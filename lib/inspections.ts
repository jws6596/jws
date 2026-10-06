export type InspectionStatus = "requested" | "scheduled" | "in-progress" | "completed"
export type InspectionItemStatus = "normal" | "attention" | "action-required"
export type InspectionResultItem = { title: string; status: InspectionItemStatus; note: string }
export type InspectionResult = {
  inspectedAt: string
  overallStatus: InspectionItemStatus
  items: InspectionResultItem[]
  inspectorNote: string
  recommendedActions: string
}

export type Inspection = {
  id: string
  address: string
  inspectionType: string
  requestedAt: string
  scheduledAt: string
  managerId: string
  memo: string
  status: InspectionStatus
  result?: InspectionResult
  assignedManagerId?: string
  scheduledDate?: string
  scheduledTime?: string
  assignmentUpdatedAt?: string
  scheduleHistory?: ScheduleHistoryEntry[]
}

export type ScheduleSnapshot = {
  managerId?: string
  scheduledDate?: string
  scheduledTime?: string
}

export type ScheduleHistoryEntry = {
  id: string
  changedAt: string
  type: "assignment-created" | "assignment-updated"
  previous: ScheduleSnapshot
  next: ScheduleSnapshot
}

export type InspectionInput = Omit<Inspection, "id" | "requestedAt" | "status" | "result">

type StorageLike = Pick<Storage, "getItem" | "setItem">
type InspectionPayload = { version: 1; items: Inspection[] }

export const inspectionsStorageKey = "binjip-inspections-v1"
export const inspectionsChangedEvent = "binjip-inspections-changed"

export const inspectionStatusLabel: Record<InspectionStatus, string> = {
  requested: "요청 접수",
  scheduled: "일정 확정",
  "in-progress": "점검 중",
  completed: "완료",
}

export const inspectionStatusOrder: InspectionStatus[] = ["requested", "scheduled", "in-progress", "completed"]

function isInspection(value: unknown): value is Inspection {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return typeof item.id === "string" && typeof item.address === "string" && typeof item.inspectionType === "string" &&
    typeof item.requestedAt === "string" && typeof item.scheduledAt === "string" && typeof item.managerId === "string" &&
    typeof item.memo === "string" && inspectionStatusOrder.includes(item.status as InspectionStatus) &&
    (item.result === undefined || isInspectionResult(item.result)) &&
    (item.assignedManagerId === undefined || typeof item.assignedManagerId === "string") &&
    (item.scheduledDate === undefined || typeof item.scheduledDate === "string") &&
    (item.scheduledTime === undefined || typeof item.scheduledTime === "string") &&
    (item.assignmentUpdatedAt === undefined || typeof item.assignmentUpdatedAt === "string") &&
    (item.scheduleHistory === undefined || (Array.isArray(item.scheduleHistory) && item.scheduleHistory.every(isScheduleHistoryEntry)))
}

function isScheduleSnapshot(value: unknown): value is ScheduleSnapshot {
  if (!value || typeof value !== "object") return false
  const snapshot = value as Record<string, unknown>
  return (snapshot.managerId === undefined || typeof snapshot.managerId === "string") &&
    (snapshot.scheduledDate === undefined || typeof snapshot.scheduledDate === "string") &&
    (snapshot.scheduledTime === undefined || typeof snapshot.scheduledTime === "string")
}

function isScheduleHistoryEntry(value: unknown): value is ScheduleHistoryEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === "string" && typeof entry.changedAt === "string" &&
    (entry.type === "assignment-created" || entry.type === "assignment-updated") &&
    isScheduleSnapshot(entry.previous) && isScheduleSnapshot(entry.next)
}

function isInspectionResult(value: unknown): value is InspectionResult {
  if (!value || typeof value !== "object") return false
  const result = value as Record<string, unknown>
  return typeof result.inspectedAt === "string" && ["normal", "attention", "action-required"].includes(result.overallStatus as string) &&
    typeof result.inspectorNote === "string" && typeof result.recommendedActions === "string" && Array.isArray(result.items) &&
    result.items.every((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).title === "string" &&
      ["normal", "attention", "action-required"].includes((item as Record<string, unknown>).status as string) && typeof (item as Record<string, unknown>).note === "string")
}

export function parseInspections(raw: string | null): Inspection[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    const candidates = parsed && typeof parsed === "object" && Array.isArray((parsed as InspectionPayload).items)
      ? (parsed as InspectionPayload).items : []
    return candidates.filter(isInspection).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  } catch { return [] }
}

export function readInspections(storage: StorageLike): Inspection[] {
  try { return parseInspections(storage.getItem(inspectionsStorageKey)) } catch { return [] }
}

export function writeInspections(storage: StorageLike, items: Inspection[]) {
  try {
    storage.setItem(inspectionsStorageKey, JSON.stringify({ version: 1, items } satisfies InspectionPayload))
    if (typeof window !== "undefined") window.dispatchEvent(new Event(inspectionsChangedEvent))
    return true
  } catch { return false }
}

export function validateInspectionInput(input: Partial<InspectionInput>, today = new Date().toISOString().slice(0, 10)) {
  if (!input.address?.trim() || !input.inspectionType || !input.scheduledAt || !input.managerId) return { valid: false as const, message: "주소, 점검 유형, 희망일, 담당 관리인을 모두 확인해주세요." }
  if (input.scheduledAt < today) return { valid: false as const, message: "희망일은 오늘 이후로 선택해주세요." }
  return { valid: true as const }
}

export function createInspection(input: InspectionInput): Inspection {
  return {
    ...input,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `inspection-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    status: "requested",
  }
}

export function getInspection(items: Inspection[], id: string | null | undefined) {
  return id ? items.find((item) => item.id === id) : undefined
}

export function updateInspection(items: Inspection[], updated: Inspection) {
  return items.map((item) => item.id === updated.id ? updated : item)
}

export function nextInspectionStatus(status: InspectionStatus) {
  const index = inspectionStatusOrder.indexOf(status)
  return inspectionStatusOrder[Math.min(index + 1, inspectionStatusOrder.length - 1)]
}

export function transitionInspection(inspection: Inspection, nextStatus: InspectionStatus) {
  const currentIndex = inspectionStatusOrder.indexOf(inspection.status)
  const nextIndex = inspectionStatusOrder.indexOf(nextStatus)
  if (nextIndex !== currentIndex + 1) return null
  if (nextStatus === "scheduled" && !hasInspectionAssignment(inspection)) return null
  if (nextStatus === "completed" && !inspection.result) return null
  return { ...inspection, status: nextStatus }
}

export type InspectionAssignment = Pick<Inspection, "assignedManagerId" | "scheduledDate" | "scheduledTime">
export type ScheduleConflictInput = InspectionAssignment & { inspectionId?: string }
export type ScheduleConflictGroup = {
  managerId: string
  scheduledDate: string
  scheduledTime: string
  inspections: Inspection[]
}

export type ScheduleExplorerFilters = {
  managerId: string
  assignment: "all" | "assigned" | "unassigned"
  scheduledDate: string
  startDate: string
  endDate: string
  status: "all" | InspectionStatus
  query: string
  conflictOnly: boolean
  overdueOnly: boolean
}

export type ScheduleSortDirection = "ascending" | "descending"
export type ManagerWorkloadFilter = "all" | "has-schedule" | "today" | "overdue" | "conflict"

export type ManagerScheduleSummary = {
  managerId: string
  totalAssigned: number
  scheduled: number
  inProgress: number
  completed: number
  upcoming: number
  today: number
  overdue: number
  conflictCount: number
  nextInspection?: Inspection
}

export type ManagerScheduleOverview = {
  summaries: ManagerScheduleSummary[]
  unassignedCount: number
  missingManagerCount: number
}

export type InspectionAlertType = "conflict" | "overdue" | "today" | "tomorrow" | "upcoming"
export type InspectionAlert = {
  id: string
  type: InspectionAlertType
  inspectionId: string
  scheduledDate: string
  scheduledTime: string
  managerId?: string
  message: string
}

export type InspectionAlertCounts = Record<InspectionAlertType, number>

export const defaultScheduleExplorerFilters: ScheduleExplorerFilters = {
  managerId: "",
  assignment: "assigned",
  scheduledDate: "",
  startDate: "",
  endDate: "",
  status: "all",
  query: "",
  conflictOnly: false,
  overdueOnly: false,
}

export function hasInspectionAssignment(inspection: Pick<Inspection, "assignedManagerId" | "scheduledDate" | "scheduledTime">) {
  return Boolean(inspection.assignedManagerId && inspection.scheduledDate && inspection.scheduledTime)
}

export function getScheduleSnapshot(inspection: Pick<Inspection, "assignedManagerId" | "scheduledDate" | "scheduledTime">): ScheduleSnapshot {
  return {
    managerId: inspection.assignedManagerId,
    scheduledDate: inspection.scheduledDate,
    scheduledTime: inspection.scheduledTime,
  }
}

export function getScheduleChanges(previous: ScheduleSnapshot, next: ScheduleSnapshot) {
  return {
    managerChanged: previous.managerId !== next.managerId,
    dateChanged: previous.scheduledDate !== next.scheduledDate,
    timeChanged: previous.scheduledTime !== next.scheduledTime,
  }
}

function makeHistoryId(changedAt: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `schedule-history-${changedAt}-${Math.random().toString(36).slice(2, 10)}`
}

export function createScheduleHistoryEntry(previous: ScheduleSnapshot, next: ScheduleSnapshot, changedAt = new Date().toISOString()): ScheduleHistoryEntry | null {
  const changes = getScheduleChanges(previous, next)
  if (!changes.managerChanged && !changes.dateChanged && !changes.timeChanged) return null
  return {
    id: makeHistoryId(changedAt),
    changedAt,
    type: !previous.managerId && !previous.scheduledDate && !previous.scheduledTime ? "assignment-created" : "assignment-updated",
    previous: { ...previous },
    next: { ...next },
  }
}

export function getScheduleHistory(inspection: Pick<Inspection, "scheduleHistory">) {
  return (inspection.scheduleHistory ?? [])
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.changedAt.localeCompare(a.entry.changedAt) || b.index - a.index)
    .map(({ entry }) => entry)
}

export function validateInspectionAssignment(assignment: InspectionAssignment, managerIds: string[], today = new Date().toISOString().slice(0, 10)) {
  if (!assignment.assignedManagerId) return { valid: false as const, message: "담당 관리인을 선택해주세요." }
  if (!managerIds.includes(assignment.assignedManagerId)) return { valid: false as const, message: "현재 등록된 관리인을 선택해주세요." }
  if (!assignment.scheduledDate) return { valid: false as const, message: "점검 예정일을 선택해주세요." }
  if (assignment.scheduledDate < today) return { valid: false as const, message: "점검 예정일은 오늘 이후로 선택해주세요." }
  if (!assignment.scheduledTime) return { valid: false as const, message: "점검 예정 시간을 선택해주세요." }
  return { valid: true as const }
}

function compareScheduledAt(a: Inspection, b: Inspection) {
  if (!hasInspectionAssignment(a) && !hasInspectionAssignment(b)) return 0
  if (!hasInspectionAssignment(a)) return 1
  if (!hasInspectionAssignment(b)) return -1
  return `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`)
}

export function getManagerScheduledInspections(items: Inspection[], managerId: string, excludeInspectionId?: string) {
  return items
    .filter((item) => item.id !== excludeInspectionId && item.status !== "completed" && item.assignedManagerId === managerId && hasInspectionAssignment(item))
    .slice()
    .sort(compareScheduledAt)
}

export function findScheduleConflicts(items: Inspection[], candidate: ScheduleConflictInput) {
  if (!candidate.assignedManagerId || !candidate.scheduledDate || !candidate.scheduledTime) return { conflict: false, inspections: [] as Inspection[] }
  const inspections = items
    .filter((item) => item.id !== candidate.inspectionId && item.assignedManagerId === candidate.assignedManagerId && item.scheduledDate === candidate.scheduledDate && item.scheduledTime === candidate.scheduledTime)
    .slice()
    .sort(compareScheduledAt)
  return { conflict: inspections.length > 0, inspections }
}

export function getScheduleConflictGroups(items: Inspection[]) {
  const groups = new Map<string, Inspection[]>()
  items.filter(hasInspectionAssignment).forEach((item) => {
    const key = `${item.assignedManagerId}\u0000${item.scheduledDate}\u0000${item.scheduledTime}`
    groups.set(key, [...(groups.get(key) ?? []), item])
  })
  return [...groups.values()]
    .filter((inspections) => inspections.length > 1)
    .map((inspections) => ({
      managerId: inspections[0].assignedManagerId as string,
      scheduledDate: inspections[0].scheduledDate as string,
      scheduledTime: inspections[0].scheduledTime as string,
      inspections: inspections.slice().sort(compareScheduledAt),
    }))
    .sort((a, b) => `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`))
}

function isValidDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

export function validateScheduleExplorerFilters(filters: Pick<ScheduleExplorerFilters, "scheduledDate" | "startDate" | "endDate">) {
  if (filters.scheduledDate && !isValidDateValue(filters.scheduledDate)) return { valid: false as const, message: "특정 날짜를 확인해주세요." }
  if (filters.startDate && !isValidDateValue(filters.startDate)) return { valid: false as const, message: "시작일을 확인해주세요." }
  if (filters.endDate && !isValidDateValue(filters.endDate)) return { valid: false as const, message: "종료일을 확인해주세요." }
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) return { valid: false as const, message: "시작일은 종료일보다 늦을 수 없습니다." }
  return { valid: true as const }
}

export function filterInspectionSchedule(items: Inspection[], filters: ScheduleExplorerFilters, now = new Date()) {
  if (!validateScheduleExplorerFilters(filters).valid) return []
  const query = filters.query.trim().toLocaleLowerCase()
  const conflictIds = filters.conflictOnly ? new Set(getScheduleConflictGroups(items).flatMap((group) => group.inspections.map((item) => item.id))) : null
  return items.filter((item) => {
    const assigned = hasInspectionAssignment(item)
    if (filters.assignment === "assigned" && !assigned) return false
    if (filters.assignment === "unassigned" && assigned) return false
    if (filters.managerId && item.assignedManagerId !== filters.managerId) return false
    if (filters.status !== "all" && item.status !== filters.status) return false
    if (filters.scheduledDate && item.scheduledDate !== filters.scheduledDate) return false
    if (filters.startDate && (!item.scheduledDate || item.scheduledDate < filters.startDate)) return false
    if (filters.endDate && (!item.scheduledDate || item.scheduledDate > filters.endDate)) return false
    if (conflictIds && !conflictIds.has(item.id)) return false
    if (filters.overdueOnly && !isInspectionOverdue(item, now)) return false
    if (query && ![item.address, item.inspectionType, item.memo].some((value) => value.toLocaleLowerCase().includes(query))) return false
    return true
  })
}

export function sortInspectionSchedule(items: Inspection[], direction: ScheduleSortDirection = "ascending") {
  return items.slice().sort((a, b) => {
    if (!hasInspectionAssignment(a) && !hasInspectionAssignment(b)) return 0
    if (!hasInspectionAssignment(a)) return 1
    if (!hasInspectionAssignment(b)) return -1
    const compared = compareScheduledAt(a, b)
    return direction === "ascending" ? compared : -compared
  })
}

export function getScheduleTiming(scheduledDate: string | undefined, today = new Date().toISOString().slice(0, 10)) {
  if (!scheduledDate) return "unscheduled" as const
  if (scheduledDate === today) return "today" as const
  return scheduledDate > today ? "upcoming" as const : "past" as const
}

function localDateValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.valueOf() - offset).toISOString().slice(0, 10)
}

export function getInspectionScheduledAt(inspection: Pick<Inspection, "assignedManagerId" | "scheduledDate" | "scheduledTime">) {
  if (!hasInspectionAssignment(inspection)) return null
  const scheduledAt = new Date(`${inspection.scheduledDate}T${inspection.scheduledTime}`)
  return Number.isNaN(scheduledAt.valueOf()) ? null : scheduledAt
}

export function isInspectionOverdue(inspection: Inspection, now = new Date()) {
  if (inspection.status === "completed") return false
  const scheduledAt = getInspectionScheduledAt(inspection)
  return scheduledAt !== null && scheduledAt.valueOf() < now.valueOf()
}

export function getOverdueInspections(inspections: Inspection[], now = new Date()) {
  return inspections.filter((inspection) => isInspectionOverdue(inspection, now)).slice().sort(compareScheduledAt)
}

function localDateAfter(now: Date, days: number) {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  return localDateValue(date)
}

const inspectionAlertPriority: Record<InspectionAlertType, number> = {
  conflict: 0,
  overdue: 1,
  today: 2,
  tomorrow: 3,
  upcoming: 4,
}

const inspectionAlertMessage: Record<InspectionAlertType, string> = {
  conflict: "관리인 일정 충돌이 있는 점검입니다.",
  overdue: "예정 시간이 지난 미완료 점검입니다.",
  today: "오늘 예정된 점검이 있습니다.",
  tomorrow: "내일 예정된 점검이 있습니다.",
  upcoming: "3일 이내 예정된 점검이 있습니다.",
}

export function createInspectionAlerts(inspections: Inspection[], _managers: Array<{ id: string }>, now = new Date()): InspectionAlert[] {
  const today = localDateValue(now)
  const tomorrow = localDateAfter(now, 1)
  const upcomingDates = new Set([localDateAfter(now, 2), localDateAfter(now, 3)])
  const conflictIds = new Set(getScheduleConflictGroups(inspections).flatMap((group) => group.inspections.map((inspection) => inspection.id)))
  const alerts: InspectionAlert[] = []

  inspections.forEach((inspection) => {
    if (!hasInspectionAssignment(inspection)) return
    const base = {
      inspectionId: inspection.id,
      scheduledDate: inspection.scheduledDate as string,
      scheduledTime: inspection.scheduledTime as string,
      managerId: inspection.assignedManagerId,
    }
    if (conflictIds.has(inspection.id)) alerts.push({ id: `alert-${inspection.id}-conflict`, type: "conflict", message: inspectionAlertMessage.conflict, ...base })
    if (inspection.status === "completed") return
    const type = isInspectionOverdue(inspection, now) ? "overdue" : inspection.scheduledDate === today ? "today" : inspection.scheduledDate === tomorrow ? "tomorrow" : upcomingDates.has(inspection.scheduledDate as string) ? "upcoming" : null
    if (type) alerts.push({ id: `alert-${inspection.id}-${type}`, type, message: inspectionAlertMessage[type], ...base })
  })

  return alerts.slice().sort((a, b) => inspectionAlertPriority[a.type] - inspectionAlertPriority[b.type] || `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`) || a.id.localeCompare(b.id))
}

export function getInspectionAlertCounts(alerts: InspectionAlert[]): InspectionAlertCounts {
  return alerts.reduce<InspectionAlertCounts>((counts, alert) => ({ ...counts, [alert.type]: counts[alert.type] + 1 }), { conflict: 0, overdue: 0, today: 0, tomorrow: 0, upcoming: 0 })
}

function isUpcomingInspection(item: Inspection, now: Date) {
  if (item.status === "completed" || !hasInspectionAssignment(item)) return false
  const scheduledAt = getInspectionScheduledAt(item)
  return scheduledAt !== null && scheduledAt.valueOf() >= now.valueOf()
}

export function createManagerScheduleSummary(managers: Array<{ id: string }>, inspections: Inspection[], now = new Date()): ManagerScheduleSummary[] {
  const today = localDateValue(now)
  const conflictGroups = getScheduleConflictGroups(inspections)
  return managers.map((manager) => {
    const assigned = inspections.filter((item) => item.assignedManagerId === manager.id)
    const scheduled = assigned.filter((item) => item.status !== "completed" && hasInspectionAssignment(item))
    const nextInspection = scheduled.filter((item) => isUpcomingInspection(item, now)).slice().sort(compareScheduledAt)[0]
    return {
      managerId: manager.id,
      totalAssigned: assigned.length,
      scheduled: scheduled.length,
      inProgress: assigned.filter((item) => item.status === "in-progress").length,
      completed: assigned.filter((item) => item.status === "completed").length,
      upcoming: scheduled.filter((item) => isUpcomingInspection(item, now)).length,
      today: scheduled.filter((item) => item.scheduledDate === today).length,
      overdue: scheduled.filter((item) => isInspectionOverdue(item, now)).length,
      conflictCount: conflictGroups.filter((group) => group.managerId === manager.id).reduce((count, group) => count + group.inspections.length, 0),
      nextInspection,
    }
  })
}

export function calculateManagerScheduleOverview(managers: Array<{ id: string }>, inspections: Inspection[], now = new Date()): ManagerScheduleOverview {
  const managerIds = new Set(managers.map((manager) => manager.id))
  return {
    summaries: createManagerScheduleSummary(managers, inspections, now),
    unassignedCount: inspections.filter((item) => !item.assignedManagerId).length,
    missingManagerCount: inspections.filter((item) => item.assignedManagerId !== undefined && !managerIds.has(item.assignedManagerId)).length,
  }
}

export function filterManagerScheduleSummary(summaries: ManagerScheduleSummary[], filter: ManagerWorkloadFilter) {
  return summaries.filter((summary) => filter === "all" || (filter === "has-schedule" ? summary.scheduled > 0 : filter === "today" ? summary.today > 0 : filter === "overdue" ? summary.overdue > 0 : summary.conflictCount > 0))
}

export function saveInspectionAssignment(inspection: Inspection, assignment: InspectionAssignment, managerIds: string[], today?: string, items: Inspection[] = []) {
  if (inspection.status === "completed") return { valid: false as const, message: "완료된 점검의 일정과 담당자는 변경할 수 없습니다." }
  const validation = validateInspectionAssignment(assignment, managerIds, today)
  if (!validation.valid) return validation
  const conflicts = findScheduleConflicts(items, { inspectionId: inspection.id, ...assignment })
  if (conflicts.conflict) return { valid: false as const, message: "선택한 관리인은 같은 시간에 다른 점검이 예정되어 있습니다.", conflicts: conflicts.inspections }
  const previous = getScheduleSnapshot(inspection)
  const next = { managerId: assignment.assignedManagerId, scheduledDate: assignment.scheduledDate, scheduledTime: assignment.scheduledTime }
  const historyEntry = createScheduleHistoryEntry(previous, next)
  return {
    valid: true as const,
    inspection: {
      ...inspection,
      ...assignment,
      status: inspection.status === "requested" ? "scheduled" as const : inspection.status,
      ...(historyEntry ? { assignmentUpdatedAt: historyEntry.changedAt, scheduleHistory: [...(inspection.scheduleHistory ?? []), historyEntry] } : {}),
    },
  }
}

export function saveInspectionResult(inspection: Inspection, result: InspectionResult): Inspection {
  return { ...inspection, status: "completed", result }
}

export function calculateInspectionStats(items: Inspection[]) {
  const completed = items.filter((item) => item.status === "completed").length
  return { total: items.length, active: items.length - completed, completed }
}

export function calculateScheduleStats(items: Inspection[]) {
  const unassigned = items.filter((item) => item.status !== "completed" && !hasInspectionAssignment(item)).length
  const scheduled = items.filter((item) => item.status === "scheduled").length
  const inProgress = items.filter((item) => item.status === "in-progress").length
  const upcoming = items
    .filter((item) => item.status !== "completed" && hasInspectionAssignment(item))
    .slice()
    .sort(compareScheduledAt)
  return { unassigned, scheduled, inProgress, upcoming }
}

export const inspectionResultStatusLabel: Record<InspectionItemStatus, string> = {
  normal: "정상",
  attention: "주의",
  "action-required": "조치 필요",
}
