import { cn } from "@/lib/utils"

/**
 * Toggle (Switch) — AIMS OS Design System
 * Source: Figma v6rmYKA2zmyXWOahlxLOeI · node 6068:18167 (Toggle Component)
 *
 * Sizes (DS exact):
 *   lg (L) → track 52×32px · thumb 16×16 · thumb margin 4-8px
 *   default (M) → track 39×24px · thumb 16×16 · thumb margin 4px
 *   sm (S) → track 26×16px · thumb 8×8   · thumb margin 4px
 *
 * States (DS exact):
 *   Off  · bg rgba(242,242,242) · border 2px rgba(92,92,92) · thumb rgba(42,42,42)
 *   On   · bg rgba(33,115,255) · no border · thumb white
 *   Off disabled · bg rgba(242,242,242) · border rgba(186,186,186) · thumb rgba(186,186,186)
 *   On  disabled · bg rgba(128,175,255) · no border · thumb white
 *
 * All colors via --toggle-* CSS custom properties in index.css.
 * Supports optional label + description rendered to the right of the track.
 */

export type ToggleSize = "lg" | "default" | "sm"

export type ToggleProps = {
  checked?:     boolean
  onChange?:    (checked: boolean) => void
  size?:        ToggleSize
  disabled?:    boolean
  label?:       string
  description?: string
  className?:   string
}

// ── Size spec table (DS exact measurements) ───────────────────────────────

const SIZE_SPEC = {
  lg: {
    track:   "w-[52px] h-[32px]",
    thumb:   "w-[16px] h-[16px]",
    margin:  4,
    travel:  28,  // 52 - 16 - 4 - 4 = 28px
    padding: "px-[8px] py-[4px]",
  },
  default: {
    track:   "w-[39px] h-[24px]",
    thumb:   "w-[16px] h-[16px]",
    margin:  4,
    travel:  15,  // 39 - 16 - 4 - 4 = 15px
    padding: "px-[4px] py-[4px]",
  },
  sm: {
    track:   "w-[26px] h-[16px]",
    thumb:   "w-[8px] h-[8px]",
    margin:  4,
    travel:  10,  // 26 - 8 - 4 - 4 = 10px
    padding: "px-[4px] py-[4px]",
  },
}

// ── Component ─────────────────────────────────────────────────────────────

function Toggle({
  checked  = false,
  onChange,
  size     = "default",
  disabled = false,
  label,
  description,
  className,
}: ToggleProps) {
  const spec = SIZE_SPEC[size]

  const handleClick = () => {
    if (!disabled) onChange?.(!checked)
  }

  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative shrink-0 rounded-full outline-none",
        "transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-[var(--toggle-track-on)] focus-visible:ring-offset-2",
        spec.track,
        // Track colors
        checked
          ? disabled
            ? "bg-[var(--toggle-track-on-disabled)] border-0"
            : "bg-[var(--toggle-track-on)] border-0"
          : disabled
            ? "bg-[var(--toggle-track-off-disabled)] border-2 border-[var(--toggle-border-off-disabled)]"
            : "bg-[var(--toggle-track-off)] border-2 border-[var(--toggle-border-off)] hover:border-[var(--field-border-hover)]",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "cursor-pointer",
      )}
    >
      {/* Thumb */}
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full",
          "transition-all duration-200 ease-in-out",
          spec.thumb,
          // Thumb color
          checked
            ? "bg-[var(--toggle-thumb-on)]"
            : disabled
              ? "bg-[var(--toggle-thumb-disabled)]"
              : "bg-[var(--toggle-thumb-off)]",
        )}
        style={{
          left: `${spec.margin}px`,
          transform: `translate(${checked ? spec.travel : 0}px, -50%)`,
        }}
      />
    </button>
  )

  if (!label && !description) {
    return <span className={cn("inline-flex", className)}>{track}</span>
  }

  return (
    <label
      className={cn(
        "inline-flex items-start gap-[12px]",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {track}
      <span className="flex flex-col pt-[2px]">
        {label && (
          <span className={cn(
            "text-[14px] font-medium leading-[1.4]",
            disabled ? "text-[var(--field-placeholder)]" : "text-[var(--field-text)]"
          )}>
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

export { Toggle }
