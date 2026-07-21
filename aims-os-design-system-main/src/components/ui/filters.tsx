import { Search, X, ChevronDown, SlidersHorizontal, ArrowDown, LayoutGrid, LayoutList } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tag } from "@/components/ui/tag"
import { Input } from "@/components/ui/input"

/**
 * Filters Bar — AIMS OS Design System
 * Figma: v6rmYKA2zmyXWOahlxLOeI · node 7996:4655
 *
 * Horizontal 40px bar combining a search input, up to 5 filter chips,
 * an "All filters" control, sort direction, sort label, and grid/list toggle.
 *
 * Sorting (DS node 7996:5555):
 *   ArrowDown button (28×28, radius-4px) · 24px gap · label text · 8px gap · ChevronDown button
 *
 * Search (DS node 7996:5357):
 *   Full Input component (TextField), leftIcon=Search, interactive
 *
 * Token family: --fi-*
 *   inactive chip:  --field-bg / --field-border / --field-text / --field-icon
 *   active chip:    --fi-chip-active-bg / --fi-chip-active-border / --fi-chip-active-text
 *   clear text:     --fi-clear-text / --fi-clear-hover
 *   badge:          --fi-badge-bg / --fi-badge-text
 *   view toggle:    --fi-view-active-bg / --fi-view-active-icon / --fi-view-icon
 *   sort controls:  --fi-sort-icon / --fi-sort-text
 */

export type FilterSlot = {
  placeholder: string
  value?: string
  onRemove?: () => void
  onOpen?: () => void
}

export type FiltersProps = {
  compact?: boolean
  compactCount?: number
  showSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  slots?: FilterSlot[]
  showClearFilters?: boolean
  onClearFilters?: () => void
  showAllFilters?: boolean
  onAllFiltersClick?: () => void
  showSort?: boolean
  sortLabel?: string
  onSortClick?: () => void
  showViewToggle?: boolean
  viewMode?: "grid" | "list"
  onViewModeChange?: (mode: "grid" | "list") => void
  className?: string
}

const CHIP_BASE =
  "inline-flex items-center gap-[6px] h-[40px] px-[8px] rounded-[8px] border-[0.5px] text-[13px] font-medium transition-colors select-none"

function AllFiltersButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="inline-flex items-center gap-[6px] h-[40px] px-[16px] rounded-full border text-[14px] font-medium transition-colors shrink-0"
      style={{
        background:  "var(--field-bg)",
        borderColor: "var(--field-border)",
        color:       "var(--field-text)",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--field-border-hover)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--field-border)" }}
      onClick={onClick}
    >
      All filters
      <SlidersHorizontal className="w-[14px] h-[14px] shrink-0" style={{ color: "var(--field-icon)" }} />
    </button>
  )
}

export function Filters({
  compact           = false,
  compactCount      = 0,
  showSearch        = true,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  slots             = [],
  showClearFilters  = false,
  onClearFilters,
  showAllFilters    = true,
  onAllFiltersClick,
  showSort          = true,
  sortLabel         = "Name",
  onSortClick,
  showViewToggle    = true,
  viewMode          = "grid",
  onViewModeChange,
  className,
}: FiltersProps) {
  const isCompactActive = compact && compactCount > 0
  const isCompactEmpty  = compact && !compactCount

  return (
    <div
      data-slot="filters"
      className={cn("flex items-center gap-[8px] w-full h-[40px]", className)}
    >
      {/* ── Left area (grows) ────────────────────────────────────────────── */}
      <div className="flex items-center gap-[8px] flex-1 min-w-0">

        {/* S Variant Filters Apply: "Filters N" badge chip + Clear Filters */}
        {isCompactActive ? (
          <>
            <button
              className={cn(CHIP_BASE, "shrink-0 gap-[6px]")}
              style={{
                background:  "var(--field-bg)",
                borderColor: "var(--field-border)",
                color:       "var(--field-text)",
              }}
            >
              Filters
              <span
                className="flex items-center justify-center min-w-[18px] h-[18px] px-[4px] rounded-full text-[11px] font-semibold leading-none"
                style={{ background: "var(--fi-badge-bg)", color: "var(--fi-badge-text)" }}
              >
                {compactCount}
              </span>
            </button>

            <button
              className="text-[13px] font-medium transition-colors shrink-0"
              style={{ color: "var(--fi-clear-text)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--fi-clear-hover)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--fi-clear-text)" }}
              onClick={onClearFilters}
            >
              Clear Filters
            </button>
          </>
        ) : (
          <>
            {/* Search — DS TextField with Search leftIcon, interactive */}
            {showSearch && (
              <div className="w-[200px] shrink-0">
                <Input
                  leftIcon={<Search className="w-[14px] h-[14px]" />}
                  rightIcon={
                    searchValue ? (
                      <button
                        className="flex items-center justify-center hover:opacity-70 transition-opacity"
                        onClick={() => onSearchChange?.("")}
                        aria-label="Clear search"
                        tabIndex={-1}
                      >
                        <X className="w-[14px] h-[14px]" />
                      </button>
                    ) : undefined
                  }
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ""}
                  onChange={e => onSearchChange?.(e.target.value)}
                  size="default"
                />
              </div>
            )}

            {/* S Variant compact: just "All filters" alongside Search */}
            {isCompactEmpty && showAllFilters && (
              <AllFiltersButton onClick={onAllFiltersClick} />
            )}

            {/* Normal mode: filter chips */}
            {!compact && slots.map((slot, i) =>
              slot.value ? (
                /* Active chip */
                <div
                  key={i}
                  className={cn(CHIP_BASE, "pr-[6px] shrink-0")}
                  style={{
                    background:  "var(--fi-chip-active-bg)",
                    borderColor: "var(--fi-chip-active-border)",
                    cursor:      "default",
                  }}
                  aria-label={`Filter: ${slot.value}`}
                >
                  <Tag
                    variant="informative"
                    size="sm"
                    trailingIcon={
                      <button
                        className="flex items-center justify-center hover:opacity-70 transition-opacity ml-[1px]"
                        onClick={e => { e.stopPropagation(); slot.onRemove?.() }}
                        aria-label={`Remove ${slot.value} filter`}
                      >
                        <X className="w-[9px] h-[9px]" />
                      </button>
                    }
                  >
                    {slot.value.length > 14 ? `${slot.value.slice(0, 14)}…` : slot.value}
                  </Tag>
                  <button
                    className="flex items-center justify-center w-[16px] h-[16px] shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: "var(--fi-chip-active-icon)" }}
                    onClick={slot.onOpen}
                    aria-label="Expand filter"
                  >
                    <ChevronDown className="w-[12px] h-[12px]" />
                  </button>
                </div>
              ) : (
                /* Inactive dropdown chip — matches Input/Select tokens */
                <button
                  key={i}
                  className={cn(CHIP_BASE, "shrink-0")}
                  style={{
                    background:  "var(--field-bg)",
                    borderColor: "var(--field-border)",
                    color:       "var(--field-text)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--field-border-hover)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--field-border)" }}
                  onClick={slot.onOpen}
                >
                  {slot.placeholder}
                  <ChevronDown className="w-[14px] h-[14px] shrink-0" style={{ color: "var(--field-icon)" }} />
                </button>
              )
            )}

            {/* Clear Filters — normal mode */}
            {!compact && showClearFilters && (
              <button
                className="text-[13px] font-medium transition-colors shrink-0"
                style={{ color: "var(--fi-clear-text)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--fi-clear-hover)" }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--fi-clear-text)" }}
                onClick={onClearFilters}
              >
                Clear Filters
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Right controls ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-[8px] shrink-0">

        {/* "All filters" pill — normal mode only */}
        {!compact && showAllFilters && (
          <AllFiltersButton onClick={onAllFiltersClick} />
        )}

        {/* Sorting — DS node 7996:5555
            ArrowDown button (28×28) · 24px gap · sort label text · ChevronDown button */}
        {showSort && (
          <div className="flex items-center gap-[24px] shrink-0">
            <button
              className="flex items-center justify-center w-[28px] h-[28px] rounded-[4px] transition-colors"
              style={{ color: "var(--fi-sort-icon)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--fi-chip-bg)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
              onClick={onSortClick}
              aria-label="Toggle sort direction"
            >
              <ArrowDown className="w-[16px] h-[16px]" />
            </button>
            <button
              className="inline-flex items-center gap-[8px] text-[14px] font-medium transition-opacity hover:opacity-80 shrink-0"
              style={{ color: "var(--fi-sort-text)" }}
              onClick={onSortClick}
            >
              {sortLabel}
              <ChevronDown className="w-[13px] h-[13px] shrink-0" style={{ color: "var(--fi-sort-icon)" }} />
            </button>
          </div>
        )}

        {/* Grid / List view toggle
            Active:   --fi-view-active-bg fill, no border
            Inactive: --field-bg + --field-border 1px (DS exact) */}
        {showViewToggle && (
          <div className="flex items-center gap-[4px]">
            {(["grid", "list"] as const).map(m => (
              <button
                key={m}
                className="flex items-center justify-center w-[32px] h-[32px] rounded-[6px] border transition-colors"
                style={{
                  background:  viewMode === m ? "var(--fi-view-active-bg)"   : "var(--field-bg)",
                  borderColor: viewMode === m ? "transparent"                : "var(--field-border)",
                  color:       viewMode === m ? "var(--fi-view-active-icon)" : "var(--fi-view-icon)",
                }}
                onClick={() => onViewModeChange?.(m)}
                aria-label={`${m === "grid" ? "Grid" : "List"} view`}
                aria-pressed={viewMode === m}
              >
                {m === "grid"
                  ? <LayoutGrid className="w-[16px] h-[16px]" />
                  : <LayoutList className="w-[16px] h-[16px]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
