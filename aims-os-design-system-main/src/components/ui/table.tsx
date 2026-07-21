import { type ReactNode } from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * Table — AIMS OS Design System
 * Source: Figma v6rmYKA2zmyXWOahlxLOeI · nodes 4687:5051 (Table Title) + 4687:5139 (Table-content)
 *
 * Sizes (DS exact):
 *   default (M) → header 48px (py-12 px-8) · row 60px (py-16 px-8) · text 14px Medium
 *   sm      (S) → header 40px (py-8 px-8)  · row 48px (py-12 px-8) · text 12px Medium
 *
 * States (DS exact):
 *   row default  → bg Surface/Neutral/White
 *   row hover    → bg Surface/Primary/Subtle translucent
 *   row selected → bg Surface/Primary/Subtle (solid)
 *   header bg    → Surface/Neutral/Subtle (slightly tinted)
 *
 * Design tokens — source: 👩‍💻 Developer Reference (node 13859:2959) + Dark Mode Preview (13859:2932):
 *   --table-bg               Surface/Neutral/White  (header + body use same bg token)
 *   --table-header-bg        Surface/Neutral/White  (same as body — hierarchy via text color only)
 *   --table-border           Border/Neutral/Lighter (row separator + outer container border)
 *   --table-header-text      Text/Subtitle          (darker color provides visual hierarchy)
 *   --table-cell-text        Text/Body              (secondary gray)
 *   --table-row-hover-bg     Surface/Neutral/Default (neutral gray — clearly distinct from selected)
 *   --table-row-selected-bg  Surface/Primary/More Subtle (lighter blue than Subtle)
 *
 * All colors via CSS custom properties — light/dark auto-handled.
 * Supports optional row selection with checkboxes.
 */

export type TableColumn<T extends object> = {
  key:     string
  header:  string
  width?:  string
  align?:  "left" | "center" | "right"
  render?: (row: T, index: number) => ReactNode
}

export type TableSize = "default" | "sm"

export type TableProps<T extends object> = {
  columns:            TableColumn<T>[]
  data:               T[]
  size?:              TableSize
  selectable?:        boolean
  selectedRows?:      Set<number>
  onRowSelect?:       (index: number, checked: boolean) => void
  onSelectAll?:       (allChecked: boolean) => void
  className?:         string
  emptyIcon?:         LucideIcon
  emptyTitle?:        string
  emptyDescription?:  string
  emptyCtaLabel?:     string
  onEmptyCta?:        () => void
}

// ── Component ─────────────────────────────────────────────────────────────

function Table<T extends object,>({
  columns,
  data,
  size              = "default",
  selectable        = false,
  selectedRows      = new Set<number>(),
  onRowSelect,
  onSelectAll,
  emptyIcon,
  emptyTitle        = "No data yet",
  emptyDescription  = "Nothing to display here yet.",
  emptyCtaLabel,
  onEmptyCta,
  className,
}: TableProps<T>) {
  const isSm = size === "sm"

  const allSelected  = data.length > 0 && data.every((_, i) => selectedRows.has(i))
  const someSelected = !allSelected && data.some((_, i) => selectedRows.has(i))

  // DS exact heights (Figma COMPONENT_SET 4687:5051 / 4687:5139):
  //   M header 48px = py-14 + leading-20 (14+20+14)
  //   S header 40px = py-10 + leading-20 (10+20+10)
  //   M content 60px = py-20 + leading-20 (20+20+20)
  //   S content 40px = py-10 + leading-20 (10+20+10)
  // All text is Medium (500). Hierarchy header→cell via color (Text/Subtitle vs Text/Body).
  const thClass = cn(
    "text-left font-medium leading-[20px] text-[var(--table-header-text)]",
    "border-b border-[var(--table-border)]",
    isSm ? "py-[10px] px-[8px] text-[12px]" : "py-[14px] px-[8px] text-[14px]",
  )
  const tdClass = cn(
    "font-medium leading-[20px] text-[var(--table-cell-text)]",
    isSm ? "py-[10px] px-[8px] text-[12px]" : "py-[20px] px-[8px] text-[14px]",
  )

  return (
    <div className={cn(
      "w-full overflow-hidden rounded-[8px]",
      "border border-[var(--table-border)]",
      className,
    )}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--table-header-bg)]">
            {selectable && (
              <th className={cn(thClass, "w-[48px]")} aria-label="Select all">
                <div className="flex items-center">
                  <Checkbox
                    size={isSm ? "sm" : "default"}
                    checked={allSelected}
                    onChange={c => onSelectAll?.(c)}
                    className={someSelected ? "opacity-50" : ""}
                  />
                </div>
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  thClass,
                  col.align === "center" && "text-center",
                  col.align === "right"  && "text-right",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={selectable ? columns.length + 1 : columns.length}
                className="p-0"
              >
                <EmptyState
                  icon={emptyIcon}
                  showIcon={!!emptyIcon}
                  title={emptyTitle}
                  description={emptyDescription}
                  ctaLabel={emptyCtaLabel}
                  onCta={onEmptyCta}
                  className="py-[48px] rounded-none"
                />
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const isSelected = selectedRows.has(i)
              return (
                <tr
                  key={i}
                  onClick={selectable ? () => onRowSelect?.(i, !isSelected) : undefined}
                  className={cn(
                    "transition-colors duration-100",
                    selectable && "cursor-pointer",
                    isSelected
                      ? "bg-[var(--table-row-selected-bg)]"
                      : "bg-[var(--table-bg)] hover:bg-[var(--table-row-hover-bg)]",
                    i < data.length - 1 && "border-b border-[var(--table-border)]",
                  )}
                >
                  {selectable && (
                    <td
                      className={cn(tdClass, "w-[48px]")}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          size={isSm ? "sm" : "default"}
                          checked={isSelected}
                          onChange={checked => onRowSelect?.(i, checked)}
                        />
                      </div>
                    </td>
                  )}
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        tdClass,
                        col.align === "center" && "text-center",
                        col.align === "right"  && "text-right",
                      )}
                    >
                      {col.render
                        ? col.render(row, i)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export { Table }

// ── Cell helpers ──────────────────────────────────────────────────────────────
// Pre-built renderers matching DS Table-content variants (COMPONENT_SET 4687:5139).
// Use inside column.render() callbacks.

// ── TableCellLink — DS variant: Link-text=Yes ─────────────────────────────────

export type TableCellLinkProps = { children: ReactNode; onClick?: () => void }

export function TableCellLink({ children, onClick }: TableCellLinkProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "text-[var(--primary)] font-medium",
        onClick && "cursor-pointer hover:underline",
      )}
    >
      {children}
    </span>
  )
}

// ── TableCellAvatar — DS variant: Avatars=Yes ─────────────────────────────────

const AV_COLOR_KEYS = ["blue","green","red","orange","purple","limegreen","lightblue"]
const nameToAvColor = (n: string) => {
  const h = n.split("").reduce((a, c) => ((a * 31) + c.charCodeAt(0)) >>> 0, 0)
  return AV_COLOR_KEYS[h % AV_COLOR_KEYS.length]
}

export type TableCellAvatarProps = { name: string; src?: string; size?: TableSize }

export function TableCellAvatar({ name, src, size = "default" }: TableCellAvatarProps) {
  const px       = size === "sm" ? 20 : 24
  const fs       = size === "sm" ? 8  : 9
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  const colorKey = nameToAvColor(name)
  return (
    <div
      style={{
        width: px, height: px, borderRadius: "50%", flexShrink: 0,
        background: src ? undefined : `var(--av-col-${colorKey}-bg)`,
        color: "var(--primary-foreground)",
        border: "1px solid var(--topbar-avatar-ring)",
        fontSize: fs, fontWeight: 600, lineHeight: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials
      }
    </div>
  )
}

// ── TableCellAvatarGroup — DS variant: Avatars=Yes (stacked) ─────────────────

export type TableCellAvatarGroupProps = { names: string[]; max?: number; size?: TableSize }

export function TableCellAvatarGroup({ names, max = 3, size = "default" }: TableCellAvatarGroupProps) {
  const px      = size === "sm" ? 20 : 24
  const visible = names.slice(0, max)
  const extra   = names.length - visible.length
  return (
    <div className="flex items-center">
      {visible.map((name, i) => (
        <div
          key={i}
          style={{
            marginLeft: i > 0 ? -(px / 4) : 0,
            zIndex: visible.length - i,
            borderRadius: "50%",
            boxShadow: "0 0 0 1.5px var(--background)",
            display: "inline-flex",
            flexShrink: 0,
          }}
        >
          <TableCellAvatar name={name} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            width: px, height: px, borderRadius: "50%",
            marginLeft: -(px / 4),
            background: "var(--tag-neutral-bg)", color: "var(--tag-neutral-fg)",
            fontSize: size === "sm" ? 8 : 9, fontWeight: 700, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 1.5px var(--background)", flexShrink: 0,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

// ── TableCellAvatarLink — DS variant: Avatar and text=Yes + Link-text=Yes ─────

export type TableCellAvatarLinkProps = {
  name:     string
  src?:     string
  size?:    TableSize
  onClick?: () => void
}

export function TableCellAvatarLink({ name, src, size = "default", onClick }: TableCellAvatarLinkProps) {
  return (
    <div className="flex items-center gap-[8px]">
      <TableCellAvatar name={name} src={src} size={size} />
      <TableCellLink onClick={onClick}>{name}</TableCellLink>
    </div>
  )
}

// ── TableCellIconText — DS variant: Icon=Yes (+ optionally Link-text=Yes) ─────

export type TableCellIconTextProps = {
  icon:      ReactNode
  children:  ReactNode
  isLink?:   boolean
  onClick?:  () => void
}

export function TableCellIconText({ icon, children, isLink, onClick }: TableCellIconTextProps) {
  return (
    <div className="flex items-center gap-[8px]">
      <span
        className="flex items-center justify-center shrink-0 text-[var(--table-cell-text)]"
        style={{ width: 16, height: 16 }}
      >
        {icon}
      </span>
      {isLink || onClick
        ? <TableCellLink onClick={onClick}>{children}</TableCellLink>
        : <span className="text-[var(--table-cell-text)] font-medium">{children}</span>
      }
    </div>
  )
}

// ── TableCellMenu — DS variant: Button=Yes (kebab) ────────────────────────────

export type TableCellMenuProps = { onClick?: () => void }

export function TableCellMenu({ onClick }: TableCellMenuProps) {
  return (
    <button
      aria-label="Row actions"
      onClick={e => { e.stopPropagation(); onClick?.() }}
      className={cn(
        "w-[28px] h-[28px] rounded-[6px] mx-auto block",
        "flex items-center justify-center",
        "text-[var(--table-cell-text)] hover:bg-[var(--table-row-hover-bg)]",
        "transition-colors cursor-pointer",
      )}
    >
      ⋮
    </button>
  )
}
