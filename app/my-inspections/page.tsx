import { InspectionDashboard } from "@/components/dashboard/inspection-dashboard"
import { InspectionList } from "@/components/inspections/inspection-list"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"

export default function MyInspectionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 py-10 md:py-14">
        <Container>
          <div className="space-y-8"><InspectionList /><InspectionDashboard /></div>
        </Container>
      </main>
      <AppFooter />
    </div>
  )
}
