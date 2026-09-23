import { test } from "node:test"
import assert from "node:assert/strict"
import { validateInspectionAddress } from "../core/inspection-availability.ts"
import { checkInspectionAvailability } from "../services/inspection-availability-service.ts"

test("주소 검증은 공백·형식 오류를 차단하고 공백을 정규화한다", () => {
  assert.deepEqual(validateInspectionAddress("   "), { valid: false, message: "빈집 주소를 입력해주세요." })
  assert.deepEqual(validateInspectionAddress("!"), { valid: false, message: "주소는 한글, 영문 또는 숫자를 포함해 2자 이상 입력해주세요." })
  assert.deepEqual(validateInspectionAddress("  전남   순천시  "), { valid: true, address: "전남 순천시" })
})

test("주소 확인 서비스는 검증된 주소와 제공자 결과를 하나의 계약으로 반환한다", async () => {
  const provider = {
    async findByAddress() {
      return { status: "점검 가능", note: "예시", activeManagers: 1, earliestDate: "내일", isExample: true }
    },
  }

  assert.deepEqual(await checkInspectionAvailability({ address: " 순천시 " }, provider), {
    ok: true,
    data: { address: "순천시", status: "점검 가능", note: "예시", activeManagers: 1, earliestDate: "내일", isExample: true },
  })
  assert.deepEqual(await checkInspectionAvailability({ address: " " }, provider), { ok: false, message: "빈집 주소를 입력해주세요." })
})
