import { InspectionRequestForm } from "@/components/inspections/inspection-request-form"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"

export default function InspectionRequestPage() {
  return <div className="flex min-h-screen flex-col bg-background"><AppHeader /><main className="flex-1 py-10 md:py-14"><Container><InspectionRequestForm /></Container></main><AppFooter /></div>
}
