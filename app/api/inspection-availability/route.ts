import { NextRequest, NextResponse } from "next/server"
import { apiFailure, apiSuccess } from "@/lib/contracts/api"
import { exampleInspectionAvailabilityProvider } from "@/infrastructure/example-inspection-availability-provider"
import { checkInspectionAvailability } from "@/services/inspection-availability-service"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { address?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(apiFailure("INVALID_REQUEST", "요청 내용을 읽을 수 없습니다. 다시 시도해주세요."), { status: 400 })
  }

  if (typeof body.address !== "string") {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "빈집 주소를 입력해주세요."), { status: 400 })
  }

  try {
    const result = await checkInspectionAvailability({ address: body.address }, exampleInspectionAvailabilityProvider)
    if (!result.ok) return NextResponse.json(apiFailure("VALIDATION_ERROR", result.message), { status: 400 })
    return NextResponse.json(apiSuccess(result.data))
  } catch {
    return NextResponse.json(apiFailure("INTERNAL_ERROR", "점검 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해주세요."), { status: 500 })
  }
}
