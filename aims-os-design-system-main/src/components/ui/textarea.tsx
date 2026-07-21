import {
  type TextareaHTMLAttributes,
  type ReactNode,
  forwardRef,
  useRef,
  useEffect,
  useCallback,
} from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Textarea (Text Description) — AIMS OS Design System
 * Component set: Figma v6rmYKA2zmyXWOahlxLOeI · node 5084:2494
 *
 * All colors reference CSS custom properties — no hardcoded hex, no dark: prefix.
 * Token sources match Input (see input.tsx header) plus char-count state colors.
 *
 * DS Boolean props → React props:
 *   Label              → label          string | undefined
 *   Supporting text    → supportingText string | undefined
 *   Feedback Characters→ showCount      boolean (shows "current/max")
 *   Expand Content     → expand         boolean (auto-grows; default false)
 *   ScrollBar          → scrollable     boolean (default true when expand=false)
 *
 * Dimensions (DS exact):
 *   Default height: 148px (fixed, rows ≈ 6)
 *   Padding: 12px all sides   Corner radius: 8px
 *   Gap (label / field / feedback): 4px
 *
 * Typography (DS exact):
 *   label       → 12px Inter Semi Bold  line-height 1.5
 *   input text  → 14px Inter Medium     line-height 1.5
 *   supporting  → 12px Inter Medium     line-height 1.5
 *   char count  → 12px Inter Medium     tabular-nums
 */

// ── Expand icon — exact SVG paths from DS node 6326:21225 ─────────────────
// viewBox 0 0 12 12, fill = var(--field-supporting) via currentColor
const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M0 12V6.86h1.71v3.43h3.43V12H0ZM10.29 5.14V1.71H6.86V0H12v5.14H10.29Z"/>
  </svg>
)

// ── Wrapper ───────────────────────────────────────────────────────────────

const wrapperCva = cva(
  [
    "relative w-full rounded-md border-[0.5px]",
    "bg-[var(--field-bg)]",
    "transition-colors duration-150",
  ],
  {
    variants: {
      state: {
        default: [
          "border-[var(--field-border)]",
          "hover:border-[var(--field-border-hover)]",
          "focus-within:border focus-within:border-[var(--field-border-focus)]",
        ],
        error:    "border-[var(--field-border-error)]",
        success:  "border-[var(--field-border-success)]",
        alert:    "border-[var(--field-border-alert)]",
        disabled: "border-[var(--field-border)]",
      },
    },
    defaultVariants: { state: "default" },
  }
)

// ── Supporting text ───────────────────────────────────────────────────────

const supportingCva = cva("text-[12px] font-medium leading-[1.5]", {
  variants: {
    state: {
      default:  "text-[var(--field-supporting)]",
      error:    "text-[var(--field-text-error)]",
      success:  "text-[var(--field-text-success)]",
      alert:    "text-[var(--field-text-alert)]",
      disabled: "text-[var(--field-supporting)]",
    },
  },
  defaultVariants: { state: "default" },
})

// Char count also changes color per state (DS Feedback Characters)
const countColorClass: Record<string, string> = {
  default:  "text-[var(--field-supporting)]",
  error:    "text-[var(--field-text-error)]",
  success:  "text-[var(--field-text-success)]",
  alert:    "text-[var(--field-text-alert)]",
  disabled: "text-[var(--field-supporting)]",
}

// ── Props ─────────────────────────────────────────────────────────────────

type TextareaState = "default" | "error" | "success" | "alert"

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  state?:        TextareaState
  /**
   * Floating label above the field.
   * Desktop PM screens: omit this prop — use placeholder only.
   * The floating label is valid for mobile/touch only.
   */
  label?:        string
  supportingText?: string
  /** DS Feedback Characters — shows "current/max" char count at bottom-right */
  showCount?:    boolean
  /**
   * DS Expand Content — auto-grows with content instead of fixed height + scroll.
   * Default: false (148px fixed, scrollable).
   */
  expand?:       boolean
  /**
   * DS ScrollBar — when expand=false, controls whether a scrollbar appears
   * when content overflows the fixed height.
   * Default: true.
   */
  scrollable?:   boolean
  currentCount?: number
  trailingIcon?: ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    state = "default",
    label,
    supportingText,
    showCount,
    expand = false,
    scrollable = true,
    currentCount,
    maxLength,
    trailingIcon,
    disabled,
    rows,
    onChange,
    value,
    ...props
  },
  forwardedRef
) {
  const resolvedState = disabled ? "disabled" : state

  // Always use a local ref for auto-resize; sync to the forwarded ref separately.
  const localRef = useRef<HTMLTextAreaElement>(null)

  // Sync localRef → forwardedRef on every render
  useEffect(() => {
    if (!forwardedRef) return
    if (typeof forwardedRef === "function") {
      forwardedRef(localRef.current)
    } else {
      ;(forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current =
        localRef.current
    }
  })

  // ── Expand Content: auto-resize via scrollHeight ─────────────────────
  const autoResize = useCallback(() => {
    const el = localRef.current
    if (!el || !expand) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [expand])

  // Resize on controlled value changes
  useEffect(() => {
    if (expand) autoResize()
  }, [expand, value, autoResize])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (expand) {
      const el = e.target
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
    onChange?.(e)
  }

  // ── Height / overflow ─────────────────────────────────────────────────
  // expand=true  → rows=1 (starting point), grows via scrollHeight, no overflow
  // expand=false → rows=6 (~148px), overflow controlled by scrollable prop
  const resolvedRows = rows ?? (expand ? 1 : 6)

  const textareaStyle: React.CSSProperties = expand
    ? { overflow: "hidden", minHeight: "148px" }
    : { overflowY: scrollable ? "auto" : "hidden" }

  const charCount =
    currentCount ?? (typeof value === "string" ? value.length : 0)

  return (
    <div
      className={cn(
        "relative flex flex-col gap-[4px] w-full",
        label && "mt-[6px]",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {/* DS: floating label — absolute, overlaps the top border of the field (node 5079:14557) */}
      {label && (
        <span className={cn(
          "absolute top-[-6px] left-[16px] z-[1]",
          "inline-flex items-center px-[4px] rounded-sm",
          "bg-[var(--field-bg)]",
          "text-[12px] font-semibold leading-normal select-none whitespace-nowrap",
          "text-[var(--field-label)]"
        )}>
          {label}
        </span>
      )}

      <div className={cn(wrapperCva({ state: resolvedState }), className)}>
        <textarea
          ref={localRef}
          disabled={disabled}
          rows={resolvedRows}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          style={textareaStyle}
          className={cn(
            "w-full bg-transparent outline-none px-[16px] py-[12px] resize-none",
            "text-[14px] font-medium leading-[1.5]",
            "text-[var(--field-text)] placeholder:text-[var(--field-placeholder)]",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        />

        {/* DS Expand Content icon — bottom-right corner, exact position from DS node 6326:21225 */}
        {expand && (
          <span className="absolute bottom-[9.5px] right-[15px] w-[16px] h-[16px] flex items-center justify-center text-[var(--field-supporting)] pointer-events-none select-none">
            <ExpandIcon />
          </span>
        )}

        {trailingIcon && (
          <div className="flex items-center justify-end px-[16px] pb-[8px]">
            <span className="shrink-0 text-[var(--field-icon)] [&_svg]:w-[16px] [&_svg]:h-[16px]">
              {trailingIcon}
            </span>
          </div>
        )}
      </div>

      {/* DS: Feedback row — supporting text left, char count right, same baseline */}
      {(showCount || supportingText) && (
        <div className="flex items-center justify-between w-full gap-[8px]">
          {supportingText ? (
            <span className={supportingCva({ state: resolvedState })}>
              {supportingText}
            </span>
          ) : <span />}
          {showCount && (
            <span
              className={cn(
                "text-[12px] font-medium tabular-nums select-none shrink-0",
                countColorClass[resolvedState]
              )}
            >
              {charCount}{maxLength ? `/${maxLength}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
