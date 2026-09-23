import { managers } from "@/lib/mock-data"

export type ChatAction =
  | { type: "navigate"; href: string; confirmation: string }
  | { type: "manager-search"; region?: string; keyword?: string; confirmation: string }
  | { type: "manager-detail"; managerId: string; confirmation: string }
  | { type: "clarify"; message: string; pending: "manager-search" }
  | { type: "unsupported"; message: string }

const regions = ["전남 순천시", "전북 김제시", "충남 서천군"] as const
const unsupportedExampleRegions = ["서울", "부산", "대구", "대전", "광주", "제주"]

function normalized(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase()
}

function findRegion(message: string) {
  return regions.find((region) => {
    const district = region.split(" ").at(-1) ?? region
    return message.includes(normalized(region)) || message.includes(normalized(district))
  })
}

function findManager(message: string) {
  return managers.find((manager) => message.includes(normalized(manager.name)))
}

export function interpretChatAction(prompt: string, pending?: "manager-search"): ChatAction | null {
  const message = normalized(prompt)
  const region = findRegion(message)
  const unsupportedRegion = unsupportedExampleRegions.find((name) => message.includes(name))
  const manager = findManager(message)
  const mentionsManager = /(관리인|현지.?지킴이|점검.?담당)/.test(message)
  const asksDetail = /(상세|프로필|자세히|열어|보여)/.test(message)
  const asksSearch = /(찾아|검색|보여|골라|비교|추천)/.test(message)

  if (/(삭제|결제|결제해|접수해|예약해|저장해|제출해)/.test(message)) {
    return { type: "unsupported", message: "삭제·결제·접수·저장처럼 실제 데이터에 영향을 주는 작업은 채팅에서 실행할 수 없어요. 화면에서 내용을 확인한 뒤 직접 진행해주세요." }
  }

  if (/(처음|메인|홈).{0,8}(화면|페이지|가|돌아)|^(처음|메인|홈)/.test(message)) {
    return { type: "navigate", href: "/", confirmation: "메인 화면으로 이동했어요." }
  }

  if (manager && asksDetail) {
    return { type: "manager-detail", managerId: manager.id, confirmation: `${manager.name} 관리인 프로필을 열었어요.` }
  }

  if (region && (mentionsManager || asksSearch || pending === "manager-search")) {
    return { type: "manager-search", region, confirmation: `${region}에서 활동하는 관리인만 보이도록 필터를 적용했어요.` }
  }

  if (unsupportedRegion && mentionsManager && asksSearch) {
    return { type: "manager-search", keyword: unsupportedRegion, confirmation: `${unsupportedRegion} 조건에는 현재 예시 관리인 데이터가 없어요. 순천시, 김제시, 서천군으로 다시 찾아볼까요?` }
  }

  if (/(관리인).{0,8}(화면|목록|찾기).{0,8}(가|열어|보여)|^(관리인 찾기)$/.test(message)) {
    return { type: "navigate", href: "/managers", confirmation: "관리인 찾기 화면으로 이동했어요." }
  }

  if (mentionsManager && /(추천|찾아|검색|보여|비교)/.test(message)) {
    return { type: "clarify", pending: "manager-search", message: "어느 지역의 관리인을 찾으시나요? 현재 예시 데이터는 순천시, 김제시, 서천군에서 확인할 수 있어요." }
  }

  if (/(점검 결과|정비 우선순위).{0,8}(화면|페이지|가|열어|보여)|^(점검 결과)$/.test(message)) {
    return { type: "navigate", href: "/inspection-result", confirmation: "점검 결과 예시 화면으로 이동했어요." }
  }

  if (/(견적).{0,8}(화면|비교|페이지|가|열어|보여)|^(견적)$/.test(message)) {
    return { type: "navigate", href: "/quotes", confirmation: "견적 비교 화면으로 이동했어요." }
  }

  return null
}
