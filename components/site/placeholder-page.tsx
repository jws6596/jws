import Link from "next/link"
import { ArrowLeft, Wrench } from "lucide-react"
import { AppHeader } from "./app-header"
import { AppFooter } from "./app-footer"
import { Container } from "./container"

export function PlaceholderPage({
  title,
  description,
  purpose,
  backHref = "/",
  backLabel = "메인으로 돌아가기",
  nextHref,
  nextLabel,
}: {
  title: string
  description: string
  purpose?: string
  backHref?: string
  backLabel?: string
  nextHref?: string
  nextLabel?: string
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 items-center py-20">
        <Container>
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-border bg-card p-10 text-center shadow-sm">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Wrench className="size-7" />
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground text-balance">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
            {purpose ? (
              <p className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted-foreground">{purpose}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={backHref}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
              {nextHref && nextLabel ? (
                <Link href={nextHref} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover">
                  {nextLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </main>
      <AppFooter />
    </div>
  )
}
