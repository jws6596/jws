"use client"

import { FormEvent, useState } from "react"
import { Save } from "lucide-react"
import { repairItems } from "@/lib/mock-data"
import { inspectionResultStatusLabel, readInspections, saveInspectionResult, updateInspection, writeInspections, type Inspection, type InspectionItemStatus, type InspectionResult } from "@/lib/inspections"

type ResultDraft = InspectionResult
const statuses = Object.keys(inspectionResultStatusLabel) as InspectionItemStatus[]

function newDraft(inspection: Inspection): ResultDraft {
  return inspection.result ?? {
    inspectedAt: new Date().toISOString().slice(0, 16), overallStatus: "attention",
    items: repairItems.map((item) => ({ title: item.title, status: "attention", note: "" })), inspectorNote: "", recommendedActions: "",
  }
}

export function InspectionResultForm({ inspection, editing = false, onSaved }: { inspection: Inspection; editing?: boolean; onSaved: (updated: Inspection) => void }) {
  const [draft, setDraft] = useState<ResultDraft>(() => newDraft(inspection))
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const updateItem = (index: number, key: "status" | "note", value: string) => setDraft((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }))
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!draft.inspectedAt || !draft.overallStatus || !draft.inspectorNote.trim() || !draft.recommendedActions.trim() || draft.items.some((item) => !item.status)) { setError("완료 일시, 전체 상태, 모든 항목 상태, 점검 메모와 조치사항을 입력해주세요."); return }
    setSaving(true)
    const result = { ...draft, inspectorNote: draft.inspectorNote.trim(), recommendedActions: draft.recommendedActions.trim(), items: draft.items.map((item) => ({ ...item, note: item.note.trim() })) }
    const updated = saveInspectionResult(inspection, result)
    const saved = writeInspections(window.localStorage, updateInspection(readInspections(window.localStorage), updated))
    if (!saved) { setError("결과를 브라우저에 저장하지 못했습니다."); setSaving(false); return }
    onSaved(updated)
    setSaving(false)
  }
  return <form onSubmit={submit} className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5"><h2 className="text-lg font-bold">{editing ? "점검 결과 수정" : "점검 결과 입력"}</h2><p className="mt-1 text-sm text-muted-foreground">입력한 내용은 현재 브라우저에만 저장됩니다.</p><div className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-bold">점검 완료 일시<input type="datetime-local" value={draft.inspectedAt} onChange={(event) => setDraft((current) => ({ ...current, inspectedAt: event.target.value }))} className="min-h-11 rounded-lg border bg-background px-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold">전체 상태<select value={draft.overallStatus} onChange={(event) => setDraft((current) => ({ ...current, overallStatus: event.target.value as InspectionItemStatus }))} className="min-h-11 rounded-lg border bg-background px-3 font-normal">{statuses.map((status) => <option key={status} value={status}>{inspectionResultStatusLabel[status]}</option>)}</select></label></div><fieldset className="mt-6"><legend className="font-bold">점검 항목별 결과</legend><div className="mt-3 space-y-3">{draft.items.map((item, index) => <div key={item.title} className="rounded-lg border border-border p-3"><p className="font-bold">{item.title}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><select aria-label={`${item.title} 상태`} value={item.status} onChange={(event) => updateItem(index, "status", event.target.value)} className="min-h-11 rounded-lg border bg-background px-3 text-sm">{statuses.map((status) => <option key={status} value={status}>{inspectionResultStatusLabel[status]}</option>)}</select><input aria-label={`${item.title} 메모`} value={item.note} onChange={(event) => updateItem(index, "note", event.target.value)} className="min-h-11 rounded-lg border bg-background px-3 text-sm" placeholder="항목 메모 (선택)" /></div></div>)}</div></fieldset><label className="mt-5 grid gap-2 text-sm font-bold">점검 메모<textarea value={draft.inspectorNote} onChange={(event) => setDraft((current) => ({ ...current, inspectorNote: event.target.value }))} className="min-h-24 rounded-lg border bg-background p-3 font-normal" placeholder="현장에서 확인한 내용을 입력하세요." /></label><label className="mt-5 grid gap-2 text-sm font-bold">필요한 조치사항<textarea value={draft.recommendedActions} onChange={(event) => setDraft((current) => ({ ...current, recommendedActions: event.target.value }))} className="min-h-24 rounded-lg border bg-background p-3 font-normal" placeholder="후속 조치가 필요한 내용을 입력하세요." /></label>{error && <p role="alert" className="mt-4 rounded-lg bg-status-danger/10 p-3 text-sm">{error}</p>}<button disabled={saving} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground disabled:opacity-60"><Save className="size-4" />{saving ? "결과를 저장하는 중..." : editing ? "수정 결과 저장" : "결과 저장 후 완료 처리"}</button></form>
}
