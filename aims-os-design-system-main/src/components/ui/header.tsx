import { ArrowLeft } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HighlightIcon, type HighlightIconVariant } from "@/components/ui/highlight-icon"

export type HeaderSize = "size-l" | "size-m" | "compress"
export type { HighlightIconVariant }

export interface HeaderProps {
  /** Page title — always required, always visible */
  title: string
  /** Subtitle below the title. Hidden in compress. */
  description?: string
  /** Size variant. "size-l" = 24px title + full padding. "size-m" = 18px. "compress" = 18px, description/tag/backButton hidden. */
  size?: HeaderSize
  /** Tag node rendered inline after the title. Hidden in compress. */
  tag?: React.ReactNode
  /** Shows an ArrowLeft back-navigation button. Hidden in compress. */
  backButton?: boolean
  /** Optional Lucide icon shown in a HighlightIcon (size sm). Hidden in compress. */
  icon?: LucideIcon
  /** HighlightIcon color variant for the icon slot. Defaults to "informative". */
  iconVariant?: HighlightIconVariant
  /** Primary CTA slot — use <Button variant="main" size="sm"> */
  primaryAction?: React.ReactNode
  /** Secondary CTA slot — use <Button variant="secondary" size="sm"> */
  secondaryAction?: React.ReactNode
  /**
   * Sticky filters row — shown only in compress mode, directly below the title row.
   * No border between the title row and this row. Renders after the gradient fade.
   * Use to keep Filters always visible when the header is compressed on scroll.
   */
  filters?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const TITLE_PX: Record<HeaderSize, number> = {
  "size-l": 24,
  "size-m": 18,
  "compress": 18,
}

const PADDING: Record<HeaderSize, string> = {
  "size-l": "12px 24px",
  "size-m": "10px 24px",
  "compress": "8px 24px",
}

export function Header({
  title,
  description,
  size = "size-l",
  tag,
  backButton = false,
  icon: Icon,
  iconVariant = "informative",
  primaryAction,
  secondaryAction,
  filters,
  className,
  style,
}: HeaderProps) {
  const isCompress = size === "compress"
  const hasFilters = isCompress && !!filters

  return (
    <div className={cn("flex flex-col w-full", className)} style={style}>
      {/* Title row */}
      <div
        className="flex items-center justify-between gap-[16px]"
        style={{ padding: hasFilters ? "8px 24px 8px" : PADDING[size] }}
      >
        {/* Left zone: back button + icon + title + tag + description */}
        <div className="flex items-start gap-[8px] min-w-0 flex-1">
          {!isCompress && backButton && (
            <button
              type="button"
              aria-label="Back"
              className="shrink-0 flex items-center justify-center rounded-[6px] hover:bg-[var(--field-bg)] transition-colors mt-[3px]"
              style={{
                width: 24, height: 24,
                color: "var(--header-back-icon)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
          )}
          {!isCompress && Icon && (
            <HighlightIcon
              size="sm"
              variant={iconVariant}
              iconColor="dark"
              icon={<Icon size={14} strokeWidth={1.75} />}
              className="shrink-0 mt-[1px]"
            />
          )}
          <div className="flex flex-col gap-[4px] min-w-0">
            <div className="flex items-center gap-[8px]">
              <h1
                className="font-semibold leading-tight m-0"
                style={{ fontSize: TITLE_PX[size], color: "var(--header-title)" }}
              >
                {title}
              </h1>
              {!isCompress && tag}
            </div>
            {!isCompress && description && (
              <p className="text-[14px] leading-[20px] m-0" style={{ color: "var(--header-desc)" }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right zone: secondary + primary CTAs */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-[8px] shrink-0">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>

      {/* Sticky filters row — only in compress when filters prop is provided. No border. */}
      {hasFilters && (
        <div style={{ padding: "0 24px 10px" }}>
          {filters}
        </div>
      )}
    </div>
  )
}
