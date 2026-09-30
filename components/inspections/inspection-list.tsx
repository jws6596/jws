"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"
import { managers } from "@/lib/mock-data"
import { inspectionStatusLabel, inspectionsChangedEvent, readInspections, type Inspection } from "@/lib/inspections"

export function InspectionList() {
  const [items, setItems] = useState<Inspection[]>([])
  const load = useCallback(() => setItems(readInspections(window.localStorage)), [])
  useEffect(() => { load(); window.addEventListener(inspectionsChangedEvent, load); window.addEventListener("storage", load); return () => { window.removeEventListener(inspectionsChangedEvent, load); window.removeEventListener("storage", load) } }, [load])
  if (!items.length) return <section className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"><ClipboardList className="mx-auto size-8 text-brand" /><h1 className="mt-3 text-xl font-bold">아직 요청한 점검이 없습니다.</h1><p className="mt-2 text-sm text-muted-foreground">빈집 주소와 희망일을 입력해 첫 점검을 요청해보세요.</p><Link href="/inspection-request" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">점검 요청하기</Link></section>
  return <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-brand">내 점검</p><h1 className="mt-1 text-2xl font-bold">신청한 빈집 점검</h1></div><Link href="/inspection-request" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">새 점검 요청</Link></div><ul className="mt-6 space-y-3">{items.map((item) => { const manager = managers.find((entry) => entry.id === item.managerId); return <li key={item.id} className="rounded-lg border border-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="break-words font-bold text-foreground">{item.address}</p><p className="mt-1 break-words text-sm text-muted-foreground">{item.inspectionType} · 요청일 {new Date(item.requestedAt).toLocaleDateString("ko-KR")}</p><p className="mt-1 break-words text-sm text-muted-foreground">담당 {manager?.name ?? "미지정"} 관리인 · 희망일 {item.scheduledAt}</p></div><span className="w-fit shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">{inspectionStatusLabel[item.status]}</span></div><Link href={`/inspection-progress?id=${item.id}`} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-brand">진행 상태 보기 <ArrowRight className="size-4" /></Link></li> })}</ul></section>
}
