import { PlaceholderPage } from "@/components/site/placeholder-page"
import { quotes } from "@/lib/mock-data"

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = quotes.find((q) => q.managerId === id)

  return (
    <PlaceholderPage
      title={quote ? `${quote.name} 견적` : "견적 상세"}
      description="선택한 관리인의 상세 견적 내용을 준비하고 있습니다."
      purpose={
        quote
          ? `${quote.availableDate} · 점검 비용 ${quote.price.toLocaleString("ko-KR")}원`
          : "이 페이지는 개별 견적의 상세 내용을 제공합니다."
      }
      backHref="/quotes"
      backLabel="견적 비교로 돌아가기"
      nextHref="/inspection-request"
      nextLabel="점검 요청으로 이동"
    />
  )
}
