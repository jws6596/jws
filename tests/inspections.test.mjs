import { test } from "node:test"
import assert from "node:assert/strict"
import {
  calculateInspectionStats,
  calculateManagerScheduleOverview,
  calculateScheduleStats,
  createInspectionAlerts,
  createScheduleHistoryEntry,
  createManagerScheduleSummary,
  createInspection,
  defaultScheduleExplorerFilters,
  filterInspectionSchedule,
  filterManagerScheduleSummary,
  findScheduleConflicts,
  getInspection,
  getManagerScheduledInspections,
  getScheduleChanges,
  getScheduleHistory,
  getScheduleConflictGroups,
  getInspectionAlertCounts,
  getOverdueInspections,
  isInspectionOverdue,
  sortInspectionSchedule,
  inspectionStatusOrder,
  inspectionsStorageKey,
  parseInspections,
  readInspections,
  saveInspectionResult,
  saveInspectionAssignment,
  transitionInspection,
  updateInspection,
  validateInspectionInput,
  validateInspectionAssignment,
  validateScheduleExplorerFilters,
  writeInspections,
} from "../lib/inspections.ts"

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

const input = { address: "전남 순천시 서면 테스트길 101", inspectionType: "정기 빈집 점검", scheduledAt: "2030-03-20", managerId: "kim-hyeonsu", memo: "창문 상태 확인" }
const result = { inspectedAt: "2030-03-20T10:00", overallStatus: "attention", items: [
  { title: "지붕 누수 흔적", status: "action-required", note: "누수 흔적 확인" },
  { title: "벽 곰팡이", status: "attention", note: "환기 필요" },
  { title: "창문 일부 파손", status: "normal", note: "현재 이상 없음" },
], inspectorNote: "현장 점검 메모", recommendedActions: "누수 부위를 우선 확인" }
const managerIds = ["kim-hyeonsu", "lee-jeongeun"]
const assignment = { assignedManagerId: "kim-hyeonsu", scheduledDate: "2030-03-20", scheduledTime: "10:00" }

function scheduledInspection(address, schedule = assignment) {
  return { ...createInspection({ ...input, address }), ...schedule, status: "scheduled" }
}

test("생성·저장·Reload 모사는 필수 필드와 요청 접수 상태를 유지한다", () => {
  const storage = memoryStorage()
  const inspection = createInspection(input)
  assert.ok(inspection.id)
  assert.equal(inspection.status, "requested")
  assert.equal(inspection.address, input.address)
  assert.equal(writeInspections(storage, [inspection]), true)
  const reloaded = readInspections(storage)
  assert.equal(reloaded.length, 1)
  assert.deepEqual(reloaded[0], inspection)
})

test("요청 입력 검증은 빈 값과 과거 날짜를 차단하고 정상 입력을 허용한다", () => {
  const today = "2030-03-10"
  assert.equal(validateInspectionInput({ ...input, address: " " }, today).valid, false)
  assert.equal(validateInspectionInput({ ...input, inspectionType: "" }, today).valid, false)
  assert.equal(validateInspectionInput({ ...input, managerId: "" }, today).valid, false)
  assert.equal(validateInspectionInput({ ...input, scheduledAt: "" }, today).valid, false)
  assert.equal(validateInspectionInput({ ...input, scheduledAt: "2030-03-09" }, today).valid, false)
  assert.deepEqual(validateInspectionInput(input, today), { valid: true })
})

test("상태는 순서대로만 전환되고 결과 없이 완료할 수 없다", () => {
  const requested = createInspection(input)
  assert.equal(transitionInspection(requested, "completed"), null)
  assert.equal(transitionInspection(requested, "scheduled"), null)
  const assigned = saveInspectionAssignment(requested, assignment, managerIds, "2030-03-10")
  assert.equal(assigned.valid, true)
  assert.equal(assigned.inspection?.status, "scheduled")
  const scheduled = assigned.inspection
  const inProgress = transitionInspection(scheduled, "in-progress")
  assert.equal(inProgress?.status, "in-progress")
  assert.equal(transitionInspection(inProgress, "completed"), null)
  assert.deepEqual(inspectionStatusOrder, ["requested", "scheduled", "in-progress", "completed"])
})

test("결과 저장은 완료 처리하며 Reload 후 항목·메모·조치사항을 보존한다", () => {
  const storage = memoryStorage()
  const assigned = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  assert.equal(assigned.valid, true)
  const inProgress = transitionInspection(assigned.inspection, "in-progress")
  assert.ok(inProgress)
  const completed = saveInspectionResult(inProgress, result)
  assert.equal(completed.status, "completed")
  assert.deepEqual(completed.result, result)
  writeInspections(storage, [completed])
  assert.deepEqual(readInspections(storage)[0].result, result)
})

test("완료 결과 수정은 기존 데이터와 수정한 값을 Reload 후 유지한다", () => {
  const storage = memoryStorage()
  const completed = saveInspectionResult(createInspection(input), result)
  const revised = saveInspectionResult(completed, { ...result, overallStatus: "action-required", recommendedActions: "창문 보수와 누수 원인 확인" })
  writeInspections(storage, updateInspection([completed], revised))
  const reloaded = readInspections(storage)[0]
  assert.equal(reloaded.result?.overallStatus, "action-required")
  assert.equal(reloaded.result?.recommendedActions, "창문 보수와 누수 원인 확인")
  assert.equal(reloaded.result?.items[0].note, "누수 흔적 확인")
})

test("Legacy 완료 데이터·잘못된 ID·손상 저장소는 안전하게 처리한다", () => {
  const legacy = { ...createInspection(input), status: "completed" }
  assert.equal(parseInspections(JSON.stringify({ version: 1, items: [legacy] }))[0].result, undefined)
  assert.equal(getInspection([legacy], "missing-id"), undefined)
  assert.deepEqual(parseInspections("{broken"), [])
  assert.deepEqual(parseInspections(JSON.stringify({ version: 1, items: {} })), [])
  assert.deepEqual(parseInspections(JSON.stringify({ version: 1, items: [{ id: "missing" }] })), [])
  assert.equal(inspectionsStorageKey, "binjip-inspections-v1")
})

test("대시보드 집계는 상태 변화 후 전체·진행·완료 수를 정확히 계산한다", () => {
  const requested = createInspection(input)
  const scheduled = { ...createInspection({ ...input, address: "주소 2" }), status: "scheduled" }
  const inProgress = { ...createInspection({ ...input, address: "주소 3" }), status: "in-progress" }
  const completed = saveInspectionResult(createInspection({ ...input, address: "주소 4" }), result)
  assert.deepEqual(calculateInspectionStats([requested, scheduled, inProgress, completed]), { total: 4, active: 3, completed: 1 })
  assert.deepEqual(calculateInspectionStats([requested, scheduled, saveInspectionResult(inProgress, result), completed]), { total: 4, active: 2, completed: 2 })
})

test("일정·담당자 배정은 필수값, 유효한 관리인, 오늘 이후 날짜와 시간을 검증한다", () => {
  const today = "2030-03-10"
  assert.equal(validateInspectionAssignment({ ...assignment, assignedManagerId: "" }, managerIds, today).valid, false)
  assert.equal(validateInspectionAssignment({ ...assignment, assignedManagerId: "removed-manager" }, managerIds, today).valid, false)
  assert.equal(validateInspectionAssignment({ ...assignment, scheduledDate: "" }, managerIds, today).valid, false)
  assert.equal(validateInspectionAssignment({ ...assignment, scheduledDate: "2030-03-09" }, managerIds, today).valid, false)
  assert.equal(validateInspectionAssignment({ ...assignment, scheduledTime: "" }, managerIds, today).valid, false)
  assert.deepEqual(validateInspectionAssignment(assignment, managerIds, today), { valid: true })
})

test("유효한 배정은 요청을 일정 확정으로 전환하고 Reload 후에도 저장된다", () => {
  const storage = memoryStorage()
  const saved = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  assert.equal(saved.valid, true)
  assert.equal(saved.inspection?.status, "scheduled")
  assert.equal(saved.inspection?.assignedManagerId, assignment.assignedManagerId)
  assert.ok(saved.inspection?.assignmentUpdatedAt)
  writeInspections(storage, [saved.inspection])
  assert.deepEqual(readInspections(storage)[0].scheduledTime, "10:00")
})

test("완료 전 배정 변경은 유지하고 완료된 점검은 읽기 전용이다", () => {
  const saved = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  assert.equal(saved.valid, true)
  const changed = saveInspectionAssignment(saved.inspection, { assignedManagerId: "lee-jeongeun", scheduledDate: "2030-03-21", scheduledTime: "14:30" }, managerIds, "2030-03-10")
  assert.equal(changed.valid, true)
  assert.equal(changed.inspection?.assignedManagerId, "lee-jeongeun")
  const completed = saveInspectionResult(changed.inspection, result)
  assert.equal(saveInspectionAssignment(completed, assignment, managerIds, "2030-03-10").valid, false)
})

test("기존 데이터는 배정 필드 없이도 읽고 일정 집계는 미배정 및 가까운 일정을 계산한다", () => {
  const legacy = createInspection(input)
  const first = saveInspectionAssignment(createInspection({ ...input, address: "주소 1" }), { ...assignment, scheduledDate: "2030-03-22", scheduledTime: "13:00" }, managerIds, "2030-03-10")
  const second = saveInspectionAssignment(createInspection({ ...input, address: "주소 2" }), { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "09:00" }, managerIds, "2030-03-10")
  const inProgress = { ...second.inspection, status: "in-progress" }
  const stats = calculateScheduleStats([legacy, first.inspection, inProgress])
  assert.equal(stats.unassigned, 1)
  assert.equal(stats.scheduled, 1)
  assert.equal(stats.inProgress, 1)
  assert.deepEqual(stats.upcoming.map((item) => item.address), ["주소 2", "주소 1"])
})

test("삭제된 관리인 ID가 남은 점검 기록도 보존하고 일정 목록에서 안전하게 집계한다", () => {
  const storage = memoryStorage()
  const inspection = { ...createInspection(input), assignedManagerId: "deleted-manager", scheduledDate: "2030-03-22", scheduledTime: "11:00", status: "scheduled" }
  writeInspections(storage, [inspection])
  const reloaded = readInspections(storage)[0]
  assert.equal(reloaded.assignedManagerId, "deleted-manager")
  assert.equal(calculateScheduleStats([reloaded]).upcoming.length, 1)
  assert.equal(validateInspectionAssignment({ assignedManagerId: reloaded.assignedManagerId, scheduledDate: reloaded.scheduledDate, scheduledTime: reloaded.scheduledTime }, managerIds, "2030-03-10").valid, false)
})

test("같은 관리인·날짜·시간은 충돌이고 다른 시간·날짜·관리인은 정상이다", () => {
  const existing = scheduledInspection("충돌 주소")
  assert.equal(findScheduleConflicts([existing], { inspectionId: "new", ...assignment }).conflict, true)
  assert.equal(findScheduleConflicts([existing], { inspectionId: "new", ...assignment, scheduledTime: "11:00" }).conflict, false)
  assert.equal(findScheduleConflicts([existing], { inspectionId: "new", ...assignment, scheduledDate: "2030-03-21" }).conflict, false)
  assert.equal(findScheduleConflicts([existing], { inspectionId: "new", ...assignment, assignedManagerId: "lee-jeongeun" }).conflict, false)
})

test("자기 자신은 충돌에서 제외하고 담당자·시간 변경은 새 슬롯 충돌을 차단한다", () => {
  const current = scheduledInspection("현재 점검")
  const otherManager = scheduledInspection("다른 담당자 일정", { ...assignment, assignedManagerId: "lee-jeongeun" })
  const otherTime = scheduledInspection("다른 시간 일정", { ...assignment, scheduledTime: "15:00" })
  assert.equal(findScheduleConflicts([current], { inspectionId: current.id, ...assignment }).conflict, false)
  assert.equal(saveInspectionAssignment(current, { ...assignment, assignedManagerId: "lee-jeongeun" }, managerIds, "2030-03-10", [current, otherManager]).valid, false)
  assert.equal(saveInspectionAssignment(current, { ...assignment, scheduledTime: "15:00" }, managerIds, "2030-03-10", [current, otherTime]).valid, false)
})

test("Legacy·일정 없는 기록은 충돌에서 제외하고 원본 배열을 변경하지 않는다", () => {
  const legacy = createInspection(input)
  const scheduled = scheduledInspection("예정 점검")
  const items = [scheduled, legacy]
  const original = [...items]
  assert.equal(findScheduleConflicts(items, { inspectionId: "new", ...assignment }).inspections.length, 1)
  assert.deepEqual(items, original)
  assert.equal(getScheduleConflictGroups([legacy]).length, 0)
})

test("기존 중복 일정은 충돌 그룹으로 탐지되고 일정·관리인 조회는 오름차순이다", () => {
  const late = scheduledInspection("늦은 점검", { ...assignment, scheduledDate: "2030-03-22", scheduledTime: "14:00" })
  const first = scheduledInspection("첫 충돌", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "09:00" })
  const duplicate = scheduledInspection("둘째 충돌", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "09:00" })
  const groups = getScheduleConflictGroups([late, first, duplicate])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].inspections.length, 2)
  assert.deepEqual(getManagerScheduledInspections([late, first, duplicate], "kim-hyeonsu").map((item) => item.address), ["첫 충돌", "둘째 충돌", "늦은 점검"])
})

test("Reload 후에도 같은 슬롯의 기존 중복 일정을 동일하게 탐지한다", () => {
  const storage = memoryStorage()
  const first = scheduledInspection("Reload 1")
  const duplicate = scheduledInspection("Reload 2")
  writeInspections(storage, [first, duplicate])
  const reloaded = readInspections(storage)
  assert.equal(findScheduleConflicts(reloaded, { inspectionId: "new", ...assignment }).conflict, true)
  assert.equal(getScheduleConflictGroups(reloaded).length, 1)
})

test("최초 배정은 현재 일정 필드를 유지하며 assignment-created 이력과 시각·stable ID를 저장한다", () => {
  const saved = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  assert.equal(saved.valid, true)
  assert.equal(saved.inspection?.assignedManagerId, "kim-hyeonsu")
  assert.equal(saved.inspection?.scheduleHistory?.length, 1)
  const entry = saved.inspection?.scheduleHistory?.[0]
  assert.equal(entry?.type, "assignment-created")
  assert.ok(entry?.id)
  assert.ok(entry?.changedAt)
  assert.deepEqual(entry?.previous, { managerId: undefined, scheduledDate: undefined, scheduledTime: undefined })
  assert.deepEqual(entry?.next, { managerId: "kim-hyeonsu", scheduledDate: "2030-03-20", scheduledTime: "10:00" })
})

test("담당자·날짜·시간 변경은 한 번의 snapshot 이력으로 기록하고 실제 변경 항목만 계산한다", () => {
  const first = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  assert.equal(first.valid, true)
  const changedAssignment = { assignedManagerId: "lee-jeongeun", scheduledDate: "2030-03-21", scheduledTime: "15:30" }
  const changed = saveInspectionAssignment(first.inspection, changedAssignment, managerIds, "2030-03-10")
  assert.equal(changed.valid, true)
  assert.equal(changed.inspection?.scheduleHistory?.length, 2)
  const entry = changed.inspection?.scheduleHistory?.[1]
  assert.equal(entry?.type, "assignment-updated")
  assert.deepEqual(getScheduleChanges(entry.previous, entry.next), { managerChanged: true, dateChanged: true, timeChanged: true })
  assert.deepEqual(entry?.previous, { managerId: "kim-hyeonsu", scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  assert.deepEqual(entry?.next, { managerId: "lee-jeongeun", scheduledDate: "2030-03-21", scheduledTime: "15:30" })
})

test("동일 일정 재저장은 이력과 assignmentUpdatedAt을 추가하지 않고 과거 이력은 immutable하다", () => {
  const first = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  assert.equal(first.valid, true)
  const originalHistory = first.inspection.scheduleHistory
  const originalUpdatedAt = first.inspection.assignmentUpdatedAt
  const unchanged = saveInspectionAssignment(first.inspection, assignment, managerIds, "2030-03-10")
  assert.equal(unchanged.valid, true)
  assert.equal(unchanged.inspection?.scheduleHistory, originalHistory)
  assert.equal(unchanged.inspection?.assignmentUpdatedAt, originalUpdatedAt)
  assert.deepEqual(first.inspection.scheduleHistory, originalHistory)
})

test("충돌 실패와 완료 점검 변경은 현재값·이력을 추가하지 않는다", () => {
  const existing = scheduledInspection("기존 점검")
  const requested = createInspection(input)
  const blocked = saveInspectionAssignment(requested, assignment, managerIds, "2030-03-10", [existing])
  assert.equal(blocked.valid, false)
  assert.equal(requested.scheduleHistory, undefined)
  const completed = saveInspectionResult(existing, result)
  const readonly = saveInspectionAssignment(completed, { ...assignment, scheduledTime: "11:00" }, managerIds, "2030-03-10")
  assert.equal(readonly.valid, false)
  assert.equal(completed.scheduleHistory, undefined)
})

test("이력은 Reload 후 유지되고 최신순 조회하며 Legacy 이력 없음도 안전하다", () => {
  const storage = memoryStorage()
  const first = saveInspectionAssignment(createInspection(input), assignment, managerIds, "2030-03-10")
  const changed = saveInspectionAssignment(first.inspection, { ...assignment, scheduledTime: "12:00" }, managerIds, "2030-03-10")
  assert.equal(changed.valid, true)
  writeInspections(storage, [changed.inspection])
  const reloaded = readInspections(storage)[0]
  assert.equal(reloaded.scheduleHistory?.length, 2)
  assert.equal(getScheduleHistory(reloaded)[0].id, changed.inspection.scheduleHistory?.[1].id)
  assert.deepEqual(getScheduleHistory(createInspection(input)), [])
})

test("History entry는 snapshot을 복사하고 삭제된 관리인 ID를 그대로 보존한다", () => {
  const entry = createScheduleHistoryEntry(
    { managerId: "deleted-manager", scheduledDate: "2030-03-20", scheduledTime: "10:00" },
    { managerId: "lee-jeongeun", scheduledDate: "2030-03-20", scheduledTime: "11:00" },
    "2030-03-10T09:00:00.000Z",
  )
  assert.ok(entry)
  assert.equal(entry.previous.managerId, "deleted-manager")
  assert.equal(entry.next.managerId, "lee-jeongeun")
  assert.equal(entry.changedAt, "2030-03-10T09:00:00.000Z")
})

test("일정 탐색 기본값은 배정된 실제 일정만 보여주고 미배정 필터는 Legacy 기록을 안전하게 보여준다", () => {
  const scheduled = scheduledInspection("배정 일정")
  const legacy = createInspection({ ...input, address: "미배정 Legacy" })
  assert.deepEqual(filterInspectionSchedule([scheduled, legacy], defaultScheduleExplorerFilters).map((item) => item.address), ["배정 일정"])
  assert.deepEqual(filterInspectionSchedule([scheduled, legacy], { ...defaultScheduleExplorerFilters, assignment: "unassigned" }).map((item) => item.address), ["미배정 Legacy"])
})

test("관리인·특정 날짜·기간·상태·검색 필터는 조합해 적용한다", () => {
  const target = scheduledInspection("순천시 대상 주소", { ...assignment, scheduledDate: "2030-03-22", scheduledTime: "09:00" })
  const otherManager = scheduledInspection("순천시 다른 관리인", { ...assignment, assignedManagerId: "lee-jeongeun", scheduledDate: "2030-03-22" })
  const otherDate = scheduledInspection("다른 날짜", { ...assignment, scheduledDate: "2030-03-25" })
  const items = [target, otherManager, otherDate]
  const filters = { ...defaultScheduleExplorerFilters, managerId: "kim-hyeonsu", scheduledDate: "2030-03-22", startDate: "2030-03-20", endDate: "2030-03-23", status: "scheduled", query: "순천시" }
  assert.deepEqual(filterInspectionSchedule(items, filters).map((item) => item.address), ["순천시 대상 주소"])
  assert.deepEqual(filterInspectionSchedule(items, { ...filters, query: "없는 검색어" }), [])
})

test("일정 탐색 날짜 검증은 잘못된 날짜와 시작일 이후 종료일을 차단한다", () => {
  assert.equal(validateScheduleExplorerFilters({ scheduledDate: "2030-02-30", startDate: "", endDate: "" }).valid, false)
  assert.equal(validateScheduleExplorerFilters({ scheduledDate: "", startDate: "2030-03-23", endDate: "2030-03-20" }).valid, false)
  assert.deepEqual(validateScheduleExplorerFilters({ scheduledDate: "", startDate: "2030-03-20", endDate: "2030-03-23" }), { valid: true })
})

test("가까운·먼 일정 정렬은 원본 배열을 변경하지 않고 미배정은 뒤에 둔다", () => {
  const late = scheduledInspection("늦은 일정", { ...assignment, scheduledDate: "2030-03-23", scheduledTime: "10:00" })
  const early = scheduledInspection("빠른 일정", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "09:00" })
  const unassigned = createInspection({ ...input, address: "미배정" })
  const items = [late, unassigned, early]
  const original = [...items]
  assert.deepEqual(sortInspectionSchedule(items, "ascending").map((item) => item.address), ["빠른 일정", "늦은 일정", "미배정"])
  assert.deepEqual(sortInspectionSchedule(items, "descending").map((item) => item.address), ["늦은 일정", "빠른 일정", "미배정"])
  assert.deepEqual(items, original)
})

test("충돌 일정만 보기와 삭제된 관리인 ID 필터는 실제 충돌 그룹과 기록을 재사용한다", () => {
  const first = scheduledInspection("충돌 1")
  const duplicate = scheduledInspection("충돌 2")
  const missingManager = scheduledInspection("삭제 관리인", { ...assignment, assignedManagerId: "deleted-manager", scheduledTime: "11:00" })
  const items = [first, duplicate, missingManager]
  assert.deepEqual(filterInspectionSchedule(items, { ...defaultScheduleExplorerFilters, conflictOnly: true }).map((item) => item.address).sort(), ["충돌 1", "충돌 2"])
  assert.deepEqual(filterInspectionSchedule(items, { ...defaultScheduleExplorerFilters, managerId: "deleted-manager" }).map((item) => item.address), ["삭제 관리인"])
})

test("관리인별 요약은 전체 배정·오늘·예정·진행·완료·다음 일정을 실제 상태로 집계한다", () => {
  const now = new Date("2030-03-20T09:00:00")
  const scheduled = scheduledInspection("김 예정", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  const inProgress = { ...scheduledInspection("김 진행", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "10:00" }), status: "in-progress" }
  const completed = { ...scheduledInspection("김 완료", { ...assignment, scheduledDate: "2030-03-22", scheduledTime: "10:00" }), status: "completed" }
  const other = scheduledInspection("이 예정", { ...assignment, assignedManagerId: "lee-jeongeun", scheduledDate: "2030-03-23", scheduledTime: "11:00" })
  const summaries = createManagerScheduleSummary([{ id: "kim-hyeonsu" }, { id: "lee-jeongeun" }], [scheduled, inProgress, completed, other], now)
  assert.deepEqual(summaries.map(({ managerId, totalAssigned, today, scheduled: count, inProgress: progress, completed: done, upcoming, nextInspection }) => ({ managerId, totalAssigned, today, scheduled: count, inProgress: progress, completed: done, upcoming, next: nextInspection?.address })), [
    { managerId: "kim-hyeonsu", totalAssigned: 3, today: 1, scheduled: 2, inProgress: 1, completed: 1, upcoming: 2, next: "김 예정" },
    { managerId: "lee-jeongeun", totalAssigned: 1, today: 0, scheduled: 1, inProgress: 0, completed: 0, upcoming: 1, next: "이 예정" },
  ])
})

test("미배정·삭제된 관리인 배정·Legacy 기록은 정상 관리인 요약과 분리된다", () => {
  const assigned = scheduledInspection("정상 배정")
  const missing = scheduledInspection("삭제 관리인", { ...assignment, assignedManagerId: "deleted-manager" })
  const legacy = createInspection({ ...input, address: "Legacy 미배정" })
  const overview = calculateManagerScheduleOverview([{ id: "kim-hyeonsu" }], [assigned, missing, legacy], new Date("2030-03-20T09:00:00"))
  assert.equal(overview.summaries[0].totalAssigned, 1)
  assert.equal(overview.unassignedCount, 1)
  assert.equal(overview.missingManagerCount, 1)
  assert.deepEqual(calculateManagerScheduleOverview([], [assigned], new Date()).summaries, [])
})

test("충돌 건수는 기존 충돌 그룹을 재사용하고 충돌 해소 후 재집계된다", () => {
  const first = scheduledInspection("충돌 1")
  const second = scheduledInspection("충돌 2")
  const managers = [{ id: "kim-hyeonsu" }]
  assert.equal(createManagerScheduleSummary(managers, [first, second], new Date("2030-03-20T09:00:00"))[0].conflictCount, 2)
  const resolved = { ...second, scheduledTime: "11:00" }
  assert.equal(createManagerScheduleSummary(managers, [first, resolved], new Date("2030-03-20T09:00:00"))[0].conflictCount, 0)
})

test("관리인 요약 필터는 일정·오늘·충돌 조건을 독립적으로 적용한다", () => {
  const now = new Date("2030-03-20T09:00:00")
  const today = scheduledInspection("오늘", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  const duplicate = scheduledInspection("충돌", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  const emptyManager = { id: "lee-jeongeun" }
  const summaries = createManagerScheduleSummary([{ id: "kim-hyeonsu" }, emptyManager], [today, duplicate], now)
  assert.equal(filterManagerScheduleSummary(summaries, "has-schedule").length, 1)
  assert.equal(filterManagerScheduleSummary(summaries, "today").length, 1)
  assert.equal(filterManagerScheduleSummary(summaries, "conflict").length, 1)
})

test("관리인 일정 집계는 원본 배열을 변경하지 않고 완료 기록을 upcoming에서 제외한다", () => {
  const completed = { ...scheduledInspection("완료", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "10:00" }), status: "completed" }
  const upcoming = scheduledInspection("예정", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "11:00" })
  const items = [completed, upcoming]
  const original = [...items]
  const summary = createManagerScheduleSummary([{ id: "kim-hyeonsu" }], items, new Date("2030-03-20T09:00:00"))[0]
  assert.equal(summary.completed, 1)
  assert.equal(summary.upcoming, 1)
  assert.equal(summary.nextInspection?.address, "예정")
  assert.deepEqual(items, original)
})

test("알림은 고정 now 기준 오늘·내일·2~3일 이내만 분류하고 안정 ID를 사용한다", () => {
  const now = new Date("2030-03-20T16:00:00")
  const today = scheduledInspection("오늘", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "17:00" })
  const tomorrow = scheduledInspection("내일", { ...assignment, scheduledDate: "2030-03-21" })
  const day2 = scheduledInspection("이틀 후", { ...assignment, scheduledDate: "2030-03-22" })
  const day3 = scheduledInspection("사흘 후", { ...assignment, scheduledDate: "2030-03-23" })
  const day4 = scheduledInspection("나흘 후", { ...assignment, scheduledDate: "2030-03-24" })
  const alerts = createInspectionAlerts([today, tomorrow, day2, day3, day4], [{ id: "kim-hyeonsu" }], now)
  assert.deepEqual(alerts.map((alert) => [alert.type, alert.inspectionId]), [["today", today.id], ["tomorrow", tomorrow.id], ["upcoming", day2.id], ["upcoming", day3.id]])
  assert.equal(alerts[0].id, `alert-${today.id}-today`)
  assert.deepEqual(getInspectionAlertCounts(alerts), { conflict: 0, overdue: 0, today: 1, tomorrow: 1, upcoming: 2 })
})

test("완료·Legacy는 날짜 알림에서 제외하고 과거 미완료는 OVERDUE로 분류하며 원본은 변경하지 않는다", () => {
  const completed = { ...scheduledInspection("완료", { ...assignment, scheduledDate: "2030-03-20" }), status: "completed" }
  const legacy = createInspection({ ...input, address: "Legacy" })
  const past = scheduledInspection("과거", { ...assignment, scheduledDate: "2030-03-19" })
  const items = [completed, legacy, past]
  const original = structuredClone(items)
  assert.deepEqual(createInspectionAlerts(items, [{ id: "kim-hyeonsu" }], new Date("2030-03-20T16:00:00")).map((alert) => [alert.type, alert.inspectionId]), [["overdue", past.id]])
  assert.deepEqual(items, original)
})

test("충돌 알림은 최우선이며 삭제된 관리인 일정도 안전하게 포함한다", () => {
  const first = scheduledInspection("충돌 1", { ...assignment, scheduledDate: "2030-03-20" })
  const second = scheduledInspection("충돌 2", { ...assignment, scheduledDate: "2030-03-20" })
  const missing = scheduledInspection("삭제 관리인", { ...assignment, assignedManagerId: "deleted-manager", scheduledDate: "2030-03-21", scheduledTime: "11:00" })
  const alerts = createInspectionAlerts([first, second, missing], [{ id: "kim-hyeonsu" }], new Date("2030-03-20T09:00:00"))
  assert.deepEqual(alerts.slice(0, 2).map((alert) => alert.type), ["conflict", "conflict"])
  assert.ok(alerts.some((alert) => alert.inspectionId === missing.id && alert.type === "tomorrow" && alert.managerId === "deleted-manager"))
})

test("일정 변경·완료 처리·충돌 해소는 별도 저장 없이 알림 계산에 즉시 반영된다", () => {
  const first = scheduledInspection("첫 일정", { ...assignment, scheduledDate: "2030-03-20" })
  const second = scheduledInspection("둘째 일정", { ...assignment, scheduledDate: "2030-03-20" })
  const now = new Date("2030-03-20T09:00:00")
  assert.equal(createInspectionAlerts([first, second], [{ id: "kim-hyeonsu" }], now).filter((alert) => alert.type === "conflict").length, 2)
  const changed = { ...second, scheduledDate: "2030-03-21", scheduledTime: "11:00" }
  assert.equal(createInspectionAlerts([first, changed], [{ id: "kim-hyeonsu" }], now).some((alert) => alert.type === "conflict"), false)
  assert.ok(createInspectionAlerts([first, changed], [{ id: "kim-hyeonsu" }], now).some((alert) => alert.inspectionId === changed.id && alert.type === "tomorrow"))
  const completed = { ...first, status: "completed" }
  assert.equal(createInspectionAlerts([completed, changed], [{ id: "kim-hyeonsu" }], now).some((alert) => alert.inspectionId === first.id && alert.type === "today"), false)
})

test("지난 미완료 판정은 고정 now의 어제·오늘 시간 경과만 포함하고 완료·Legacy·일정 없음은 제외한다", () => {
  const now = new Date("2030-03-20T14:00:00")
  const yesterday = scheduledInspection("어제", { ...assignment, scheduledDate: "2030-03-19", scheduledTime: "10:00" })
  const todayPast = scheduledInspection("오늘 지남", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  const todayFuture = scheduledInspection("오늘 남음", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "15:00" })
  const completed = { ...yesterday, id: "completed-past", status: "completed" }
  const legacy = createInspection({ ...input, address: "Legacy" })
  const items = [yesterday, todayPast, todayFuture, completed, legacy]
  const original = structuredClone(items)
  assert.equal(isInspectionOverdue(yesterday, now), true)
  assert.equal(isInspectionOverdue(todayPast, now), true)
  assert.equal(isInspectionOverdue(todayFuture, now), false)
  assert.deepEqual(getOverdueInspections(items, now).map((item) => item.address), ["어제", "오늘 지남"])
  assert.deepEqual(items, original)
})

test("알림은 지난 미완료를 TODAY와 중복하지 않고 충돌 다음 우선순위 및 stable ID를 유지한다", () => {
  const now = new Date("2030-03-20T14:00:00")
  const first = scheduledInspection("충돌 지난 1", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  const second = scheduledInspection("충돌 지난 2", { ...assignment, scheduledDate: "2030-03-20", scheduledTime: "10:00" })
  const missing = scheduledInspection("삭제 관리인 지난", { ...assignment, assignedManagerId: "deleted-manager", scheduledDate: "2030-03-19", scheduledTime: "10:00" })
  const alerts = createInspectionAlerts([first, second, missing], [{ id: "kim-hyeonsu" }], now)
  assert.deepEqual(alerts.map((alert) => alert.type), ["conflict", "conflict", "overdue", "overdue", "overdue"])
  assert.equal(alerts.filter((alert) => alert.inspectionId === first.id && alert.type === "today").length, 0)
  assert.ok(alerts.some((alert) => alert.id === `alert-${first.id}-overdue`))
  assert.ok(alerts.some((alert) => alert.inspectionId === missing.id && alert.managerId === "deleted-manager"))
})

test("지난 미완료 일정의 완료 및 오늘·내일 재조정은 알림을 현재 일정으로 바꾼다", () => {
  const now = new Date("2030-03-20T14:00:00")
  const overdue = scheduledInspection("재조정", { ...assignment, scheduledDate: "2030-03-19", scheduledTime: "10:00" })
  assert.equal(createInspectionAlerts([overdue], [{ id: "kim-hyeonsu" }], now)[0].type, "overdue")
  const today = { ...overdue, scheduledDate: "2030-03-20", scheduledTime: "15:00" }
  assert.equal(createInspectionAlerts([today], [{ id: "kim-hyeonsu" }], now)[0].type, "today")
  const tomorrow = { ...today, scheduledDate: "2030-03-21", scheduledTime: "10:00" }
  assert.equal(createInspectionAlerts([tomorrow], [{ id: "kim-hyeonsu" }], now)[0].type, "tomorrow")
  const completed = { ...overdue, status: "completed" }
  assert.deepEqual(createInspectionAlerts([completed], [{ id: "kim-hyeonsu" }], now), [])
})

test("일정 탐색의 지난 미완료 필터는 고정 now 기준으로 Legacy와 미래 일정을 제외한다", () => {
  const now = new Date("2030-03-20T14:00:00")
  const overdue = scheduledInspection("지난 미완료", { ...assignment, scheduledDate: "2030-03-19", scheduledTime: "10:00" })
  const future = scheduledInspection("미래", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "10:00" })
  const legacy = createInspection({ ...input, address: "Legacy" })
  assert.deepEqual(filterInspectionSchedule([overdue, future, legacy], { ...defaultScheduleExplorerFilters, overdueOnly: true }, now).map((item) => item.address), ["지난 미완료"])
})

test("관리인 요약은 지난 미완료를 운영 현황으로만 집계하고 필터링한다", () => {
  const now = new Date("2030-03-20T14:00:00")
  const overdue = scheduledInspection("지난 미완료", { ...assignment, scheduledDate: "2030-03-19", scheduledTime: "10:00" })
  const future = scheduledInspection("내일", { ...assignment, scheduledDate: "2030-03-21", scheduledTime: "10:00" })
  const summary = createManagerScheduleSummary([{ id: "kim-hyeonsu" }], [overdue, future], now)
  assert.equal(summary[0].overdue, 1)
  assert.equal(filterManagerScheduleSummary(summary, "overdue").length, 1)
})
