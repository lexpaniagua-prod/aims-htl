import { Check, ChevronRight, Lock } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HighlightIcon, type HighlightIconVariant, type HighlightIconColor } from "@/components/ui/highlight-icon"

export type StepState = "default" | "active" | "completed" | "locked" | "view-only"

export interface StepItem {
  label: string
  state: StepState
  /** Optional Lucide icon component to show inside the dot. When omitted, the step number is shown. */
  icon?: LucideIcon
}

interface StepperProps {
  steps: StepItem[]
  onStepClick?: (index: number) => void
  className?: string
}

export function Stepper({ steps, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const isActive    = step.state === "active"
        const isCompleted = step.state === "completed"
        const isLocked    = step.state === "locked"
        const canClick    = !isLocked && !!onStepClick

        const hiVariant: HighlightIconVariant = (isActive || isCompleted) ? "informative" : "neutral"
        const hiColor:   HighlightIconColor   = isLocked ? "default" : "dark"

        const StepIcon = step.icon
        const dotIcon: React.ReactNode = isCompleted
          ? <Check size={14} strokeWidth={2.5} />
          : isLocked
            ? <Lock size={14} strokeWidth={2} />
            : StepIcon
              ? <StepIcon size={14} strokeWidth={1.75} />
              : <span className="text-[12px] font-semibold leading-none select-none">{i + 1}</span>

        const labelColor  = isActive ? "var(--stepper-label-active)"  : "var(--stepper-label-default)"
        const labelWeight = isActive ? "600" : "500"
        const labelLine   = isActive ? "normal" : "20px"

        const dotLabel = `Step ${i + 1}: ${step.label}${isCompleted ? " — Completed" : ""}${isLocked ? " — Locked" : ""}`

        const inner = (
          <span className="flex items-center gap-[4px]">
            <HighlightIcon
              size="sm"
              variant={hiVariant}
              iconColor={hiColor}
              icon={dotIcon}
            />
            <span
              className="text-[14px] whitespace-nowrap"
              style={{ color: labelColor, fontWeight: labelWeight, lineHeight: labelLine }}
            >
              {step.label}
            </span>
          </span>
        )

        return (
          <li
            key={i}
            className="flex items-center shrink-0"
            aria-current={isActive ? "step" : undefined}
          >
            {i > 0 && (
              <ChevronRight
                size={16}
                aria-hidden="true"
                className="mx-[16px] shrink-0"
                style={{ color: "var(--stepper-connector)" }}
              />
            )}
            {canClick ? (
              <button
                type="button"
                onClick={() => onStepClick!(i)}
                aria-label={dotLabel}
                className="cursor-pointer hover:opacity-75 transition-opacity"
                style={{ background: "none", border: "none", padding: 0, font: "inherit" }}
              >
                {inner}
              </button>
            ) : (
              <span aria-label={dotLabel} aria-disabled={isLocked ? "true" : undefined}>
                {inner}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
