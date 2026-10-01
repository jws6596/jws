import { ScheduleExplorer } from "@/components/inspections/schedule-explorer"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"

export default function InspectionSchedulePage() {
  return <div className="flex min-h-screen flex-col bg-background"><AppHeader /><main className="flex-1 py-10 md:py-14"><Container><ScheduleExplorer /></Container></main><AppFooter /></div>
}
