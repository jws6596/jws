import type { InspectionAvailabilityProvider } from "@/services/inspection-availability-service"

// This provider is intentionally isolated from the domain. Replace it with a
// database or regional-availability adapter when real coverage data exists.
export const exampleInspectionAvailabilityProvider: InspectionAvailabilityProvider = {
  async findByAddress() {
    return {
      status: "점검 가능한 지역입니다.",
      note: "평균 2~3일 내 현장 점검이 가능합니다.",
      activeManagers: 3,
      earliestDate: "8월 25일 (월)",
      isExample: true,
    }
  },
}
