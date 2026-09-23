"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BadgeCheck, BookmarkCheck, Briefcase, Calendar, CheckCircle2, MapPin, RotateCcw, Search, Star, Trash2 } from "lucide-react"
import { managers, quotes } from "@/lib/mock-data"
import { clearSavedManagers, readSavedManagers, removeSavedManager, saveManager, writeSavedManagers } from "@/lib/saved-managers"
import type { SavedManager } from "@/lib/saved-managers"
import { buildManagerShareText } from "@/lib/manager-share"
import { ManagerShareActions } from "@/components/managers/manager-share-actions"

const regionFilters = ["전체", "전남 순천시", "전북 김제시", "충남 서천군"]

export function ManagerFinder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [region, setRegion] = useState("전체")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedEntries, setSavedEntries] = useState<SavedManager[]>([])
  const [storageNotice, setStorageNotice] = useState<string | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<string | "all" | null>(null)

  useEffect(() => {
    const queryRegion = searchParams.get("region")
    setKeyword(searchParams.get("q") ?? "")
    setRegion(queryRegion && regionFilters.includes(queryRegion) ? queryRegion : "전체")
  }, [searchParams])

  useEffect(() => {
    const loaded = readSavedManagers(window.localStorage)
    const stored = loaded.filter((entry) => managers.some((manager) => manager.id === entry.managerId))
    if (stored.length !== loaded.length) writeSavedManagers(window.localStorage, stored)
    setSavedEntries(stored)
    if (stored[0]) setSelectedId(stored[0].managerId)
  }, [])

  const filteredManagers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return managers.filter((manager) => {
      const matchesRegion = region === "전체" || manager.regions.includes(region)
      const matchesKeyword = !normalizedKeyword || [manager.name, manager.regions].some((value) => value.toLowerCase().includes(normalizedKeyword))
      return matchesRegion && matchesKeyword
    })
  }, [keyword, region])

  const selectedManager = managers.find((manager) => manager.id === selectedId)
  const selectedQuote = quotes.find((quote) => quote.managerId === selectedId)
  const savedManagerDetails = savedEntries.flatMap((entry) => {
    const manager = managers.find((item) => item.id === entry.managerId)
    return manager ? [{ entry, manager, quote: quotes.find((item) => item.managerId === manager.id) }] : []
  })

  function updateFilters(nextKeyword: string, nextRegion: string) {
    setKeyword(nextKeyword)
    setRegion(nextRegion)

    const params = new URLSearchParams()
    if (nextKeyword.trim()) params.set("q", nextKeyword.trim())
    if (nextRegion !== "전체") params.set("region", nextRegion)
    const query = params.toString()
    router.replace(query ? `/managers?${query}` : "/managers", { scroll: false })
  }

  function resetFilters() {
    updateFilters("", "전체")
  }

  function selectManager(managerId: string) {
    if (selectedId === managerId) {
      setSelectedId(null)
      return
    }

    const result = saveManager(window.localStorage, managerId)
    setSavedEntries(result.items)
    setSelectedId(managerId)
    setStorageNotice(result.saved ? "선택한 관리인을 저장했어요." : "선택은 반영했지만 브라우저에 저장하지 못했어요.")
  }

  function removeManager(managerId: string) {
    const result = removeSavedManager(window.localStorage, managerId)
    setSavedEntries(result.items)
    if (selectedId === managerId) setSelectedId(null)
    setStorageNotice(result.saved ? "저장한 관리인을 삭제했어요." : "브라우저 저장값을 삭제하지 못했어요.")
    setPendingDeletion(null)
  }

  function clearManagers() {
    const cleared = clearSavedManagers(window.localStorage)
    if (cleared) {
      setSavedEntries([])
      setSelectedId(null)
    }
    setStorageNotice(cleared ? "저장한 관리인을 모두 초기화했어요." : "브라우저 저장값을 초기화하지 못했어요.")
    setPendingDeletion(null)
  }

  function confirmDeletion() {
    if (pendingDeletion === "all") clearManagers()
    else if (pendingDeletion) removeManager(pendingDeletion)
  }

  function reselectManager(managerId: string) {
    setSelectedId(managerId)
    const manager = managers.find((item) => item.id === managerId)
    setStorageNotice(manager ? `${manager.name} 관리인을 다시 선택했어요.` : "저장한 관리인을 다시 선택했어요.")
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="manager-search-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand">검증된 현지 관리인</p>
            <h1 id="manager-search-title" className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              우리 집 주변 관리인을 찾아보세요.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">활동 지역과 이름으로 관리인을 찾고, 점검 경험과 예시 견적을 비교할 수 있습니다.</p>
          </div>
          <p className="rounded-md bg-surface-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">현재는 비교를 위한 예시 데이터입니다.</p>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="manager-keyword" className="text-sm font-bold text-foreground">관리인 또는 지역 검색</label>
            <div className="mt-2 flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-brand/30">
              <Search className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <input
                id="manager-keyword"
                value={keyword}
                onChange={(event) => updateFilters(event.target.value, region)}
                onKeyDown={(event) => { if (event.key === "Escape" && (keyword || region !== "전체")) resetFilters() }}
                placeholder="예: 순천시, 김현수"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-foreground">활동 지역</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="활동 지역 선택">
              {regionFilters.map((filter) => {
                const selected = region === filter
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => updateFilters(keyword, filter)}
                    aria-pressed={selected}
                    className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selected ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`}
                  >
                    {filter}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="manager-results-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="manager-results-title" className="text-xl font-bold text-foreground">검색 결과</h2>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">조건에 맞는 관리인 {filteredManagers.length}명</p>
          </div>
          {(keyword || region !== "전체") ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <RotateCcw className="size-4" />
              조건 초기화
            </button>
          ) : null}
        </div>

        {filteredManagers.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredManagers.map((manager) => {
              const quote = quotes.find((item) => item.managerId === manager.id)
              const selected = manager.id === selectedId

              return (
                <article key={manager.id} className={`flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors ${selected ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full">
                      <Image src={manager.photo || "/placeholder.svg"} alt={`${manager.name} 관리인 프로필 사진`} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-foreground">{manager.name}</h3>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-status-success/10 px-1.5 py-0.5 text-[11px] font-medium text-status-success">
                        <BadgeCheck className="size-3.5" aria-hidden="true" />
                        본인 확인 완료
                      </span>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-2 border-y border-border py-4 text-sm">
                    <div className="flex gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                      <div><dt className="sr-only">활동 지역</dt><dd>{manager.regions}</dd></div>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <Briefcase className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                      <div><dt className="sr-only">점검 경험</dt><dd>점검 경력 {manager.years}년 · {manager.completed}건 완료</dd></div>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Star className="size-4 fill-status-warning text-status-warning" aria-hidden="true" />
                      <dt className="sr-only">평점</dt><dd>{manager.rating}점 · 후기 {manager.reviews}개</dd>
                    </div>
                  </dl>

                  {quote ? (
                    <div className="mt-4 rounded-lg bg-surface-muted p-3 text-sm">
                      <p className="text-xs text-muted-foreground">예시 점검 견적</p>
                      <p className="mt-1 font-bold text-foreground">{quote.price.toLocaleString("ko-KR")}원 <span className="font-normal text-muted-foreground">· {quote.availableDate}</span></p>
                    </div>
                  ) : null}

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link href={`/managers/${manager.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      프로필 보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => selectManager(manager.id)}
                      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selected ? "bg-status-success text-status-success-foreground hover:opacity-90" : "bg-brand text-brand-foreground hover:bg-brand-hover"}`}
                    >
                      {selected ? "선택 해제" : "이 관리인 선택"}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <Search className="mx-auto size-7 text-brand" aria-hidden="true" />
            <h3 className="mt-3 text-base font-bold text-foreground">조건에 맞는 관리인이 없습니다.</h3>
            <p className="mt-2 text-sm text-muted-foreground">지역 또는 검색어를 바꿔 다시 찾아보세요.</p>
            <button type="button" onClick={resetFilters} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              전체 관리인 보기
            </button>
          </div>
        )}
      </section>

      {selectedManager ? (
        <aside className="rounded-xl border border-status-success/30 bg-status-success/10 p-5" aria-live="polite">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-status-success"><CheckCircle2 className="size-4" aria-hidden="true" />선택한 관리인</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">{selectedManager.name} 관리인</h2>
              <p className="mt-1 text-sm text-muted-foreground">{selectedManager.regions} · {selectedQuote ? `${selectedQuote.price.toLocaleString("ko-KR")}원 예시 견적` : "예시 견적 준비 중"}</p>
              <ManagerShareActions title={`빈집지킴이 · ${selectedManager.name} 관리인`} text={buildManagerShareText(selectedManager, selectedQuote)} href={`/managers/${selectedManager.id}`} />
            </div>
            <Link href="/inspection-request" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-brand px-5 text-sm font-bold text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Calendar className="size-4" aria-hidden="true" />
              이 관리인으로 점검 요청
            </Link>
          </div>
        </aside>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="saved-managers-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-brand"><BookmarkCheck className="size-4" aria-hidden="true" />저장한 관리인</p>
            <h2 id="saved-managers-title" className="mt-1 text-lg font-bold text-foreground">나중에 다시 비교할 관리인</h2>
            <p className="mt-1 text-sm text-muted-foreground">관리인을 선택하면 이 브라우저에 최근순으로 저장됩니다.</p>
          </div>
          {savedManagerDetails.length ? <button type="button" onClick={() => setPendingDeletion("all")} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"><Trash2 className="size-4" />전체 초기화</button> : null}
        </div>

        {storageNotice ? <p className="mt-3 text-sm font-medium text-status-success" role="status">{storageNotice}</p> : null}
        {pendingDeletion ? (
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p className="text-sm font-medium text-foreground">{pendingDeletion === "all" ? "저장한 관리인을 모두 삭제할까요?" : "이 관리인을 저장 목록에서 삭제할까요?"}</p>
            <div className="flex gap-2">
              <button type="button" onClick={confirmDeletion} className="inline-flex min-h-10 items-center rounded-lg bg-status-danger px-3 text-sm font-bold text-status-danger-foreground">삭제</button>
              <button type="button" onClick={() => setPendingDeletion(null)} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted">취소</button>
            </div>
          </div>
        ) : null}

        {savedManagerDetails.length ? (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
            {savedManagerDetails.map(({ entry, manager, quote }) => (
              <li key={entry.managerId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-foreground">{manager.name} 관리인</p>
                  <p className="mt-1 text-sm text-muted-foreground">{manager.regions}{quote ? ` · 예시 견적 ${quote.price.toLocaleString("ko-KR")}원` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => reselectManager(manager.id)} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted">다시 선택</button>
                  <button type="button" onClick={() => setPendingDeletion(manager.id)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"><Trash2 className="size-4" />삭제</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg bg-surface-muted p-4 text-sm text-muted-foreground">아직 저장한 관리인이 없습니다. 비교할 관리인을 선택해보세요.</p>
        )}
      </section>
    </div>
  )
}
