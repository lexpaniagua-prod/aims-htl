import { cn } from "@/lib/utils"

export type SkeletonShape = "rectangle" | "circle" | "text"

interface SkeletonProps {
  shape?: SkeletonShape
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ shape = "rectangle", width, height, className }: SkeletonProps) {
  const radiusClass =
    shape === "circle"    ? "rounded-full"   :
    shape === "text"      ? "rounded-[4px]"  :
                            "rounded-[12px]"

  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className={cn("skeleton-shimmer", radiusClass, className)}
      style={{
        width:  typeof width  === "number" ? `${width}px`  : (width  ?? "100%"),
        height: typeof height === "number" ? `${height}px` : (height ?? "16px"),
      }}
    />
  )
}
