/**
 * ProgressBar — AIMS OS DS · node 7091:37109
 * Linear determinate loading bar. Full-width track with semantic fill color.
 * 7 styles · 2 sizes (S 4px / M 8px) · ARIA progressbar.
 *
 * Tokens (DS Figma vars → index.css):
 *   Fill  : --color-surface-{style}-default
 *   Track : --color-surface-{style}-more-subtle  (or -subtle for light-blue/purple)
 *   Radius: --pb-radius  (Radius/Radius-XS = 2px)
 */
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProgressBarStyle =
  | "primary"
  | "success"
  | "alert"
  | "error"
  | "yellow"
  | "light-blue"
  | "purple"

export type ProgressBarSize = "s" | "m"

export interface ProgressBarProps {
  /** Progress value 0–100 */
  value: number
  /** Color style. Default: "primary" */
  style?: ProgressBarStyle
  /** S = 4px track height / M = 8px. Default: "m" */
  size?: ProgressBarSize
  /** Accessible label for screen readers. Default: "Loading" */
  label?: string
  className?: string
}

// ── Token map ─────────────────────────────────────────────────────────────────

const STYLE_TOKENS: Record<ProgressBarStyle, { fill: string; track: string }> = {
  primary:      { fill: "var(--color-surface-primary-default)",    track: "var(--color-surface-primary-subtle)" },
  success:      { fill: "var(--color-surface-success-default)",    track: "var(--color-surface-success-more-subtle)" },
  alert:        { fill: "var(--color-surface-alert-default)",      track: "var(--color-surface-alert-more-subtle)" },
  error:        { fill: "var(--color-surface-error-default)",      track: "var(--color-surface-error-more-subtle)" },
  yellow:       { fill: "var(--color-surface-yellow-default)",     track: "var(--color-surface-yellow-more-subtle)" },
  "light-blue": { fill: "var(--color-surface-light-blue-default)", track: "var(--color-surface-light-blue-subtle)" },
  purple:       { fill: "var(--color-surface-purple-default)",     track: "var(--color-surface-purple-subtle)" },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  style = "primary",
  size = "m",
  label = "Loading",
  className,
}: ProgressBarProps) {
  const clamped    = Math.max(0, Math.min(100, value))
  const tokens     = STYLE_TOKENS[style]
  const trackH     = size === "s" ? 4 : 8

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden", className)}
      style={{
        height: trackH,
        background: tokens.track,
        borderRadius: "var(--pb-radius)",
      }}
    >
      <div
        className="h-full transition-[width] duration-300 ease-in-out"
        style={{
          width: `${clamped}%`,
          background: tokens.fill,
          borderRadius: "var(--pb-radius)",
        }}
      />
    </div>
  )
}
