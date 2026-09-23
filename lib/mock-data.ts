export type RepairPriority = "danger" | "warning" | "success"

export type Manager = {
  id: string
  name: string
  photo: string
  regions: string
  years: number
  completed: number
  rating: number
  reviews: number
}

export type RepairItem = {
  priority: RepairPriority
  priorityLabel: string
  title: string
  image: string
  description: string
  reason: string
}

export type Quote = {
  managerId: string
  name: string
  photo: string
  availableDate: string
  price: number
  rating: number
  reviews: number
}

export type Faq = {
  question: string
  answer: string
}

export const managers: Manager[] = [
  {
    id: "kim-hyeonsu",
    name: "김현수",
    photo: "/images/manager-kim.png",
    regions: "전남 순천시 외 3개 지역",
    years: 5,
    completed: 120,
    rating: 4.9,
    reviews: 120,
  },
  {
    id: "lee-jeongeun",
    name: "이정은",
    photo: "/images/manager-lee.png",
    regions: "전북 김제시 외 2개 지역",
    years: 4,
    completed: 98,
    rating: 4.8,
    reviews: 98,
  },
  {
    id: "park-seongmin",
    name: "박성민",
    photo: "/images/manager-park.png",
    regions: "충남 서천군 외 4개 지역",
    years: 7,
    completed: 210,
    rating: 4.9,
    reviews: 210,
  },
]

export const repairItems: RepairItem[] = [
  {
    priority: "danger",
    priorityLabel: "먼저 정비",
    title: "지붕 누수 흔적",
    image: "/images/repair-roof-leak.png",
    description: "천장에 누수로 인한 변색이 확인됩니다. 장기 방치 시 구조 손상이 발생할 수 있습니다.",
    reason: "누수 범위가 넓고, 추가 피해 가능성이 높음",
  },
  {
    priority: "warning",
    priorityLabel: "빠른 시일 내 정비",
    title: "벽 곰팡이",
    image: "/images/repair-wall-mold.png",
    description: "실내 벽면에 곰팡이가 확인됩니다. 환기와 방수가 필요합니다.",
    reason: "곰팡이 확산 시 실내 환경이 악화될 수 있음",
  },
  {
    priority: "success",
    priorityLabel: "나중에 정비",
    title: "창문 일부 파손",
    image: "/images/repair-window-broken.png",
    description: "창문 유리 일부가 파손되어 있습니다. 우천 시 빗물 유입 가능성이 있습니다.",
    reason: "긴급하지 않지만, 추후 정비 권장",
  },
]

export const quotes: Quote[] = [
  {
    managerId: "kim-hyeonsu",
    name: "김현수 관리인",
    photo: "/images/manager-kim.png",
    availableDate: "8월 25일 (월) 가능",
    price: 50000,
    rating: 4.9,
    reviews: 120,
  },
  {
    managerId: "lee-jeongeun",
    name: "이정은 관리인",
    photo: "/images/manager-lee.png",
    availableDate: "8월 26일 (화) 가능",
    price: 60000,
    rating: 4.8,
    reviews: 98,
  },
  {
    managerId: "park-seongmin",
    name: "박성민 관리인",
    photo: "/images/manager-park.png",
    availableDate: "8월 28일 (목) 가능",
    price: 70000,
    rating: 4.9,
    reviews: 210,
  },
]

export const faqs: Faq[] = [
  {
    question: "집주인이 현장에 없어도 되나요?",
    answer:
      "네, 가능합니다. 검증된 현지 관리인이 집주인을 대신해 현장을 방문하고 점검합니다. 점검 결과는 사진과 함께 온라인으로 전달되므로 직접 방문하지 않아도 집 상태를 확인할 수 있습니다.",
  },
  {
    question: "현지 관리인은 어떻게 확인하나요?",
    answer:
      "모든 관리인은 본인 확인 절차를 거친 뒤 활동합니다. 관리인 프로필에서 활동 지역, 점검 경력, 누적 점검 건수, 이용자 후기를 확인하고 직접 선택하실 수 있습니다.",
  },
  {
    question: "점검 후 반드시 수리해야 하나요?",
    answer:
      "아닙니다. 점검은 집 상태를 파악하기 위한 것으로, 수리 여부는 전적으로 집주인이 결정합니다. AI가 분석한 정비 우선순위를 참고해 필요한 부분부터 천천히 진행하시면 됩니다.",
  },
  {
    question: "점검 결과는 어떻게 확인하나요?",
    answer:
      "점검이 완료되면 '내 점검' 메뉴에서 현장 사진과 함께 정비 우선순위 리포트를 확인할 수 있습니다. 어떤 부분을 먼저 손봐야 하는지 한눈에 파악할 수 있습니다.",
  },
]

export const heroTrustPoints = ["전국 주요 농촌 지역 지원", "검증된 현지 관리인", "AI 기반 정비 우선순위 분석"]

export const availabilityResult = {
  address: "전라남도 순천시 서면 ○○길 123",
  status: "점검 가능한 지역입니다.",
  note: "평균 2~3일 내 현장 점검이 가능합니다.",
  activeManagers: 3,
  earliestDate: "8월 25일 (월)",
}
