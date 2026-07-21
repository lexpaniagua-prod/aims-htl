/**
 * AppBackground — AIMS OS DS · node 12655:211429
 * Fixed full-screen gradient background layer.
 * Default variant switches light/dark via --app-bg token.
 * Contextual variants are always light — no dark mode switching.
 */
import { cn } from "@/lib/utils"

export type AppBgVariant =
  | "default"
  | "green"
  | "red"
  | "orange"
  | "yellow"
  | "purple"
  | "light-blue"
  | "lime"

const VARIANT_BG: Record<AppBgVariant, string> = {
  "default":    "var(--app-bg)",
  "green":      "var(--app-bg-green)",
  "red":        "var(--app-bg-red)",
  "orange":     "var(--app-bg-orange)",
  "yellow":     "var(--app-bg-yellow)",
  "purple":     "var(--app-bg-purple)",
  "light-blue": "var(--app-bg-light-blue)",
  "lime":       "var(--app-bg-lime)",
}

export interface AppBackgroundProps {
  variant?: AppBgVariant
  className?: string
}

export function AppBackground({ variant = "default", className }: AppBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("fixed inset-0 -z-10 w-full h-full", className)}
      style={{ background: VARIANT_BG[variant] }}
    />
  )
}
