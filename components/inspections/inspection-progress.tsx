"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleCheck, Clock3 } from "lucide-react"
import { managers as seedManagers } from "@/lib/mock-data"
import type { Manager } from "@/lib/mock-data"
import { managersChangedEvent, readLocalManagers } from "@/lib/local-managers"
import { getScheduleChanges, getScheduleHistory, hasInspectionAssignment, inspectionStatusLabel, inspectionStatusOrder, inspectionsChangedEvent, nextInspectionStatus, readInspections, transitionInspection, updateInspection, writeInspections, type Inspection } from "@/lib/inspections"
import { InspectionResultForm } from "./inspection-result-form"
import { InspectionAssignmentForm } from "./inspection-assignment-form"

function managerName(managerId: string | undefined, managers: Manager[]) {
  if (!managerId) return "담당자 없음"
  return managers.find((item) => item.id === managerId)?.name ?? `현재 등록되지 않은 관리인 (ID: ${managerId})`
}

export function InspectionProgress({ id }: { id: string | null }) {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [managers, setManagers] = useState(seedManagers)
  const load = useCallback(() => { const items = readInspections(window.localStorage); setInspection(items.find((item) => item.id === id) ?? null) }, [id])
  useEffect(() => { load(); window.addEventListener(inspectionsChangedEvent, load); return () => window.removeEventListener(inspectionsChangedEvent, load) }, [load])
  useEffect(() => { const loadManagers = () => setManagers(readLocalManagers(window.localStorage, seedManagers)); loadManagers(); window.addEventListener(managersChangedEvent, loadManagers); return () => window.removeEventListener(managersChangedEvent, loadManagers) }, [])
  if (!id || !inspection) return <section className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"><h1 className="text-xl font-bold">확인할 점검 요청을 찾지 못했습니다.</h1><p className="mt-2 text-sm text-muted-foreground">내 점검 목록에서 진행 상태를 확인해주세요.</p><Link href="/my-inspections" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">내 점검 보기</Link></section>
  const manager = managers.find((item) => item.id === inspection.assignedManagerId)
  const scheduleHistory = getScheduleHistory(inspection)
  const statusIndex = inspectionStatusOrder.indexOf(inspection.status)
  const advance = () => { const next = nextInspectionStatus(inspection.status); const updated = transitionInspection(inspection, next); if (!updated) return; writeInspections(window.localStorage, updateInspection(readInspections(window.localStorage), updated)); load() }
  return <section className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7"><p className="text-sm font-bold text-brand">점검 진행 상태</p><h1 className="mt-1 break-words text-2xl font-bold">{inspection.address}</h1><p className="mt-2 break-words text-sm text-muted-foreground">{inspection.inspectionType} · 담당 {inspection.assignedManagerId ? manager?.name ?? "현재 등록되지 않은 관리인" : "담당 관리인 미배정"} · {inspection.scheduledDate && inspection.scheduledTime ? `${inspection.scheduledDate} ${inspection.scheduledTime}` : "일정 미정"}</p>{manager ? <Link href={`/managers/${manager.id}`} className="mt-2 inline-flex text-sm font-bold text-brand hover:underline">담당 관리인 상세 보기</Link> : null}
    <ol className="mt-7 grid gap-3 sm:grid-cols-4" aria-label="점검 진행 단계">{inspectionStatusOrder.map((status, index) => <li key={status} className={`rounded-lg border p-3 text-sm ${index <= statusIndex ? "border-brand bg-brand/5 text-foreground" : "text-muted-foreground"}`}><span className="flex items-center gap-1.5 font-bold">{index < statusIndex ? <CircleCheck className="size-4 text-brand" /> : <Clock3 className="size-4" />}{inspectionStatusLabel[status]}</span></li>)}</ol>
    <div className="mt-7 rounded-lg bg-surface-muted p-4"><h2 className="font-bold">현재 상태: {inspectionStatusLabel[inspection.status]}</h2><p className="mt-1 text-sm text-muted-foreground">{inspection.status === "completed" ? (inspection.result ? "점검 결과가 저장되었습니다." : "점검 결과가 아직 입력되지 않았습니다.") : inspection.status === "in-progress" ? "점검 결과를 입력하면 완료 처리됩니다." : `다음 단계: ${inspectionStatusLabel[inspectionStatusOrder[Math.min(statusIndex + 1, inspectionStatusOrder.length - 1)]]}`}</p></div>
    {inspection.memo && <p className="mt-4 rounded-lg border border-border p-4 text-sm"><strong>요청사항</strong><br />{inspection.memo}</p>}
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5" aria-labelledby="schedule-history-title"><h2 id="schedule-history-title" className="text-lg font-bold">일정 변경 이력</h2>{scheduleHistory.length ? <ol className="mt-4 space-y-3">{scheduleHistory.map((entry) => { const changes = getScheduleChanges(entry.previous, entry.next); return <li key={entry.id} className="rounded-lg bg-surface-muted p-3 text-sm"><p className="font-bold text-foreground">{entry.type === "assignment-created" ? "점검 일정이 등록되었습니다." : "점검 일정이 변경되었습니다."}</p><p className="mt-1 text-muted-foreground">{new Date(entry.changedAt).toLocaleString("ko-KR")}</p><div className="mt-3 space-y-1 break-words text-muted-foreground">{entry.type === "assignment-created" || changes.managerChanged ? <p>담당 관리인: {entry.type === "assignment-created" ? managerName(entry.next.managerId, managers) : `${managerName(entry.previous.managerId, managers)} → ${managerName(entry.next.managerId, managers)}`}</p> : null}{entry.type === "assignment-created" || changes.dateChanged ? <p>예정 날짜: {entry.type === "assignment-created" ? entry.next.scheduledDate : `${entry.previous.scheduledDate ?? "일정 없음"} → ${entry.next.scheduledDate ?? "일정 없음"}`}</p> : null}{entry.type === "assignment-created" || changes.timeChanged ? <p>예정 시간: {entry.type === "assignment-created" ? entry.next.scheduledTime : `${entry.previous.scheduledTime ?? "일정 없음"} → ${entry.next.scheduledTime ?? "일정 없음"}`}</p> : null}</div></li> })}</ol> : <p className="mt-3 rounded-lg bg-surface-muted p-4 text-sm text-muted-foreground">일정 변경 이력이 없습니다.</p>}</section>
    {inspection.status !== "completed" ? <InspectionAssignmentForm inspection={inspection} onSaved={(updated) => setInspection(updated)} /> : null}
    {inspection.status === "in-progress" || (inspection.status === "completed" && !inspection.result) ? <InspectionResultForm inspection={inspection} onSaved={(updated) => setInspection(updated)} /> : inspection.status === "completed" ? <Link href={`/inspection-result?id=${inspection.id}`} className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">점검 결과 보기 <ArrowRight className="size-4" /></Link> : <div className="mt-6 rounded-lg border border-status-warning/30 bg-status-warning/10 p-4"><p className="text-sm font-bold">MVP 테스트 기능</p><p className="mt-1 text-sm text-muted-foreground">일정과 담당 관리인을 저장한 뒤 다음 상태로 변경할 수 있습니다.</p><button onClick={advance} disabled={!hasInspectionAssignment(inspection)} className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground disabled:cursor-not-allowed disabled:opacity-60">다음 상태로 변경</button></div>}
  </section>
}
