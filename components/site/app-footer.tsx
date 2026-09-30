import Link from "next/link"
import { Phone } from "lucide-react"
import { Logo } from "./logo"
import { Container } from "./container"

const footerLinks = [
  { label: "점검 요청", href: "/inspection-request" },
  { label: "내 점검", href: "/my-inspections" },
  { label: "관리인 찾기", href: "/managers" },
]

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <Container>
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-5">
            <Logo />
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="하단 메뉴">
              {footerLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">1588-1234</p>
              <p className="text-xs text-muted-foreground">평일 09:00 - 18:00</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 빈집지킴이. All rights reserved.</p>
          <p>비어 있는 집도, 여전히 소중한 우리의 자산입니다.</p>
        </div>
      </Container>
    </footer>
  )
}
