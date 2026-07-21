import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Informational Card — AIMS OS Design System
 * Figma: v6rmYKA2zmyXWOahlxLOeI · node 8057:1259
 *
 * Horizontal surface that combines icon + title + optional description + optional CTA.
 * Uses --ic-* token family (separate from --hi-* used by HighlightIcon).
 *
 * States:  informative · alert · error · success · neutral
 * Sizes:   sm (p-[8px]) · md (p-[16px]) · lg (p-[24px])
 *
 * Token map (Figma resolved values):
 *   informative → Surface/Primary/Subtle  · Icon/Primary/Default  · Text/Info
 *   alert       → Surface/Warning/Subtle  · Icon/Alert/Default    · Text/Alert
 *   error       → Surface/Error/Subtle    · Icon/Error/Default    · Text/Error
 *   success     → Surface/Success/Subtle  · Icon/Success/Default  · Text/Success
 *   neutral     → Surface/Neutral/Default · Icon/Neutral/Dark     · Text/Primary
 */

export type InformativeCardState = "informative" | "alert" | "error" | "success" | "neutral"
export type InformativeCardSize  = "sm" | "md" | "lg"

export type InformativeCardProps = {
  state?:         InformativeCardState   // default: "informative"
  size?:          InformativeCardSize    // default: "md"
  title:          string
  description?:   string
  cta?:           { label: string; onClick?: () => void }
  ctaSecondary?:  { label: string; onClick?: () => void }
  icon?:          ReactNode              // overrides default state icon
  className?:     string
}

// Default icons per state (matches DS component icon choices)
const DEFAULT_ICON: Record<InformativeCardState, ReactNode> = {
  alert:       <AlertTriangle  className="w-[24px] h-[24px]" />,
  error:       <AlertCircle    className="w-[24px] h-[24px]" />,
  success:     <CheckCircle2   className="w-[24px] h-[24px]" />,
  informative: <Info           className="w-[24px] h-[24px]" />,
  neutral:     <Info           className="w-[24px] h-[24px]" />,
}

const SIZE_CLASS: Record<InformativeCardSize, string> = {
  sm: "p-[8px]",
  md: "p-[16px]",
  lg: "p-[24px]",
}

function InformativeCard({
  state        = "informative",
  size         = "md",
  title,
  description,
  cta,
  ctaSecondary,
  icon,
  className,
}: InformativeCardProps) {
  return (
    <div
      data-slot="informative-card"
      data-state={state}
      data-size={size}
      className={cn(
        "flex items-center gap-[12px] rounded-[8px]",
        SIZE_CLASS[size],
        className
      )}
      style={{ background: `var(--ic-${state}-bg)` }}
    >
      {/* Icon */}
      <span
        className="shrink-0 flex items-center justify-center w-[24px] h-[24px]"
        style={{ color: `var(--ic-${state}-icon)` }}
      >
        {icon ?? DEFAULT_ICON[state]}
      </span>

      {/* Text block — vertical, gap 8px, fills remaining width */}
      <div className="flex-1 flex flex-col gap-[8px] min-w-0">
        <p
          className="text-[14px] font-semibold leading-[1.2]"
          style={{ color: `var(--ic-${state}-text)` }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-[14px] font-medium leading-[1.4]"
            style={{ color: `var(--ic-${state}-text)` }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Optional CTA pair — secondary left, primary right (matches DS layout) */}
      {(ctaSecondary || cta) && (
        <div className="shrink-0 flex items-center gap-[8px]">
          {ctaSecondary && (
            <Button variant="secondary" size="sm" onClick={ctaSecondary.onClick}>
              {ctaSecondary.label}
            </Button>
          )}
          {cta && (
            <Button variant="primary" size="sm" onClick={cta.onClick}>
              {cta.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { InformativeCard }
