import { test } from "node:test"
import assert from "node:assert/strict"
import { buildInspectionBriefPrompt, createInspectionBriefInput, inspectionBriefProviderError, isInspectionBriefConfigured, parseInspectionBrief, parseInspectionBriefContent, validateInspectionBriefInput } from "../lib/inspection-brief.ts"
import { createInspection } from "../lib/inspections.ts"

const inspection = createInspection({ address: "전남 순천시 테스트길 101", inspectionType: "정기 빈집 점검", scheduledAt: "2030-03-20", managerId: "kim-hyeonsu", memo: "창문 상태 확인" })

test("AI 브리핑 구조화 응답은 summary·최대 3개 checks·최대 2개 actions만 허용한다", () => {
  const brief = parseInspectionBrief({ summary: "점검 일정이 저장되어 있습니다.", checks: ["예정 일시 확인", "담당 관리인 확인", "결과 입력 여부 확인"], actions: ["필요한 경우 일정을 다시 지정하세요."], notice: "저장된 점검정보를 정리한 AI 안내이며 현장 안전진단이나 법적 판정이 아닙니다." })
  assert.equal(brief?.checks.length, 3)
  assert.equal(brief?.actions.length, 1)
  assert.equal(parseInspectionBrief({ ...brief, checks: ["1", "2", "3", "4"] }), null)
  assert.equal(parseInspectionBrief({ ...brief, actions: ["1", "2", "3"] }), null)
})

test("AI 브리핑은 malformed JSON과 잘못된 입력을 출력하지 않는다", () => {
  assert.equal(parseInspectionBriefContent("{broken"), null)
  assert.equal(parseInspectionBrief({ summary: "", checks: [], actions: [], notice: "안내" }), null)
  assert.equal(validateInspectionBriefInput({ address: "주소" }), null)
})

test("AI 입력은 현재 점검 1건과 기존 파생 상태만 사용하며 점검 원본을 변경하지 않는다", () => {
  const original = structuredClone(inspection)
  const input = createInspectionBriefInput(inspection, { managerName: "김현수", overdue: true, conflict: false })
  assert.deepEqual(inspection, original)
  assert.equal(input.address, inspection.address)
  assert.equal(input.overdue, true)
  assert.equal(input.conflict, false)
  assert.match(buildInspectionBriefPrompt(input), /OVERDUE와 충돌은 이미 시스템이 판정한 값/)
})

test("AI 브리핑 설정 및 무료 API 오류는 안전한 메시지로 매핑한다", () => {
  assert.equal(isInspectionBriefConfigured(undefined), false)
  assert.equal(isInspectionBriefConfigured(" key "), true)
  assert.deepEqual(inspectionBriefProviderError(429), { status: 429, code: "AI_RATE_LIMIT", message: "무료 AI 사용 한도에 도달했습니다. 잠시 후 다시 이용해주세요." })
  assert.equal(inspectionBriefProviderError(500).status, 502)
  assert.equal(inspectionBriefProviderError(401).status, 503)
})
