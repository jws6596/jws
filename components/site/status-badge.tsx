import { cn } from "@/lib/utils"
import type { RepairPriority } from "@/lib/mock-data"

const styles: Record<RepairPriority, string> = {
  danger: "bg-status-danger text-status-danger-foreground",
  warning: "bg-status-warning text-status-warning-foreground",
  success: "bg-status-success text-status-success-foreground",
}

export function StatusBadge({
  priority,
  children,
  className,
}: {
  priority: RepairPriority
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold",
        styles[priority],
        className,
      )}
    >
      {children}
    </span>
  )
}
