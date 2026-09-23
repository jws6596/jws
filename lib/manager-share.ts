import type { Manager, Quote } from "@/lib/mock-data"

export function buildManagerShareText(manager: Manager, quote?: Quote) {
  const quoteText = quote ? ` · 예시 점검 견적 ${quote.price.toLocaleString("ko-KR")}원` : ""
  return `빈집지킴이에서 ${manager.name} 관리인을 확인해보세요.\n활동 지역: ${manager.regions}\n점검 경력: ${manager.years}년 · ${manager.completed}건 완료\n평점: ${manager.rating}점${quoteText}`
}
