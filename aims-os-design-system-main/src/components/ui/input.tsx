import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Input (Text Field) — AIMS OS Design System
 * Component set: Figma v6rmYKA2zmyXWOahlxLOeI · node 4833:2316
 *
 * All colors reference CSS custom properties — no hardcoded hex, no dark: prefix.
 * Token sources (index.css):
 *
 *   Neutral state
 *     bg              → --field-bg              (Surface/Neutral/White)
 *     border          → --field-border          (Border/Neutral/Default)
 *     border:hover    → --field-border-hover     (Border/Neutral/Black)
 *     border:focus    → --field-border-focus     (Border/Primary/Default)
 *     input text      → --field-text             (Text/Subtitle)
 *     placeholder     → --field-placeholder      (Text/Disabled)
 *     label           → --field-label            (Text/Subtitle)
 *     supporting      → --field-supporting       (Text/Body)
 *     icon            → --field-icon
 *
 *   Validation state borders
 *     error           → --field-border-error     (Border/Error/Lighter)
 *     success         → --field-border-success   (Border/Success/Default)
 *     alert           → --field-border-alert     (Border/Alert/Default)
 *
 *   Validation state text + icons
 *     error           → --field-text-error       (Text/Error)
 *     success         → --field-text-success     (Text/Success)
 *     alert           → --field-text-alert       (Text/Alert)
 *
 * Dimensions (DS exact):
 *   S → h=32px   M → h=40px   corner radius=8px   paddingX=12px   gap=4px
 *
 * Typography (DS exact):
 *   label       → 12px Inter Semi Bold  line-height 1.5
 *   input text  → 14px Inter Medium     line-height 1.5
 *   supporting  → 12px Inter Medium     line-height 1.5
 */

// ── Wrapper ───────────────────────────────────────────────────────────────

const wrapperCva = cva(
  [
    "flex items-center gap-[4px]",
    "w-full rounded-md border-[0.5px]",
    "bg-[var(--field-bg)]",
    "transition-colors duration-150",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
    "[&_svg]:w-[16px] [&_svg]:h-[16px]",
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
      size: {
        sm:      "h-[32px] px-[12px]",
        default: "h-[40px] px-[12px]",
      },
    },
    defaultVariants: { state: "default", size: "default" },
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

// ── State icon color classes (uses currentColor so SVG stroke inherits) ──

const stateIconClass: Partial<Record<string, string>> = {
  error:   "text-[var(--field-text-error)]",
  success: "text-[var(--field-text-success)]",
  alert:   "text-[var(--field-text-alert)]",
}

// ── State indicator icons — use currentColor, no hardcoded hex ────────────

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const SuccessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2.5L14 13.5H2L8 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const STATE_ICON: Partial<Record<string, ReactNode>> = {
  error:   <ErrorIcon />,
  success: <SuccessIcon />,
  alert:   <AlertIcon />,
}

// ── Props ─────────────────────────────────────────────────────────────────

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** DS State — controls border, supporting text, and state icon colors */
  state?: "default" | "error" | "success" | "alert"
  /** DS Size — S=32px, M=40px (default) */
  size?: "sm" | "default"
  /**
   * Floating label above the field (DS "Label" boolean).
   * Desktop PM screens: omit this prop — use placeholder only.
   * The floating label is valid for mobile/touch only.
   */
  label?: string
  /** Supporting text rendered below — color changes per state */
  supportingText?: string
  /** Leading icon (left slot) */
  leftIcon?: ReactNode
  /**
   * Trailing icon (right slot).
   * Omit to auto-show the DS state indicator for error/success/alert.
   * Pass `null` to suppress the auto icon.
   */
  rightIcon?: ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    state = "default",
    size = "default",
    label,
    supportingText,
    leftIcon,
    rightIcon,
    disabled,
    ...props
  },
  ref
) {
  const resolvedState = disabled ? "disabled" : state
  const autoRightIcon = rightIcon !== undefined ? rightIcon : STATE_ICON[resolvedState]
  // State icons use stateIconClass; user-supplied icons use neutral --field-icon
  const rightIconColor = rightIcon !== undefined
    ? "text-[var(--field-icon)]"
    : (stateIconClass[resolvedState] ?? "text-[var(--field-icon)]")

  return (
    <div
      className={cn(
        "relative flex flex-col gap-[4px] w-full",
        label && "mt-[6px]",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {/* DS: floating label — absolute, overlaps the top border of the field */}
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

      <div className={cn(wrapperCva({ state: resolvedState, size }), className)}>
        {leftIcon && (
          <span className="shrink-0 flex items-center text-[var(--field-icon)]">{leftIcon}</span>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none",
            "text-[14px] font-medium leading-[1.5]",
            "text-[var(--field-text)] placeholder:text-[var(--field-placeholder)]",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        />

        {autoRightIcon && (
          <span className={cn("shrink-0 flex items-center", rightIconColor)}>
            {autoRightIcon}
          </span>
        )}
      </div>

      {supportingText && (
        <span className={supportingCva({ state: resolvedState })}>
          {supportingText}
        </span>
      )}
    </div>
  )
})

Input.displayName = "Input"

export { Input }
