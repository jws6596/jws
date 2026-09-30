"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Send } from "lucide-react"
import { managers } from "@/lib/mock-data"
import { createInspection, readInspections, validateInspectionInput, writeInspections } from "@/lib/inspections"

type FormState = { address: string; inspectionType: string; scheduledAt: string; managerId: string; memo: string }
const initialState: FormState = { address: "", inspectionType: "정기 빈집 점검", scheduledAt: "", managerId: "", memo: "" }

export function InspectionRequestForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const validation = validateInspectionInput(form, minDate)
    if (!validation.valid) { setError(validation.message); return }
    setSubmitting(true)
    const inspection = createInspection({ ...form, address: form.address.trim(), memo: form.memo.trim() })
    const current = readInspections(window.localStorage)
    if (!writeInspections(window.localStorage, [inspection, ...current])) { setError("브라우저에 요청을 저장하지 못했습니다."); setSubmitting(false); return }
    router.push(`/my-inspections?created=${inspection.id}`)
  }

  return <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7" noValidate>
    <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><CalendarDays className="size-5" /></span><div><h1 className="text-2xl font-bold">빈집 점검 요청</h1><p className="mt-1 text-sm text-muted-foreground">입력한 요청은 현재 브라우저에 저장됩니다.</p></div></div>
    <div className="mt-7 grid gap-5">
      <label className="grid gap-2 text-sm font-bold">점검 대상 주소<input value={form.address} onChange={(e) => update("address", e.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal" placeholder="예: 전남 순천시 서면 ○○길 123" /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">점검 유형<select value={form.inspectionType} onChange={(e) => update("inspectionType", e.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal"><option>정기 빈집 점검</option><option>방문 전 상태 확인</option><option>정비 전 현장 확인</option></select></label>
        <label className="grid gap-2 text-sm font-bold">희망일<input type="date" min={minDate} value={form.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal" /></label>
      </div>
      <label className="grid gap-2 text-sm font-bold">담당 관리인<select value={form.managerId} onChange={(e) => update("managerId", e.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal"><option value="">관리인을 선택해주세요</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name} 관리인 · {manager.regions}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-bold">요청사항 <span className="font-normal text-muted-foreground">(선택)</span><textarea value={form.memo} onChange={(e) => update("memo", e.target.value)} className="min-h-28 rounded-lg border bg-background p-3 font-normal" placeholder="현장에서 확인할 내용이 있다면 남겨주세요." /></label>
    </div>
    {error && <p role="alert" className="mt-5 rounded-lg bg-status-danger/10 p-3 text-sm text-foreground">{error}</p>}
    <button disabled={submitting} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-brand-foreground hover:bg-brand-hover disabled:opacity-60"><Send className="size-4" />{submitting ? "요청을 저장하는 중..." : "점검 요청 저장"}</button>
  </form>
}
