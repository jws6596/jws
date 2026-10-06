"use client"

import { useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { createInspectionBriefInput, type InspectionBrief } from "@/lib/inspection-brief"
import type { Inspection } from "@/lib/inspections"

type Props = { inspection: Inspection; managerName?: string; overdue: boolean; conflict: boolean }

export function InspectionBrief({ inspection, managerName, overdue, conflict }: Props) {
  const [brief, setBrief] = useState<InspectionBrief | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const requestInFlight = useRef(false)

  const requestBrief = async () => {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setLoading(true)
    setError(null)
    setBrief(null)
    try {
      const response = await fetch("/api/inspection-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspection: createInspectionBriefInput(inspection, { managerName, overdue, conflict }) }),
      })
      const payload = await response.json().catch(() => null) as { brief?: InspectionBrief; error?: { message?: string } } | null
      if (!response.ok || !payload?.brief) throw new Error(payload?.error?.message ?? "현재 AI 점검 브리핑을 사용할 수 없습니다.")
      setBrief(payload.brief)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "현재 AI 점검 브리핑을 사용할 수 없습니다.")
    } finally {
      requestInFlight.current = false
      setLoading(false)
    }
  }

  return <section className="mt-6 rounded-xl border border-brand/20 bg-brand/5 p-4 sm:p-5" aria-labelledby="inspection-brief-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="inspection-brief-title" className="flex items-center gap-2 text-lg font-bold"><Sparkles className="size-5 text-brand" aria-hidden="true" />AI 점검 브리핑</h2><p className="mt-1 text-sm text-muted-foreground">현재 저장된 점검정보 1건을 짧게 정리합니다.</p></div><button type="button" onClick={requestBrief} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground disabled:cursor-wait disabled:opacity-60">{loading ? "AI 브리핑 생성 중..." : "AI 점검 브리핑"}</button></div>
    {error ? <p className="mt-4 rounded-lg border border-status-warning/30 bg-background p-3 text-sm text-foreground" role="alert">{error}</p> : null}
    {brief ? <div className="mt-5 space-y-4 rounded-lg border border-border bg-card p-4" aria-live="polite"><section><h3 className="font-bold">현재 상황</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{brief.summary}</p></section><section><h3 className="font-bold">확인할 사항</h3><ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">{brief.checks.map((item, index) => <li key={`${index}-${item}`} className="break-words">• {item}</li>)}</ul></section><section><h3 className="font-bold">다음 운영 조치</h3><ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">{brief.actions.map((item, index) => <li key={`${index}-${item}`} className="break-words">• {item}</li>)}</ul></section><section className="rounded-lg bg-surface-muted p-3"><h3 className="font-bold">안내</h3><p className="mt-1 break-words text-sm text-muted-foreground">{brief.notice}</p></section></div> : null}
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">이 브리핑은 현재 저장된 점검정보를 AI가 정리한 내용입니다. 현장 안전진단이나 법적 판정이 아닙니다.</p>
  </section>
}
