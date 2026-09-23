"use client"

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bot, ChevronDown, Eraser, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react"
import { interpretChatAction } from "@/lib/chat-actions"
import type { ChatAction } from "@/lib/chat-actions"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const storageKey = "binjip-chatbot-messages-v1"
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "안녕하세요. 빈집지킴이 도우미예요. 주소 확인, 관리인 찾기, 견적 비교, 점검 결과 예시에 관해 편하게 물어보세요.",
}
const suggestedQuestions = [
  "이 서비스는 어떻게 사용하나요?",
  "순천시에서 관리인을 어떻게 찾나요?",
  "관리인 선택 전에 무엇을 비교해야 하나요?",
  "점검 결과 예시는 어떻게 봐야 하나요?",
]
const quickActions = ["사용 방법", "관리인 찾기", "점검 결과 보기"]

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, content }
}

function readStoredMessages() {
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (!stored) return null
    const messages = JSON.parse(stored) as unknown
    if (!Array.isArray(messages) || !messages.every((message) => message && typeof message === "object" && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")) return null
    return messages.slice(-24) as ChatMessage[]
  } catch {
    return null
  }
}

export function ProjectChatbot() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [pendingAction, setPendingAction] = useState<"manager-search" | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = readStoredMessages()
    if (stored?.length) setMessages(stored)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-24)))
  }, [hydrated, messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading, error, open])

  const showSuggestions = useMemo(() => messages.length === 1 && messages[0].id === "welcome", [messages])

  function runAppAction(action: ChatAction) {
    if (action.type === "navigate") {
      router.push(action.href)
      setMessages((current) => [...current, createMessage("assistant", action.confirmation)])
      return
    }

    if (action.type === "manager-search") {
      const params = new URLSearchParams()
      if (action.keyword) params.set("q", action.keyword)
      if (action.region) params.set("region", action.region)
      router.push(`/managers?${params.toString()}`)
      setMessages((current) => [...current, createMessage("assistant", action.confirmation)])
      return
    }

    if (action.type === "manager-detail") {
      router.push(`/managers/${action.managerId}`)
      setMessages((current) => [...current, createMessage("assistant", action.confirmation)])
      return
    }

    setMessages((current) => [...current, createMessage("assistant", action.message)])
  }

  async function sendMessage(prompt?: string, retry = false) {
    const content = (prompt ?? draft).trim()
    if (!content || isLoading) return

    const nextMessages = retry ? messages : [...messages, createMessage("user", content)]
    if (!retry) setMessages(nextMessages)
    setDraft("")
    setError(null)
    setLastPrompt(content)

    const action = retry ? null : interpretChatAction(content, pendingAction ?? undefined)
    if (action) {
      setPendingAction(action.type === "clarify" ? action.pending : null)
      setLastPrompt(null)
      runAppAction(action)
      return
    }

    setPendingAction(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12).map(({ role, content: messageContent }) => ({ role, content: messageContent })), page: pathname }),
      })
      const payload = await response.json() as { answer?: unknown; error?: { message?: unknown } }
      const answer = typeof payload.answer === "string" ? payload.answer.trim() : ""
      if (!response.ok || !answer) {
        throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "AI 답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.")
      }
      setMessages((current) => [...current, createMessage("assistant", answer)])
      setLastPrompt(null)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : ""
      const isUserSafeMessage = /^(AI|대화|질문)/.test(message)

      setError(
        isUserSafeMessage
          ? message
          : "AI 답변을 가져오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  function clearConversation() {
    sessionStorage.removeItem(storageKey)
    setMessages([welcomeMessage])
    setDraft("")
    setError(null)
    setLastPrompt(null)
    setPendingAction(null)
    setConfirmingClear(false)
  }

  return (
    <aside className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-24 sm:right-5" aria-label="빈집지킴이 AI 도우미">
      {open ? (
        <section className="flex h-[min(620px,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" role="dialog" aria-modal="false" aria-labelledby="chatbot-title" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false) }}>
          <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground"><Bot className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0"><h2 id="chatbot-title" className="truncate text-sm font-bold text-foreground">빈집지킴이 AI 도우미</h2><p className="text-xs text-muted-foreground">현재 화면을 참고해 안내합니다</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label="AI 도우미 닫기"><X className="size-5" /></button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            {showSuggestions ? (
              <div className="rounded-xl border border-border bg-surface-muted p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Sparkles className="size-4 text-brand" aria-hidden="true" />이런 질문부터 해보세요</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => <button key={question} type="button" onClick={() => void sendMessage(question)} disabled={isLoading} className="rounded-lg border border-border bg-card px-2.5 py-2 text-left text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">{question}</button>)}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-md bg-brand text-brand-foreground" : "rounded-bl-md bg-surface-muted text-foreground"}`}>
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading ? <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-surface-muted px-3.5 py-2.5 text-sm text-muted-foreground" role="status">도우미가 답변을 작성하고 있어요…</div></div> : null}
            {error ? (
              <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3" role="alert">
                <p className="text-xs leading-relaxed text-foreground">{error}</p>
                {lastPrompt ? <button type="button" onClick={() => void sendMessage(lastPrompt, true)} disabled={isLoading} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-60"><RotateCcw className="size-3.5" />다시 시도</button> : null}
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {quickActions.map((action) => <button key={action} type="button" onClick={() => void sendMessage(action === "사용 방법" ? "이 서비스는 어떻게 사용하나요?" : action === "관리인 찾기" ? "관리인 찾기 기능을 설명해줘." : "점검 결과 예시는 어떻게 봐야 하나요?")} disabled={isLoading} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60">{action}</button>)}
              <button type="button" onClick={() => setConfirmingClear(true)} disabled={isLoading} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"><Eraser className="size-3.5" />대화 초기화</button>
            </div>
            {confirmingClear ? <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground"><span>대화 내용을 초기화할까요?</span><span className="flex shrink-0 gap-1"><button type="button" onClick={clearConversation} className="rounded-md bg-brand px-2 py-1 font-bold text-brand-foreground">초기화</button><button type="button" onClick={() => setConfirmingClear(false)} className="rounded-md border border-border bg-card px-2 py-1">취소</button></span></div> : null}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="chatbot-message" className="sr-only">AI 도우미에게 질문하기</label>
              <textarea id="chatbot-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} maxLength={1200} rows={2} placeholder="빈집지킴이에 관해 물어보세요" className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/30 disabled:opacity-60" />
              <button type="submit" disabled={isLoading || !draft.trim()} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50" aria-label="메시지 전송"><Send className="size-4" /></button>
            </form>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Enter 전송 · Shift + Enter 줄바꿈</p>
          </div>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground shadow-lg transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label="AI 도우미 열기" aria-expanded={open}>
        <MessageCircle className="size-5" aria-hidden="true" />
        AI 도우미
        <ChevronDown className="size-4 -rotate-90" aria-hidden="true" />
      </button>
    </aside>
  )
}
