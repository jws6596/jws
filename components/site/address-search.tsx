"use client"

import { useId, useState } from "react"
import { MapPin, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateInspectionAddress } from "@/core/inspection-availability"
import type { InspectionAvailabilityResult } from "@/core/inspection-availability"
import { requestInspectionAvailability } from "@/services/client/inspection-availability-client"

export function AddressSearch({
  onResult,
  onAddressChange,
  className,
  buttonLabel = "점검 가능 지역 확인",
}: {
  onResult?: (result: InspectionAvailabilityResult) => void
  onAddressChange?: (address: string) => void
  className?: string
  buttonLabel?: string
}) {
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputId = useId()
  const errorId = `${inputId}-error`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    const validation = validateInspectionAddress(address)
    if (!validation.valid) {
      setError(validation.message)
      setSubmitted(false)
      return
    }
    setError(null)
    setSubmitted(false)
    setIsSubmitting(true)
    try {
      const result = await requestInspectionAvailability(validation.address)
      onResult?.(result)
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "점검 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} noValidate>
      <div className={cn("flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-brand/30 sm:flex-row sm:items-center", error ? "border-status-danger" : "border-border")}>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <MapPin className="size-5 shrink-0 text-brand" />
          <label htmlFor={inputId} className="sr-only">
            빈집 주소
          </label>
          <input
            id={inputId}
            type="text"
            value={address}
            onChange={(e) => {
              const nextAddress = e.target.value
              setAddress(nextAddress)
              onAddressChange?.(nextAddress.trim())
              if (error) setError(null)
              if (submitted) setSubmitted(false)
            }}
            maxLength={120}
            placeholder="빈집 주소를 입력해주세요 (예: 전라남도 순천시 …)"
            className="h-12 min-w-0 w-full bg-transparent text-base text-foreground outline-none placeholder:text-sm placeholder:text-muted-foreground"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-6 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {isSubmitting ? "확인 중…" : buttonLabel}
          <ArrowRight className="size-4" />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-2 pl-1 text-sm font-medium text-status-danger" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      {submitted ? (
        <p className="mt-2 flex items-center gap-1.5 pl-1 text-sm font-medium text-status-success" role="status" aria-live="polite">
          입력한 주소로 예시 결과를 갱신했습니다.
        </p>
      ) : null}
    </form>
  )
}
