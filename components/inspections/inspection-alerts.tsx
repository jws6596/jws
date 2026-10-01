"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BellRing, CalendarClock } from "lucide-react"
import { managers as seedManagers } from "@/lib/mock-data"
import type { Manager } from "@/lib/mock-data"
import { managersChangedEvent, readLocalManagers } from "@/lib/local-managers"
import { createInspectionAlerts, getInspectionAlertCounts, inspectionStatusLabel, inspectionsChangedEvent, readInspections, type Inspection, type InspectionAlert, type InspectionAlertType } from "@/lib/inspections"

type AlertFilter = "all" | InspectionAlertType

const alertLabel: Record<InspectionAlertType, string> = { conflict: "일정 충돌", today: "오늘", tomorrow: "내일", upcoming: "3일 이내" }
const filterItems: Array<{ id: AlertFilter; label: string }> = [{ id: "all", label: "전체" }, { id: "conflict", label: "충돌" }, { id: "today", label: "오늘" }, { id: "tomorrow", label: "내일" }, { id: "upcoming", label: "3일 이내" }]

function AlertCard({ alert, inspections, managers }: { alert: InspectionAlert; inspections: Inspection[]; managers: Manager[] }) {
  const inspection = inspections.find((item) => item.id === alert.inspectionId)
  const manager = managers.find((item) => item.id === alert.managerId)
  const isConflict = alert.type === "conflict"
  return <li className={`rounded-lg border p-4 ${isConflict ? "border-status-danger/30 bg-status-danger/10" : "border-border bg-background"}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isConflict ? "bg-status-danger/15 text-status-danger" : "bg-brand/10 text-brand"}`}>{alertLabel[alert.type]}</span>{inspection ? <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-foreground">{inspectionStatusLabel[inspection.status]}</span> : null}</div><p className="mt-3 break-words font-bold text-foreground">{inspection?.address ?? "점검 정보를 불러올 수 없습니다."}</p><p className="mt-1 break-words text-sm text-muted-foreground">{alert.message}</p><p className="mt-2 break-words text-sm text-muted-foreground">{alert.scheduledDate} {alert.scheduledTime} · 담당 {alert.managerId ? manager?.name ?? "현재 등록되지 않은 관리인" : "관리인 미배정"}</p>{manager ? <Link href={`/managers/${manager.id}`} className="mt-2 inline-flex text-sm font-bold text-brand hover:underline">담당 관리인 상세 보기</Link> : null}</div><div className="flex shrink-0 flex-wrap gap-2"><Link href={`/inspection-progress?id=${alert.inspectionId}`} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground hover:bg-muted">상세 보기</Link>{isConflict ? <Link href="/inspections/schedule?conflict=true" className="inline-flex min-h-10 items-center rounded-lg bg-status-danger px-3 text-sm font-bold text-status-danger-foreground">충돌 일정 확인</Link> : null}</div></div>
  </li>
}

export function InspectionAlerts({ limit, showFilters = false }: { limit?: number; showFilters?: boolean }) {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [managers, setManagers] = useState<Manager[]>(seedManagers)
  const [filter, setFilter] = useState<AlertFilter>("all")
  const load = useCallback(() => { setInspections(readInspections(window.localStorage)); setManagers(readLocalManagers(window.localStorage, seedManagers)) }, [])
  useEffect(() => { load(); window.addEventListener(inspectionsChangedEvent, load); window.addEventListener(managersChangedEvent, load); window.addEventListener("storage", load); return () => { window.removeEventListener(inspectionsChangedEvent, load); window.removeEventListener(managersChangedEvent, load); window.removeEventListener("storage", load) } }, [load])
  const alerts = useMemo(() => createInspectionAlerts(inspections, managers), [inspections, managers])
  const counts = useMemo(() => getInspectionAlertCounts(alerts), [alerts])
  const visibleAlerts = (filter === "all" ? alerts : alerts.filter((alert) => alert.type === filter)).slice(0, limit)

  return <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="inspection-alerts-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-brand">일정 운영</p><h2 id="inspection-alerts-title" className="mt-1 text-xl font-bold text-foreground">오늘의 점검 알림</h2><p className="mt-1 text-sm text-muted-foreground">현재 저장된 일정에서 계산한 앱 내부 안내입니다.</p></div>{!showFilters ? <Link href="/inspections/alerts" className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground hover:bg-muted">전체 알림 보기</Link> : null}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-lg bg-status-danger/10 p-3 text-sm"><p className="font-bold text-status-danger">충돌</p><p className="mt-1 text-lg font-bold text-foreground">{counts.conflict}건</p></div><div className="rounded-lg bg-brand/10 p-3 text-sm"><p className="font-bold text-brand">오늘</p><p className="mt-1 text-lg font-bold text-foreground">{counts.today}건</p></div><div className="rounded-lg bg-surface-muted p-3 text-sm"><p className="font-bold text-foreground">내일</p><p className="mt-1 text-lg font-bold text-foreground">{counts.tomorrow}건</p></div><div className="rounded-lg bg-surface-muted p-3 text-sm"><p className="font-bold text-foreground">3일 이내</p><p className="mt-1 text-lg font-bold text-foreground">{counts.upcoming}건</p></div></div>{showFilters ? <div className="mt-5 flex flex-wrap gap-2" aria-label="알림 유형 필터">{filterItems.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`min-h-10 rounded-lg border px-3 text-sm font-bold ${filter === item.id ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-foreground"}`}>{item.label}</button>)}</div> : null}{visibleAlerts.length ? <ul className="mt-5 space-y-3">{visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} inspections={inspections} managers={managers} />)}</ul> : <div className="mt-5 rounded-lg bg-surface-muted p-6 text-center"><BellRing className="mx-auto size-7 text-brand" aria-hidden="true" /><h3 className="mt-3 font-bold text-foreground">{filter === "all" ? "현재 확인할 점검 알림이 없습니다." : "선택한 조건의 점검 알림이 없습니다."}</h3><p className="mt-1 text-sm text-muted-foreground">일정이 저장되거나 변경되면 현재 정보로 다시 계산됩니다.</p></div>}{!showFilters && alerts.length > (limit ?? alerts.length) ? <Link href="/inspections/alerts" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand hover:underline"><CalendarClock className="size-4" />전체 알림에서 모두 보기</Link> : null}{counts.conflict > 0 ? <p className="mt-4 flex items-center gap-2 text-sm font-medium text-status-danger"><AlertTriangle className="size-4" aria-hidden="true" />충돌 알림은 기존 일정 충돌 기준으로 계산됩니다.</p> : null}</section>
}
