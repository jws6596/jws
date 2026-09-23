import { AppHeader } from "@/components/site/app-header"
import { AppFooter } from "@/components/site/app-footer"
import { Container } from "@/components/site/container"
import { Hero } from "@/components/sections/hero"
import { HowItWorks } from "@/components/sections/how-it-works"
import { RepairPriority } from "@/components/sections/repair-priority"
import { InspectionCases } from "@/components/sections/inspection-cases"
import { Managers } from "@/components/sections/managers"
import { Quotes } from "@/components/sections/quotes"
import { Faq } from "@/components/sections/faq"
import { BottomCta } from "@/components/sections/bottom-cta"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />

        <section className="pb-16 md:pb-20">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2">
                <RepairPriority />
              </div>
              <div className="lg:col-span-1">
                <InspectionCases />
              </div>
            </div>
          </Container>
        </section>

        <section className="pb-16 md:pb-20">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-6">
              <div className="lg:col-span-3">
                <Managers />
              </div>
              <div className="lg:col-span-2">
                <Quotes />
              </div>
            </div>
          </Container>
        </section>

        <section className="pb-20">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-6">
              <div className="lg:col-span-2">
                <Faq />
              </div>
              <div className="lg:col-span-3">
                <BottomCta />
              </div>
            </div>
          </Container>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}
