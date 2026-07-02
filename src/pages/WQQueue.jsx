import { useState, useMemo, useRef, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Search, ChevronDown, X, GitBranch, AlertTriangle, SkipForward, CalendarDays, Flame, Zap
} from 'lucide-react'
import { Drawer } from '../components/Modal'
import {
  EVENTS, SEVERITY, SEVERITY_ORDER, EVENT_TYPES, STUDIOS, PEOPLE
} from '../data/workQueueData'
import EventModal from './EventModal'
import AttestModal from './AttestModal'
import EscalationModal from './EscalationModal'

// ─── Type-based standardized quick actions ────────────────────────────────────
const TYPE_ACTIONS = {
  approve:     ['Review', 'Approve', 'Reject'],
  review:      ['Open Review', 'Request Changes', 'Approve'],
  respond:     ['View Details', 'Respond'],
  resolve:     ['Review Conflict', 'Resolve'],
  acknowledge: ['View', 'Acknowledge'],
  train:       ['Review and Edit', 'Promote', 'Reject'],
}

const CATEGORY_OPTIONS = [
  { value: 'approve',     label: 'Approvals',   group: 'type'   },
  { value: 'review',      label: 'Revisions',   group: 'type'   },
  { value: 'respond',     label: 'Respond',     group: 'type'   },
  { value: 'message',     label: 'Messages',    group: 'type'   },
  { value: 'acknowledge', label: 'Audit',       group: 'type'   },
  { value: 'train',       label: 'Train Me',    group: 'type'   },
  { value: 'customer',    label: 'Customer',    group: 'origin' },
  { value: 'internal',    label: 'Internal',    group: 'origin' },
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

function getMyEvents(currentUser) {
  return EVENTS.filter(e => {
    if (e.ownerId === currentUser.id) return true
    const delegatee = delegatedTo(e)
    return delegatee === currentUser.id
  })
}

function getTeamEvents(currentUser) {
  if (currentUser.scope === 'executive') return EVENTS
  if (currentUser.scope === 'manager') {
    return EVENTS.filter(e => {
      const owner = PEOPLE.find(p => p.id === e.ownerId)
      return owner && currentUser.studios.some(s => owner.studios.includes(s))
    })
  }
  return EVENTS.filter(e => e.ownerId === currentUser.id || delegatedTo(e) === currentUser.id)
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function WQToast({ text, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [text, onDismiss])
  return <div className="wq-toast">{text}</div>
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

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, currentUser, teamMode, onTrace, onAction, onSkip, onAskTeammate, isSkipped, isEscalated }) {
  const sev    = SEVERITY[event.severity]
  const etype  = EVENT_TYPES[event.type]
  const studio = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: (event.studio || '??').toUpperCase(), accentColor: '#6b7280' }
  const owner  = PEOPLE.find(p => p.id === event.ownerId)
  const isOwn      = event.ownerId === currentUser.id
  const isCovering = event.coveringFor && delegatedTo(event) === currentUser.id
  const urgency = dueUrgency(event)

  const actions  = TYPE_ACTIONS[event.type] || ['View']
  const [primary, ...secondary] = actions

  return (
    <div className={`wq-event-card wq-event-card--${event.severity}${isSkipped ? ' wq-event-card--skipped' : ''}`}>
      {/* Header row */}
      <div className="wq-card-header">
        <div className="wq-card-badges">
          <span className={`wq-badge wq-badge--sev wq-badge--${event.severity}`}>{sev.label}</span>
          <span className="wq-badge wq-badge--studio" style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}>
            {studio.short}
          </span>
          <span className="wq-badge wq-badge--type" style={{ color: etype.color, borderColor: etype.color + '44' }}>
            {etype.label}
          </span>
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
        {/* Trace + Skip + meta */}
        <div className="wq-card-right">
          <button className="wq-trace-btn" onClick={() => onTrace(event)}>
            <GitBranch size={10} /> Trace
          </button>
          {!isSkipped && (
            <button
              className="wq-skip-icon-btn"
              title="Skip — resurfaces in 2 hours"
              onClick={() => onSkip(event)}
            >
              <SkipForward size={12} />
            </button>
          )}
          <span className="wq-card-id">{event.id}</span>
          {event.dueLabel && (
            <span className={`wq-card-due wq-card-due--${urgency}`}>{event.dueLabel}</span>
          )}
        </div>
      </div>

      {/* Body: content (left) + actions (right) */}
      <div className="wq-card-body">
        <div className="wq-card-content">
          <div className="wq-card-title">{event.title}</div>
          <div className="wq-card-detail">{event.detail}</div>
          {event.missionCritical && event.blastRadius?.workflows > 0 && (
            <div className="wq-card-blast">
              <AlertTriangle size={11} />
              Blocks {event.blastRadius.workflows} workflow{event.blastRadius.workflows !== 1 ? 's' : ''} · {event.blastRadius.agents} agent{event.blastRadius.agents !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {!isSkipped && (
          <div className="wq-card-action-col">
            <button className="wq-btn wq-btn--primary" onClick={() => onAction(event, primary)}>
              {primary}
            </button>
            {secondary.map(a => (
              <button key={a} className="wq-btn wq-btn--ghost" onClick={() => onAction(event, a)}>
                {a}
              </button>
            ))}
            <div className="wq-card-action-secondary">
              <button className="wq-btn wq-btn--ask" onClick={() => onAskTeammate(event)}>Ask</button>
              {event.type === 'train' && (
                <button className="wq-btn wq-btn--train" onClick={() => onAction(event, 'Review and Edit')}>Train</button>
              )}
              <button className="wq-btn wq-btn--escalate" onClick={() => onAction(event, 'Escalate')}>Escalate</button>
            </div>
          </div>
        )}
      </div>
    </div>
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
  const { currentUser } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()

  // Derive view + mode from URL
  const view = searchParams.get('view') || 'my-work'
  const mode = view === 'my-team' ? 'team' : 'my'

  const [search, setSearch]       = useState('')
  const [studioFilter, setStudioFilter] = useState([])
  const [typeFilter,   setTypeFilter]   = useState([])
  const [traceEvent,   setTraceEvent]   = useState(null)

  // Modal state
  const [activeModal,    setActiveModal]    = useState(null)
  const [attestTarget,   setAttestTarget]   = useState(null)
  const [escalateTarget, setEscalateTarget] = useState(null)

  // Event status sets
  const [skippedIds,   setSkippedIds]   = useState(new Set())
  const [resolvedIds,  setResolvedIds]  = useState(new Set())
  const [escalatedIds, setEscalatedIds] = useState(new Set())
  const [toast, setToast] = useState(null)

  const [sortMode,       setSortMode]       = useState('default')
  const [categoryFilter, setCategoryFilter] = useState([])
  const [ownerFilter,    setOwnerFilter]    = useState([])
  const [dueFilter,      setDueFilter]      = useState([])

  // Deep-link filters from Overview CTAs
  const initSev  = searchParams.get('severity')
  const initType = searchParams.get('type')

  const [sevFilter]  = useState(initSev  ? [initSev]  : [])
  const [activeTypeFilter, setActiveTypeFilter] = useState(initType ? [initType] : typeFilter)

  // Scroll to severity group when arriving via Overview CTA
  useEffect(() => {
    if (!initSev) return
    const t = setTimeout(() => {
      const el = document.querySelector(`.wq-group-header--${initSev}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleAction = (event, action) => {
    if (action === 'Escalate') {
      setEscalateTarget(event)
      return
    }
    if (action === 'Acknowledge') {
      setResolvedIds(prev => new Set([...prev, event.id]))
      setToast('Acknowledged — logged to audit')
      return
    }
    setActiveModal({ event, action })
  }

  const handleModalDecide = (msg) => {
    if (activeModal) {
      setResolvedIds(prev => new Set([...prev, activeModal.event.id]))
      setActiveModal(null)
    }
    setToast(msg)
  }

  const handleModalEscalate = () => {
    if (activeModal) setEscalateTarget(activeModal.event)
  }

  const handleEscalateConfirm = ({ recipient, urgency }) => {
    const target = escalateTarget || activeModal?.event
    if (target) setEscalatedIds(prev => new Set([...prev, target.id]))
    const name = recipient?.name || 'team'
    setToast(`Escalated to ${name}${urgency === 'urgent' ? ' — marked urgent' : ''}`)
  }

  const handleSkip = (event) => {
    setSkippedIds(prev => new Set([...prev, event.id]))
    setToast('Skipped — will resurface in 2 hours')
  }

  const handleAskTeammate = (event) => {
    setAttestTarget({ event, mode: 'informal' })
  }

  const handleRequestAttestation = (event) => {
    setAttestTarget({ event: activeModal?.event || event, mode: 'formal' })
  }

  const baseEvents = mode === 'my' ? getMyEvents(currentUser) : getTeamEvents(currentUser)

  const combinedTypeFilter = initType ? activeTypeFilter : typeFilter

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return baseEvents.filter(e => {
      if (resolvedIds.has(e.id)) return false
      if (studioFilter.length && !studioFilter.includes(e.studio)) return false
      if (combinedTypeFilter.length && !combinedTypeFilter.includes(e.type)) return false
      if (sevFilter.length && !sevFilter.includes(e.severity)) return false
      if (mode === 'team' && ownerFilter.length && !ownerFilter.includes(e.ownerId)) return false
      if (categoryFilter.length) {
        const matchesType   = categoryFilter.includes(e.type)
        const matchesOrigin = categoryFilter.includes(e.origin)
        if (!matchesType && !matchesOrigin) return false
      }
      if (dueFilter.length) {
        const urg = dueUrgency(e)
        if (!dueFilter.includes(urg)) return false
      }
      if (q && !e.title.toLowerCase().includes(q) && !e.detail.toLowerCase().includes(q) && !e.spec?.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false
      if (sortMode === 'today')    return e.dueToday === true
      if (sortMode === 'act-now')  return e.severity === 'now'
      if (sortMode === 'critical') return e.severity === 'now' || e.severity === 'red'
      return true
    })
  }, [baseEvents, resolvedIds, search, studioFilter, combinedTypeFilter, sevFilter, categoryFilter, ownerFilter, dueFilter, sortMode, mode])

  const grouped = SEVERITY_ORDER.map(sev => {
    const events = filtered.filter(e => e.severity === sev)
    const active  = events.filter(e => !skippedIds.has(e.id))
    const skipped = events.filter(e =>  skippedIds.has(e.id))

    const sortedActive = sortMode === 'due-date'
      ? [...active].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
        })
      : active

    return { sev, events: [...sortedActive, ...skipped] }
  }).filter(g => g.events.length > 0)

  const studioOptions = Object.values(STUDIOS).map(s => ({
    value: s.key, label: s.name,
    count: baseEvents.filter(e => e.studio === s.key).length,
  }))

  const typeOptions = Object.values(EVENT_TYPES).map(t => ({
    value: t.key, label: t.label,
    count: baseEvents.filter(e => e.type === t.key).length,
  }))

  const categoryOptions = CATEGORY_OPTIONS.map(c => ({
    value: c.value, label: c.label,
    count: c.group === 'type'
      ? baseEvents.filter(e => e.type === c.value).length
      : baseEvents.filter(e => e.origin === c.value).length,
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
    ...ownerFilter.map(v      => ({ key: `o:${v}`,  label: PEOPLE.find(p => p.id === v)?.name, clear: () => setOwnerFilter(f => f.filter(x => x !== v)) })),
    ...dueFilter.map(v        => ({ key: `d:${v}`,  label: DUE_LABEL[v],                      clear: () => setDueFilter(f => f.filter(x => x !== v)) })),
  ]

  const clearAll = () => {
    setStudioFilter([])
    setActiveTypeFilter([])
    setCategoryFilter([])
    setOwnerFilter([])
    setDueFilter([])
    setSortMode('default')
  }

  return (
    <div className="wq-queue">

      {/* ── Filter bar with My Work / My Team toggle ─────────────────────── */}
      <div className="wq-filter-bar">
        {/* My Work / My Team toggle */}
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

        <div className="wq-search-wrap">
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
        <MultiSelect label="Studio"    options={studioOptions}   selected={studioFilter}       onChange={setStudioFilter}      />
        <MultiSelect label="Type"      options={categoryOptions} selected={categoryFilter}     onChange={setCategoryFilter}    />
        <MultiSelect label="Due"       options={DUE_OPTIONS}     selected={dueFilter}          onChange={setDueFilter}         />
        {mode === 'team' && (
          <MultiSelect label="Owner" options={ownerOptions} selected={ownerFilter} onChange={setOwnerFilter} />
        )}
      </div>

      {/* Sort pills */}
      <div className="wq-sort-bar">
        <span className="wq-sort-label">Sort:</span>
        {[
          { id: 'default',  label: 'Default' },
          { id: 'today',    label: 'Today',    icon: <CalendarDays size={11} /> },
          { id: 'act-now',  label: 'Act Now',  icon: <Zap size={11} /> },
          { id: 'critical', label: 'Critical', icon: <Flame size={11} /> },
          { id: 'due-date', label: 'Due Date', icon: <CalendarDays size={11} /> },
        ].map(s => (
          <button
            key={s.id}
            className={`wq-sort-pill${sortMode === s.id ? ' wq-sort-pill--active' : ''}`}
            onClick={() => setSortMode(prev => prev === s.id ? 'default' : s.id)}
          >
            {s.icon && s.icon}
            {s.label}
          </button>
        ))}
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

          {/* Event list */}
          {grouped.length === 0 ? (
            <div className="wq-empty">No events match the current filters.</div>
          ) : (
            grouped.map(({ sev, events }) => {
              const meta = SEVERITY[sev]
              return (
                <div key={sev} className="wq-severity-group">
                  <div className={`wq-group-header wq-group-header--${sev}`}>
                    <span className={`wq-group-dot wq-group-dot--${sev}`} />
                    <span className="wq-group-label">{meta.label}</span>
                    <span className="wq-group-count">{events.length}</span>
                  </div>
                  {events.map(e => (
                    <EventCard
                      key={e.id}
                      event={e}
                      currentUser={currentUser}
                      teamMode={mode === 'team'}
                      onTrace={setTraceEvent}
                      onAction={handleAction}
                      onSkip={handleSkip}
                      onAskTeammate={handleAskTeammate}
                      isSkipped={skippedIds.has(e.id)}
                      isEscalated={escalatedIds.has(e.id)}
                    />
                  ))}
                </div>
              )
            })
          )}

      {/* Trace drawer */}
      <TraceDrawer event={traceEvent} onClose={() => setTraceEvent(null)} />

      {/* Event modal */}
      {activeModal && (
        <EventModal
          event={activeModal.event}
          action={activeModal.action}
          onClose={() => setActiveModal(null)}
          onRequestAttestation={() => handleRequestAttestation(activeModal.event)}
          onEscalate={handleModalEscalate}
          onDecide={handleModalDecide}
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

      {/* Attestation / Ask teammate modal */}
      {attestTarget && (
        <AttestModal
          event={attestTarget.event}
          defaultMode={attestTarget.mode}
          currentUserId={currentUser.id}
          onClose={() => setAttestTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && <WQToast text={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
