import type { ReactNode } from "react"

// ── WidgetCanvasSection ───────────────────────────────────────────────────────
//
// Canonical 3-column Widget Canvas grid for Overview tabs.
// Equivalent to ListViewSection for list views — bakes in the DS grid spec
// so PM screens can never accidentally drift from the pattern.
//
// DS spec (PatternWidgetCanvasPage, App.tsx):
//   Grid:         12 columns, simulated as 3 equal CSS columns
//   Gap:          16px (between columns and rows)
//   Align-items:  start — each widget takes its natural DS height class
//                 (Compact ≈ 160px, Standard ≈ 280px, Heavy = Standard + scroll)
//   Max-width:    none on WidgetFather (always pass fillWidth)
//
// Usage:
//   <WidgetCanvasSection>
//     {/* Narrow (1/3) — KPI widgets */}
//     <WidgetFather title="Metric" fillWidth widthClass="narrow" showRefresh showMenu>
//       <KpiContent ... />
//     </WidgetFather>
//
//     {/* Wide (2/3) — tables, charts, feeds */}
//     <WidgetCanvasCell span={2}>
//       <WidgetFather title="Activity" fillWidth widthClass="wide" showRefresh showMenu>
//         ...
//       </WidgetFather>
//     </WidgetCanvasCell>
//
//     {/* Full (3/3) — timelines, large tables */}
//     <WidgetCanvasCell span={3}>
//       <WidgetFather title="Timeline" fillWidth widthClass="full" showRefresh showMenu>
//         ...
//       </WidgetFather>
//     </WidgetCanvasCell>
//   </WidgetCanvasSection>
//
// Rules (enforced by this component):
//   - Always pass fillWidth to every WidgetFather inside this grid
//   - widthClass="narrow" → direct child (no wrapper needed)
//   - widthClass="wide"   → wrap in <WidgetCanvasCell span={2}>
//   - widthClass="full"   → wrap in <WidgetCanvasCell span={3}>
//   - Never nest a WidgetCanvasSection inside another WidgetCanvasSection
// ─────────────────────────────────────────────────────────────────────────────

interface WidgetCanvasSectionProps {
  children: ReactNode
  className?: string
}

export function WidgetCanvasSection({ children, className }: WidgetCanvasSectionProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  )
}

// ── WidgetCanvasCell ──────────────────────────────────────────────────────────
//
// Wrapper for wide (span=2) and full-width (span=3) widgets.
// Narrow widgets (span=1) don't need a wrapper — place WidgetFather directly.
// ─────────────────────────────────────────────────────────────────────────────

interface WidgetCanvasCellProps {
  /** Column span: 1=narrow (default, no wrapper needed), 2=wide, 3=full */
  span: 1 | 2 | 3
  children: ReactNode
}

export function WidgetCanvasCell({ span, children }: WidgetCanvasCellProps) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      {children}
    </div>
  )
}
