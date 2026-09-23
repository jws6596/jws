import Link from "next/link"
import { Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="빈집지킴이 홈">
      <span className="flex size-9 items-center justify-center rounded-md bg-brand/10 text-brand">
        <Home className="size-5" strokeWidth={2.2} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-tight text-brand">빈집지킴이</span>
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">멀리 있어도, 늘 가까이</span>
      </span>
    </Link>
  )
}
