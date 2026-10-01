"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { CalendarClock, Save } from "lucide-react"
import { managers as seedManagers } from "@/lib/mock-data"
import { managersChangedEvent, readLocalManagers } from "@/lib/local-managers"
import { getManagerScheduledInspections, inspectionsChangedEvent, readInspections, saveInspectionAssignment, updateInspection, writeInspections, type Inspection } from "@/lib/inspections"

export function InspectionAssignmentForm({ inspection, onSaved }: { inspection: Inspection; onSaved: (inspection: Inspection) => void }) {
  const [managers, setManagers] = useState(seedManagers)
  const [assignedManagerId, setAssignedManagerId] = useState(inspection.assignedManagerId ?? "")
  const [scheduledDate, setScheduledDate] = useState(inspection.scheduledDate ?? "")
  const [scheduledTime, setScheduledTime] = useState(inspection.scheduledTime ?? "")
  const [inspectionItems, setInspectionItems] = useState<Inspection[]>([])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    const load = () => setManagers(readLocalManagers(window.localStorage, seedManagers))
    load(); window.addEventListener(managersChangedEvent, load)
    return () => window.removeEventListener(managersChangedEvent, load)
  }, [])
  useEffect(() => {
    const load = () => setInspectionItems(readInspections(window.localStorage))
    load(); window.addEventListener(inspectionsChangedEvent, load); window.addEventListener("storage", load)
    return () => { window.removeEventListener(inspectionsChangedEvent, load); window.removeEventListener("storage", load) }
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const currentInspections = readInspections(window.localStorage)
    const saved = saveInspectionAssignment(inspection, { assignedManagerId, scheduledDate, scheduledTime }, managers.map((manager) => manager.id), today, currentInspections)
    if (!saved.valid) { setError(saved.message); setSaving(false); return }
    if (!writeInspections(window.localStorage, updateInspection(readInspections(window.localStorage), saved.inspection))) { setError("일정과 담당자 정보를 저장하지 못했습니다."); setSaving(false); return }
    setError(""); setSaving(false); onSaved(saved.inspection)
  }

  const managerSchedule = assignedManagerId ? getManagerScheduledInspections(inspectionItems, assignedManagerId, inspection.id).slice(0, 5) : []
  return <form onSubmit={submit} className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><CalendarClock className="size-5" /></span><div><h2 className="text-lg font-bold">일정 및 담당 관리인 배정</h2><p className="mt-1 text-sm text-muted-foreground">저장하면 요청 접수 상태가 일정 확정으로 변경됩니다.</p></div></div><div className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-bold">담당 관리인<select value={assignedManagerId} onChange={(event) => setAssignedManagerId(event.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal"><option value="">관리인을 선택해주세요</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name} 관리인 · {manager.regions} · 경력 {manager.years}년</option>)}</select></label>{assignedManagerId ? <div className="rounded-lg bg-surface-muted p-3 text-sm"><p className="font-bold">현재 예정된 점검</p>{managerSchedule.length ? <ul className="mt-2 space-y-1 text-muted-foreground">{managerSchedule.map((item) => <li key={item.id} className="break-words">{item.scheduledDate} {item.scheduledTime} · {item.address}</li>)}</ul> : <p className="mt-1 text-muted-foreground">현재 등록된 예정 점검이 없습니다.</p>}</div> : null}<div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">점검 예정일<input type="date" min={today} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold">점검 예정 시간<input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="min-h-11 rounded-lg border bg-background px-3 font-normal" /></label></div></div>{error && <div role="alert" className="mt-4 rounded-lg bg-status-danger/10 p-3 text-sm"><p className="font-bold">{error}</p><p className="mt-1 text-muted-foreground">다른 관리인, 날짜 또는 시간을 선택해주세요.</p></div>}<button disabled={saving} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground disabled:opacity-60"><Save className="size-4" />{saving ? "저장 중..." : inspection.assignedManagerId ? "일정·담당자 변경 저장" : "일정 확정 및 담당자 배정"}</button></form>
}
