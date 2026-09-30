import { test } from "node:test"
import assert from "node:assert/strict"
import {
  calculateInspectionStats,
  createInspection,
  getInspection,
  inspectionStatusOrder,
  inspectionsStorageKey,
  parseInspections,
  readInspections,
  saveInspectionResult,
  transitionInspection,
  updateInspection,
  validateInspectionInput,
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
  const scheduled = transitionInspection(requested, "scheduled")
  assert.equal(scheduled?.status, "scheduled")
  const inProgress = transitionInspection(scheduled, "in-progress")
  assert.equal(inProgress?.status, "in-progress")
  assert.equal(transitionInspection(inProgress, "completed"), null)
  assert.deepEqual(inspectionStatusOrder, ["requested", "scheduled", "in-progress", "completed"])
})

test("결과 저장은 완료 처리하며 Reload 후 항목·메모·조치사항을 보존한다", () => {
  const storage = memoryStorage()
  const inProgress = transitionInspection(transitionInspection(createInspection(input), "scheduled"), "in-progress")
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
