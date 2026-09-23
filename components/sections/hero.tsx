"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, MapPin, Home, Calendar, ArrowRight } from "lucide-react"
import { Container } from "@/components/site/container"
import { AddressSearch } from "@/components/site/address-search"
import { heroTrustPoints } from "@/lib/mock-data"
import type { InspectionAvailabilityResult } from "@/core/inspection-availability"

export function Hero() {
  const [availability, setAvailability] = useState<InspectionAvailabilityResult | null>(null)

  return (
    <section aria-label="빈집 점검 시작">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-inspection.png)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-background/90 md:bg-transparent md:bg-gradient-to-r md:from-background md:via-background/95 md:to-background/20"
          aria-hidden
        />
        <Container className="relative">
          <div className="max-w-2xl pb-12 pt-8 sm:pt-12 md:pb-16 md:pt-14">
            <p className="mb-3 text-sm font-bold tracking-wide text-brand">빈집지킴이 · 현지 점검 서비스</p>
            <h1 className="text-[1.75rem] font-black leading-[1.3] tracking-tight text-foreground text-balance sm:text-4xl md:text-[2.6rem]">
              멀리 있는 우리 집,
              <br />
              직접 가지 않아도 <span className="block sm:inline">확인하세요.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-foreground/80 md:text-base">
              빈집 주소를 입력하면 현지 점검 가능 여부를 확인할 수 있습니다.
              <br className="hidden sm:block" />{' '}
              신뢰할 수 있는 현지 관리인이 대신 점검해드립니다.
            </p>

            <div className="mt-6 max-w-xl">
              <AddressSearch
                onResult={setAvailability}
                onAddressChange={(addr) => {
                  if (addr !== availability?.address) setAvailability(null)
                }}
              />
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {heroTrustPoints.map((point) => (
                <li key={point} className="flex items-center gap-1.5 text-xs font-medium text-foreground/70 md:text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-status-success" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>

      {availability ? (
        <Container className="relative -mt-5 pb-2 md:-mt-6">
          <AvailabilityCard result={availability} />
        </Container>
      ) : (
        <Container className="relative -mt-5 pb-2 md:-mt-6">
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-4 text-center shadow-sm sm:px-6">
            <p className="text-sm font-bold text-foreground">주소를 입력하면 점검 가능 결과 예시를 확인할 수 있어요.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">입력한 주소는 이 화면의 예시 결과 표시에만 사용되며, 실제 지역 조회나 일정 확정은 아직 연결되어 있지 않습니다.</p>
          </div>
        </Container>
      )}
    </section>
  )
}

function AvailabilityCard({ result }: { result: InspectionAvailabilityResult }) {
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-4 shadow-md sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-success/10 text-status-success sm:size-11">
          <MapPin className="size-5 sm:size-6" />
        </span>
        <div className="min-w-0">
          <span className="mb-2 inline-block rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">점검 가능 결과 예시</span>
          <p className="break-words text-sm font-medium leading-relaxed text-foreground">{result.address}</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-status-success">
            <CheckCircle2 className="hidden size-5 shrink-0 sm:block" />
            {result.status}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{result.note}</p>
          {result.isExample ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">현재는 샘플 결과이며 실제 지역 조회·일정 확정 정보가 아닙니다.</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 items-center gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] xl:border-t-0 xl:pt-0">
        <div className="flex items-center gap-2.5">
          <Home className="size-5 shrink-0 text-brand" />
          <div>
            <p className="text-xs text-muted-foreground">주변 관리인</p>
            <p className="text-sm font-bold text-foreground">{result.activeManagers}명 활동 중</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar className="size-5 shrink-0 text-brand" />
          <div>
            <p className="text-xs text-muted-foreground">가장 빠른 점검일</p>
            <p className="text-sm font-bold text-foreground">{result.earliestDate}</p>
          </div>
        </div>
        <Link
          href="/inspection-request"
          className="col-span-2 inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:col-span-1"
        >
          지금 점검 요청하기
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
