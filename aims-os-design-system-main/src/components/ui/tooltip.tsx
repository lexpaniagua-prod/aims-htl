/**
 * Tooltip — AIMS OS DS · node 4614:5319
 *
 * Tokens: --tooltip-bg → --color-surface-neutral-darker (#111827)
 *         --tooltip-text → --color-text-negative (#ffffff)
 *
 * side="cursor" → positions via portal using getBoundingClientRect() on the
 * trigger element, immune to parent transforms / backdrop-filter / DPI issues.
 * Smart side selection: right → left → above → below, based on available space.
 */

import { useState, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

export type TooltipSide = "top" | "right" | "bottom" | "left" | "cursor"

type FixedSide = Exclude<TooltipSide, "cursor">

export interface TooltipProps {
  /** The element that triggers the tooltip on hover/focus */
  children: ReactNode
  /** Tooltip text content (max ~300px width, 2 lines recommended) */
  content: string
  /** Show directional arrow pointer. Default: false (ignored for side="cursor") */
  arrow?: boolean
  /**
   * Which side the tooltip appears on. Default: "top"
   * Use "cursor" for viewport-safe tooltip rendered via portal, positioned
   * next to the trigger element with smart side selection.
   */
  side?: TooltipSide
  /** Classes applied to the tooltip popup bubble */
  className?: string
  /**
   * Classes applied to the trigger wrapper span.
   * Use "block min-w-0" (or "block min-w-0 w-full") to enable truncation
   * inside flex/grid containers — overrides the default inline-flex display.
   */
  triggerClassName?: string
}

// ── Arrow styles (CSS border trick) ─────────────────────────────────────────

function getArrowStyle(side: FixedSide): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    border: "4px solid transparent",
    pointerEvents: "none",
  }
  switch (side) {
    case "top":
      return { ...base, top: "100%", left: "50%", transform: "translateX(-50%)", borderTopColor: "var(--tooltip-bg)", borderBottomWidth: 0 }
    case "bottom":
      return { ...base, bottom: "100%", left: "50%", transform: "translateX(-50%)", borderBottomColor: "var(--tooltip-bg)", borderTopWidth: 0 }
    case "left":
      return { ...base, left: "100%", top: "50%", transform: "translateY(-50%)", borderLeftColor: "var(--tooltip-bg)", borderRightWidth: 0 }
    case "right":
      return { ...base, right: "100%", top: "50%", transform: "translateY(-50%)", borderRightColor: "var(--tooltip-bg)", borderLeftWidth: 0 }
  }
}

// ── Positioning class per fixed side ─────────────────────────────────────────

const POSITION: Record<FixedSide, string> = {
  top:    "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
  bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
  left:   "right-[calc(100%+8px)] top-1/2 -translate-y-1/2",
  right:  "left-[calc(100%+8px)] top-1/2 -translate-y-1/2",
}

// ── Shared popup classes ──────────────────────────────────────────────────────

const POPUP_BASE = cn(
  "pointer-events-none z-50 w-max max-w-[300px]",
  "rounded-[4px] px-[12px] py-[8px]",
  "text-[14px] leading-[20px] font-medium",
  "bg-[var(--tooltip-bg)] text-[var(--tooltip-text)]",
)

// ── Element-anchored portal popup ─────────────────────────────────────────────
// Uses getBoundingClientRect() on the trigger — immune to transforms/DPI/zoom.
//
// Positioning strategy:
//   RIGHT: `left = r.right + GAP`           — left edge anchors to element's right
//   LEFT:  `right = vw - r.left + GAP`      — right edge anchors to element's left
//                                              ↑ this is the key: the actual tooltip
//                                              width doesn't matter. Short labels like
//                                              "Config" land 8px from the icon regardless.
//   ABOVE: centered horizontally on element
//   BELOW: fallback

const GAP    = 8   // px between element edge and tooltip edge
const MARGIN = 8   // minimum distance from viewport edge

function ElementPopup({ id, content, triggerRect, className }: {
  id: string
  content: string
  triggerRect: DOMRect
  className?: string
}) {
  const vw   = window.innerWidth
  const vh   = window.innerHeight
  const r    = triggerRect
  const midY = r.top + r.height / 2

  // Prefer right if there's meaningful space; otherwise left; otherwise above; below
  const canGoRight = vw - r.right - GAP > 60
  const canGoLeft  = r.left - GAP > 60
  const canGoAbove = r.top - GAP > 40

  const vertStyle: React.CSSProperties = {
    top: Math.max(MARGIN, Math.min(vh - 40 - MARGIN, midY)),
    transform: "translateY(-50%)",
  }

  if (canGoRight) {
    return (
      <span id={id} role="tooltip" className={cn(POPUP_BASE, className)}
        style={{ position: "fixed", left: r.right + GAP, ...vertStyle, animation: "tooltip-in 120ms ease-out both" }}>
        {content}
      </span>
    )
  }

  if (canGoLeft) {
    // `right` anchors the tooltip's RIGHT edge to the element's LEFT edge — width-agnostic
    return (
      <span id={id} role="tooltip" className={cn(POPUP_BASE, className)}
        style={{ position: "fixed", right: vw - r.left + GAP, ...vertStyle, animation: "tooltip-in 120ms ease-out both" }}>
        {content}
      </span>
    )
  }

  if (canGoAbove) {
    return (
      <span id={id} role="tooltip" className={cn(POPUP_BASE, className)}
        style={{
          position: "fixed",
          left: Math.max(MARGIN, r.left + r.width / 2),
          transform: "translateX(-50%)",
          top: Math.max(MARGIN, r.top - GAP - 36),
          animation: "tooltip-in 120ms ease-out both",
        }}>
        {content}
      </span>
    )
  }

  return (
    <span id={id} role="tooltip" className={cn(POPUP_BASE, className)}
      style={{
        position: "fixed",
        left: Math.max(MARGIN, r.left + r.width / 2),
        transform: "translateX(-50%)",
        top: r.bottom + GAP,
        animation: "tooltip-in 120ms ease-out both",
      }}>
      {content}
    </span>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function Tooltip({ children, content, arrow = false, side = "top", className, triggerClassName }: TooltipProps) {
  const [visible, setVisible]         = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const id         = useId()
  const isCursor   = side === "cursor"
  const triggerRef = useRef<HTMLSpanElement>(null)

  const captureRect = () => {
    if (isCursor && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
  }

  return (
    <span
      ref={triggerRef}
      className={cn("relative inline-flex items-center", triggerClassName)}
      onMouseEnter={() => { captureRect(); setVisible(true) }}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => { captureRect(); setVisible(true) }}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}

      {visible && !isCursor && (
        <span
          id={id}
          role="tooltip"
          className={cn(POPUP_BASE, "absolute", POSITION[side as FixedSide], className)}
          style={{ animation: "tooltip-in 120ms ease-out both" }}
        >
          {content}
          {arrow && <span style={getArrowStyle(side as FixedSide)} />}
        </span>
      )}

      {/* cursor mode — portal anchored to element rect, not mouse coordinates */}
      {visible && isCursor && triggerRect && createPortal(
        <ElementPopup id={id} content={content} triggerRect={triggerRect} className={className} />,
        document.body,
      )}
    </span>
  )
}
