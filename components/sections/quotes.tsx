import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Star } from "lucide-react"
import { SectionHeader } from "@/components/site/section-header"
import { managers, quotes } from "@/lib/mock-data"

export function Quotes() {
  return (
    <div>
      <SectionHeader
        title="견적 비교 예시"
        description="여러 관리인의 견적을 한눈에 비교할 수 있습니다."
        action={{ label: "더 많은 견적 보기", href: "/quotes" }}
      />

      <div className="mt-6 flex flex-col gap-3">
        {quotes.map((quote) => {
          const manager = managers.find((item) => item.id === quote.managerId)
          return (
          <div
            key={quote.managerId}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="relative size-11 shrink-0 overflow-hidden rounded-full">
              <Image
                src={quote.photo || "/placeholder.svg"}
                alt={`${quote.name} 프로필 사진`}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{quote.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{quote.availableDate}</p>
            </div>

            <div className="text-right">
              <p className="text-base font-bold text-foreground">{quote.price.toLocaleString("ko-KR")}원</p>
              <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-status-warning text-status-warning" />
                {quote.rating} ({quote.reviews})
              </p>
            </div>

            <details className="group w-full border-t border-border pt-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 text-xs font-bold text-brand transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                <span>{quote.name} 견적 자세히 보기</span>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <div className="mt-2 rounded-lg bg-surface-muted p-4">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs leading-relaxed">
                  <dt className="text-muted-foreground">점검 비용</dt>
                  <dd className="text-right font-semibold">{quote.price.toLocaleString("ko-KR")}원</dd>
                  <dt className="text-muted-foreground">가능 일정</dt>
                  <dd className="text-right">{quote.availableDate}</dd>
                  {manager && <>
                    <dt className="text-muted-foreground">활동 지역</dt>
                    <dd className="text-right">{manager.regions}</dd>
                    <dt className="text-muted-foreground">점검 경험</dt>
                    <dd className="text-right">{manager.years}년 · {manager.completed}건 완료</dd>
                  </>}
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">비교용 예시 데이터입니다. 실제 견적이나 예약 확정 정보가 아닙니다.</p>
                <Link href={`/quotes/${quote.managerId}`} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  견적 상세페이지로 이동
                </Link>
              </div>
            </details>
          </div>
          )
        })}
      </div>
    </div>
  )
}
