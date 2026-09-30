import { InspectionProgress } from "@/components/inspections/inspection-progress"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"

export default async function InspectionProgressPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return <div className="flex min-h-screen flex-col bg-background"><AppHeader /><main className="flex-1 py-10 md:py-14"><Container><InspectionProgress id={id ?? null} /></Container></main><AppFooter /></div>
}
