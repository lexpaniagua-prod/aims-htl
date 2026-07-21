/**
 * ScrollArea — AIMS OS DS · node 4838:8343
 *
 * Scrollable container with DS-branded 4px custom scrollbar (Size S, only supported size).
 * Thumb is hidden by default and appears on container hover — never persistently visible.
 * Maintain Spacing/2x (8px) between the scrollbar and the scrollable content via padding.
 *
 * States:
 *   Default      → thumb transparent (hidden)
 *   Container hover → thumb visible · --field-scrollbar-thumb
 *   Thumb hover  → thumb darker · --scrollbar-thumb-hover
 *
 * Tokens: --field-scrollbar-thumb · --scrollbar-thumb-hover
 */

import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScrollAreaProps {
  children:   ReactNode
  /** Scroll axis. Default: "y" */
  axis?:      "y" | "x" | "both"
  className?: string
  style?:     React.CSSProperties
}

// ── Component ────────────────────────────────────────────────────────────────

export function ScrollArea({ children, axis = "y", className, style }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "aims-scroll",
        axis === "y"    && "overflow-y-auto overflow-x-hidden",
        axis === "x"    && "overflow-x-auto overflow-y-hidden",
        axis === "both" && "overflow-auto",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
