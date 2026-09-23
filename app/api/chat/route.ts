import { NextRequest, NextResponse } from "next/server"
import { getCurrentPageContext, projectChatContext } from "@/lib/project-chat-context"

export const runtime = "nodejs"

type ChatMessage = { role: "user" | "assistant"; content: string }

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim().length > 0 && message.content.length <= 1200
}

function buildConversation(messages: ChatMessage[]) {
  return messages.map((message) => `${message.role === "user" ? "사용자" : "도우미"}: ${message.content.trim()}`).join("\n\n")
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: { code: "AI_NOT_CONFIGURED", message: "AI 연결이 아직 설정되지 않았습니다. 관리자에게 OPENAI_API_KEY 설정을 요청한 뒤 다시 시도해주세요." } }, { status: 503 })
  }

  let body: { messages?: unknown; page?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "대화 내용을 읽을 수 없습니다. 다시 시도해주세요." } }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages.filter(isChatMessage).slice(-12) : []
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: { code: "INVALID_MESSAGE", message: "질문을 입력한 뒤 다시 시도해주세요." } }, { status: 400 })
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        store: false,
        max_output_tokens: 500,
        instructions: `${projectChatContext}\n\n현재 페이지 정보:\n${getCurrentPageContext(body.page)}`,
        input: buildConversation(messages),
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: { code: "AI_UPSTREAM_ERROR", message: "AI 답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요." } }, { status: 502 })
    }

    const payload = await response.json() as { output_text?: unknown }
    const answer = typeof payload.output_text === "string" ? payload.output_text.trim() : ""
    if (!answer) {
      return NextResponse.json({ error: { code: "EMPTY_RESPONSE", message: "답변을 만들지 못했습니다. 질문을 조금 다르게 입력해 다시 시도해주세요." } }, { status: 502 })
    }

    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ error: { code: "NETWORK_ERROR", message: "AI 서비스에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요." } }, { status: 503 })
  }
}
