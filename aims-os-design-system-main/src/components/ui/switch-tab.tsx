/**
 * SwitchTab — AIMS OS DS · node 4591:349
 * Segmented tab switcher for top-level navigation within a contained view.
 * White pill container · 2–7 tabs · M (48px) / S (44px) · full keyboard nav · ARIA.
 *
 * Tokens:
 *   --st-bg              Surface/Neutral/White (always white, floats on dark)
 *   --st-shadow          Elevation-5 (8px 8px 16px rgba(0,0,0,0.08))
 *   --st-active-bg       Surface/Primary/More Subtle (#f6f9ff)
 *   --st-active-text     Text/Link = var(--primary)
 *   --st-text            foreground text
 *   --st-radius          8px  container
 *   --st-item-radius     4px  individual tab item
 */
import { useState, useRef, useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export type SwitchTabSize = "m" | "s"

export interface SwitchTabItem {
  id: string
  label: string
  icon?: ReactNode
}

export interface SwitchTabProps {
  /** Tab definitions — 2–7 items */
  items: SwitchTabItem[]
  /** Controlled active tab id */
  value?: string
  /** Uncontrolled initial active tab id (defaults to first item) */
  defaultValue?: string
  /** Called when the active tab changes */
  onChange?: (id: string) => void
  /** M = 48px container / S = 44px container. Default: "m" */
  size?: SwitchTabSize
  className?: string
  /** Accessible label for the tablist */
  "aria-label"?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SwitchTab({
  items,
  value,
  defaultValue,
  onChange,
  size = "m",
  className,
  "aria-label": ariaLabel,
}: SwitchTabProps) {
  const uid               = useId()
  const listRef           = useRef<HTMLDivElement>(null)
  const isControlled      = value !== undefined
  const [internal, setInternal] = useState<string>(defaultValue ?? items[0]?.id ?? "")

  const active = isControlled ? value : internal

  const activate = (id: string) => {
    if (!isControlled) setInternal(id)
    onChange?.(id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const last = items.length - 1
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      const next = e.key === "ArrowRight"
        ? (idx + 1 > last ? 0 : idx + 1)
        : (idx - 1 < 0 ? last : idx - 1)
      activate(items[next].id)
      const btns = listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")
      btns?.[next]?.focus()
    }
  }

  const isM = size === "m"

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex w-fit items-center p-[8px] rounded-[8px]", className)}
      style={{
        background: "var(--st-bg)",
        boxShadow: "var(--st-shadow)",
        gap: 2,
      }}
    >
      {items.map((item, idx) => {
        const isActive  = item.id === active
        const tabPanelId = `${uid}-panel-${item.id}`
        const tabId      = `${uid}-tab-${item.id}`

        return (
          <button
            key={item.id}
            id={tabId}
            role="tab"
            aria-selected={isActive}
            aria-controls={tabPanelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => activate(item.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "flex-1 flex items-center justify-center gap-[2px] whitespace-nowrap select-none transition-colors duration-150",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 rounded-[4px]",
              isM ? "px-[12px] py-[4px]" : "px-[8px] py-[4px]",
            )}
            style={{
              background: isActive ? "var(--st-active-bg)" : "transparent",
              borderRadius: "var(--st-item-radius)",
            }}
          >
            {item.icon && (
              <span
                className="shrink-0 flex items-center justify-center"
                style={{ color: isActive ? "var(--st-active-text)" : "var(--st-text)" }}
                aria-hidden
              >
                {item.icon}
              </span>
            )}
            <span
              className={cn(
                isM ? "text-[16px] leading-[24px]" : "text-[14px] leading-[20px]",
                isActive ? "font-semibold" : "font-medium",
              )}
              style={{ color: isActive ? "var(--st-active-text)" : "var(--st-text)" }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
