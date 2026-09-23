import type { InspectionAvailabilityResult } from "@/core/inspection-availability"
import type { ApiResponse } from "@/lib/contracts/api"

export class InspectionAvailabilityRequestError extends Error {}

export async function requestInspectionAvailability(address: string): Promise<InspectionAvailabilityResult> {
  let response: Response
  try {
    response = await fetch("/api/inspection-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
  } catch {
    throw new InspectionAvailabilityRequestError("점검 가능 여부를 확인하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.")
  }

  const payload = await response.json().catch(() => null) as ApiResponse<InspectionAvailabilityResult> | null
  if (!response.ok || !payload || !payload.success) {
    const message = payload && !payload.success ? payload.error.message : "점검 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해주세요."
    throw new InspectionAvailabilityRequestError(message)
  }
  return payload.data
}
