import { cn } from "@/lib/utils"

/**
 * Checkbox — AIMS OS Design System
 * Source: Figma v6rmYKA2zmyXWOahlxLOeI · node 4753:19229 (Checkbox-NEW)
 *
 * Sizes (DS exact):
 *   default (M) → outer 32×32px · inner icon 24×24 · padding 4px · ripple area rounded-full
 *   sm      (S) → outer 24×24px · inner icon 16×16 · padding 4px · ripple area rounded-full
 *
 * States (DS exact):
 *   unchecked default  → border rgba(92,92,92) — same as --field-border
 *   unchecked hover    → outer ripple rgba(242,242,242) · darker border rgba(42,42,42)
 *   unchecked focus    → outer ripple rgba(217,217,217) · border rgba(92,92,92)
 *   checked default    → fill rgba(33,115,255) — --field-border-focus
 *   checked hover      → outer ripple rgba(233,241,255) · same blue fill
 *   disabled unchecked → border rgba(186,186,186) — --field-placeholder
 *   disabled checked   → fill rgba(128,175,255) — --checkbox-checked-dim
 *
 * All colors via CSS custom properties — light/dark auto-handled.
 * Accepts an optional `label` and `description` for inline labeling.
 */

export type CheckboxSize = "default" | "sm"

export type CheckboxProps = {
  checked?:     boolean
  onChange?:    (checked: boolean) => void
  size?:        CheckboxSize
  disabled?:    boolean
  label?:       string
  description?: string
  className?:   string
  id?:          string
}

// ── Inline SVGs (matches DS vector icons exactly) ────────────────────────

function UncheckedIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function CheckedIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect width="18" height="18" rx="3" fill="currentColor"/>
      <path
        d="M4.5 9.5l3 3 6-7"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────

function Checkbox({
  checked   = false,
  onChange,
  size      = "default",
  disabled  = false,
  label,
  description,
  className,
  id,
}: CheckboxProps) {
  const isSmall  = size === "sm"
  // outer ripple container: M=32×32, S=24×24
  const outerSz  = isSmall ? "w-[24px] h-[24px]" : "w-[32px] h-[32px]"
  // inner icon: M=24×24, S=16×16
  const iconSz   = isSmall ? 16 : 24

  const handleChange = () => {
    if (!disabled) onChange?.(!checked)
  }

  const control = (
    <span
      className={cn(
        "shrink-0 relative inline-flex items-center justify-center rounded-full",
        "transition-colors duration-150",
        outerSz,
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer",
        // ripple hover bg
        !disabled && checked  && "hover:bg-[var(--checkbox-ripple-checked)]",
        !disabled && !checked && "hover:bg-[var(--checkbox-ripple)]",
      )}
    >
      {/* Hidden native checkbox for a11y + keyboard */}
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />

      {/* Visual icon */}
      <span
        className={cn(
          "pointer-events-none transition-colors duration-150",
          checked
            ? disabled
              ? "text-[var(--checkbox-checked-dim)]"
              : "text-[var(--field-border-focus)]"
            : disabled
              ? "text-[var(--field-placeholder)]"
              : "text-[var(--field-border)]",
          !disabled && !checked && "group-hover:text-[var(--field-border-hover)]",
        )}
      >
        {checked
          ? <CheckedIcon size={iconSz} />
          : <UncheckedIcon size={iconSz} />
        }
      </span>
    </span>
  )

  if (!label && !description) {
    return (
      <span
        role="checkbox"
        aria-checked={checked}
        onClick={handleChange}
        className={cn("inline-flex", className)}
      >
        {control}
      </span>
    )
  }

  return (
    <label
      className={cn(
        "inline-flex items-start gap-[8px]",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        className
      )}
    >
      {control}
      <span className="flex flex-col pt-[4px]">
        {label && (
          <span className="text-[14px] font-medium leading-[1.4] text-[var(--field-text)]">
            {label}
          </span>
        )}
        {description && (
          <span className="text-[12px] font-normal leading-[1.5] text-[var(--field-supporting)] mt-[2px]">
            {description}
          </span>
        )}
      </span>
    </label>
  )
}

export { Checkbox }
