import { ManagerDetail } from "@/components/managers/manager-detail"
import { AppFooter } from "@/components/site/app-footer"
import { AppHeader } from "@/components/site/app-header"
import { Container } from "@/components/site/container"
import { managers } from "@/lib/mock-data"

export function generateStaticParams() {
  return managers.map((manager) => ({ id: manager.id }))
}

export default async function ManagerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div className="flex min-h-screen flex-col bg-background"><AppHeader /><main className="flex-1 py-10 md:py-14"><Container><ManagerDetail id={id} /></Container></main><AppFooter /></div>
}
