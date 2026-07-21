import { CircleX, CircleCheck, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Alert Banner — AIMS OS Design System
 * Source: Figma v6rmYKA2zmyXWOahlxLOeI · node 119:5867
 *
 * Full-width dismissible notice for Error, Success, and Alert (warning) states.
 * Layout: [Icon] [Title + Description] [optional CTA + Close]
 * Padding: 12px (Spacing/3×) · Gap: 8px (Spacing/2×) · Radius: 8px (Radius-M)
 * CTA ↔ Close gap: 4px (Spacing/7×)
 *
 * Token family: --ab-{state}-{role}
 *   bg   → Surface/…/More Subtle   (very subtle tint)
 *   bd   → semi-opaque border      (~25% state color)
 *   icon → Icon/{State}/Default    (vivid icon color)
 *   text → Text/{State}            (accessible label color)
 */

export type AlertBannerState = "error" | "success" | "alert"

export type AlertBannerProps = {
  state?:       AlertBannerState
  title:        string
  description?: string
  cta?:         string
  onCta?:       () => void
  onClose?:     () => void
  className?:   string
}

const STATE_CONFIG = {
  error: {
    Icon: CircleX,
    bg:   "var(--ab-error-bg)",
    bd:   "var(--ab-error-bd)",
    icon: "var(--ab-error-icon)",
    text: "var(--ab-error-text)",
  },
  success: {
    Icon: CircleCheck,
    bg:   "var(--ab-success-bg)",
    bd:   "var(--ab-success-bd)",
    icon: "var(--ab-success-icon)",
    text: "var(--ab-success-text)",
  },
  alert: {
    Icon: TriangleAlert,
    bg:   "var(--ab-alert-bg)",
    bd:   "var(--ab-alert-bd)",
    icon: "var(--ab-alert-icon)",
    text: "var(--ab-alert-text)",
  },
} as const

export function AlertBanner({
  state = "error",
  title,
  description,
  cta,
  onCta,
  onClose,
  className,
}: AlertBannerProps) {
  const cfg = STATE_CONFIG[state]
  const { Icon } = cfg

  return (
    <div
      role="alert"
      className={cn("flex items-start gap-[8px] rounded-[8px] p-[12px] w-full", className)}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.bd}`,
      }}
    >
      {/* State icon — 20px, padded container matches Figma Icon Container */}
      <div className="flex items-start p-[4px] shrink-0">
        <Icon
          style={{ color: cfg.icon }}
          size={20}
          strokeWidth={1.75}
        />
      </div>

      {/* Body: title + optional description — both use full-opacity state color */}
      <div className="flex-1 flex flex-col gap-[4px] min-w-0 py-[1px]">
        <p
          className="text-[14px] font-semibold leading-[1.43]"
          style={{ color: cfg.text }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-[14px] font-medium leading-[1.43]"
            style={{ color: cfg.text }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Actions: CTA uses Text/Label (neutral), not state color — matches DS */}
      {(cta || onClose) && (
        <div className="flex items-center gap-[4px] shrink-0">
          {cta && (
            <button
              onClick={onCta}
              className="text-[12px] font-medium leading-[20px] px-[12px] py-[4px] rounded-[4px] transition-opacity hover:opacity-70 focus-visible:outline-none"
              style={{ color: "var(--ab-cta-text)" }}
            >
              {cta}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Dismiss"
              className="w-[28px] h-[28px] flex items-center justify-center rounded-[4px] transition-opacity hover:opacity-70 focus-visible:outline-none"
              style={{ color: "var(--ab-cta-text)" }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
