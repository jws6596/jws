import Link from "next/link"
import Image from "next/image"
import { BadgeCheck, MapPin, Briefcase } from "lucide-react"
import { SectionHeader } from "@/components/site/section-header"
import { managers } from "@/lib/mock-data"

export function Managers() {
  return (
    <div>
      <SectionHeader
        title="검증된 현지 관리인"
        description="우리 지역의 믿을 수 있는 관리인을 만나보세요."
        action={{ label: "관리인 더 보기", href: "/managers" }}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {managers.map((manager) => (
          <div key={manager.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={manager.photo || "/placeholder.svg"}
                  alt={`${manager.name} 관리인 프로필 사진`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{manager.name}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-status-success/10 px-1.5 py-0.5 text-[11px] font-medium text-status-success">
                  <BadgeCheck className="size-3.5" />
                  본인 확인 완료
                </span>
              </div>
            </div>

            <dl className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-brand" />
                <dt className="sr-only">활동 지역</dt>
                <dd>{manager.regions}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-brand" />
                <dt className="sr-only">점검 경력</dt>
                <dd>점검 경력 {manager.years}년</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">점검 완료</p>
                <p className="text-sm font-bold text-foreground">{manager.completed}건</p>
              </div>
              <Link
                href={`/managers/${manager.id}`}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                프로필 보기
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
