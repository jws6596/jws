"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { faqs } from "@/lib/mock-data"

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">자주 묻는 질문</h2>
          <p className="mt-2 text-sm text-muted-foreground">궁금한 점을 미리 확인해보세요.</p>
        </div>
        <Link
          href="/faq"
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-brand hover:underline"
        >
          더보기
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question} className="rounded-xl border border-border bg-card shadow-sm">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-foreground">{faq.question}</span>
                <ChevronDown
                  className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen ? (
                <p className="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
