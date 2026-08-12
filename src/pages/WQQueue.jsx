import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ChevronDown, X, GitBranch, AlertTriangle, MoreVertical, Check, MessageSquare, SkipForward,
  LayoutGrid, Inbox, SlidersHorizontal, ArrowDown,
  Workflow, ArrowRightLeft, MessageCircleQuestion, GraduationCap,
  ShieldCheck, ClipboardCheck, ShieldAlert, GitPullRequest, PhoneCall,
  CircleHelp, GitMerge, Reply, CircleCheckBig,
} from 'lucide-react'
import { Drawer, Modal } from '../components/Modal'
import {
  EVENTS, SEVERITY, SEVERITY_ORDER, EVENT_TYPES, STUDIOS, PEOPLE, TEAMS
} from '../data/workQueueData'
import EventSlideout from './EventSlideout'
import EscalationModal from './EscalationModal'
import QuestionModal from './QuestionModal'
import WQEventPage from './WQEventPage'

// Severity filter chips — Action (yellow) intentionally excluded; those events
// still appear in the list, just without a dedicated filter chip.
const SEVERITY_CHIP_ORDER = ['now', 'red', 'green']

const CATEGORY_OPTIONS = [
  { value: 'htl-continuation',   label: 'HTL Continuation',   group: 'eventCategory' },
  { value: 'htl-handoff',        label: 'HTL Handoff',        group: 'eventCategory' },
  { value: 'inbound-question',   label: 'Question',           group: 'eventCategory' },
  { value: 'train-me',           label: 'Train Me',           group: 'eventCategory' },
  { value: 'gov-promotion',      label: 'Gov Promotion',      group: 'eventCategory' },
  { value: 'gov-review',         label: 'Gov Review',         group: 'eventCategory' },
  { value: 'gov-break-glass',    label: 'Gov Break Glass',    group: 'eventCategory' },
  { value: 'customer',           label: 'Customer',           group: 'origin' },
]

// ─── helpers ─────────────────────────────────────────────────────────────────
const TODAY = '2026-07-02'

function dueUrgency(event) {
  if (!event.dueDate) return 'none'
  if (event.dueDate < TODAY)  return 'overdue'
  if (event.dueDate === TODAY) return 'today'
  const diff = (new Date(event.dueDate) - new Date(TODAY)) / 86400000
  if (diff <= 7) return 'week'
  return 'future'
}

function personName(id) {
  return PEOPLE.find(p => p.id === id)?.name || id
}

function delegatedTo(event) {
  const owner = PEOPLE.find(p => p.id === event.ownerId)
  if (!owner?.ooo) return null
  return owner.ooo.delegate
}

function getMyEvents(events, currentUser) {
  return events.filter(e => {
    if (e.ownerId === currentUser.id) return true
    const delegatee = delegatedTo(e)
    return delegatee === currentUser.id
  })
}

function getTeamEvents(events, currentUser) {
  if (currentUser.scope === 'executive') return events
  if (currentUser.scope === 'manager') {
    return events.filter(e => {
      const owner = PEOPLE.find(p => p.id === e.ownerId)
      return owner && currentUser.studios.some(s => owner.studios.includes(s))
    })
  }
  return events.filter(e => e.ownerId === currentUser.id || delegatedTo(e) === currentUser.id)
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function WQToast({ text, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [text, onDismiss])
  return <div className="wq-toast">{text}</div>
}

// ─── Inbox view — grouped, expandable mini-card list (left) + full detail (right) ──
// Reuses the exact same full event page (WQEventPage/DecisionSurface) for the
// right-hand detail — no decision-flow content is re-implemented here.
const INBOX_GROUPS = [
  { key: 'critical', label: 'Critical', color: '#ef4444', match: e => e.severity === 'red' },
  { key: 'overdue',  label: 'Over Due', color: '#e05252', match: e => dueUrgency(e) === 'overdue' },
  { key: 'act-now',  label: 'Act Now',  color: '#f43f5e', match: e => e.severity === 'now' },
  // Catch-all — anything not already bucketed above (green heads-up, yellow
  // "Action" tier, or any other case) still needs a group to show up in, so
  // a filtered event never silently disappears from every list.
  { key: 'heads-up', label: 'Heads-up', color: '#10b981', match: () => true },
]

// Critical vs. Normal — same signal as the card's own coral severity bar and
// its "Critical" status tag (severity === 'red'), and nothing broader. This
// is the single source of truth for "critical" across the Inbox view: the
// border, the tag, and this filter can never disagree on a given card.
function isCriticalEvent(event) {
  return event.severity === 'red'
}

// Mini-card icon reflects the event's own type/category, not its severity
// bucket — lets you recognize what kind of case it is at a glance, the same
// way the group color tells you how urgent it is.
// eventCategory covers the newer governance/HTL/client taxonomy; not every
// event has one (older entries predate it), so `type` — populated on every
// event — is the fallback. Each entry pairs an icon with its own color, so a
// case reads as "what kind" at a glance, distinct from the group's own
// color-coded "how urgent" dot/count.
const CATEGORY_ICON = {
  'htl-continuation':   { icon: Workflow,              color: '#38bdf8', label: 'HTL Continuation' },
  'htl-handoff':        { icon: ArrowRightLeft,         color: '#a855f7', label: 'HTL Handoff' },
  'inbound-question':   { icon: MessageCircleQuestion,  color: '#f59e0b', label: 'Question' },
  'train-me':           { icon: GraduationCap,          color: '#84cc16', label: 'Train Me' },
  'gov-promotion':      { icon: ShieldCheck,            color: '#2b7fff', label: 'Gov Promotion' },
  'gov-review':         { icon: ClipboardCheck,         color: '#34d399', label: 'Gov Review' },
  'gov-break-glass':    { icon: ShieldAlert,            color: '#e05252', label: 'Gov Break Glass' },
  'gov-change-request': { icon: GitPullRequest,         color: '#f472b6', label: 'Gov Change Request' },
  'client-continuation': { icon: MessageSquare,         color: '#14b8a6', label: 'Client Continuation' },
  'client-handoff':      { icon: PhoneCall,             color: '#14b8a6', label: 'Client Handoff' },
}

const TYPE_ICON = {
  approve:     { icon: CircleCheckBig, color: '#2b7fff', label: 'Approve' },
  review:      { icon: ClipboardCheck, color: '#34d399', label: 'Review' },
  respond:     { icon: Reply,          color: '#14b8a6', label: 'Respond' },
  resolve:     { icon: GitMerge,       color: '#f97316', label: 'Resolve' },
  acknowledge: { icon: Check,          color: '#34d399', label: 'Acknowledge' },
  train:       { icon: GraduationCap,  color: '#84cc16', label: 'Train Me' },
  'inbound-question':    { icon: MessageCircleQuestion, color: '#f59e0b', label: 'Question' },
  question:              { icon: CircleHelp,            color: '#f59e0b', label: 'Question' },
  'client-continuation': { icon: MessageSquare,          color: '#14b8a6', label: 'Client Continuation' },
  'client-handoff':      { icon: PhoneCall,              color: '#14b8a6', label: 'Client Handoff' },
}

function categoryVisual(event) {
  return CATEGORY_ICON[event.eventCategory] || TYPE_ICON[event.type] || { icon: AlertTriangle, color: 'var(--text-muted)', label: 'Event' }
}

// Studio is the icon badge's color — a benchmark-driven decision (Linear/Jira):
// the badge should be recognizable at a glance after repeated exposure, the
// same way a colored folder or app icon becomes instantly identifiable.
const STUDIO_ICON_CLASS = {
  gov: 'wq-inbox-item-icon--gov',
  data: 'wq-inbox-item-icon--data',
  agentic: 'wq-inbox-item-icon--agentic',
  client: 'wq-inbox-item-icon--client',
}

// Top-right slot always shows the calendar date (never the free-text status
// word like "Blocking"/"Paused"/"Respond within 2h" — those move down into
// the tags row instead, so every card's date sits in the same place).
function formatDueDate(dateStr) {
  if (!dateStr) return null
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// Each event resolves to exactly one tier — first matching entry in the
// order above wins, and the last entry is a catch-all so nothing is ever
// left unclassified. Used both for the per-card status chip and for sorting
// the flat list below (no grouped/collapsible buckets — a single ordered
// list: Critical, then Over Due, then Act Now, then everything else).
function resolveGroup(event) {
  return INBOX_GROUPS.find(g => g.match(event)) || INBOX_GROUPS[INBOX_GROUPS.length - 1]
}

function sortInboxEvents(events) {
  const tierIndex = new Map(INBOX_GROUPS.map((g, i) => [g.key, i]))
  return [...events].sort((a, b) => tierIndex.get(resolveGroup(a).key) - tierIndex.get(resolveGroup(b).key))
}

// DS Filters "show sort" — Criticality keeps the tier-based order above
// (the existing default); Event Type / Studio sort alphabetically. The
// direction toggle reverses whichever field is active.
const INBOX_SORT_OPTIONS = [
  { value: 'criticality', label: 'Criticality' },
  { value: 'eventType',   label: 'Event Type' },
  { value: 'studio',      label: 'Studio' },
]

function sortInboxEventsBy(events, sortField, direction) {
  let sorted
  if (sortField === 'eventType') {
    sorted = [...events].sort((a, b) => (EVENT_TYPES[a.type]?.label || '').localeCompare(EVENT_TYPES[b.type]?.label || ''))
  } else if (sortField === 'studio') {
    sorted = [...events].sort((a, b) => (STUDIOS[a.studio]?.name || '').localeCompare(STUDIOS[b.studio]?.name || ''))
  } else {
    sorted = sortInboxEvents(events)
  }
  return direction === 'desc' ? sorted.reverse() : sorted
}

// ─── Inbox mini-card — 5-layer anatomy (severity bar / type icon / title /
// impact chips / studio+type badge), benchmarked against Linear, Zendesk,
// Intercom, Jira and PagerDuty's task-list cards. No description text and no
// action buttons on the card itself — those live in the detail pane on the
// right; the card is a triage surface only. Severity bar is two states only
// (critical vs normal) — "overdue" is carried by the due-date chip's color,
// not a third bar color.
function InboxMiniCard({ event, isSelected, onClick }) {
  const urgency = dueUrgency(event)
  const { icon: Icon, label: typeLabel } = categoryVisual(event)
  const studio = STUDIOS[event.studio]
  const group = resolveGroup(event)
  const isCritical = event.severity === 'red'
  const isCustomerFacing = event.origin === 'customer' || event.studio === 'client'
  const blockedCount = event.blastRadius?.workflows || 0
  const dueDate = formatDueDate(event.dueDate)

  // Tooltip is positioned in JS (fixed, portaled to <body>) rather than a
  // pure-CSS sibling-hover box — the card list scrolls with overflow-y:auto,
  // which per the CSS spec forces overflow-x to clip too, so a tooltip
  // anchored purely in-flow gets cut off for cards near the top of the list.
  // Sizing it to the card's own width (not a fixed small box) also uses the
  // full horizontal room of the left column instead of a cramped popup.
  const cardRef = useRef(null)
  const [tooltipRect, setTooltipRect] = useState(null)
  const showTooltip = () => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const below = rect.top < 100
    setTooltipRect({ left: rect.left, width: rect.width, top: rect.top, bottom: rect.bottom, below })
  }
  const hideTooltip = () => setTooltipRect(null)

  return (
    <button
      ref={cardRef}
      className={`wq-inbox-item${isCritical ? ' wq-inbox-item--critical' : ''}${isSelected ? ' wq-inbox-item--active' : ''}`}
      onClick={onClick}
    >
      <div className="wq-inbox-item-top">
        <div className="wq-inbox-item-icon-wrap" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
          <span className={`wq-inbox-item-icon ${isCritical ? 'wq-inbox-item-icon--critical' : (STUDIO_ICON_CLASS[event.studio] || 'wq-inbox-item-icon--other')}`}>
            <Icon size={13} />
          </span>
        </div>
        {tooltipRect && createPortal(
          <div
            className="wq-inbox-tooltip"
            role="tooltip"
            style={{
              left: tooltipRect.left,
              width: tooltipRect.width,
              ...(tooltipRect.below
                ? { top: tooltipRect.bottom + 8 }
                : { bottom: window.innerHeight - tooltipRect.top + 8 }),
            }}
          >
            <div className="wq-inbox-tooltip-title">{event.title}</div>
            <div className="wq-inbox-tooltip-meta">{studio?.name || event.studio} · {typeLabel}</div>
          </div>,
          document.body
        )}
        <span className="wq-inbox-item-title">{event.title}</span>
        {dueDate && (
          <span className="wq-inbox-item-date">{dueDate}</span>
        )}
      </div>
      <div className="wq-inbox-item-tags">
        {(() => {
          // Status tag is red text only when the group is genuinely
          // "Critical" — every other tag is neutral unless it carries its
          // own status meaning (blocked workflows, customer-facing).
          const descriptors = [
            { key: 'status', node: (
              <span
                key="status"
                className={`wq-inbox-chip${group.key !== 'critical' ? ' wq-inbox-chip--neutral' : ''}`}
                style={group.key === 'critical' ? { color: group.color, background: group.color + '1a' } : undefined}
              >
                {group.label}
              </span>
            ), label: group.label },
            event.dueLabel && event.dueLabel !== dueDate ? {
              key: 'due',
              node: <span key="due" className="wq-inbox-chip wq-inbox-chip--neutral">{event.dueLabel}</span>,
              label: event.dueLabel,
            } : null,
            studio ? {
              key: 'studio',
              node: <span key="studio" className="wq-inbox-chip wq-inbox-chip--neutral">{studio.short}</span>,
              label: studio.short,
            } : null,
            EVENT_TYPES[event.type] ? {
              key: 'type',
              node: <span key="type" className="wq-inbox-chip wq-inbox-chip--neutral">{EVENT_TYPES[event.type].label}</span>,
              label: EVENT_TYPES[event.type].label,
            } : null,
            blockedCount > 0 ? {
              key: 'blocked',
              node: (
                <span key="blocked" className="wq-inbox-chip wq-inbox-chip--neutral">
                  <AlertTriangle size={9} /> {blockedCount} workflow{blockedCount !== 1 ? 's' : ''} blocked
                </span>
              ),
              label: `${blockedCount} workflow${blockedCount !== 1 ? 's' : ''} blocked`,
            } : null,
            isCustomerFacing ? {
              key: 'client',
              node: <span key="client" className="wq-inbox-chip wq-inbox-chip--accent">Client</span>,
              label: 'Client',
            } : null,
          ].filter(Boolean)

          const visible = descriptors.slice(0, 2)
          const overflow = descriptors.slice(2)

          return (
            <>
              {visible.map(d => d.node)}
              {overflow.length > 0 && (
                <span className="wq-inbox-chip wq-inbox-chip--neutral wq-inbox-tag-overflow">
                  +{overflow.length}
                  <div className="wq-inbox-tag-overflow-tooltip">
                    {overflow.map(d => <div key={d.key}>{d.label}</div>)}
                  </div>
                </span>
              )}
            </>
          )
        })()}
        <span className="wq-inbox-item-id">{event.id}</span>
      </div>
    </button>
  )
}

// General actions (Skip/Ask/Escalate/Trace, plus Take it/Nudge/Reassign in
// My Team) — same handlers as Card view, but tucked into a single menu
// button pinned to the bottom-right corner of the decision sticky area
// instead of their own always-visible bar. Cuts the pinned-button count
// down to just the decision buttons + this one trigger, for any event type.
function InboxDetailActionBar({ event, teamMode, onSkip, onAsk, onEscalate, onTrace, onTakeIt, onNudge, onReassign }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const cornerRef = useRef(null)
  // The decision area only occupies the center column (.wqep-body) — the
  // Thread/Attestation/Audit column sits to its right. Anchor the trigger
  // to the center column's own right edge (measured live) rather than the
  // whole pane's, or it lands out past the decision box, over the side
  // column instead of inside the corner it's meant to sit in.
  const [rightInset, setRightInset] = useState(16)

  useEffect(() => {
    const cornerEl = cornerRef.current
    if (!cornerEl) return
    const container = cornerEl.closest('.wq-inbox-detail')
    const body = container?.querySelector('.wqep-body')
    if (!container || !body) return
    const measure = () => {
      const containerRect = container.getBoundingClientRect()
      const bodyRect = body.getBoundingClientRect()
      setRightInset(Math.max(16, containerRect.right - bodyRect.right + 16))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    ro.observe(body)
    return () => ro.disconnect()
  }, [event?.id])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!event) return null
  const pick = (fn) => { setOpen(false); fn(event) }

  return (
    <div className="wq-inbox-actions-corner" ref={cornerRef}>
      <div className="wq-inbox-actions-corner-wrap" ref={wrapRef} style={{ right: rightInset }}>
        <button
          className="wq-inbox-actions-corner-btn"
          title="General actions"
          onClick={() => setOpen(o => !o)}
        >
          <MoreVertical size={15} />
        </button>
        {open && (
          <div className="wq-card-menu wq-card-menu--up">
            <button title="Resurfaces in 2h" onClick={() => pick(onSkip)}>Skip</button>
            <button onClick={() => pick(onAsk)}>Ask</button>
            <button onClick={() => pick(onEscalate)}>Escalate</button>
            {event.sourceWorkflow && (
              <button onClick={() => pick(onTrace)}>
                <GitBranch size={12} /> Trace
              </button>
            )}
            {teamMode && (
              <>
                <button onClick={() => pick(onTakeIt)}>Take it</button>
                <button onClick={() => pick(onNudge)}>Nudge</button>
                <button onClick={() => pick(onReassign)}>Reassign</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inbox filters slideout — DS "Filters" panel anatomy (380px right-side
// slideout: sticky header with Clear all + close, scrollable body of
// checkbox sections, sticky footer). Team/Studio/Type/Due/Owner live here
// instead of the horizontal bar, so the search input can take that room —
// reference: aims-os-design-system.vercel.app/?page=filters&tab=overview ──
function FilterSection({ title, options, selected, onChange }) {
  if (!options.length) return null
  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }
  return (
    <div className="wq-inbox-filters-section">
      <div className="wq-inbox-filters-section-title">{title}</div>
      <div className="wq-inbox-filters-section-list">
        {options.map(o => (
          <label key={o.value} className="wq-inbox-filters-option">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            <span className="wq-inbox-filters-option-label">{o.label}</span>
            <span className="wq-inbox-filters-option-count">{o.count}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Toggle List — a switch per row, used where each option is effectively a
// binary on/off and there are few enough rows that a full-width row per
// option reads fine (Studio: only 4 studios).
function ToggleListSection({ title, options, selected, onChange }) {
  if (!options.length) return null
  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }
  return (
    <div className="wq-inbox-filters-section">
      <div className="wq-inbox-filters-section-title">{title}</div>
      <div className="wq-inbox-filters-section-list">
        {options.map(o => (
          <div key={o.value} className="wq-inbox-filters-toggle-row">
            <span className="wq-inbox-filters-option-label">{o.label}</span>
            <span className="wq-inbox-filters-option-count">{o.count}</span>
            <button
              type="button"
              role="switch"
              aria-checked={selected.includes(o.value)}
              className={`wq-toggle-switch${selected.includes(o.value) ? ' wq-toggle-switch--on' : ''}`}
              onClick={() => toggle(o.value)}
            >
              <span className="wq-toggle-switch-thumb" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Chip Select — wrapped pill buttons, more items fit per row than a
// full-width checkbox row (Type: many event types).
function ChipSelectSection({ title, options, selected, onChange }) {
  if (!options.length) return null
  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }
  return (
    <div className="wq-inbox-filters-section">
      <div className="wq-inbox-filters-section-title">{title}</div>
      <div className="wq-inbox-filters-chip-list">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            className={`wq-inbox-filters-chip${selected.includes(o.value) ? ' wq-inbox-filters-chip--active' : ''}`}
            onClick={() => toggle(o.value)}
          >
            {o.label} <span className="wq-inbox-filters-option-count">{o.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Priority — checkbox + colored dot + label, so the urgency reads visually
// at a glance (overdue=red, due today=yellow, this week=blue, no date=gray).
const DUE_PRIORITY_COLOR = {
  overdue: 'var(--accent-coral)',
  today:   'var(--accent-amber)',
  week:    'var(--accent-blue)',
  none:    'var(--text-muted)',
}
function PrioritySection({ title, options, selected, onChange }) {
  if (!options.length) return null
  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }
  return (
    <div className="wq-inbox-filters-section">
      <div className="wq-inbox-filters-section-title">{title}</div>
      <div className="wq-inbox-filters-section-list">
        {options.map(o => (
          <label key={o.value} className="wq-inbox-filters-option">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            <span className="wq-inbox-filters-priority-dot" style={{ background: DUE_PRIORITY_COLOR[o.value] }} />
            <span className="wq-inbox-filters-option-label">{o.label}</span>
            <span className="wq-inbox-filters-option-count">{o.count}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function InboxFilterSlideout({
  open, onClose, onClearAll,
  teamOptions, teamFilter, setTeamFilter,
  studioOptions, studioFilter, setStudioFilter,
  categoryOptions, categoryFilter, setCategoryFilter,
  dueOptions, dueFilter, setDueFilter,
  ownerOptions, ownerFilter, setOwnerFilter,
  showOwner,
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="wq-btn wq-btn--primary" onClick={onClose}>Apply filters</button>
        </>
      }
    >
      <div className="wq-inbox-filters-header">
        <button className="wq-inbox-filters-clear-all" onClick={onClearAll}>Clear all</button>
      </div>
      <FilterSection      title="Team"   options={teamOptions}     selected={teamFilter}     onChange={setTeamFilter} />
      <ToggleListSection  title="Studio" options={studioOptions}   selected={studioFilter}   onChange={setStudioFilter} />
      <ChipSelectSection  title="Type"   options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} />
      <PrioritySection    title="Due"    options={dueOptions}      selected={dueFilter}      onChange={setDueFilter} />
      {showOwner && (
        <FilterSection title="Owner" options={ownerOptions} selected={ownerFilter} onChange={setOwnerFilter} />
      )}
    </Drawer>
  )
}

function InboxView({
  events, mode, sortField, sortDirection,
  onSkip, onAsk, onEscalate, onTrace, onTakeIt, onNudge, onReassign,
}) {
  // First item in sort order is pre-selected so the detail pane never needs
  // to show the empty state on load.
  const [selectedId, setSelectedId] = useState(() => sortInboxEventsBy(events, sortField, sortDirection)[0]?.id ?? null)
  // Critical / Normal chip — a coarser split than the Critical/Over Due/Act
  // Now/Heads-up tiers; null shows everything.
  const [criticalFilter, setCriticalFilter] = useState(null)
  const toggleCriticalFilter = (val) => setCriticalFilter(prev => prev === val ? null : val)
  const containerRef = useRef(null)
  const [paneHeight, setPaneHeight] = useState(null)

  // Left column width — drag the handle between the list and the detail pane
  // to trade space between them; clamped so neither pane collapses to nothing.
  const [listWidth, setListWidth] = useState(300)
  const draggingRef = useRef(false)

  const onResizeStart = useCallback((e) => {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      if (!draggingRef.current || !containerRef.current) return
      const left = containerRef.current.getBoundingClientRect().left
      const containerWidth = containerRef.current.getBoundingClientRect().width
      const next = ev.clientX - left
      const maxWidth = Math.max(260, containerWidth - 360)
      setListWidth(Math.max(240, Math.min(next, maxWidth)))
    }
    const onUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  // Measure the real space left below this container (rather than guessing a
  // fixed "100vh minus N" offset) so both panes cap exactly at the visible
  // viewport edge and scroll internally instead of growing the whole page.
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      setPaneHeight(Math.max(280, window.innerHeight - top - 20))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const criticalCount = useMemo(() => events.filter(isCriticalEvent).length, [events])

  // Flat, ordered list — no buckets. Critical first, then Over Due, then Act
  // Now, then everything else; stable within each tier.
  const sortedEvents = useMemo(() => {
    const scoped = criticalFilter
      ? events.filter(e => (isCriticalEvent(e) ? 'critical' : 'normal') === criticalFilter)
      : events
    return sortInboxEventsBy(scoped, sortField, sortDirection)
  }, [events, criticalFilter, sortField, sortDirection])
  const selectedEvent = events.find(e => e.id === selectedId) || null

  return (
    <div className="wq-inbox" ref={containerRef}>
      <div className="wq-inbox-list-col" style={{ width: listWidth, flex: `0 0 ${listWidth}px` }}>
        <div className="wq-inbox-crit-chips">
          <button
            className={`wq-inbox-crit-chip wq-inbox-crit-chip--all${criticalFilter === null ? ' wq-inbox-crit-chip--active' : ''}`}
            onClick={() => setCriticalFilter(null)}
          >
            All <span className="wq-inbox-crit-chip-count">{events.length}</span>
          </button>
          <button
            className={`wq-inbox-crit-chip wq-inbox-crit-chip--critical${criticalFilter === 'critical' ? ' wq-inbox-crit-chip--active' : ''}`}
            onClick={() => toggleCriticalFilter('critical')}
          >
            Critical <span className="wq-inbox-crit-chip-count">{criticalCount}</span>
          </button>
        </div>
        <div className="wq-inbox-list" style={paneHeight ? { maxHeight: paneHeight } : undefined}>
        {sortedEvents.map(e => (
          <InboxMiniCard
            key={e.id}
            event={e}
            isSelected={selectedId === e.id}
            onClick={() => setSelectedId(e.id)}
          />
        ))}
        {sortedEvents.length === 0 && (
          <div className="wq-inbox-list-empty">No events match the current filters.</div>
        )}
        </div>
      </div>

      <div
        className="wq-inbox-resize-handle"
        onPointerDown={onResizeStart}
        style={paneHeight ? { height: paneHeight } : undefined}
      />

      <div className="wq-inbox-detail" style={paneHeight ? { maxHeight: paneHeight } : undefined}>
        {selectedEvent ? (
          <>
            <WQEventPage eventId={selectedId} />
            <InboxDetailActionBar
              event={selectedEvent}
              teamMode={mode === 'team'}
              onSkip={onSkip}
              onAsk={onAsk}
              onEscalate={onEscalate}
              onTrace={onTrace}
              onTakeIt={onTakeIt}
              onNudge={onNudge}
              onReassign={onReassign}
            />
          </>
        ) : (
          <div className="wq-inbox-detail-empty">
            <Inbox size={26} />
            <p>Select an item on the left to see the full details.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Trace drawer ─────────────────────────────────────────────────────────────
function TraceDrawer({ event, onClose }) {
  if (!event) return null
  const wf = event.sourceWorkflow
  const STATUS_ICON  = { done: '✓', paused: '⏸', error: '✗', blocked: '⊘', pending: '·' }
  const STATUS_CLASS = { done: 'wq-step--done', paused: 'wq-step--paused', error: 'wq-step--error', blocked: 'wq-step--error', pending: 'wq-step--pending' }

  return (
    <Drawer open title={wf ? `Trace: ${wf.name}` : 'Workflow Trace'} subtitle={event.id} onClose={onClose}>
      {!wf ? (
        <div className="wq-trace-empty">
          <GitBranch size={22} className="wq-trace-empty-icon" />
          <p className="wq-trace-empty-title">No workflow trace</p>
          <p className="wq-trace-empty-sub">This event was triggered directly, not via an automated workflow pipeline.</p>
        </div>
      ) : (
        <div className="wq-trace-steps">
          {wf.steps.map((s, i) => (
            <div key={i} className={`wq-trace-step ${STATUS_CLASS[s.status] || ''}`}>
              <div className="wq-trace-step-marker">
                <span className="wq-trace-step-icon">{STATUS_ICON[s.status] || '·'}</span>
                {i < wf.steps.length - 1 && <div className="wq-trace-step-line" />}
              </div>
              <div className="wq-trace-step-body">
                <div className="wq-trace-step-header">
                  <span className="wq-trace-step-num">Step {s.step}</span>
                  <span className="wq-trace-step-label">{s.label}</span>
                  {s.timestamp && (
                    <span className="wq-trace-step-ts">
                      {new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="wq-trace-step-detail">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  )
}

// ─── Card overflow menu — Trace always first, Team actions appended when
// relevant (Take it / Nudge / Reassign) ────────────────────────────────────────
function CardMenu({ onTrace, showTeamActions, onTakeIt, onNudge, onReassign }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pick = (fn) => {
    setOpen(false)
    fn()
  }

  return (
    <div className="wq-card-menu-wrap" ref={wrapRef}>
      <button
        className="wq-btn wq-btn--ghost wq-btn--icon wq-card-menu-btn"
        title="More actions"
        data-tour="wq-card-menu-btn"
        onClick={() => setOpen(o => !o)}
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <div className="wq-card-menu" data-tour="wq-card-menu">
          <button data-tour="wq-trace-item" onClick={() => pick(onTrace)}>
            <GitBranch size={12} /> Trace
          </button>
          {showTeamActions && (
            <>
              <button data-tour="wq-takeit-item" onClick={() => pick(onTakeIt)}>Take it</button>
              <button data-tour="wq-nudge-item" onClick={() => pick(onNudge)}>Nudge</button>
              <button data-tour="wq-reassign-item" onClick={() => pick(onReassign)}>Reassign</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, currentUser, teamMode, teamFilter, onTrace, onOpenSlideout, onDetails, onSkip, onAskTeammate, onEscalate, onTakeIt, onNudge, onReassign, isSkipped, isEscalated, thread, hasUnread }) {
  const sev    = SEVERITY[event.severity]
  const etype  = EVENT_TYPES[event.type]
  const studio = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: (event.studio || '??').toUpperCase(), accentColor: '#6b7280' }
  const owner  = PEOPLE.find(p => p.id === event.ownerId)
  const ownerTeams = owner?.teams || []
  // When a Team filter is active, the badge shows the team(s) that actually
  // matched the filter — not just the owner's first team — so the tag always
  // agrees with why this card is visible. Otherwise, if the owner belongs to
  // several teams, prefer whichever one shares this event's studio (so e.g.
  // an executive on both Governance Operations and Agentic Oversight shows
  // the one that actually explains this specific card).
  let displayTeams
  if (teamFilter?.length) {
    const matchedTeams = ownerTeams.filter(t => teamFilter.includes(t))
    displayTeams = matchedTeams.length ? matchedTeams : ownerTeams
  } else if (ownerTeams.length > 1) {
    const studioMatch = ownerTeams.filter(t => TEAMS[t]?.studio === event.studio)
    displayTeams = studioMatch.length ? studioMatch : ownerTeams
  } else {
    displayTeams = ownerTeams
  }
  const isOwn      = event.ownerId === currentUser.id
  const isCovering = event.coveringFor && delegatedTo(event) === currentUser.id
  const urgency = dueUrgency(event)
  const commentCount = thread?.comments.length || 0

  // Level 1: clicking anywhere on the card body (not a button) opens the slideout
  const handleCardClick = (e) => {
    if (isSkipped) return
    if (e.target.closest('button')) return
    onOpenSlideout(event)
  }

  return (
    <div
      className={`wq-event-card wq-event-card--${event.severity}${isSkipped ? ' wq-event-card--skipped' : ''}`}
      onClick={handleCardClick}
    >
      {/* Header row — title (left) + primary actions (top right) */}
      <div className="wq-card-header">
        <div className="wq-card-title-wrap">
          <div className="wq-card-title">{event.title}</div>
        </div>

        {/* 1. Skip · 2. Details · 3. Ask · 4. Escalate · 5. More actions (Trace first) */}
        {!isSkipped && (
          <div className="wq-card-action-row">
            <button
              className="wq-btn wq-btn--ghost wq-btn--icon"
              title="Skip — resurfaces in 2h"
              data-tour="wq-skip-btn"
              onClick={() => onSkip(event)}
            >
              <SkipForward size={13} />
            </button>
            <button className="wq-btn wq-btn--primary" data-tour="wq-details-btn" onClick={() => onDetails(event)}>Details</button>
            <button className="wq-btn wq-btn--ghost" data-tour="wq-ask-btn" onClick={() => onAskTeammate(event)}>Ask</button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" data-tour="wq-escalate-btn" onClick={() => onEscalate(event)}>Escalate</button>
            <CardMenu
              onTrace={() => onTrace(event)}
              showTeamActions={teamMode}
              onTakeIt={() => onTakeIt(event)}
              onNudge={() => onNudge(event)}
              onReassign={() => onReassign(event)}
            />
          </div>
        )}
      </div>

      {/* Body content — description only */}
      <div className="wq-card-body">
        <div className="wq-card-content">
          <div className="wq-card-detail">{event.detail}</div>
        </div>
      </div>

      {/* Bottom row — id/comments/due/blast (left) + tags (right), same row */}
      <div className="wq-card-bottom-row">
        <div className="wq-card-meta-row">
          <span className="wq-card-id">{event.id}</span>
          {thread && (
            <button
              className={`wq-comment-indicator${hasUnread ? ' wq-comment-indicator--unread' : ''}`}
              title={`${commentCount} comment${commentCount === 1 ? '' : 's'}`}
              onClick={() => onAskTeammate(event)}
            >
              <MessageSquare size={12} />
              <span>{commentCount}</span>
            </button>
          )}
          {event.dueLabel && (
            <span className={`wq-card-due wq-card-due--${urgency}`}>{event.dueLabel}</span>
          )}
          {event.missionCritical && event.blastRadius?.workflows > 0 && (
            <span className="wq-card-blast-inline">
              <AlertTriangle size={11} />
              Blocks {event.blastRadius.workflows} workflow{event.blastRadius.workflows !== 1 ? 's' : ''} · {event.blastRadius.agents} agent{event.blastRadius.agents !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="wq-card-tags-row">
          <span className={`wq-badge wq-badge--sev wq-badge--${event.severity}`}>{sev.label}</span>
          <span className="wq-badge wq-badge--studio" style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}>
            {studio.short}
          </span>
          <span className="wq-badge wq-badge--type" style={{ color: etype.color, borderColor: etype.color + '44' }}>
            {etype.label}
          </span>
          {displayTeams.length > 0 && (
            <span className="wq-badge wq-badge--team">
              {TEAMS[displayTeams[0]]?.label || displayTeams[0]}
              {displayTeams.length > 1 && ` +${displayTeams.length - 1}`}
            </span>
          )}
          {event.missionCritical && (
            <span className="wq-badge wq-badge--critical">
              <AlertTriangle size={9} /> Mission Critical
            </span>
          )}
          {isCovering && (
            <span className="wq-badge wq-badge--covering">
              Covering for {personName(event.coveringFor)}
            </span>
          )}
          {teamMode && owner && (
            <span className="wq-badge wq-badge--owner">
              <span className="wq-owner-initials">{owner.initials}</span>
              {owner.name}
              {isOwn && <span className="wq-badge-mine">Mine</span>}
            </span>
          )}
          {isSkipped && (
            <span className="wq-badge wq-skipped-chip">Skipped · comes back in 2h</span>
          )}
          {isEscalated && (
            <span className="wq-badge wq-badge--escalated">Escalated</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Reassign modal (My Team overflow menu) ────────────────────────────────────
function ReassignModal({ event, onClose, onConfirm }) {
  const [query, setQuery] = useState('')
  const [pickedId, setPickedId] = useState(null)

  const candidates = useMemo(() => {
    const q = query.toLowerCase()
    return PEOPLE.filter(p =>
      p.id !== event.ownerId &&
      (!q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q))
    )
  }, [query, event.ownerId])

  return (
    <Modal
      open
      onClose={onClose}
      title="Reassign Event"
      subtitle={`${event.id} · ${event.title.slice(0, 55)}`}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="wq-btn wq-btn--primary"
            disabled={!pickedId}
            onClick={() => onConfirm(pickedId)}
          >
            Reassign
          </button>
        </div>
      }
    >
      <div className="esc-body">
        <div className="esc-field">
          <label className="esc-label">Reassign to</label>
          <div className="esc-search-wrap">
            <Search size={12} className="esc-search-icon" />
            <input
              className="esc-search-input"
              placeholder="Search person…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="esc-people">
            {candidates.map(p => {
              const isOn = pickedId === p.id
              return (
                <button
                  key={p.id}
                  className={`esc-person${isOn ? ' esc-person--on' : ''}`}
                  onClick={() => setPickedId(isOn ? null : p.id)}
                >
                  <span className="esc-initials">{p.initials}</span>
                  <div className="esc-person-info">
                    <span className="esc-person-name">{p.name}</span>
                    <span className="esc-person-role">{p.role} · {p.dept}</span>
                  </div>
                  {isOn && <Check size={13} style={{ color: 'var(--accent-blue)', marginLeft: 'auto' }} />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Multi-select dropdown ────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const triggerRef = useRef(null)

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setMenuStyle({ top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 200) })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!triggerRef.current?.closest('.wq-multiselect')?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="wq-multiselect">
      <button
        ref={triggerRef}
        className="wq-multiselect-trigger"
        onClick={() => open ? setOpen(false) : openMenu()}
      >
        <span>{label}{selected.length > 0 ? ` (${selected.length})` : ''}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="wq-multiselect-menu" style={menuStyle}>
          {options.map(opt => (
            <label key={opt.value} className="wq-multiselect-item">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span>{opt.label}</span>
              {opt.count != null && <span className="wq-multiselect-count">{opt.count}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Work Queues tab ─────────────────────────────────────────────────────
export default function WQQueue() {
  const { currentUser, commentThreads, addComment, notify, resolvedIds, escalatedIds, markEscalated, questionEvents, createQuestion, showNotV1 } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Derive view + mode from URL
  const view = searchParams.get('view') || 'my-work'
  const mode = view === 'my-team' ? 'team' : 'my'

  const [search, setSearch]       = useState('')
  const [studioFilter, setStudioFilter] = useState([])
  const [typeFilter,   setTypeFilter]   = useState([])
  const [traceEvent,   setTraceEvent]   = useState(null)

  // Level 1 slideout state — { event, askSignal }
  const [slideout, setSlideout] = useState(null)
  const [escalateTarget, setEscalateTarget] = useState(null)
  const [questionTarget, setQuestionTarget] = useState(null)
  const [reassignTarget, setReassignTarget] = useState(null)

  // Restore scroll position when returning from the full event page
  useEffect(() => {
    const y = sessionStorage.getItem('htl-wq-return-scroll')
    if (!y) return
    sessionStorage.removeItem('htl-wq-return-scroll')
    const t = setTimeout(() => {
      document.querySelector('.wq-page')?.scrollTo({ top: Number(y) })
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Event status sets
  const [skippedIds,   setSkippedIds]   = useState(new Set())
  const [toast, setToast] = useState(null)

  // Card view (today's list) vs Inbox view. Card view only exists in Full
  // mode — when the header toggle is set to V1, only Inbox view is available.
  const [queueViewMode, setQueueViewMode] = useState('card')
  useEffect(() => {
    if (!showNotV1 && queueViewMode === 'card') setQueueViewMode('inbox')
  }, [showNotV1, queueViewMode])
  // Inbox view — Team/Studio/Type/Due/Owner move into a slideout (DS Filters
  // pattern) instead of living in the horizontal bar, freeing that room for
  // the search input.
  const [inboxFiltersOpen, setInboxFiltersOpen] = useState(false)
  const [inboxSortField, setInboxSortField] = useState('criticality')
  const [inboxSortDirection, setInboxSortDirection] = useState('asc')

  // Local ownership overrides (Take it / Reassign) — never mutates workQueueData.js
  const [ownerOverrides, setOwnerOverrides] = useState({})

  // Comment threads the current persona has opened this session — drives the unread indicator
  const [readThreads, setReadThreads] = useState(new Set())

  const [categoryFilter, setCategoryFilter] = useState([])
  const [ownerFilter,    setOwnerFilter]    = useState([])
  const [dueFilter,      setDueFilter]      = useState([])
  const [teamFilter,     setTeamFilter]     = useState([])

  // Deep-link filters from Overview CTAs
  const initSev  = searchParams.get('severity')
  const initType = searchParams.get('type')

  const [sevFilter, setSevFilter] = useState(initSev ? [initSev] : [])
  const [activeTypeFilter, setActiveTypeFilter] = useState(initType ? [initType] : typeFilter)

  const toggleSeverityFilter = (sev) => {
    setSevFilter(prev => prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev])
  }

  // Scroll to first matching card when arriving via Overview CTA
  useEffect(() => {
    if (!initSev) return
    const t = setTimeout(() => {
      const el = document.querySelector(`.wq-event-card--${initSev}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  // Level 1 — card body click opens the fast-context slideout
  const handleOpenSlideout = (event) => {
    setSlideout({ event })
    setReadThreads(prev => new Set([...prev, event.id]))
  }

  const handleCloseSlideout = () => setSlideout(null)

  // Level 2 — Details always navigates straight to the full page, skipping
  // the slideout. Stash the current view + scroll so the back link can restore it.
  const handleOpenFullPage = (event, opts) => {
    sessionStorage.setItem('htl-wq-return-url', location.pathname + location.search)
    sessionStorage.setItem('htl-wq-return-scroll', String(document.querySelector('.wq-page')?.scrollTop || 0))
    setSlideout(null)
    navigate(`/work-queue/event/${event.id}`, opts?.focusComments ? { state: { focusComments: true } } : undefined)
  }

  // "View thread →" inside the slideout's comment indicator goes straight to
  // the full page's Thread tab.
  const handleViewThread = (event) => handleOpenFullPage(event, { focusComments: true })

  // Ask (from the card, the slideout, or the full page) opens the Question
  // modal — it no longer opens/scrolls to comments directly.
  const handleAsk = (event) => setQuestionTarget(event)

  const handleQuestionSubmit = ({ recipient, question, why, dueDate }) => {
    createQuestion({ originatingEvent: questionTarget, recipient, question, why, dueDate })
    notify(`Question sent to ${recipient.name} — added to their Work Queue`)
    setQuestionTarget(null)
  }

  // Linked-event chip on a Question's slideout — navigate straight there.
  const handleNavigateToLinkedEvent = (eventId) => {
    sessionStorage.setItem('htl-wq-return-url', location.pathname + location.search)
    sessionStorage.setItem('htl-wq-return-scroll', String(document.querySelector('.wq-page')?.scrollTop || 0))
    setSlideout(null)
    navigate(`/work-queue/event/${eventId}`)
  }

  const handleEscalateCard = (event) => {
    setEscalateTarget(event)
  }

  const handleEscalateConfirm = ({ recipient, urgency }) => {
    const target = escalateTarget
    if (target) markEscalated(target.id)
    const name = recipient?.name || 'team'
    setToast(`Escalated to ${name}${urgency === 'urgent' ? ' — marked urgent' : ''}`)
  }

  const handleSkip = (event) => {
    setSkippedIds(prev => new Set([...prev, event.id]))
    setToast('Skipped — will resurface in 2 hours')
  }

  const handleTakeIt = (event) => {
    setOwnerOverrides(prev => ({ ...prev, [event.id]: currentUser.id }))
    setToast(`You took ${event.id}`)
  }

  const handleNudge = (event) => {
    const owner = PEOPLE.find(p => p.id === event.ownerId)
    setToast(`Nudged ${owner?.name || 'owner'} on ${event.id}`)
  }

  const handleReassignOpen = (event) => {
    setReassignTarget(event)
  }

  const handleReassignConfirm = (personId) => {
    if (reassignTarget) {
      setOwnerOverrides(prev => ({ ...prev, [reassignTarget.id]: personId }))
      const person = PEOPLE.find(p => p.id === personId)
      setToast(`Reassigned to ${person?.name || 'teammate'}`)
    }
    setReassignTarget(null)
  }

  const effectiveEvents = useMemo(() => {
    const merged = [...EVENTS, ...questionEvents]
    if (!Object.keys(ownerOverrides).length) return merged
    return merged.map(e => ownerOverrides[e.id] ? { ...e, ownerId: ownerOverrides[e.id] } : e)
  }, [ownerOverrides, questionEvents])

  const baseEvents = mode === 'my' ? getMyEvents(effectiveEvents, currentUser) : getTeamEvents(effectiveEvents, currentUser)

  const combinedTypeFilter = initType ? activeTypeFilter : typeFilter

  // Filters excluding severity — used to compute live counts on the severity chips
  const preSeverityFiltered = useMemo(() => {
    const q = search.toLowerCase()
    return baseEvents.filter(e => {
      if (resolvedIds.has(e.id)) return false
      if (studioFilter.length && !studioFilter.includes(e.studio)) return false
      if (combinedTypeFilter.length && !combinedTypeFilter.includes(e.type)) return false
      if (mode === 'team' && ownerFilter.length && !ownerFilter.includes(e.ownerId)) return false
      if (categoryFilter.length) {
        const matchesCategory = categoryFilter.includes(e.eventCategory)
        const matchesOrigin   = categoryFilter.includes(e.origin)
        if (!matchesCategory && !matchesOrigin) return false
      }
      if (teamFilter.length) {
        const owner = PEOPLE.find(p => p.id === e.ownerId)
        if (!owner?.teams?.some(t => teamFilter.includes(t))) return false
      }
      if (dueFilter.length) {
        const urg = dueUrgency(e)
        if (!dueFilter.includes(urg)) return false
      }
      if (q && !e.title.toLowerCase().includes(q) && !e.detail.toLowerCase().includes(q) && !e.spec?.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [baseEvents, resolvedIds, search, studioFilter, combinedTypeFilter, categoryFilter, ownerFilter, teamFilter, dueFilter, mode])

  const filtered = useMemo(() => {
    if (!sevFilter.length) return preSeverityFiltered
    return preSeverityFiltered.filter(e => sevFilter.includes(e.severity))
  }, [preSeverityFiltered, sevFilter])

  const severityCounts = useMemo(() => {
    const counts = {}
    SEVERITY_ORDER.forEach(sev => {
      counts[sev] = preSeverityFiltered.filter(e => e.severity === sev).length
    })
    return counts
  }, [preSeverityFiltered])

  // Flat list, severity descending — active events first within each tier, skipped at the bottom
  const flatEvents = SEVERITY_ORDER.flatMap(sev => {
    const events = filtered.filter(e => e.severity === sev)
    const active  = events.filter(e => !skippedIds.has(e.id))
    const skipped = events.filter(e =>  skippedIds.has(e.id))

    return [...active, ...skipped]
  })

  const studioOptions = Object.values(STUDIOS).map(s => ({
    value: s.key, label: s.name,
    count: baseEvents.filter(e => e.studio === s.key).length,
  }))

  const typeOptions = Object.values(EVENT_TYPES).map(t => ({
    value: t.key, label: t.label,
    count: baseEvents.filter(e => e.type === t.key).length,
  }))

  // Team filter options — individual personas only see their own teams;
  // manager/executive personas see every team represented in their scope.
  const scopePeople = currentUser.scope === 'individual'
    ? [currentUser]
    : currentUser.scope === 'manager'
      ? PEOPLE.filter(p => currentUser.studios.some(s => p.studios.includes(s)))
      : PEOPLE

  const teamOptionIds = new Set()
  scopePeople.forEach(p => (p.teams || []).forEach(t => teamOptionIds.add(t)))
  const teamOptions = Array.from(teamOptionIds).map(id => ({
    value: id,
    label: TEAMS[id]?.label || id,
    count: baseEvents.filter(e => PEOPLE.find(p => p.id === e.ownerId)?.teams?.includes(id)).length,
  }))

  // Team-filtered events — Type filter counts respond to an active Team filter.
  const teamFilteredEvents = useMemo(() => {
    if (!teamFilter.length) return baseEvents
    return baseEvents.filter(e => PEOPLE.find(p => p.id === e.ownerId)?.teams?.some(t => teamFilter.includes(t)))
  }, [baseEvents, teamFilter])

  const categoryOptions = CATEGORY_OPTIONS.map(c => ({
    value: c.value, label: c.label,
    count: c.group === 'eventCategory'
      ? teamFilteredEvents.filter(e => e.eventCategory === c.value).length
      : teamFilteredEvents.filter(e => e.origin === c.value).length,
  }))

  const ownerOptions = mode === 'team'
    ? PEOPLE.map(p => ({ value: p.id, label: p.name, count: baseEvents.filter(e => e.ownerId === p.id).length }))
        .filter(o => o.count > 0)
    : []

  const DUE_OPTIONS = [
    { value: 'overdue', label: 'Overdue', count: baseEvents.filter(e => dueUrgency(e) === 'overdue').length },
    { value: 'today',   label: 'Due Today', count: baseEvents.filter(e => dueUrgency(e) === 'today').length },
    { value: 'week',    label: 'This Week', count: baseEvents.filter(e => dueUrgency(e) === 'week').length },
    { value: 'none',    label: 'No Date',   count: baseEvents.filter(e => dueUrgency(e) === 'none').length },
  ]

  const DUE_LABEL = { overdue: 'Overdue', today: 'Due today', week: 'This week', none: 'No date' }

  const activeFilters = [
    ...studioFilter.map(v     => ({ key: `s:${v}`,  label: STUDIOS[v]?.short,                clear: () => setStudioFilter(f => f.filter(x => x !== v)) })),
    ...combinedTypeFilter.map(v => ({ key: `t:${v}`, label: EVENT_TYPES[v]?.label,            clear: () => setActiveTypeFilter(f => f.filter(x => x !== v)) })),
    ...categoryFilter.map(v   => ({ key: `c:${v}`,  label: CATEGORY_OPTIONS.find(c => c.value === v)?.label, clear: () => setCategoryFilter(f => f.filter(x => x !== v)) })),
    ...teamFilter.map(v       => ({ key: `tm:${v}`, label: TEAMS[v]?.label,                    clear: () => setTeamFilter(f => f.filter(x => x !== v)) })),
    ...ownerFilter.map(v      => ({ key: `o:${v}`,  label: PEOPLE.find(p => p.id === v)?.name, clear: () => setOwnerFilter(f => f.filter(x => x !== v)) })),
    ...dueFilter.map(v        => ({ key: `d:${v}`,  label: DUE_LABEL[v],                      clear: () => setDueFilter(f => f.filter(x => x !== v)) })),
  ]

  const clearAll = () => {
    setStudioFilter([])
    setActiveTypeFilter([])
    setCategoryFilter([])
    setTeamFilter([])
    setOwnerFilter([])
    setDueFilter([])
    setSevFilter([])
  }

  return (
    <div className="wq-queue">

      {/* ── Card view / Inbox view toggle — its own clearly-visible row, not
          buried inside the filter bar. The whole row only exists in Full
          mode — V1 mode has only Inbox view, so there's nothing to switch. */}
      {showNotV1 && (
        <div className="wq-queue-view-toggle">
          <button
            className={`wq-queue-view-btn${queueViewMode === 'card' ? ' wq-queue-view-btn--active' : ''}`}
            title="Card view"
            onClick={() => setQueueViewMode('card')}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`wq-queue-view-btn${queueViewMode === 'inbox' ? ' wq-queue-view-btn--active' : ''}`}
            title="Inbox view"
            onClick={() => setQueueViewMode('inbox')}
          >
            <Inbox size={15} />
          </button>
        </div>
      )}

      {queueViewMode === 'inbox' ? (
        /* ── Inbox filter bar — My Work/My Team, search, 3 quick filters
            (Event Type / Due / Team), All filters (opens the slideout), and
            a sort control (Criticality / Event Type / Studio), all one row. */
        <div className="wq-filter-bar">
          <div className="wq-view-toggle">
            <button
              className={`wq-view-btn${view !== 'my-team' ? ' wq-view-btn--active' : ''}`}
              onClick={() => setSearchParams({ view: 'my-work' })}
            >
              My Work
            </button>
            <button
              className={`wq-view-btn${view === 'my-team' ? ' wq-view-btn--active' : ''}`}
              onClick={() => setSearchParams({ view: 'my-team' })}
            >
              My Team
            </button>
          </div>
          <div className="wq-search-wrap wq-search-wrap--sm">
            <Search size={13} className="wq-search-icon" />
            <input
              className="wq-search-input"
              placeholder="Search events, specs, IDs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="wq-search-clear" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <MultiSelect label="Event Type" options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} />
          <MultiSelect label="Due"        options={DUE_OPTIONS}     selected={dueFilter}      onChange={setDueFilter} />
          <MultiSelect label="Team"       options={teamOptions}     selected={teamFilter}     onChange={setTeamFilter} />
          {/* All filters + sort — one grouped cluster, pushed to the right
              as a unit (not spread across the bar), matching the DS Filters
              component. */}
          <div className="wq-inbox-allfilters-sort-group">
            <button className="wq-inbox-allfilters-btn" onClick={() => setInboxFiltersOpen(true)}>
              All filters
              {(teamFilter.length + studioFilter.length + categoryFilter.length + dueFilter.length + ownerFilter.length) > 0 && (
                <span className="wq-inbox-filters-btn-count">
                  {teamFilter.length + studioFilter.length + categoryFilter.length + dueFilter.length + ownerFilter.length}
                </span>
              )}
              <SlidersHorizontal size={13} />
            </button>
            <button
              className={`wq-inbox-sort-dir${inboxSortDirection === 'desc' ? ' wq-inbox-sort-dir--desc' : ''}`}
              title={inboxSortDirection === 'desc' ? 'Descending' : 'Ascending'}
              onClick={() => setInboxSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowDown size={13} />
            </button>
            <select
              className="wq-inbox-sort-field"
              value={inboxSortField}
              onChange={e => setInboxSortField(e.target.value)}
            >
              {INBOX_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="wq-filter-bar">
          <div className="wq-view-toggle">
            <button
              className={`wq-view-btn${view !== 'my-team' ? ' wq-view-btn--active' : ''}`}
              onClick={() => setSearchParams({ view: 'my-work' })}
            >
              My Work
            </button>
            <button
              className={`wq-view-btn${view === 'my-team' ? ' wq-view-btn--active' : ''}`}
              onClick={() => setSearchParams({ view: 'my-team' })}
            >
              My Team
            </button>
          </div>
          <div className="wq-search-wrap wq-search-wrap--sm">
            <Search size={13} className="wq-search-icon" />
            <input
              className="wq-search-input"
              placeholder="Search events, specs, IDs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="wq-search-clear" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <MultiSelect label="Team"      options={teamOptions}     selected={teamFilter}         onChange={setTeamFilter}        />
          <MultiSelect label="Studio"    options={studioOptions}   selected={studioFilter}       onChange={setStudioFilter}      />
          <MultiSelect label="Type"      options={categoryOptions} selected={categoryFilter}     onChange={setCategoryFilter}    />
          <MultiSelect label="Due"       options={DUE_OPTIONS}     selected={dueFilter}          onChange={setDueFilter}         />
          {mode === 'team' && (
            <MultiSelect label="Owner" options={ownerOptions} selected={ownerFilter} onChange={setOwnerFilter} />
          )}
        </div>
      )}

      {queueViewMode === 'inbox' ? (
        <>
          <InboxView
            events={preSeverityFiltered}
            mode={mode}
            sortField={inboxSortField}
            sortDirection={inboxSortDirection}
            onSkip={handleSkip}
            onAsk={handleAsk}
            onEscalate={handleEscalateCard}
            onTrace={setTraceEvent}
            onTakeIt={handleTakeIt}
            onNudge={handleNudge}
            onReassign={handleReassignOpen}
          />
          <InboxFilterSlideout
            open={inboxFiltersOpen}
            onClose={() => setInboxFiltersOpen(false)}
            onClearAll={clearAll}
            teamOptions={teamOptions}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            studioOptions={studioOptions}
            studioFilter={studioFilter}
            setStudioFilter={setStudioFilter}
            categoryOptions={categoryOptions}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            dueOptions={DUE_OPTIONS}
            dueFilter={dueFilter}
            setDueFilter={setDueFilter}
            ownerOptions={ownerOptions}
            ownerFilter={ownerFilter}
            setOwnerFilter={setOwnerFilter}
            showOwner={mode === 'team'}
          />
        </>
      ) : (
        <>

      {/* ── Severity stat chips + sort chips (same chip treatment) ───────── */}
      <div className="wq-sev-chips">
        {SEVERITY_CHIP_ORDER.map(sev => {
          const meta = SEVERITY[sev]
          const active = sevFilter.includes(sev)
          return (
            <button
              key={sev}
              className={`wq-sev-chip${active ? ' wq-sev-chip--active' : ''}`}
              style={active ? { background: meta.color, borderColor: meta.color } : { borderColor: meta.color + '55' }}
              onClick={() => toggleSeverityFilter(sev)}
            >
              <span className="wq-sev-chip-dot" style={{ background: active ? '#fff' : meta.color }} />
              {meta.label}
              <span className="wq-sev-chip-count">{severityCounts[sev] || 0}</span>
            </button>
          )
        })}
      </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="wq-filter-chips">
              {activeFilters.map(f => (
                <span key={f.key} className="wq-filter-chip">
                  {f.label}
                  <button onClick={f.clear}><X size={10} /></button>
                </span>
              ))}
              <button className="wq-filter-clear-all" onClick={clearAll}>Clear all</button>
            </div>
          )}

          {/* Event list — flat, severity descending, no section headers */}
          {flatEvents.length === 0 ? (
            <div className="wq-empty">No events match the current filters.</div>
          ) : (
            <div className="wq-event-list">
              {flatEvents.map(e => {
                const thread = commentThreads?.[e.id]
                const hasUnread = !!thread && thread.status === 'open' && !readThreads.has(e.id) &&
                  thread.comments.some(c => c.authorId !== currentUser.id)
                return (
                  <EventCard
                    key={e.id}
                    event={e}
                    currentUser={currentUser}
                    teamMode={mode === 'team'}
                    teamFilter={teamFilter}
                    onTrace={setTraceEvent}
                    onOpenSlideout={handleOpenSlideout}
                    onDetails={handleOpenFullPage}
                    onSkip={handleSkip}
                    onAskTeammate={handleAsk}
                    onEscalate={handleEscalateCard}
                    onTakeIt={handleTakeIt}
                    onNudge={handleNudge}
                    onReassign={handleReassignOpen}
                    isSkipped={skippedIds.has(e.id)}
                    isEscalated={escalatedIds.has(e.id)}
                    thread={thread}
                    hasUnread={hasUnread}
                  />
                )
              })}
            </div>
          )}

        </>
      )}

      {/* Trace drawer */}
      <TraceDrawer event={traceEvent} onClose={() => setTraceEvent(null)} />

      {/* Level 1 — fast-context slideout */}
      {slideout && (
        <EventSlideout
          event={slideout.event}
          thread={commentThreads?.[slideout.event.id]}
          onClose={handleCloseSlideout}
          onOpenFullPage={handleOpenFullPage}
          onAsk={handleAsk}
          onViewThread={handleViewThread}
          onEscalate={handleEscalateCard}
          onTrace={setTraceEvent}
          onNavigateToEvent={handleNavigateToLinkedEvent}
          notify={setToast}
        />
      )}

      {/* Question modal — Ask, from anywhere */}
      {questionTarget && (
        <QuestionModal
          event={questionTarget}
          onClose={() => setQuestionTarget(null)}
          onSubmit={handleQuestionSubmit}
        />
      )}

      {/* Escalation modal */}
      {escalateTarget && (
        <EscalationModal
          event={escalateTarget}
          onClose={() => setEscalateTarget(null)}
          onConfirm={handleEscalateConfirm}
        />
      )}

      {/* Reassign modal (My Team overflow menu) */}
      {reassignTarget && (
        <ReassignModal
          event={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onConfirm={handleReassignConfirm}
        />
      )}

      {/* Toast */}
      {toast && <WQToast text={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
