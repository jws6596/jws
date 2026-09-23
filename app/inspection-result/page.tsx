import { PlaceholderPage } from "@/components/site/placeholder-page"

export default function InspectionResultPage() {
  return (
    <PlaceholderPage
      title="정비 우선순위 결과"
      description="AI가 분석한 정비 우선순위 리포트를 준비하고 있습니다."
      purpose="이 페이지는 점검 사진과 함께 항목별 정비 우선순위를 제공합니다."
      nextHref="/my-inspections"
      nextLabel="내 점검 보기"
    />
  )
}
