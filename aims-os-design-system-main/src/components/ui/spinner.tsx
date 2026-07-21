import { cn } from "@/lib/utils"

export type SpinnerStyle = "primary" | "success" | "alert" | "error" | "informative" | "bw"
export type SpinnerSize  = "xs" | "s" | "m" | "l" | "xl"

interface SpinnerProps {
  style?: SpinnerStyle
  size?: SpinnerSize
  label?: string
  className?: string
}

const SIZE_PX: Record<SpinnerSize, number> = { xs: 12, s: 16, m: 24, l: 32, xl: 48 }
const SIZE_BW: Record<SpinnerSize, number> = { xs: 1.5, s: 2, m: 2.5, l: 3, xl: 3.5 }

const FILL:  Record<SpinnerStyle, string> = {
  primary:     "var(--spinner-primary-fill)",
  success:     "var(--spinner-success-fill)",
  alert:       "var(--spinner-alert-fill)",
  error:       "var(--spinner-error-fill)",
  informative: "var(--spinner-informative-fill)",
  bw:          "var(--spinner-bw-fill)",
}
const TRACK: Record<SpinnerStyle, string> = {
  primary:     "var(--spinner-primary-track)",
  success:     "var(--spinner-success-track)",
  alert:       "var(--spinner-alert-track)",
  error:       "var(--spinner-error-track)",
  informative: "var(--spinner-informative-track)",
  bw:          "var(--spinner-bw-track)",
}

export function Spinner({ style = "primary", size = "m", label = "Loading…", className }: SpinnerProps) {
  const px = SIZE_PX[size]
  const bw = SIZE_BW[size]
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn("spinner-base", className)}
      style={{
        width:             px,
        height:            px,
        borderWidth:       bw,
        borderTopColor:    FILL[style],
        borderRightColor:  TRACK[style],
        borderBottomColor: TRACK[style],
        borderLeftColor:   TRACK[style],
      }}
    />
  )
}
