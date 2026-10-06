import { NextRequest, NextResponse } from "next/server"
import { buildInspectionBriefPrompt, inspectionBriefJsonSchema, inspectionBriefProviderError, isInspectionBriefConfigured, parseInspectionBriefContent, validateInspectionBriefInput } from "@/lib/inspection-brief"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!isInspectionBriefConfigured(process.env.GROQ_API_KEY)) {
    return NextResponse.json({ error: { code: "AI_UNAVAILABLE", message: "현재 AI 점검 브리핑을 사용할 수 없습니다." } }, { status: 503 })
  }

  let body: { inspection?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "점검 정보를 읽을 수 없습니다. 다시 시도해주세요." } }, { status: 400 })
  }

  const inspection = validateInspectionBriefInput(body.inspection)
  if (!inspection) return NextResponse.json({ error: { code: "INVALID_INSPECTION", message: "AI 브리핑에 사용할 점검 정보가 올바르지 않습니다." } }, { status: 400 })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "You format stored inspection operations information only. Return the requested JSON schema and do not add unsupported claims." },
          { role: "user", content: buildInspectionBriefPrompt(inspection) },
        ],
        response_format: { type: "json_schema", json_schema: inspectionBriefJsonSchema },
        max_completion_tokens: 500,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const error = inspectionBriefProviderError(response.status)
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> }
    const brief = parseInspectionBriefContent(payload.choices?.[0]?.message?.content)
    if (!brief) return NextResponse.json({ error: { code: "INVALID_AI_RESPONSE", message: "AI 점검 브리핑을 안전하게 읽지 못했습니다. 잠시 후 다시 이용해주세요." } }, { status: 502 })
    return NextResponse.json({ brief })
  } catch {
    return NextResponse.json({ error: { code: "AI_NETWORK_ERROR", message: "현재 AI 점검 브리핑을 사용할 수 없습니다." } }, { status: 503 })
  } finally {
    clearTimeout(timeout)
  }
}
