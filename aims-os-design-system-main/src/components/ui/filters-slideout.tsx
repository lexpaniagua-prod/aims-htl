import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronUp, Search, Calendar, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { Tag, type TagVariant } from "@/components/ui/tag"

/**
 * Filters Slideout — AIMS OS Design System
 * Figma: v6rmYKA2zmyXWOahlxLOeI · Section container 11442:253862
 *
 * Right-side 380px panel triggered by the "All filters" button in the Filters bar.
 * Contains 12 filter section types, each with 4 state variants:
 *   Expanded × No active filter
 *   Expanded × Has active filter (shows "Clear" or count badge)
 *   Collapsed × No active filter
 *   Collapsed × Has active filter (shows "Clear" or {x} badge)
 *
 * Active indicator rules:
 *   Count badge {x}  → count-based sections: Toggle List, Multi Select, Priority, Search Select
 *   "Clear" text     → clear-action sections: Single Select, Numeric Range, Chip Select,
 *                       Assignment, Date & Time, AI Insights
 *   No indicator     → Sort (always has a value)
 *
 * Reuses existing DS tokens — no new --fso-* family needed.
 */

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ActiveBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-[5px] rounded-full text-[11px] font-semibold leading-none"
      style={{
        background: "var(--tag-informative-bg)",
        border: "1px solid var(--tag-informative-bd)",
        color: "var(--tag-informative-fg)",
      }}
    >
      {`{${count}}`}
    </span>
  )
}

function RadioButton({ selected, onChange }: { selected: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onChange}
      className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
      style={{ borderColor: selected ? "var(--primary)" : "var(--field-border)" }}
    >
      {selected && (
        <span className="w-[8px] h-[8px] rounded-full" style={{ background: "var(--primary)" }} />
      )}
    </button>
  )
}

type SectionShellProps = {
  title: string
  expanded: boolean
  onToggle: () => void
  activeCount?: number
  hasClear?: boolean
  onClear?: () => void
  children: React.ReactNode
}

function SectionShell({
  title, expanded, onToggle, activeCount, hasClear, onClear, children
}: SectionShellProps) {
  return (
    <div style={{ borderBottom: "1px solid var(--table-border)" }}>
      <button
        className="flex items-center justify-between w-full px-[16px] py-[14px]"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-[8px]">
          <span className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
            {title}
          </span>
          {activeCount !== undefined && activeCount > 0 ? (
            <ActiveBadge count={activeCount} />
          ) : hasClear ? (
            <button
              className="text-[13px] font-medium"
              style={{ color: "var(--primary)" }}
              onClick={e => { e.stopPropagation(); onClear?.() }}
            >
              Clear
            </button>
          ) : null}
        </span>
        <span style={{ color: "var(--field-supporting)" }}>
          {expanded
            ? <ChevronUp className="w-[16px] h-[16px]" />
            : <ChevronDown className="w-[16px] h-[16px]" />
          }
        </span>
      </button>
      {expanded && (
        <div className="px-[16px] pb-[16px]">
          {children}
        </div>
      )}
    </div>
  )
}

function ExpandableList<T>({
  items,
  initialCount = 3,
  renderItem,
}: {
  items: T[]
  initialCount?: number
  renderItem: (item: T, index: number) => React.ReactNode
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, initialCount)
  const hidden = items.length - initialCount
  return (
    <div className="flex flex-col gap-[2px]">
      {visible.map((item, i) => renderItem(item, i))}
      {hidden > 0 && (
        <button
          className="flex items-center gap-[4px] text-[13px] font-medium mt-[6px] self-start"
          style={{ color: "var(--primary)" }}
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? (
            <><span>Show less</span><ChevronUp className="w-[13px] h-[13px]" /></>
          ) : (
            <><span>Show {hidden} more</span><ChevronDown className="w-[13px] h-[13px]" /></>
          )}
        </button>
      )}
    </div>
  )
}

// ─── 1. Sort ─────────────────────────────────────────────────────────────────
// node 11971:775 — radio group, no active indicator (always has a value)

const SORT_OPTIONS = ["Newest", "Oldest", "Priority", "Last updated"]

function SortSectionContent() {
  const [selected, setSelected] = useState("Newest")
  const [expanded, setExpanded] = useState(true)
  return (
    <SectionShell title="Sort" expanded={expanded} onToggle={() => setExpanded(v => !v)}>
      <div className="flex flex-col gap-[8px]">
        {SORT_OPTIONS.map(opt => (
          <label key={opt} className="flex items-center gap-[10px] cursor-pointer py-[2px]">
            <RadioButton selected={selected === opt} onChange={() => setSelected(opt)} />
            <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{opt}</span>
          </label>
        ))}
      </div>
    </SectionShell>
  )
}

// ─── 2. Toggle List ───────────────────────────────────────────────────────────
// node 13848:405 — toggles, expandable, {x} badge

const DEFAULT_TOGGLE_OPTIONS = ["Option A", "Option B", "Option C", "Option D", "Option E", "Option F"]

function ToggleListSectionContent({ options = DEFAULT_TOGGLE_OPTIONS }: { options?: string[] }) {
  const [values, setValues] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState(true)
  const activeCount = Object.values(values).filter(Boolean).length
  const toggle = (opt: string) => setValues(v => ({ ...v, [opt]: !v[opt] }))
  return (
    <SectionShell
      title="Toggle List"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      activeCount={activeCount}
      onClear={() => setValues({})}
    >
      <ExpandableList
        items={options}
        renderItem={(opt, i) => (
          <div key={i} className="flex items-center justify-between py-[8px]">
            <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{opt}</span>
            <Toggle size="sm" checked={values[opt] || false} onChange={() => toggle(opt)} />
          </div>
        )}
      />
    </SectionShell>
  )
}

// ─── 3. Multi Select ──────────────────────────────────────────────────────────
// node 13848:477 — checkboxes, expandable, {x} badge

const DEFAULT_MULTI_OPTIONS = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"]

function MultiSelectSectionContent({ options = DEFAULT_MULTI_OPTIONS }: { options?: string[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)
  const toggle = (opt: string) => setChecked(s => {
    const n = new Set(s); n.has(opt) ? n.delete(opt) : n.add(opt); return n
  })
  return (
    <SectionShell
      title="Multi Select"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      activeCount={checked.size}
      onClear={() => setChecked(new Set())}
    >
      <ExpandableList
        items={options}
        renderItem={(opt, i) => (
          <div key={i} className="py-[4px]">
            <Checkbox size="sm" label={opt} checked={checked.has(opt)} onChange={() => toggle(opt)} />
          </div>
        )}
      />
    </SectionShell>
  )
}

// ─── 4. Priority ──────────────────────────────────────────────────────────────
// node 13851:366 — colored-dot checkboxes, {x} badge

const PRIORITY_LEVELS = [
  { label: "Critical", color: "var(--priority-critical)" },
  { label: "High",     color: "var(--priority-high)" },
  { label: "Medium",   color: "var(--priority-medium)" },
  { label: "Low",      color: "var(--priority-low)" },
]

function PrioritySectionContent() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)
  const toggle = (label: string) => setChecked(s => {
    const n = new Set(s); n.has(label) ? n.delete(label) : n.add(label); return n
  })
  return (
    <SectionShell
      title="Priority"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      activeCount={checked.size}
      onClear={() => setChecked(new Set())}
    >
      <div className="flex flex-col gap-[4px]">
        {PRIORITY_LEVELS.map(p => (
          <div key={p.label} className="flex items-center gap-[10px] py-[6px]">
            <Checkbox
              size="sm"
              checked={checked.has(p.label)}
              onChange={() => toggle(p.label)}
            />
            <span
              className="w-[8px] h-[8px] rounded-full shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{p.label}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

// ─── 5. Date Presets ──────────────────────────────────────────────────────────
// node 13851:482 — radio date options, {x} badge when non-default selected

const DATE_PRESET_OPTIONS = [
  "Today", "Yesterday", "Last 7 days", "Last 30 days", "This month", "Custom range",
]

function DatePresetsSectionContent() {
  const [selected, setSelected] = useState("")
  const [expanded, setExpanded] = useState(true)
  return (
    <SectionShell
      title="Date Presets"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      activeCount={selected ? 1 : 0}
      onClear={() => setSelected("")}
    >
      <div className="flex flex-col gap-[4px]">
        {DATE_PRESET_OPTIONS.map(preset => (
          <label key={preset} className="flex items-center gap-[10px] cursor-pointer py-[4px]">
            <RadioButton selected={selected === preset} onChange={() => setSelected(preset)} />
            <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{preset}</span>
          </label>
        ))}
      </div>
    </SectionShell>
  )
}

// ─── 6. Numeric Range ─────────────────────────────────────────────────────────
// node 13852:471 — two labeled inputs (min/max), "Clear" when any value entered

function NumericRangeSectionContent() {
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [expanded, setExpanded] = useState(true)
  const hasValue = min !== "" || max !== ""
  return (
    <SectionShell
      title="Numeric Range"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      hasClear={hasValue}
      onClear={() => { setMin(""); setMax("") }}
    >
      <div className="grid grid-cols-2 gap-[8px]">
        {[
          { placeholder: "0",  value: min, onChange: setMin },
          { placeholder: "∞",  value: max, onChange: setMax },
        ].map((field, i) => (
          <div key={i} className="flex flex-col gap-[4px]">
            <div
              className="flex flex-col gap-[2px] rounded-[8px] border px-[12px] py-[8px]"
              style={{ borderColor: "var(--field-border)", background: "var(--field-bg)" }}
            >
              <span className="text-[11px] font-medium" style={{ color: "var(--field-supporting)" }}>
                Label
              </span>
              <input
                type="number"
                placeholder={field.placeholder}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                className="bg-transparent outline-none text-[13px] font-medium w-full"
                style={{ color: "var(--field-text)" }}
              />
            </div>
            <span className="text-[11px]" style={{ color: "var(--field-supporting)" }}>
              Supporting text
            </span>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

// ─── 7. Search Select ────────────────────────────────────────────────────────
// node 13996:2054 — search input + checkboxes, {x} badge

const DEFAULT_SEARCH_OPTIONS = ["Option 1", "Option 2", "Option 3", "Option 4"]

function SearchSelectSectionContent({ options = DEFAULT_SEARCH_OPTIONS }: { options?: string[] }) {
  const [search, setSearch] = useState("")
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)
  const toggle = (opt: string) => setChecked(s => {
    const n = new Set(s); n.has(opt) ? n.delete(opt) : n.add(opt); return n
  })
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
  return (
    <SectionShell
      title="Search Select"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      activeCount={checked.size}
      onClear={() => setChecked(new Set())}
    >
      <div className="flex flex-col gap-[8px]">
        <div
          className="flex items-center gap-[8px] rounded-[8px] border px-[10px] py-[7px]"
          style={{ borderColor: "var(--field-border)", background: "var(--field-bg)" }}
        >
          <Search className="w-[14px] h-[14px] shrink-0" style={{ color: "var(--field-icon)" }} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: "var(--field-text)" }}
          />
        </div>
        <div className="flex flex-col gap-[4px]">
          {filtered.map((opt, i) => (
            <div key={i} className="py-[3px]">
              <Checkbox
                size="sm"
                label={opt}
                checked={checked.has(opt)}
                onChange={() => toggle(opt)}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <span className="text-[13px] py-[4px]" style={{ color: "var(--field-supporting)" }}>
              No results
            </span>
          )}
        </div>
      </div>
    </SectionShell>
  )
}

// ─── 8. Single Select ────────────────────────────────────────────────────────
// node 14056:459 — radio buttons, "Clear" text when non-default selected

const DEFAULT_SINGLE_OPTIONS = ["All", "Option A", "Option B", "Option C"]

function SingleSelectSectionContent({
  title = "Single Select",
  options = DEFAULT_SINGLE_OPTIONS,
}: {
  title?: string
  options?: string[]
}) {
  const [selected, setSelected] = useState(options[0] ?? "All")
  const [expanded, setExpanded] = useState(true)
  const hasActive = selected !== options[0]
  return (
    <SectionShell
      title={title}
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      hasClear={hasActive}
      onClear={() => setSelected(options[0] ?? "All")}
    >
      <div className="flex flex-col gap-[4px]">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-[10px] cursor-pointer py-[4px]">
            <RadioButton selected={selected === opt} onChange={() => setSelected(opt)} />
            <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{opt}</span>
          </label>
        ))}
      </div>
    </SectionShell>
  )
}

// ─── 9. Chip Select ──────────────────────────────────────────────────────────
// node 11971:786 — pill grid, "Clear" text, "+N more" overflow

const DEFAULT_CHIP_OPTIONS = [
  "item-1", "item-2", "item-3", "item-4", "item-5", "item-6", "item-7", "item-8", "item-9",
]

function ChipSelectSectionContent({ options = DEFAULT_CHIP_OPTIONS }: { options?: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const CHIP_VISIBLE = 6
  const visible = showAll ? options : options.slice(0, CHIP_VISIBLE)
  const overflow = options.length - CHIP_VISIBLE
  const toggle = (opt: string) => setSelected(s => {
    const n = new Set(s); n.has(opt) ? n.delete(opt) : n.add(opt); return n
  })
  return (
    <SectionShell
      title="Chip Select"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      hasClear={selected.size > 0}
      onClear={() => setSelected(new Set())}
    >
      <div className="flex flex-wrap gap-[8px]">
        {visible.map((opt, i) => (
          <button
            key={i}
            className="px-[12px] h-[32px] rounded-full border text-[13px] font-medium transition-colors"
            style={{
              borderColor: selected.has(opt) ? "var(--tag-informative-bd)" : "var(--field-border)",
              background:  selected.has(opt) ? "var(--tag-informative-bg)" : "transparent",
              color:       selected.has(opt) ? "var(--tag-informative-fg)" : "var(--foreground)",
            }}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
        {overflow > 0 && !showAll && (
          <button
            className="text-[13px] font-medium self-center"
            style={{ color: "var(--primary)" }}
            onClick={() => setShowAll(true)}
          >
            +{overflow} more
          </button>
        )}
      </div>
    </SectionShell>
  )
}

// ─── 10. Assignment ──────────────────────────────────────────────────────────
// node 14091:418 — avatar circles + "+ Add", "Clear" text, "+N" overflow

const MOCK_ASSIGNEES = [
  { id: "ME", color: "var(--av-col-blue-bg)" },
  { id: "JS", color: "var(--av-col-orange-bg)" },
  { id: "AL", color: "var(--av-col-purple-bg)" },
  { id: "RK", color: "var(--av-col-green-bg)" },
  { id: "TM", color: "var(--av-col-pink-bg)" },
  { id: "CA", color: "var(--av-col-amber-bg)" },
  { id: "BP", color: "var(--av-col-lightblue-bg)" },
  { id: "LV", color: "var(--av-col-teal-bg)" },
]
const AVATAR_VISIBLE = 5

function AssignmentSectionContent() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)
  const toggle = (id: string) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const overflow = Math.max(0, selected.size - AVATAR_VISIBLE)
  return (
    <SectionShell
      title="Assign"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      hasClear={selected.size > 0}
      onClear={() => setSelected(new Set())}
    >
      <div className="flex items-center gap-[8px] flex-wrap">
        {MOCK_ASSIGNEES.map(u => (
          <button
            key={u.id}
            className="flex items-center justify-center w-[36px] h-[36px] rounded-full text-[12px] font-bold text-white transition-all"
            style={{
              background: u.color,
              outline: selected.has(u.id) ? `2px solid var(--primary)` : "2px solid transparent",
              outlineOffset: "2px",
            }}
            onClick={() => toggle(u.id)}
            title={u.id}
          >
            {u.id}
          </button>
        ))}
        {overflow > 0 && (
          <span
            className="flex items-center justify-center w-[36px] h-[36px] rounded-full text-[12px] font-semibold"
            style={{ background: "var(--ctrl-inactive-bg)", color: "var(--foreground)" }}
          >
            +{overflow}
          </span>
        )}
        <button
          className="flex items-center gap-[4px] text-[13px] font-medium"
          style={{ color: "var(--primary)" }}
        >
          <Plus className="w-[14px] h-[14px]" />
          Add
        </button>
      </div>
    </SectionShell>
  )
}

// ─── 11. Date & Time ─────────────────────────────────────────────────────────
// node 14094:432 — two date inputs (From / To), "Clear" text

function DateTimeSectionContent() {
  const [from, setFrom] = useState("")
  const [to,   setTo]   = useState("")
  const [expanded, setExpanded] = useState(true)
  const hasValue = from !== "" || to !== ""
  return (
    <SectionShell
      title="Date & Time"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      hasClear={hasValue}
      onClear={() => { setFrom(""); setTo("") }}
    >
      <div className="grid grid-cols-2 gap-[8px]">
        {[
          { label: "From", value: from, onChange: setFrom },
          { label: "To",   value: to,   onChange: setTo   },
        ].map((field, i) => (
          <div
            key={i}
            className="flex items-center gap-[8px] rounded-[8px] border px-[10px] py-[8px]"
            style={{ borderColor: "var(--field-border)", background: "var(--field-bg)" }}
          >
            <Calendar className="w-[14px] h-[14px] shrink-0" style={{ color: "var(--field-icon)" }} />
            <input
              type="date"
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
              placeholder={field.label}
              style={{ color: field.value ? "var(--field-text)" : "var(--field-placeholder)" }}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

// ─── 12. AI Insights ─────────────────────────────────────────────────────────
// node 14095:506 — chip pills + Alert Level radios, "Clear" text

const AI_STATUS_CHIPS  = ["Needs attention", "On track", "Escalation risk", "Resolved by AI"]
const AI_ALERT_LEVELS  = ["Any", "Has insights", "No insights"]

function AIInsightsSectionContent() {
  const [chips,      setChips]      = useState<Set<string>>(new Set())
  const [alertLevel, setAlertLevel] = useState("Any")
  const [expanded,   setExpanded]   = useState(false)
  const hasActive = chips.size > 0 || alertLevel !== "Any"
  const toggleChip = (chip: string) => setChips(s => {
    const n = new Set(s); n.has(chip) ? n.delete(chip) : n.add(chip); return n
  })
  return (
    <SectionShell
      title="AI Insights"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      hasClear={hasActive}
      onClear={() => { setChips(new Set()); setAlertLevel("Any") }}
    >
      <div className="flex flex-col gap-[12px]">
        {/* Status chips */}
        <div className="flex flex-wrap gap-[8px]">
          {AI_STATUS_CHIPS.map(chip => (
            <button
              key={chip}
              className="px-[12px] h-[32px] rounded-full border text-[13px] font-medium transition-colors"
              style={{
                borderColor: chips.has(chip) ? "var(--tag-informative-bd)" : "var(--field-border)",
                background:  chips.has(chip) ? "var(--tag-informative-bg)" : "transparent",
                color:       chips.has(chip) ? "var(--tag-informative-fg)" : "var(--foreground)",
              }}
              onClick={() => toggleChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Alert level */}
        <div className="flex flex-col gap-[6px]">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--field-supporting)" }}
          >
            Alert Level
          </span>
          <div className="flex items-center gap-[16px]">
            {AI_ALERT_LEVELS.map(level => (
              <label key={level} className="flex items-center gap-[6px] cursor-pointer">
                <RadioButton
                  selected={alertLevel === level}
                  onChange={() => setAlertLevel(level)}
                />
                <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{level}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

// ─── FiltersSlideout ──────────────────────────────────────────────────────────

export type FiltersSlideoutActiveFilter = {
  label: string
  value: string
  onRemove: () => void
  tagVariant?: TagVariant
}

export type FiltersSlideoutProps = {
  isOpen: boolean
  onClose: () => void
  onApply?: () => void
  onClearAll?: () => void
  activeFilters?: FiltersSlideoutActiveFilter[]
  className?: string
}

export function FiltersSlideout({
  isOpen,
  onClose,
  onApply,
  onClearAll,
  activeFilters,
  className,
}: FiltersSlideoutProps) {
  const [mounted,  setMounted]  = useState(false)
  const [show,     setShow]     = useState(false)
  const [closing,  setClosing]  = useState(false)

  useEffect(() => {
    if (isOpen) {
      setClosing(false)
      setMounted(true)
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)))
      return () => cancelAnimationFrame(id)
    } else {
      setClosing(true)
      setShow(false)
      const t = setTimeout(() => { setMounted(false); setClosing(false) }, 280)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{
        background:           show ? "var(--modal-scrim)" : "rgba(0,0,0,0)",
        backdropFilter:       show ? "blur(2px)" : "none",
        WebkitBackdropFilter: show ? "blur(2px)" : "none",
        transition:           "background 200ms ease, backdrop-filter 200ms ease",
        pointerEvents:        show ? "auto" : "none",
      }}
      onClick={onClose}
    >
      <div
        className={cn("flex flex-col h-full w-[380px] shadow-2xl", className)}
        style={{
          background:  "var(--surface)",
          borderLeft:  "1px solid var(--table-border)",
          transform:   show ? "translateX(0)" : "translateX(100%)",
          transition:  closing
            ? "transform 200ms cubic-bezier(0.4, 0, 1, 1)"
            : "transform 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-[16px] h-[56px] shrink-0"
          style={{ borderBottom: "1px solid var(--table-border)" }}
        >
          <span className="text-[16px] font-semibold" style={{ color: "var(--foreground)" }}>
            Filters
          </span>
          <div className="flex items-center gap-[12px]">
            <button
              className="text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--fi-clear-text)" }}
              onClick={onClearAll}
            >
              Clear all
            </button>
            <button
              className="w-[28px] h-[28px] flex items-center justify-center rounded-[6px] transition-colors hover:opacity-70"
              style={{ color: "var(--fi-chip-icon)" }}
              onClick={onClose}
              aria-label="Close filters"
            >
              <X className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Active filters row */}
          {activeFilters && activeFilters.length > 0 && (
            <div className="px-[16px] py-[12px]" style={{ borderBottom: "1px solid var(--table-border)" }}>
              <div className="flex items-center justify-between mb-[8px]">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--field-supporting)" }}>
                  Applied filters
                </span>
                <button
                  className="text-[12px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--fi-clear-text)" }}
                  onClick={onClearAll}
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-[6px]">
                {activeFilters.map((f, i) => (
                  <Tag
                    key={`${f.label}-${f.value}-${i}`}
                    variant={f.tagVariant ?? "informative"}
                    size="sm"
                    trailingIcon={
                      <button
                        className="flex items-center justify-center hover:opacity-70 transition-opacity ml-[1px]"
                        onClick={f.onRemove}
                        aria-label={`Remove ${f.value}`}
                      >
                        <X className="w-[9px] h-[9px]" />
                      </button>
                    }
                  >
                    {f.label}: {f.value.length > 14 ? `${f.value.slice(0, 14)}…` : f.value}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          <SortSectionContent />
          <ToggleListSectionContent />
          <MultiSelectSectionContent />
          <PrioritySectionContent />
          <DatePresetsSectionContent />
          <NumericRangeSectionContent />
          <SearchSelectSectionContent />
          <SingleSelectSectionContent />
          <ChipSelectSectionContent />
          <AssignmentSectionContent />
          <DateTimeSectionContent />
          <AIInsightsSectionContent />
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-end gap-[8px] px-[16px] py-[12px] shrink-0"
          style={{ borderTop: "1px solid var(--table-border)" }}
        >
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onApply?.(); onClose() }}>Apply filters</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Exported section components for docs use ────────────────────────────────
// These are re-exported so FiltersPage can compose individual sections in
// static "4-state" documentation previews.

export {
  SortSectionContent,
  ToggleListSectionContent,
  MultiSelectSectionContent,
  PrioritySectionContent,
  DatePresetsSectionContent,
  NumericRangeSectionContent,
  SearchSelectSectionContent,
  SingleSelectSectionContent,
  ChipSelectSectionContent,
  AssignmentSectionContent,
  DateTimeSectionContent,
  AIInsightsSectionContent,
}
