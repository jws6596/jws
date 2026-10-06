"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BookmarkCheck, CalendarClock, ClipboardList, RefreshCw, Search, WalletCards } from "lucide-react"
import { managers as seedManagers, quotes } from "@/lib/mock-data"
import type { Manager } from "@/lib/mock-data"
import { managersChangedEvent, readLocalManagers } from "@/lib/local-managers"
import { readSavedManagers } from "@/lib/saved-managers"
import type { SavedManager } from "@/lib/saved-managers"
import { calculateInspectionStats, calculateManagerScheduleOverview, calculateScheduleStats, getScheduleConflictGroups, inspectionsChangedEvent, readInspections } from "@/lib/inspections"
import type { Inspection } from "@/lib/inspections"
import { InspectionAlerts } from "@/components/inspections/inspection-alerts"

type DashboardState = "loading" | "ready" | "error"

function formatSavedAt(savedAt: number) {
  if (!savedAt) return "저장 시각 정보 없음"

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(savedAt))
}

export function InspectionDashboard() {
  const [savedEntries, setSavedEntries] = useState<SavedManager[]>([])
  const [state, setState] = useState<DashboardState>("loading")
  const [managerItems, setManagerItems] = useState<Manager[]>(seedManagers)
  const [inspectionItems, setInspectionItems] = useState<Inspection[]>([])

  const loadDashboard = useCallback(() => {
    setState("loading")

    try {
      const currentManagers = readLocalManagers(window.localStorage, seedManagers)
      const entries = readSavedManagers(window.localStorage)
        .filter((entry) => currentManagers.some((manager) => manager.id === entry.managerId))
      setManagerItems(currentManagers)
      setSavedEntries(entries)
      setInspectionItems(readInspections(window.localStorage))
      setState("ready")
    } catch {
      setState("error")
    }
  }, [])

  useEffect(() => {
    loadDashboard()
    window.addEventListener("storage", loadDashboard)
    window.addEventListener(managersChangedEvent, loadDashboard)
    window.addEventListener(inspectionsChangedEvent, loadDashboard)
    return () => { window.removeEventListener("storage", loadDashboard); window.removeEventListener(managersChangedEvent, loadDashboard); window.removeEventListener(inspectionsChangedEvent, loadDashboard) }
  }, [loadDashboard])

  const savedManagers = useMemo(() => savedEntries.flatMap((entry) => {
    const manager = managerItems.find((item) => item.id === entry.managerId)
    return manager ? [{ entry, manager, quote: quotes.find((item) => item.managerId === manager.id) }] : []
  }), [managerItems, savedEntries])

  const quoteCount = savedManagers.filter(({ quote }) => quote).length
  const latestSaved = savedManagers[0]
  const inspectionStats = calculateInspectionStats(inspectionItems)
  const scheduleStats = calculateScheduleStats(inspectionItems)
  const conflictGroups = getScheduleConflictGroups(inspectionItems)
  const workloadOverview = calculateManagerScheduleOverview(managerItems, inspectionItems)

  const stats = [
    {
      label: "저장한 관리인",
      value: `${savedManagers.length}명`,
      description: savedManagers.length ? "나중에 다시 비교할 수 있어요." : "아직 선택한 관리인이 없어요.",
      href: "/managers",
      icon: BookmarkCheck,
    },
    {
      label: "비교 가능한 견적",
      value: `${quoteCount}건`,
      description: quoteCount ? "관리인 상세에서 예시 견적을 확인할 수 있어요." : "관리인을 선택하면 예시 견적을 확인할 수 있어요.",
      href: "/managers",
      icon: WalletCards,
    },
    {
      label: "최근 선택",
      value: latestSaved ? latestSaved.manager.name : "없음",
      description: latestSaved ? formatSavedAt(latestSaved.entry.savedAt) : "관리인을 선택해 기록을 시작하세요.",
      href: latestSaved ? `/managers/${latestSaved.manager.id}` : "/managers",
      icon: CalendarClock,
    },
    {
      label: "전체 점검",
      value: `${inspectionStats.total}건`,
      description: inspectionStats.total ? `진행 ${inspectionStats.active}건 · 완료 ${inspectionStats.completed}건` : "아직 요청한 점검이 없어요.",
      href: "/my-inspections",
      icon: ClipboardList,
    },
    {
      label: "일정 미배정",
      value: `${scheduleStats.unassigned}건`,
      description: scheduleStats.unassigned ? "담당 관리인과 일정을 지정해주세요." : "모든 진행 점검에 일정이 있습니다.",
      href: "/my-inspections",
      icon: CalendarClock,
    },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="dashboard-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand">내 점검 대시보드</p>
            <h1 id="dashboard-title" className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">선택한 관리인과 점검 준비 현황</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">이 브라우저에 저장한 관리인 선택 기록을 확인하고 다음 작업으로 바로 이동하세요.</p>
          </div>
          <button type="button" onClick={loadDashboard} disabled={state === "loading"} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className={`size-4 ${state === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
            새로고침
          </button>
        </div>
      </section>

      {state === "error" ? (
        <section className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-5" role="alert">
          <h2 className="font-bold text-foreground">저장한 기록을 불러오지 못했어요.</h2>
          <p className="mt-1 text-sm text-muted-foreground">브라우저 저장소를 확인한 뒤 다시 시도해주세요.</p>
          <button type="button" onClick={loadDashboard} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground hover:bg-brand-hover">다시 시도</button>
        </section>
      ) : (
        <>
          <section aria-label="점검 준비 통계" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map(({ label, value, description, href, icon: Icon }) => (
              <Link key={label} href={href} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{state === "loading" ? "…" : value}</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon className="size-5" aria-hidden="true" /></span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{state === "loading" ? "기록을 불러오는 중입니다." : description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">자세히 보기 <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </Link>
            ))}
          </section>

          <InspectionAlerts limit={5} />

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="manager-workload-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-brand">관리인 일정 현황</p><h2 id="manager-workload-title" className="mt-1 text-xl font-bold text-foreground">운영 요약</h2><p className="mt-1 text-sm text-muted-foreground">등록 관리인 {managerItems.length}명 · 오늘 예정 {workloadOverview.summaries.reduce((count, item) => count + item.today, 0)}건 · 지난 미완료 {workloadOverview.summaries.reduce((count, item) => count + item.overdue, 0)}건 · 미배정 {workloadOverview.unassignedCount}건 · 충돌 {conflictGroups.length}건</p></div><Link href="/managers/schedule-summary" className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground hover:bg-muted">관리인별 현황 보기</Link></div></section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="upcoming-inspections-title">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-brand">예정 점검</p><h2 id="upcoming-inspections-title" className="mt-1 text-xl font-bold text-foreground">가까운 일정</h2></div><Link href="/inspections/schedule" className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground hover:bg-muted">전체 일정 보기</Link></div>
            <p className="mt-2 text-sm text-muted-foreground">일정 확정 {scheduleStats.scheduled}건 · 점검 중 {scheduleStats.inProgress}건 · 완료 {inspectionStats.completed}건</p>
            <div className={`mt-4 rounded-lg p-3 text-sm ${conflictGroups.length ? "border border-status-danger/30 bg-status-danger/10" : "bg-surface-muted"}`}><p className="font-bold">{conflictGroups.length ? `일정 충돌 ${conflictGroups.length}건` : "일정 충돌 없음"}</p>{conflictGroups.length ? <ul className="mt-1 space-y-1 text-muted-foreground">{conflictGroups.slice(0, 3).map((group) => { const manager = managerItems.find((item) => item.id === group.managerId); return <li key={`${group.managerId}-${group.scheduledDate}-${group.scheduledTime}`} className="break-words">{group.scheduledDate} {group.scheduledTime} · {manager?.name ?? "현재 등록되지 않은 관리인"} 관리인 · 점검 {group.inspections.length}건</li> })}</ul> : <p className="mt-1 text-muted-foreground">현재 저장된 일정에서 같은 관리인·날짜·시간 조합이 없습니다.</p>}</div>
            {scheduleStats.upcoming.length ? <ul className="mt-5 divide-y divide-border rounded-lg border border-border">{scheduleStats.upcoming.slice(0, 5).map((inspection) => { const manager = managerItems.find((item) => item.id === inspection.assignedManagerId); return <li key={inspection.id}><Link href={`/inspection-progress?id=${inspection.id}`} className="block p-4 hover:bg-muted"><p className="break-words font-bold text-foreground">{inspection.address}</p><p className="mt-1 break-words text-sm text-muted-foreground">{inspection.scheduledDate} {inspection.scheduledTime} · {manager?.name ?? "현재 등록되지 않은 관리인"} 관리인</p></Link></li> })}</ul> : <p className="mt-5 rounded-lg bg-surface-muted p-5 text-sm text-muted-foreground">현재 예정된 점검이 없습니다.</p>}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="recent-activity-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-brand">최근 활동</p>
                <h2 id="recent-activity-title" className="mt-1 text-xl font-bold text-foreground">최근 저장한 관리인</h2>
              </div>
              <Link href="/managers" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted">관리인 찾기 <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>

            {state === "loading" ? (
              <div className="mt-5 space-y-3" role="status" aria-live="polite">
                <p className="sr-only">저장한 관리인 기록을 불러오는 중입니다.</p>
                {[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-surface-muted" />)}
              </div>
            ) : savedManagers.length ? (
              <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
                {savedManagers.slice(0, 5).map(({ entry, manager, quote }) => (
                  <li key={entry.managerId}>
                    <Link href={`/managers/${manager.id}`} className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-foreground">{manager.name} 관리인</p>
                        <p className="mt-1 text-sm text-muted-foreground">{manager.regions}{quote ? ` · 예시 견적 ${quote.price.toLocaleString("ko-KR")}원` : " · 예시 견적 없음"}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatSavedAt(entry.savedAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-lg bg-surface-muted p-6 text-center">
                <ClipboardList className="mx-auto size-7 text-brand" aria-hidden="true" />
                <h3 className="mt-3 font-bold text-foreground">아직 기록이 없습니다.</h3>
                <p className="mt-1 text-sm text-muted-foreground">관리인을 선택하면 이곳에서 최근 기록과 견적 준비 현황을 확인할 수 있어요.</p>
                <Link href="/managers" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground hover:bg-brand-hover">관리인 찾기</Link>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="quick-actions-title">
            <div>
              <p className="text-sm font-bold text-brand">빠른 실행</p>
              <h2 id="quick-actions-title" className="mt-1 text-xl font-bold text-foreground">다음 작업을 시작하세요</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/managers" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground hover:bg-brand-hover"><Search className="size-4" aria-hidden="true" />관리인 찾기</Link>
              <Link href="/inspection-request" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted"><CalendarClock className="size-4" aria-hidden="true" />점검 요청</Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
