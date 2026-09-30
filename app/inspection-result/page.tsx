import { InspectionResult } from "@/components/inspections/inspection-result"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"

export default async function InspectionResultPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return <div className="flex min-h-screen flex-col bg-background"><AppHeader /><main className="flex-1 py-10 md:py-14"><Container><InspectionResult id={id ?? null} /></Container></main><AppFooter /></div>
}
