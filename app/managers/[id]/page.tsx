import { PlaceholderPage } from "@/components/site/placeholder-page"
import { managers } from "@/lib/mock-data"

export default async function ManagerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const manager = managers.find((m) => m.id === id)

  return (
    <PlaceholderPage
      title={manager ? `${manager.name} 관리인` : "관리인 상세"}
      description="관리인의 상세 프로필과 점검 이력을 준비하고 있습니다."
      purpose={
        manager
          ? `${manager.regions} · 점검 경력 ${manager.years}년 · 점검 완료 ${manager.completed}건`
          : "이 페이지는 개별 관리인의 상세 정보를 제공합니다."
      }
      backHref="/managers"
      backLabel="관리인 목록으로 돌아가기"
      nextHref="/inspection-request"
      nextLabel="점검 요청으로 이동"
    />
  )
}
