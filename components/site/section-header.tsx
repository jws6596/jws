import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: { label: string; href: string }
  className?: string
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground text-pretty">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-brand hover:underline"
        >
          {action.label}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}
