import { type InspectionAvailabilityInput, type InspectionAvailabilityResult, validateInspectionAddress } from "../core/inspection-availability.ts"

export type InspectionAvailabilityProvider = {
  findByAddress(address: string): Promise<Omit<InspectionAvailabilityResult, "address">>
}

export type InspectionAvailabilityServiceResult =
  | { ok: true; data: InspectionAvailabilityResult }
  | { ok: false; message: string }

export async function checkInspectionAvailability(
  input: InspectionAvailabilityInput,
  provider: InspectionAvailabilityProvider,
): Promise<InspectionAvailabilityServiceResult> {
  const validation = validateInspectionAddress(input.address)
  if (!validation.valid) return { ok: false, message: validation.message }

  const availability = await provider.findByAddress(validation.address)
  return { ok: true, data: { address: validation.address, ...availability } }
}
