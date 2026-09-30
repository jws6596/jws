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
    (item.result === undefined || isInspectionResult(item.result))
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
  if (nextStatus === "completed" && !inspection.result) return null
  return { ...inspection, status: nextStatus }
}

export function saveInspectionResult(inspection: Inspection, result: InspectionResult): Inspection {
  return { ...inspection, status: "completed", result }
}

export function calculateInspectionStats(items: Inspection[]) {
  const completed = items.filter((item) => item.status === "completed").length
  return { total: items.length, active: items.length - completed, completed }
}

export const inspectionResultStatusLabel: Record<InspectionItemStatus, string> = {
  normal: "정상",
  attention: "주의",
  "action-required": "조치 필요",
}
