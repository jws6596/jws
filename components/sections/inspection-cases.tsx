import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { SectionHeader } from "@/components/site/section-header"

export function InspectionCases() {
  return (
    <div>
      <SectionHeader title="실제 점검 사례" action={{ label: "더 많은 사례 보기", href: "/cases" }} />

      <Link
        href="/cases"
        className="group mt-6 flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand/40"
      >
        <div className="flex items-center gap-3">
          <figure className="relative flex-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image src="/images/case-before.png" alt="점검 전 빈집 외관" fill sizes="20vw" className="object-cover" />
            </div>
            <figcaption className="absolute left-2 top-2 rounded-md bg-foreground/70 px-2 py-1 text-[11px] font-bold text-background">
              점검 전
            </figcaption>
          </figure>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
          <figure className="relative flex-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/case-after.png"
                alt="점검 후 정비된 빈집 외관"
                fill
                sizes="20vw"
                className="object-cover"
              />
            </div>
            <figcaption className="absolute left-2 top-2 rounded-md bg-status-success px-2 py-1 text-[11px] font-bold text-status-success-foreground">
              점검 후
            </figcaption>
          </figure>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-foreground">전라북도 김제시 ○○면</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
            오랫동안 비어 있어 잡풀이 무성했던 주택을 점검하여 지붕, 외벽, 배수 상태를 확인했습니다.
          </p>
        </div>
      </Link>
    </div>
  )
}
