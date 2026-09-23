"use client"

import { useRouter } from "next/navigation"
import { AddressSearch } from "@/components/site/address-search"

export function BottomCta() {
  const router = useRouter()

  return (
    <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/cta-rural.png)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" aria-hidden />
      <div className="relative flex flex-col gap-6 p-8 md:p-10">
        <div>
          <h2 className="text-2xl font-bold leading-snug tracking-tight text-foreground text-balance md:text-[1.75rem]">
            멀리 있는 빈집,
            <br />
            직접 가지 말고 먼저 상태를 확인해보세요.
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            주소를 입력하면 현재 지역의 점검 가능 여부를 바로 확인할 수 있습니다.
          </p>
        </div>
        <div className="max-w-2xl">
          <AddressSearch onResult={() => router.push("/inspection-request")} />
        </div>
      </div>
    </div>
  )
}
