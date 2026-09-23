import Link from "next/link"
import Image from "next/image"
import { ShieldCheck } from "lucide-react"
import { SectionHeader } from "@/components/site/section-header"
import { StatusBadge } from "@/components/site/status-badge"
import { repairItems } from "@/lib/mock-data"

export function RepairPriority() {
  return (
    <div>
      <SectionHeader
        title="점검 결과 예시"
        description="AI가 분석한 정비 우선순위로, 무엇부터 고쳐야 할지 한눈에 확인할 수 있습니다."
        action={{ label: "더 많은 결과 보기", href: "/inspection-result" }}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {repairItems.map((item) => (
          <Link
            key={item.title}
            href="/inspection-result"
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-brand/40"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
              <StatusBadge priority={item.priority} className="absolute left-3 top-3 shadow-sm">
                {item.priorityLabel}
              </StatusBadge>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-base font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">{item.description}</p>
              <div className="mt-4 flex items-start gap-1.5 border-t border-border pt-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="text-[11px] font-medium text-foreground">판정 이유</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
