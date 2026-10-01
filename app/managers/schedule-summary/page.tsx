import { ManagerScheduleSummary } from "@/components/managers/manager-schedule-summary"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"

export default function ManagerScheduleSummaryPage() {
  return <div className="flex min-h-screen flex-col bg-background"><AppHeader /><main className="flex-1 py-10 md:py-14"><Container><ManagerScheduleSummary /></Container></main><AppFooter /></div>
}
