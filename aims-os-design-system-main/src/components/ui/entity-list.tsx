import { useState, useRef } from "react"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tag } from "@/components/ui/tag"
import type { TagVariant } from "@/components/ui/tag"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ELMetaItem = {
  iconName?:  string     // icon shown (optional when tag is set)
  label?:     string     // text label
  tooltip?:   string     // tooltip on hover; falls back to label
  tag?:       string     // if set, renders as a lightBlue Tag chip
}

export type ELAction = {
  label:    string
  variant:  "primary" | "secondary" | "tertiary"
  icon?:    string   // lucide icon name — renders as icon-only button when set
  onClick?: () => void
}

export type EntityListItemData = {
  id:             string
  title:          string
  // left zone
  showCheckbox?:  boolean
  checked?:       boolean
  onCheckChange?: (v: boolean) => void
  iconVariant?:   "yellow" | "success" | "error" | "info" | "neutral" | "purple" | "light-blue"
  iconName?:      string
  avatarName?:    string
  avatarSrc?:     string
  // primary meta always shows icon + text
  primaryMeta?:   ELMetaItem[]
  pinned?:        boolean
  // right zone
  actions?:       ELAction[]
  state?:         { label: string; variant?: "success" | "error" | "alert" | "informative" | "neutral" }
  timestamp?:     string
  showMenu?:      boolean
  onMenuClick?:   () => void
  // body — description auto-shows chevron when text.length > descMaxChars (default 120)
  description?:         string
  descMaxChars?:        number
  defaultDescExpanded?: boolean
  // AI insight
  // detail: string = single-line (collapses when > detailThreshold chars)
  // detail: string[] = bullet list (always collapsible when > 1 item)
  // showLabel: false = icon + detail only, no "AI {action}" label
  // viewMore: shows "View more →" button in expanded state
  aiInsight?: {
    action:           string
    detail:           string | string[]
    showLabel?:       boolean
    viewMore?:        boolean
    onViewMore?:      () => void  // called when "View more" is clicked — pair with ModalDialog
    defaultExpanded?: boolean
    detailThreshold?: number   // chars before collapsible kicks in (default 80)
  }
  // bottom — secondaryMetaMode: explicit override; auto icon-only when items > secondaryMetaAutoIconAt (default 5)
  secondaryMeta?:          ELMetaItem[]
  secondaryMetaMode?:      "icon" | "icon-text"
  secondaryMetaAutoIconAt?: number
  // tags renders up to tagsMaxVisible (default 5); extras collapse into "+n" with tooltip
  tags?:           { label: string }[]
  tagsMaxVisible?: number
  onClick?:        () => void
}

export type EntityListProps = {
  items:      EntityListItemData[]
  className?: string
}

// ── Token maps ────────────────────────────────────────────────────────────────

const HI_BG: Record<NonNullable<EntityListItemData["iconVariant"]>, string> = {
  yellow:       "var(--hi-yellow-bg)",
  success:      "var(--hi-success-bg)",
  error:        "var(--hi-error-bg)",
  info:         "var(--hi-informative-bg)",
  neutral:      "var(--hi-neutral-bg)",
  purple:       "var(--hi-purple-bg)",
  "light-blue": "var(--hi-lightblue-bg)",
}

const HI_ICON: Record<NonNullable<EntityListItemData["iconVariant"]>, string> = {
  yellow:       "var(--hi-yellow-icon)",
  success:      "var(--hi-success-icon)",
  error:        "var(--hi-error-icon)",
  info:         "var(--hi-informative-icon)",
  neutral:      "var(--hi-neutral-icon)",
  purple:       "var(--hi-purple-icon)",
  "light-blue": "var(--hi-lightblue-icon)",
}

const STATE_TAG_VARIANT: Record<string, TagVariant> = {
  success:     "success",
  error:       "error",
  alert:       "alert",
  informative: "informative",
  neutral:     "secondary",
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getLucideIcon(name?: string): LucideIcon | null {
  if (!name) return null
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[name] ?? null
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function ELIconHighlight({
  variant,
  iconName,
}: {
  variant:  NonNullable<EntityListItemData["iconVariant"]>
  iconName: string
}) {
  const Icon = getLucideIcon(iconName)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center w-[24px] h-[24px] rounded-[4px]"
      style={{ background: HI_BG[variant], color: HI_ICON[variant] }}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} />}
    </span>
  )
}

export function ELAvatar({ name, src }: { name: string; src?: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
  if (src) {
    return (
      <img
        src={src} alt={name}
        className="w-[24px] h-[24px] rounded-full object-cover shrink-0"
        style={{ boxShadow: "0 0 0 1.5px var(--el-avatar-ring)" }}
      />
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center w-[24px] h-[24px] rounded-full"
      style={{ background: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "0 0 0 1.5px var(--el-avatar-ring)", fontSize: "9px", fontWeight: 700, lineHeight: 1 }}
    >
      {initials}
    </span>
  )
}

function Bullet() {
  return (
    <span className="shrink-0 leading-none" style={{ fontSize: "14px", color: "var(--el-bullet)" }}>•</span>
  )
}

// Meta item with hover tooltip — position:fixed so it escapes overflow:hidden containers
function MetaItemView({ meta, mode, isFirst }: { meta: ELMetaItem; mode: "icon" | "icon-text"; isFirst: boolean }) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null)

  // Tag variant: renders as a lightBlue Tag chip (no bullet before tags)
  if (meta.tag) {
    return (
      <div className="flex items-center gap-[4px]">
        {!isFirst && <Bullet />}
        <Tag variant="lightBlue" size="sm">{meta.tag}</Tag>
      </div>
    )
  }

  const Icon    = getLucideIcon(meta.iconName)
  const tipText = meta.tooltip ?? meta.label

  const handleMouseEnter = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setTipPos({ left: rect.left + rect.width / 2, top: rect.top })
    }
  }

  return (
    <div className="flex items-center gap-[4px]">
      {!isFirst && <Bullet />}
      <div
        ref={anchorRef}
        className="flex items-center gap-[4px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTipPos(null)}
      >
        {Icon && <Icon size={16} strokeWidth={1.75} style={{ color: "var(--muted-foreground)" }} />}
        {mode === "icon-text" && meta.label && (
          <span className="text-[12px] font-medium leading-none whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
            {meta.label}
          </span>
        )}
        {tipPos && tipText && (
          <div
            className="pointer-events-none"
            style={{
              position: "fixed",
              left: tipPos.left,
              top: tipPos.top - 6,
              transform: "translate(-50%, -100%)",
              zIndex: 99999,
              whiteSpace: "nowrap",
              background: "var(--tooltip-bg)",
              borderRadius: 4,
              padding: "4px 8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            <span className="text-[11px] font-medium" style={{ color: "var(--tooltip-text)" }}>{tipText}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// "+n" overflow pill — shows hidden tag labels on hover
function TagOverflow({ labels }: { labels: string[] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Tag variant="lightBlue" size="sm">+{labels.length}</Tag>
      {hovered && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            bottom: "calc(100% + 6px)",
            right: 0,
            background: "var(--tooltip-bg)",
            borderRadius: 4,
            padding: "6px 10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            minWidth: "max-content",
          }}
        >
          <div className="flex flex-col gap-[3px]">
            {labels.map((label, i) => (
              <span key={i} className="text-[11px] font-medium" style={{ color: "var(--tooltip-text)" }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── EntityListRow ─────────────────────────────────────────────────────────────

const DESC_THRESHOLD = 120

function EntityListRow({ item }: { item: EntityListItemData }) {
  const threshold     = item.descMaxChars ?? DESC_THRESHOLD
  const needsExpander = (item.description?.length ?? 0) > threshold
  const [descExpanded, setDescExpanded] = useState(item.defaultDescExpanded ?? false)
  const [aiExpanded,   setAiExpanded]   = useState(item.aiInsight?.defaultExpanded ?? false)

  const MoreHorizontalIcon = getLucideIcon("MoreHorizontal")
  const ChevronDownIcon    = getLucideIcon("ChevronDown")
  const ChevronUpIcon      = getLucideIcon("ChevronUp")
  const PinIcon            = getLucideIcon("Pin")
  const SparkleIcon        = getLucideIcon("Sparkle")

  // Auto icon-only when secondary meta items exceed threshold (default 5), unless explicitly overridden
  const secMode: "icon" | "icon-text" = item.secondaryMetaMode
    ?? ((item.secondaryMeta?.length ?? 0) > (item.secondaryMetaAutoIconAt ?? 5) ? "icon" : "icon-text")
  const hasBottom = (item.secondaryMeta?.length ?? 0) > 0 || (item.tags?.length ?? 0) > 0

  return (
    <div
      className={cn("w-full flex flex-col gap-[8px] py-[12px] px-[16px]", item.onClick ? "cursor-pointer" : "cursor-default")}
      onClick={item.onClick}
    >

      {/* ── Top row ── */}
      <div className="flex items-center justify-between min-w-0 gap-[12px]">

        {/* Left */}
        <div className="flex items-center gap-[8px] flex-1 min-w-0 flex-wrap">
          {item.showCheckbox && (
            <input
              type="checkbox"
              checked={item.checked ?? false}
              onChange={e => item.onCheckChange?.(e.target.checked)}
              onClick={e => e.stopPropagation()}
              className="w-[16px] h-[16px] shrink-0 rounded-[3px] accent-[var(--primary)] cursor-pointer"
              style={{ border: "1px solid var(--border)" }}
            />
          )}
          {item.iconVariant && item.iconName && (
            <ELIconHighlight variant={item.iconVariant} iconName={item.iconName} />
          )}
          {item.avatarName && <ELAvatar name={item.avatarName} src={item.avatarSrc} />}
          <span className="text-[16px] font-semibold leading-none whitespace-nowrap" style={{ color: "var(--foreground)" }}>
            {item.title}
          </span>
          {/* Primary meta always shows icon + text */}
          {item.primaryMeta?.map((meta, i) => (
            <MetaItemView key={i} meta={meta} mode="icon-text" isFirst={i === 0} />
          ))}
          {item.pinned && PinIcon && (
            <Tag variant="error" size="sm" leadingIcon={<PinIcon size={12} />}>Pinned</Tag>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-[8px] shrink-0">
          {item.actions?.map((action, i) => {
            const ActionIcon = action.icon ? getLucideIcon(action.icon) : null
            const isTertiaryIcon = action.variant === "tertiary" && ActionIcon
            return (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); action.onClick?.() }}
                className="h-[27px] rounded-[8px] text-[12px] font-medium leading-none transition-opacity hover:opacity-80 flex items-center justify-center"
                style={
                  action.variant === "primary"
                    ? { background: "var(--primary)", color: "var(--primary-foreground)", border: "none", padding: "0 12px" }
                    : action.variant === "secondary"
                    ? { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)", padding: "0 12px" }
                    : isTertiaryIcon
                    ? { background: "transparent", border: "none", color: "var(--muted-foreground)", padding: "0 6px", width: 27 }
                    : { background: "transparent", border: "none", color: "var(--muted-foreground)", padding: "0 12px" }
                }
              >
                {ActionIcon ? <ActionIcon size={15} strokeWidth={1.75} /> : action.label}
              </button>
            )
          })}
          {item.actions && item.actions.length > 0 && (
            <div className="w-px h-[18px] shrink-0" style={{ background: "var(--border)" }} />
          )}
          {item.state && (
            <Tag variant={STATE_TAG_VARIANT[item.state.variant ?? "neutral"]} size="sm">
              {item.state.label}
            </Tag>
          )}
          {item.timestamp && (
            <span className="text-[12px] font-medium leading-none whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
              {item.timestamp}
            </span>
          )}
          {item.showMenu && MoreHorizontalIcon && (
            <button
              onClick={e => { e.stopPropagation(); item.onMenuClick?.() }}
              className="w-[28px] h-[28px] flex items-center justify-center rounded-[4px] transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--muted)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
            >
              <MoreHorizontalIcon size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      {item.description && (
        <div
          className="flex items-start gap-[8px] px-[8px] py-[4px] rounded-[6px]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex-1 min-w-0 overflow-hidden" style={{ maxHeight: needsExpander && !descExpanded ? "20px" : "none" }}>
            <p
              className="text-[14px] font-medium leading-[20px]"
              style={{
                color:        "var(--muted-foreground)",
                overflow:     needsExpander && !descExpanded ? "hidden" : "visible",
                textOverflow: needsExpander && !descExpanded ? "ellipsis" : "clip",
                whiteSpace:   needsExpander && !descExpanded ? "nowrap" : "normal",
              }}
            >
              {item.description}
            </p>
          </div>
          {needsExpander && (
            <button
              onClick={e => { e.stopPropagation(); setDescExpanded(v => !v) }}
              className="shrink-0 w-[20px] h-[20px] flex items-center justify-center rounded-[4px] transition-colors mt-[2px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {descExpanded
                ? (ChevronUpIcon   && <ChevronUpIcon   size={16} strokeWidth={1.75} />)
                : (ChevronDownIcon && <ChevronDownIcon size={16} strokeWidth={1.75} />)
              }
            </button>
          )}
        </div>
      )}

      {/* ── AI insight — 3 states: short / collapsed / expanded ── */}
      {item.aiInsight && SparkleIcon && (() => {
        const ai         = item.aiInsight!
        const isArr      = Array.isArray(ai.detail)
        const lines      = isArr ? (ai.detail as string[]) : [ai.detail as string]
        const aiThresh   = ai.detailThreshold ?? 80
        const isLong     = isArr ? lines.length > 1 : lines[0].length > aiThresh

        return (
          <div
            className={cn(
              "flex flex-col gap-[6px] px-[8px] py-[8px] rounded-[8px]",
              !isLong && "self-start"  // adapt to text width when short; full-width when long
            )}
            style={{ background: "var(--tag-purple-bg)", border: "1px solid var(--tag-purple-bd)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header row: sparkle · label · inline-text (short/collapsed) · [view more] · chevron */}
            <div className="flex items-center gap-[6px] min-h-[20px]">
              <SparkleIcon size={16} strokeWidth={1.75} style={{ color: "var(--tag-purple-fg)", flexShrink: 0 }} />
              {ai.showLabel !== false && (
                <>
                  <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                    AI {ai.action}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--tag-purple-fg)" }}>·</span>
                </>
              )}
              {/* Inline detail: always shown when short; truncated when long+collapsed */}
              {(!isLong || !aiExpanded) && (
                <span
                  className={cn("text-[12px] font-medium", isLong ? "flex-1 min-w-0" : "shrink-0")}
                  style={{
                    color:        "var(--muted-foreground)",
                    overflow:     isLong && !aiExpanded ? "hidden"    : undefined,
                    textOverflow: isLong && !aiExpanded ? "ellipsis"  : undefined,
                    whiteSpace:   isLong && !aiExpanded ? "nowrap"    : "nowrap",
                  }}
                >
                  {lines[0]}
                </span>
              )}
              {isLong && aiExpanded && <div className="flex-1" />}
              {/* Right controls: View more (expanded only) + chevron */}
              {isLong && (
                <div className="flex items-center gap-[6px] shrink-0">
                  {aiExpanded && ai.viewMore && (
                    <button
                      className="text-[12px] font-medium px-[10px] h-[24px] rounded-[4px] transition-opacity hover:opacity-70"
                      style={{ color: "var(--foreground)" }}
                      onClick={e => { e.stopPropagation(); ai.onViewMore?.() }}
                    >
                      View more
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setAiExpanded(v => !v) }}
                    className="shrink-0 w-[20px] h-[20px] flex items-center justify-center rounded-[4px] transition-opacity hover:opacity-70"
                    style={{ color: "var(--tag-purple-fg)" }}
                  >
                    {aiExpanded
                      ? (ChevronUpIcon   && <ChevronUpIcon   size={15} strokeWidth={1.75} />)
                      : (ChevronDownIcon && <ChevronDownIcon size={15} strokeWidth={1.75} />)
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Expanded content: all lines / bullets */}
            {isLong && aiExpanded && (
              <div className="flex flex-col gap-[3px] pl-[22px]">
                {lines.map((line, i) => (
                  <div key={i} className="flex items-start gap-[6px]">
                    {isArr && (
                      <span className="text-[12px] leading-[18px] shrink-0" style={{ color: "var(--tag-purple-fg)" }}>•</span>
                    )}
                    <span className="text-[12px] font-medium leading-[18px]" style={{ color: "var(--muted-foreground)" }}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Bottom row — secondary meta left, tags always right ── */}
      {hasBottom && (
        <div className="flex items-center gap-[8px] min-w-0">
          <div className="flex-1 flex flex-wrap items-center gap-[4px] min-w-0">
            {item.secondaryMeta?.map((meta, i) => (
              <MetaItemView key={i} meta={meta} mode={secMode} isFirst={i === 0} />
            ))}
          </div>
          {item.tags && item.tags.length > 0 && (() => {
            const max     = item.tagsMaxVisible ?? 5
            const visible = item.tags.slice(0, max)
            const hidden  = item.tags.slice(max)
            return (
              <div className="flex items-center gap-[6px] shrink-0">
                {visible.map((tag, i) => (
                  <Tag key={i} variant="lightBlue" size="sm">{tag.label}</Tag>
                ))}
                {hidden.length > 0 && <TagOverflow labels={hidden.map(t => t.label)} />}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ── EntityList ────────────────────────────────────────────────────────────────

export function EntityList({ items, className }: EntityListProps) {
  return (
    <div className={cn("w-full flex flex-col", className)}>
      {items.map((item, i) => (
        <div key={item.id}>
          {i > 0 && <div style={{ height: 1, background: "var(--border)" }} />}
          <EntityListRow item={item} />
        </div>
      ))}
    </div>
  )
}

export default EntityList
