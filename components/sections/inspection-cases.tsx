import Image from "next/image"
import { SectionHeader } from "@/components/site/section-header"

export function InspectionCases() {
  return (
    <div>
      <SectionHeader title="점검 화면 예시" />

      <article
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
          <h3 className="text-base font-bold text-foreground">예시 점검 화면</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
            점검 전후 화면 구성과 정비 확인 항목을 안내하기 위한 예시입니다. 실제 점검 결과나 사례가 아닙니다.
          </p>
        </div>
      </article>
    </div>
  )
}
