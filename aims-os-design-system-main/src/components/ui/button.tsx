import { type ReactNode } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — AIMS OS Design System
 * Component set: Figma v6rmYKA2zmyXWOahlxLOeI · node 4504:5148
 *
 * All colors reference CSS custom properties defined in index.css.
 * Light / dark mode is handled by the token layer — no `dark:` prefix needed.
 *
 * Token mapping per variant:
 *   Primary  → --btn-primary-*      (Border/Primary/Default per mode)
 *   Secondary→ --btn-secondary-*    (Surface/Neutral/White + Border/Neutral/Default per mode)
 *   Tertiary → --btn-tertiary-*     (text-only, no border)
 *   Warning  → --btn-warning-*      (destructive red per mode)
 *   Positive → --btn-positive-*     (success green)
 *   Main     → radial gradient (hardcoded — CSS vars cannot be interpolated
 *               inside Tailwind arbitrary gradient strings)
 *
 * Sizes (DS exact):
 *   S: h=27px  px=12px  gap=4px   text=12px  radius=8px
 *   M: h=40px  px=16px  gap=8px   text=14px  radius=8px
 *   L: h=52px  px=20px  gap=12px  text=16px  radius=16px
 *
 * Icon=Alone square sizes (DS exact):
 *   S: 24×24px   M: 40×40px   L: 56×56px
 */

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center",
    "font-semibold whitespace-nowrap select-none",
    "transition-all duration-200",
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:[ring-offset-color:var(--canvas)]",
    "disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Primary — Border/Primary/Default (different per mode → token handles it)
        // Text/Negative = #ffffff in both Primary and Dark modes → !important to beat inherited foreground
        primary: [
          "border border-transparent",
          "bg-[var(--btn-primary-bg)] !text-white",
          "hover:bg-[var(--btn-primary-hover-bg)]",
          "active:bg-[var(--btn-primary-active-bg)]",
          "disabled:opacity-40",
        ],

        // Secondary — outlined; Surface/Neutral/White + Border/Neutral/Default per mode
        // Focus: border shifts to Border/Neutral/Lighter (softer, DS confirmed)
        // Disabled: DS-specific bg/border/text instead of generic opacity
        secondary: [
          "border border-[var(--btn-secondary-border)]",
          "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)]",
          "hover:bg-[var(--btn-secondary-hover-bg)] hover:border-[var(--btn-secondary-hover-bd)]",
          "focus-visible:border-[var(--btn-secondary-focus-bd)]",
          "active:bg-[var(--btn-secondary-active-bg)]",
          "disabled:bg-[var(--btn-secondary-disabled-bg)] disabled:border-[var(--btn-secondary-disabled-bd)] disabled:text-[var(--btn-secondary-disabled-fg)]",
        ],

        // Tertiary — text-only; hover/focus use Surface/Neutral/Subtle|Default per DS
        tertiary: [
          "border border-transparent",
          "bg-transparent text-[var(--btn-tertiary-fg)]",
          "hover:bg-[var(--btn-tertiary-hover-bg)]",
          "focus-visible:bg-[var(--btn-tertiary-focus-bg)]",
          "active:bg-[var(--btn-tertiary-active-bg)]",
          "disabled:opacity-40",
        ],

        // Warning — destructive red; Text/Negative = #ffffff in both modes
        warning: [
          "border border-transparent",
          "bg-[var(--btn-warning-bg)] !text-white",
          "hover:bg-[var(--btn-warning-hover-bg)]",
          "active:bg-[var(--btn-warning-active-bg)]",
          "disabled:opacity-40",
        ],

        // Positive — success green; Text/Negative = #ffffff in both modes
        positive: [
          "border border-transparent",
          "bg-[var(--btn-positive-bg)] !text-white",
          "hover:bg-[var(--btn-positive-hover-bg)]",
          "active:bg-[var(--btn-positive-active-bg)]",
          "disabled:opacity-40",
        ],

        // Main Action — radial gradient blue→teal + neon shadow
        // Gradient values are intentionally hardcoded: CSS custom properties
        // cannot be interpolated inside Tailwind arbitrary gradient strings.
        main: [
          "border border-transparent !text-white",
          "[background:radial-gradient(ellipse_100%_160%_at_61%_68%,#2173ff_0%,#09e2ab_100%)]",
          "[box-shadow:4px_8px_12px_8px_#09e2ab29]",
          "hover:[background:radial-gradient(ellipse_100%_160%_at_59%_72%,#002f80_0%,#2173ff_40%,#09e2ab_100%)]",
          "hover:[box-shadow:8px_8px_20px_0px_#00c94f59]",
          "active:opacity-90",
          "disabled:opacity-40",
        ],
      },

      size: {
        sm:      "h-[27px] px-[12px] gap-[4px]  text-type-sm   rounded-md",
        default: "h-[40px] px-[16px] gap-[8px]  text-type-base rounded-md",
        lg:      "h-[52px] px-[20px] gap-[12px] text-type-md   rounded-lg",
      },

      pill: {
        true:  "!rounded-full",
        false: "",
      },
    },

    compoundVariants: [
      { variant: "primary",   class: "focus-visible:ring-[var(--btn-primary-ring)]"  },
      { variant: "secondary", class: "focus-visible:ring-[var(--btn-secondary-ring)]" },
      { variant: "tertiary",  class: "focus-visible:ring-[var(--btn-secondary-ring)]" },
      { variant: "warning",   class: "focus-visible:ring-[var(--btn-warning-ring)]"  },
      { variant: "positive",  class: "focus-visible:ring-[var(--btn-positive-ring)]" },
      // Main Action focus: DS Border/Success/Subtle — mint in light, teal in dark
      { variant: "main",      class: "focus-visible:ring-[var(--btn-main-ring)]" },
    ],

    defaultVariants: {
      variant: "primary",
      size: "default",
      pill: false,
    },
  }
)

// Icon=Alone square sizes (DS exact): S 24×24 · M 40×40 · L 56×56
const iconAloneClasses: Record<string, string> = {
  sm:      "h-[24px] w-[24px] !px-0",
  default: "h-[40px] w-[40px] !px-0",
  lg:      "h-[56px] w-[56px] !px-0",
}

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    pill?: boolean
    icon?: ReactNode
    iconPosition?: "left" | "right" | "alone"
  }

function Button({
  className,
  variant = "primary",
  size = "default",
  pill = false,
  icon,
  iconPosition = "left",
  children,
  ...props
}: ButtonProps) {
  const alone = iconPosition === "alone"
  const sizeKey = (size ?? "default") as string

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, pill }),
        alone && iconAloneClasses[sizeKey],
        className
      )}
      {...props}
    >
      {alone ? (
        icon
      ) : (
        <>
          {iconPosition !== "right" && icon}
          {children}
          {iconPosition === "right" && icon}
        </>
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
