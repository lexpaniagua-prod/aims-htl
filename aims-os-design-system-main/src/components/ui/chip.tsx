/**
 * Chip — AIMS OS DS · node 5051:62341
 * Pill-shaped selection chip. 5 variants × 2 sizes × 4 states.
 *
 * Variants : primary | secondary | purple-primary | purple-secondary | light-blue-primary
 * Sizes    : m (h-28px, px-12px, py-4px) | s (h-20px, px-12px, py-0)
 * States   : default → hover → disabled (focus handled via CSS outline)
 */
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"
import { User } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChipVariant =
  | "primary"
  | "secondary"
  | "purple-primary"
  | "purple-secondary"
  | "light-blue-primary"

export type ChipSize = "m" | "s"

export interface ChipProps {
  children: ReactNode
  variant?: ChipVariant
  size?: ChipSize
  /** Shows a person icon to the left of the label */
  personIcon?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

// ── Per-variant token maps ────────────────────────────────────────────────────

type ChipConfig = {
  bg: string
  bgHover: string
  bgDisabled: string
  text: string
  textDisabled: string
  border?: string
  borderDisabled?: string
}

const CONFIGS: Record<ChipVariant, ChipConfig> = {
  primary: {
    bg:           "var(--color-surface-primary-default)",
    bgHover:      "var(--color-surface-primary-darker)",
    bgDisabled:   "var(--color-surface-primary-lighter)",
    text:         "var(--color-button-primary-text-default)",
    textDisabled: "var(--color-button-primary-text-disabled)",
  },
  secondary: {
    bg:           "var(--chip-secondary-bg)",
    bgHover:      "var(--chip-secondary-bg-hover)",
    bgDisabled:   "var(--chip-secondary-bg-disabled)",
    text:         "var(--chip-secondary-text)",
    textDisabled: "var(--chip-secondary-text-disabled)",
    border:       "1px solid var(--color-border-neutral-default)",
    borderDisabled:"1px solid var(--color-border-neutral-lighter)",
  },
  "purple-primary": {
    bg:           "var(--color-surface-purple-default)",
    bgHover:      "var(--color-surface-purple-darker)",
    bgDisabled:   "var(--color-surface-purple-lighter)",
    text:         "var(--color-button-primary-text-default)",
    textDisabled: "var(--color-button-primary-text-disabled)",
  },
  "purple-secondary": {
    bg:           "var(--chip-secondary-bg)",
    bgHover:      "var(--color-surface-purple-more-subtle)",
    bgDisabled:   "var(--chip-secondary-bg-disabled)",
    text:         "var(--color-text-purple)",
    textDisabled: "var(--chip-secondary-text-disabled)",
    border:       "1px solid var(--color-border-purple-default)",
    borderDisabled:"1px solid var(--color-border-purple-lighter)",
  },
  "light-blue-primary": {
    bg:           "var(--color-surface-light-blue-default)",
    bgHover:      "var(--color-surface-light-blue-darker)",
    bgDisabled:   "var(--color-surface-light-blue-lighter)",
    text:         "var(--color-button-primary-text-default)",
    textDisabled: "var(--color-button-primary-text-disabled)",
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Chip({
  children,
  variant = "secondary",
  size = "m",
  disabled = false,
  personIcon = false,
  onClick,
  className,
}: ChipProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = CONFIGS[variant]
  const isM = size === "m"

  const bg     = disabled ? cfg.bgDisabled : hovered ? cfg.bgHover : cfg.bg
  const color  = disabled ? cfg.textDisabled : cfg.text
  const border = disabled ? (cfg.borderDisabled ?? "none") : (cfg.border ?? "none")

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
        "transition-all duration-150",
        isM
          ? "h-[28px] px-[12px] py-[4px] gap-[4px] text-[14px] leading-[20px]"
          : "h-[20px] px-[12px] py-[0px] gap-[4px] text-[12px] leading-[20px]",
        disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-95",
        className,
      )}
      style={{ background: bg, color, border }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={disabled ? undefined : onClick}
    >
      {personIcon && <User size={isM ? 14 : 12} aria-hidden />}
      {children}
    </button>
  )
}
