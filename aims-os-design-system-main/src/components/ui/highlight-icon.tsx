import { type ReactNode } from "react"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Highlight Icon — AIMS OS Design System
 * Component set: Figma v6rmYKA2zmyXWOahlxLOeI · node 7919:10532
 * Key: d80bc09138faa2445d51ea10ef21ed600bee1011
 *
 * Rounded container with semantic tinted background + icon.
 * Used as leading slot in Menu/Dropdown items and standalone context indicators.
 *
 * Sizes (exact DS measurements):
 *   lg (L) → 40×40px · icon 24×24 · padding 8px · radius 8
 *   md (M) → 32×32px · icon 24×24 · padding 4px · radius 8
 *   sm (S) → 24×24px · icon 16×16 · padding 4px · radius 4
 *
 * Icon Color variants (DS "Icon Color" prop):
 *   dark    → deep saturated semantic tones (VariableIDs resolved from DS)
 *   default → lighter/softer tones for reduced emphasis
 *
 * All colors via CSS custom properties in index.css — light/dark auto-handled.
 */

export type HighlightIconVariant =
  | "informative" | "success" | "alert" | "error" | "neutral"
  | "yellow" | "lime" | "purple" | "light-blue"

export type HighlightIconSize  = "lg" | "md" | "sm"
export type HighlightIconColor = "dark" | "default"

type HighlightIconProps = {
  icon?:       ReactNode           // pass a ReactNode OR use iconName
  iconName?:   string              // Lucide icon name — resolved automatically
  variant?:    HighlightIconVariant
  size?:       HighlightIconSize
  iconColor?:  HighlightIconColor
  className?:  string
}

// ── Token maps ────────────────────────────────────────────────────────────

const BG_VAR: Record<HighlightIconVariant, string> = {
  informative:  "var(--hi-informative-bg)",
  success:      "var(--hi-success-bg)",
  alert:        "var(--hi-alert-bg)",
  error:        "var(--hi-error-bg)",
  neutral:      "var(--hi-neutral-bg)",
  yellow:       "var(--hi-yellow-bg)",
  lime:         "var(--hi-lime-bg)",
  purple:       "var(--hi-purple-bg)",
  "light-blue": "var(--hi-lightblue-bg)",
}

const ICON_DARK_VAR: Record<HighlightIconVariant, string> = {
  informative:  "var(--hi-informative-icon)",
  success:      "var(--hi-success-icon)",
  alert:        "var(--hi-alert-icon)",
  error:        "var(--hi-error-icon)",
  neutral:      "var(--hi-neutral-icon)",
  yellow:       "var(--hi-yellow-icon)",
  lime:         "var(--hi-lime-icon)",
  purple:       "var(--hi-purple-icon)",
  "light-blue": "var(--hi-lightblue-icon)",
}

// Default variant uses a softer bg and mid-tone icon (lighter than Dark)
const ICON_DEFAULT_VAR: Record<HighlightIconVariant, string> = {
  informative:  "var(--hi-informative-icon-soft)",
  success:      "var(--hi-success-icon-soft)",
  alert:        "var(--hi-alert-icon-soft)",
  error:        "var(--hi-error-icon-soft)",
  neutral:      "var(--hi-neutral-icon-soft)",
  yellow:       "var(--hi-yellow-icon-soft)",
  lime:         "var(--hi-lime-icon-soft)",
  purple:       "var(--hi-purple-icon-soft)",
  "light-blue": "var(--hi-lightblue-icon-soft)",
}

// ── Size classes ──────────────────────────────────────────────────────────

const SIZE: Record<HighlightIconSize, { box: string; icon: string; radius: string }> = {
  lg: { box: "w-[40px] h-[40px]", icon: "w-[24px] h-[24px]", radius: "rounded-[8px]" },
  md: { box: "w-[32px] h-[32px]", icon: "w-[24px] h-[24px]", radius: "rounded-[8px]" },
  sm: { box: "w-[24px] h-[24px]", icon: "w-[16px] h-[16px]", radius: "rounded-[4px]" },
}

// ── Icon resolver ─────────────────────────────────────────────────────────

function resolveLucideIcon(name?: string): LucideIcon | null {
  if (!name) return null
  const candidate = (LucideIcons as Record<string, unknown>)[name]
  // Lucide icons are React.forwardRef objects (typeof === "object"), not plain functions
  return candidate != null ? (candidate as LucideIcon) : null
}

// ── Component ─────────────────────────────────────────────────────────────

function HighlightIcon({
  icon,
  iconName,
  variant   = "informative",
  size      = "md",
  iconColor = "dark",
  className,
}: HighlightIconProps) {
  const { box, icon: iconClass, radius } = SIZE[size]
  const bg      = BG_VAR[variant]
  const iconClr = iconColor === "dark" ? ICON_DARK_VAR[variant] : ICON_DEFAULT_VAR[variant]

  const ResolvedIcon = resolveLucideIcon(iconName)
  // Pass iconClass so the icon fills the correct size slot regardless of Lucide defaults
  const renderedIcon = icon ?? (ResolvedIcon ? <ResolvedIcon className={iconClass} /> : null)

  return (
    <span
      data-slot="highlight-icon"
      data-variant={variant}
      data-size={size}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        box,
        radius,
        className
      )}
      style={{ background: bg, color: iconClr }}
    >
      <span className={cn("flex items-center justify-center", iconClass)}>
        {renderedIcon}
      </span>
    </span>
  )
}

export { HighlightIcon }
