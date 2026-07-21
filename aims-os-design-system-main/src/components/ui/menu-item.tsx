import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Menu / Dropdown — AIMS OS Design System
 * Component set: Figma v6rmYKA2zmyXWOahlxLOeI · node 4762:7152
 *
 * All colors resolve via CSS custom properties in index.css.
 * Light / dark handled by the token layer — no dark: prefix needed.
 *
 * States (exact DS states):
 *   default  → Surface/Floating/Default bg · normal text
 *   hover    → Surface/Floating/Hover bg (CSS :hover) — same token as focus
 *   focus    → Surface/Floating/Hover bg (gray, NOT blue) · same text as default
 *   disabled → Surface/Floating/Default bg (unchanged!) · Text/Disabled color on text+icon
 *
 * Sizes (height is auto — padding-driven, NOT fixed):
 *   default (M) → py-[8px] px-[16px] gap-[16px]  14px Medium  icon 24×24
 *                 single-line ≈ 40px · with subtext ≈ 56px
 *   sm      (S) → py-[8px] px-[8px]  gap-[8px]   12px Medium  icon 16×16
 *                 single-line ≈ 40px · with subtext ≈ 56px
 *                 Note: S label uses Text/Body (--menu-item-subtext, lighter) not Text/Subtitle
 *
 * DS slot layout (HORIZONTAL auto-layout, left → right):
 *   [checkbox?] · [leadingIcon?] · [label + subtext] · [trailingElement?]
 *
 * DS subtext: Roboto Regular 14px in source — we use Inter throughout this doc app.
 * Trailing dismiss: Buttons-NEW Tertiary / Icon Alone — 40×40 (M) · 28×28 (S)
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type MenuItemState = "default" | "focus" | "disabled"
export type MenuItemSize  = "default" | "sm"

// ── Menu container ────────────────────────────────────────────────────────

type MenuProps = {
  children:   ReactNode
  className?: string
}

function Menu({ children, className }: MenuProps) {
  return (
    <div
      data-slot="menu"
      className={cn(
        "w-[260px] max-h-[288px] overflow-y-auto rounded-[8px] py-[4px]",
        "bg-[var(--menu-bg)] shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-[16px]",
        className
      )}
    >
      {children}
    </div>
  )
}

// ── MenuItem ──────────────────────────────────────────────────────────────

type MenuItemProps = {
  label:            string
  subtext?:         string
  /** Checkbox-NEW slot — placed before leadingIcon. 32×32 (M) · 24×24 (S) in DS */
  checkbox?:        ReactNode
  leadingIcon?:     ReactNode
  trailingElement?: ReactNode
  state?:           MenuItemState
  size?:            MenuItemSize
  onClick?:         () => void
  className?:       string
}

function MenuItem({
  label,
  subtext,
  checkbox,
  leadingIcon,
  trailingElement,
  state     = "default",
  size      = "default",
  onClick,
  className,
}: MenuItemProps) {
  const isDisabled = state === "disabled"
  const isFocus    = state === "focus"
  const isSmall    = size === "sm"

  return (
    <div
      data-slot="menu-item"
      data-state={state}
      onClick={!isDisabled ? onClick : undefined}
      role="option"
      aria-selected={isFocus}
      aria-disabled={isDisabled}
      className={cn(
        "flex items-center select-none transition-colors duration-150",
        isSmall ? "py-[8px] px-[8px] gap-[8px]" : "py-[8px] px-[16px] gap-[16px]",
        isFocus
          ? "bg-[var(--menu-item-hover)] cursor-default"
          : isDisabled
            ? "cursor-not-allowed"
            : "cursor-pointer hover:bg-[var(--menu-item-hover)]",
        className
      )}
    >
      {checkbox && (
        <span className="shrink-0 flex items-center justify-center">
          {checkbox}
        </span>
      )}

      {leadingIcon && (
        <span
          className={cn(
            "shrink-0 flex items-center justify-center",
            isSmall ? "w-[16px] h-[16px]" : "w-[24px] h-[24px]",
            isDisabled ? "text-[var(--menu-item-disabled)]" : "text-[var(--menu-item-icon)]"
          )}
        >
          {leadingIcon}
        </span>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span
          className={cn(
            "truncate font-medium leading-[20px]",
            isSmall ? "text-[12px]" : "text-[14px]",
            isDisabled
              ? "text-[var(--menu-item-disabled)]"
              : isSmall
                ? "text-[var(--menu-item-subtext)]"
                : "text-[var(--menu-item-text)]"
          )}
        >
          {label}
        </span>
        {subtext && (
          <span
            className={cn(
              "truncate text-[14px] leading-[20px]",
              isDisabled ? "text-[var(--menu-item-disabled)]" : "text-[var(--menu-item-subtext)]"
            )}
          >
            {subtext}
          </span>
        )}
      </div>

      {trailingElement && (
        <span className="shrink-0 flex items-center">
          {trailingElement}
        </span>
      )}
    </div>
  )
}

// ── MenuDivider ───────────────────────────────────────────────────────────

function MenuDivider({ className }: { className?: string }) {
  return (
    <div
      data-slot="menu-divider"
      className={cn("h-px my-[4px] bg-[var(--menu-divider)]", className)}
    />
  )
}

// ── MenuSection ───────────────────────────────────────────────────────────

function MenuSection({ label, className }: { label: string; className?: string }) {
  return (
    <div
      data-slot="menu-section"
      className={cn(
        "px-[16px] py-[4px] text-[11px] font-semibold uppercase tracking-wider",
        "text-[var(--menu-section-text)]",
        className
      )}
    >
      {label}
    </div>
  )
}

export { Menu, MenuItem, MenuDivider, MenuSection }
