import { ManagerFinder } from "@/components/managers/manager-finder"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"
import { Suspense } from "react"

export default function ManagersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 py-10 md:py-14">
        <Container>
          <Suspense fallback={<div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">관리인 목록을 불러오는 중입니다.</div>}>
            <ManagerFinder />
          </Suspense>
        </Container>
      </main>
      <AppFooter />
    </div>
  )
}
