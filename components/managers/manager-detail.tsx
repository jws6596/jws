"use client"

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Briefcase, Calendar, MapPin, Star, Trash2, WalletCards } from "lucide-react"
import { managers as seedManagers, quotes } from "@/lib/mock-data"
import type { Manager } from "@/lib/mock-data"
import { deleteLocalManager, notifyManagersChanged, readLocalManagers, updateLocalManager } from "@/lib/local-managers"
import { getManagerScheduledInspections, inspectionStatusLabel, inspectionsChangedEvent, readInspections, type Inspection } from "@/lib/inspections"

export function ManagerDetail({ id }: { id: string }) {
  const router = useRouter()
  const [manager, setManager] = useState<Manager | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [inspectionItems, setInspectionItems] = useState<Inspection[]>([])

  useEffect(() => {
    const load = () => { setManager(readLocalManagers(window.localStorage, seedManagers).find((item) => item.id === id) ?? null); setLoaded(true) }
    load()
    window.addEventListener("binjip-managers-changed", load)
    return () => window.removeEventListener("binjip-managers-changed", load)
  }, [id])
  useEffect(() => {
    const load = () => setInspectionItems(readInspections(window.localStorage))
    load(); window.addEventListener(inspectionsChangedEvent, load); window.addEventListener("storage", load)
    return () => { window.removeEventListener(inspectionsChangedEvent, load); window.removeEventListener("storage", load) }
  }, [])

  if (!loaded) return <section className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center" role="status"><p className="font-medium text-muted-foreground">관리인 정보를 불러오는 중입니다.</p></section>
  if (!manager) return <section className="mx-auto max-w-xl rounded-xl border border-dashed border-border bg-card p-8 text-center"><h1 className="text-2xl font-bold text-foreground">관리인 정보를 찾을 수 없습니다.</h1><p className="mt-3 text-sm text-muted-foreground">주소가 잘못되었거나 삭제된 관리인입니다.</p><Link href="/managers" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-bold text-brand-foreground">관리인 목록으로 돌아가기</Link></section>

  const currentManager = manager
  const quote = quotes.find((item) => item.managerId === currentManager.id)
  const scheduledInspections = getManagerScheduledInspections(inspectionItems, currentManager.id).slice(0, 5)
  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "").trim(); const regions = String(form.get("regions") ?? "").trim()
    const years = Number(form.get("years")); const completed = Number(form.get("completed")); const rating = Number(form.get("rating")); const reviews = Number(form.get("reviews"))
    if (!name || !regions || !Number.isInteger(years) || years < 0 || !Number.isInteger(completed) || completed < 0 || !Number.isFinite(rating) || rating < 0 || rating > 5 || !Number.isInteger(reviews) || reviews < 0) { setError("필수 항목과 숫자 범위를 확인해주세요."); return }
    const result = updateLocalManager(window.localStorage, seedManagers, currentManager.id, { name, regions, years, completed, rating, reviews, photo: currentManager.photo })
    if (!result.saved) { setError("수정 내용을 저장하지 못했습니다."); return }
    setManager(result.items.find((item) => item.id === currentManager.id) ?? null); setEditing(false); setError(null); notifyManagersChanged()
  }
  function remove() {
    const result = deleteLocalManager(window.localStorage, seedManagers, currentManager.id)
    if (!result.saved) { setError("삭제 내용을 저장하지 못했습니다."); return }
    notifyManagersChanged(); router.replace("/managers")
  }

  return <div className="space-y-6"><Link href="/managers" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"><ArrowLeft className="size-4" />관리인 목록</Link>
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><div className="relative size-20 shrink-0 overflow-hidden rounded-full"><Image src={manager.photo || "/placeholder.svg"} alt={`${manager.name} 관리인 사진`} fill sizes="80px" className="object-cover" /></div><div><p className="text-sm font-bold text-brand">관리인 프로필</p><h1 className="mt-1 text-2xl font-bold text-foreground">{manager.name} 관리인</h1><p className="mt-2 flex gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4 text-brand" />{manager.regions}</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditing((value) => !value); setError(null) }} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted">{editing ? "수정 닫기" : "정보 수정"}</button><button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-status-danger/30 bg-background px-4 text-sm font-bold text-status-danger hover:bg-status-danger/10"><Trash2 className="size-4" />삭제</button></div></div>
      {editing ? <form onSubmit={saveEdit} className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2" noValidate>{[["name","이름",manager.name,"text"],["regions","활동 지역",manager.regions,"text"],["years","점검 경력",String(manager.years),"number"],["completed","완료 건수",String(manager.completed),"number"],["rating","평점(0~5)",String(manager.rating),"number"],["reviews","후기 수",String(manager.reviews),"number"]].map(([name,label,value,type]) => <label key={name} className="text-sm font-medium text-foreground">{label}<input name={name} defaultValue={value} type={type} min={type === "number" ? "0" : undefined} max={name === "rating" ? "5" : undefined} step={name === "rating" ? "0.1" : undefined} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" /></label>)}{error ? <p className="sm:col-span-2 text-sm text-status-danger" role="alert">{error}</p> : null}<button type="submit" className="sm:col-span-2 inline-flex min-h-11 w-fit items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">수정 저장</button></form> : null}
      {confirmDelete ? <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-status-danger/30 bg-status-danger/10 p-4" role="alert"><p className="flex-1 text-sm font-medium text-foreground">{manager.name} 관리인을 삭제할까요? 이 작업은 되돌릴 수 없습니다.</p><button type="button" onClick={remove} className="min-h-10 rounded-lg bg-status-danger px-3 text-sm font-bold text-status-danger-foreground">삭제</button><button type="button" onClick={() => setConfirmDelete(false)} className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground">취소</button></div> : null}
    </section>
    <section className="grid gap-4 sm:grid-cols-3">{[[Briefcase,`경력 ${manager.years}년`,`${manager.completed}건 완료`],[Star,`${manager.rating}점`,`후기 ${manager.reviews}개`],[WalletCards,quote ? `${quote.price.toLocaleString("ko-KR")}원` : "견적 준비 중",quote ? quote.availableDate : "예시 견적 없음"]].map(([Icon,title,description], index) => { const CardIcon = Icon as typeof Briefcase; return <div key={index} className="rounded-xl border border-border bg-card p-5 shadow-sm"><CardIcon className="size-5 text-brand" /><p className="mt-3 font-bold text-foreground">{title as string}</p><p className="mt-1 text-sm text-muted-foreground">{description as string}</p></div> })}</section>
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><p className="text-sm font-bold text-brand">예정 점검</p><h2 className="mt-1 text-xl font-bold text-foreground">이 관리인의 일정</h2>{scheduledInspections.length ? <ul className="mt-4 divide-y divide-border rounded-lg border border-border">{scheduledInspections.map((inspection) => <li key={inspection.id} className="p-4"><p className="break-words font-bold text-foreground">{inspection.address}</p><p className="mt-1 text-sm text-muted-foreground">{inspection.scheduledDate} {inspection.scheduledTime} · {inspectionStatusLabel[inspection.status]}</p></li>)}</ul> : <p className="mt-4 rounded-lg bg-surface-muted p-4 text-sm text-muted-foreground">현재 등록된 예정 점검이 없습니다.</p>}</section>
    <Link href="/inspection-request" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-brand-foreground"><Calendar className="size-4" />이 관리인으로 점검 요청</Link>
  </div>
}
