import Link from "next/link"
import { MapPin, CalendarCheck, ClipboardList, HardHat, ListChecks, ChevronRight } from "lucide-react"
import { Container } from "@/components/site/container"
import { SectionHeader } from "@/components/site/section-header"

const steps = [
  {
    icon: MapPin,
    title: "주소 확인",
    description: "빈집 주소를 입력하고 점검 가능 지역을 확인합니다.",
    href: "/",
  },
  {
    icon: CalendarCheck,
    title: "점검 요청",
    description: "원하는 일정에 점검을 요청합니다.",
    href: "/inspection-request",
  },
  {
    icon: ClipboardList,
    title: "관리인 견적 비교",
    description: "여러 관리인의 견적과 조건을 비교할 수 있습니다.",
    href: "/quotes",
  },
  {
    icon: HardHat,
    title: "현장 점검",
    description: "선택한 관리인이 직접 현장을 점검합니다.",
    href: "/inspection-progress",
  },
  {
    icon: ListChecks,
    title: "정비 우선순위 확인",
    description: "점검 결과와 AI 분석을 통해 정비 우선순위를 확인합니다.",
    href: "/inspection-result",
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20">
      <Container>
        <SectionHeader title="이용 방법" description="간단한 5단계로 우리 집을 안전하게 관리하세요." />

        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex lg:block">
              <Link
                href={step.href}
                className="group flex flex-1 flex-col items-center rounded-xl border border-transparent px-2 py-4 text-center transition-colors hover:border-border hover:bg-card"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <step.icon className="size-6" />
                </span>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] text-brand-foreground">
                    {index + 1}
                  </span>
                  {step.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">{step.description}</p>
              </Link>
              {index < steps.length - 1 ? (
                <ChevronRight
                  className="absolute right-[-14px] top-[38px] hidden size-5 text-border lg:block"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
