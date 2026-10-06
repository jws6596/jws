import type { Inspection } from "@/lib/inspections"

export type InspectionBriefInput = {
  address: string
  inspectionType: string
  status: string
  memo?: string
  managerName?: string
  scheduledDate?: string
  scheduledTime?: string
  overdue: boolean
  conflict: boolean
  result?: {
    overallStatus: string
    itemCount: number
    inspectorNote?: string
    recommendedActions?: string
  }
}

export type InspectionBrief = {
  summary: string
  checks: string[]
  actions: string[]
  notice: string
}

type BriefFlags = { managerName?: string; overdue: boolean; conflict: boolean }

const maxTextLength = 800

function optionalText(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().slice(0, maxTextLength)
  return trimmed || undefined
}

function requiredText(value: unknown) {
  return optionalText(value) ?? ""
}

export function createInspectionBriefInput(inspection: Inspection, flags: BriefFlags): InspectionBriefInput {
  const result = inspection.result
  return {
    address: inspection.address,
    inspectionType: inspection.inspectionType,
    status: inspection.status,
    ...(inspection.memo.trim() ? { memo: inspection.memo } : {}),
    ...(flags.managerName ? { managerName: flags.managerName } : {}),
    ...(inspection.scheduledDate ? { scheduledDate: inspection.scheduledDate } : {}),
    ...(inspection.scheduledTime ? { scheduledTime: inspection.scheduledTime } : {}),
    overdue: flags.overdue,
    conflict: flags.conflict,
    ...(result ? {
      result: {
        overallStatus: result.overallStatus,
        itemCount: result.items.length,
        ...(result.inspectorNote.trim() ? { inspectorNote: result.inspectorNote } : {}),
        ...(result.recommendedActions.trim() ? { recommendedActions: result.recommendedActions } : {}),
      },
    } : {}),
  }
}

export function validateInspectionBriefInput(value: unknown): InspectionBriefInput | null {
  if (!value || typeof value !== "object") return null
  const input = value as Record<string, unknown>
  const address = requiredText(input.address)
  const inspectionType = requiredText(input.inspectionType)
  const status = requiredText(input.status)
  if (!address || !inspectionType || !status || typeof input.overdue !== "boolean" || typeof input.conflict !== "boolean") return null

  const rawResult = input.result
  const result = rawResult && typeof rawResult === "object"
    ? (() => {
        const candidate = rawResult as Record<string, unknown>
        const overallStatus = requiredText(candidate.overallStatus)
        const itemCount = typeof candidate.itemCount === "number" && Number.isInteger(candidate.itemCount) && candidate.itemCount >= 0 ? candidate.itemCount : null
        if (!overallStatus || itemCount === null) return undefined
        return {
          overallStatus,
          itemCount,
          ...(optionalText(candidate.inspectorNote) ? { inspectorNote: optionalText(candidate.inspectorNote) } : {}),
          ...(optionalText(candidate.recommendedActions) ? { recommendedActions: optionalText(candidate.recommendedActions) } : {}),
        }
      })()
    : undefined

  return {
    address,
    inspectionType,
    status,
    ...(optionalText(input.memo) ? { memo: optionalText(input.memo) } : {}),
    ...(optionalText(input.managerName) ? { managerName: optionalText(input.managerName) } : {}),
    ...(optionalText(input.scheduledDate) ? { scheduledDate: optionalText(input.scheduledDate) } : {}),
    ...(optionalText(input.scheduledTime) ? { scheduledTime: optionalText(input.scheduledTime) } : {}),
    overdue: input.overdue,
    conflict: input.conflict,
    ...(result ? { result } : {}),
  }
}

function isBriefList(value: unknown, maximum: number): value is string[] {
  return Array.isArray(value) && value.length <= maximum && value.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= maxTextLength)
}

export function parseInspectionBrief(value: unknown): InspectionBrief | null {
  if (!value || typeof value !== "object") return null
  const brief = value as Record<string, unknown>
  if (typeof brief.summary !== "string" || !brief.summary.trim() || brief.summary.trim().length > maxTextLength) return null
  if (!isBriefList(brief.checks, 3) || !isBriefList(brief.actions, 2)) return null
  if (typeof brief.notice !== "string" || !brief.notice.trim() || brief.notice.trim().length > maxTextLength) return null
  return {
    summary: brief.summary.trim(),
    checks: brief.checks.map((item) => (item as string).trim()),
    actions: brief.actions.map((item) => (item as string).trim()),
    notice: brief.notice.trim(),
  }
}

export function parseInspectionBriefContent(content: unknown) {
  if (typeof content !== "string") return null
  try { return parseInspectionBrief(JSON.parse(content)) } catch { return null }
}

export function isInspectionBriefConfigured(apiKey: string | undefined) {
  return Boolean(apiKey?.trim())
}

export function inspectionBriefProviderError(status: number) {
  if (status === 429) return { status: 429, code: "AI_RATE_LIMIT", message: "무료 AI 사용 한도에 도달했습니다. 잠시 후 다시 이용해주세요." }
  if (status === 401 || status === 403) return { status: 503, code: "AI_UNAVAILABLE", message: "현재 AI 점검 브리핑을 사용할 수 없습니다." }
  return { status: 502, code: "AI_PROVIDER_ERROR", message: "AI 점검 브리핑을 만들지 못했습니다. 잠시 후 다시 이용해주세요." }
}

export const inspectionBriefJsonSchema = {
  name: "inspection_brief",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "checks", "actions", "notice"],
    properties: {
      summary: { type: "string" },
      checks: { type: "array", maxItems: 3, items: { type: "string" } },
      actions: { type: "array", maxItems: 2, items: { type: "string" } },
      notice: { type: "string" },
    },
  },
} as const

export function buildInspectionBriefPrompt(input: InspectionBriefInput) {
  return [
    "아래는 현재 저장된 점검 운영정보 1건입니다. 제공된 사실만 읽기 쉽게 요약하세요.",
    "현장 안전·구조·전기·가스 진단, 위험 단정, 법적 판정, 관리인 평가·순위, 사실에 없는 점검결과 생성은 금지합니다.",
    "OVERDUE와 충돌은 이미 시스템이 판정한 값이므로 새로 계산하지 말고, true인 경우에만 운영 확인사항으로 설명하세요.",
    "summary는 최대 2문장, checks는 최대 3개, actions는 최대 2개입니다.",
    "notice에는 '저장된 점검정보를 정리한 AI 안내이며 현장 안전진단이나 법적 판정이 아닙니다.'라는 의미를 짧게 포함하세요.",
    `점검 정보: ${JSON.stringify(input)}`,
  ].join("\n")
}
