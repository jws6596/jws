export type InspectionAvailabilityInput = { address: string }

export type InspectionAvailabilityResult = {
  address: string
  status: string
  note: string
  activeManagers: number
  earliestDate: string
  isExample: boolean
}

export type AddressValidation = { valid: true; address: string } | { valid: false; message: string }

export function validateInspectionAddress(value: string): AddressValidation {
  const address = value.trim().replace(/\s+/g, " ")
  if (!address) return { valid: false, message: "빈집 주소를 입력해주세요." }
  if (address.length > 120) return { valid: false, message: "주소는 120자 이내로 입력해주세요." }
  if (address.length < 2 || !/[가-힣A-Za-z0-9]/.test(address)) {
    return { valid: false, message: "주소는 한글, 영문 또는 숫자를 포함해 2자 이상 입력해주세요." }
  }
  return { valid: true, address }
}
