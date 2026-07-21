import { type LucideIcon, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * EmptyState — AIMS OS Design System
 * Source: Figma v6rmYKA2zmyXWOahlxLOeI · node 8419:24544
 *
 * Displayed when a section, list, table or view has no content.
 * Anatomy: [Icon Highlight] [Title] [Description] [CTA buttons]
 *
 * Tokens used (DS variables — no custom aliases):
 *   --card-primary-bg → Surface/Primary/More Subtle (light: #f6f9ff · dark: rgba(43,127,255,0.08))
 *   --primary         → Icon/Primary/Default         (light: #2173ff · dark: #2b7fff)
 *
 * DS measurements (Figma exact):
 *   Container gap (content ↔ actions): Spacing/6x = 24px
 *   Content gap (icon ↔ text):         Spacing/2x = 8px
 *   Text gap (title ↔ description):    Spacing/1x = 4px
 *   Icon container: 40×40px · padding Spacing/2x = 8px · radius Radius-M = 8px
 *   Icon: 24×24px
 *   Container radius: Radius-L = 16px
 *   Default padding: 64px top/bottom · 24px sides
 */

export type EmptyStateProps = {
  icon?:         LucideIcon
  showIcon?:     boolean
  title:         string
  description?:  string
  ctaLabel?:     string
  onCta?:        () => void
  cta2Label?:    string
  onCta2?:       () => void
  className?:    string
}

export function EmptyState({
  icon: Icon = Inbox,
  showIcon = true,
  title,
  description,
  ctaLabel,
  onCta,
  cta2Label,
  onCta2,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-[24px] text-center w-full py-[64px] px-[24px] rounded-[16px]",
        className
      )}
    >
      {/* Content: icon highlight + title + description */}
      <div className="flex flex-col items-center gap-[8px]">
        {showIcon && (
          <div
            className="flex items-center justify-center p-[8px] rounded-[8px] w-[40px] h-[40px] shrink-0 mb-[2px]"
            style={{ background: "var(--card-primary-bg)" }}
          >
            <Icon
              size={24}
              strokeWidth={1.75}
              aria-hidden="true"
              style={{ color: "var(--primary)" }}
            />
          </div>
        )}
        <div className="flex flex-col items-center gap-[4px]">
          <p
            className="text-[16px] font-semibold leading-[1.4]"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </p>
          {description && (
            <p
              className="text-[14px] font-medium leading-[20px] max-w-[440px]"
              style={{ color: "var(--field-supporting)" }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(ctaLabel || cta2Label) && (
        <div className="flex items-center gap-[8px] flex-wrap justify-center">
          {cta2Label && (
            <Button variant="secondary" size="default" onClick={onCta2}>
              {cta2Label}
            </Button>
          )}
          {ctaLabel && (
            <Button variant="primary" size="default" onClick={onCta}>
              {ctaLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
