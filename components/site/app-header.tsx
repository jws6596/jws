"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User } from "lucide-react"
import { Logo } from "./logo"
import { Container } from "./container"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "관리인 찾기", href: "/managers" },
]

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", closeWithEscape)
    return () => window.removeEventListener("keydown", closeWithEscape)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 md:h-[72px]">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/my-inspections"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <User className="size-4" />내 점검
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      <div className={cn("border-t border-border md:hidden", open ? "block" : "hidden")}>
        <Container>
          <nav className="flex flex-col py-2" aria-label="모바일 메뉴">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 py-3 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2">
              <Link
                href="/my-inspections"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground"
              >
                <User className="size-4" />내 점검
              </Link>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  )
}
