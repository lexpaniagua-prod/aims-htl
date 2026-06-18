import { useState, useMemo, useRef, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Search, ChevronDown, X, GitBranch, AlertTriangle, Users
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
  respond:     ['View Details', 'Respond', 'Escalate'],
  resolve:     ['Review Conflict', 'Resolve', 'Escalate'],
  acknowledge: ['View', 'Acknowledge'],
  train:       ['Review and Edit', 'Promote', 'Reject'],
}

// ─── helpers ─────────────────────────────────────────────────────────────────
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
  if (!event?.sourceWorkflow) return null
  const wf = event.sourceWorkflow
  const STATUS_ICON  = { done: '✓', paused: '⏸', error: '✗', blocked: '⊘', pending: '·' }
  const STATUS_CLASS = { done: 'wq-step--done', paused: 'wq-step--paused', error: 'wq-step--error', blocked: 'wq-step--error', pending: 'wq-step--pending' }

  return (
    <Drawer open title={`Trace: ${wf.name}`} subtitle={`Workflow ${wf.id}`} onClose={onClose}>
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
    </Drawer>
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, currentUser, teamMode, onTrace, onAction, onSkip, onAskTeammate, isSkipped, isEscalated }) {
  const sev    = SEVERITY[event.severity]
  const etype  = EVENT_TYPES[event.type]
  const studio = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: event.studio.toUpperCase(), accentColor: '#6b7280' }
  const owner  = PEOPLE.find(p => p.id === event.ownerId)
  const isOwn      = event.ownerId === currentUser.id
  const isCovering = event.coveringFor && delegatedTo(event) === currentUser.id

  const actions = TYPE_ACTIONS[event.type] || ['View']
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
          {event.sourceWorkflow && (
            <button className="wq-badge wq-badge--trace" onClick={() => onTrace(event)}>
              <GitBranch size={9} /> Trace
            </button>
          )}
          {isSkipped && (
            <span className="wq-badge wq-skipped-chip">Skipped · comes back in 2h</span>
          )}
          {isEscalated && (
            <span className="wq-badge wq-badge--escalated">Escalated</span>
          )}
        </div>
        <div className="wq-card-right">
          <span className="wq-card-id">{event.id}</span>
          <span className="wq-card-due">{event.dueLabel}</span>
        </div>
      </div>

      {/* Title + detail */}
      <div className="wq-card-title">{event.title}</div>
      <div className="wq-card-detail">{event.detail}</div>

      {/* Blast radius */}
      {event.missionCritical && event.blastRadius?.workflows > 0 && (
        <div className="wq-card-blast">
          <AlertTriangle size={11} />
          Blocks {event.blastRadius.workflows} workflow{event.blastRadius.workflows !== 1 ? 's' : ''} · {event.blastRadius.agents} agent{event.blastRadius.agents !== 1 ? 's' : ''}
        </div>
      )}

      {/* Actions */}
      {!isSkipped && (
        <>
          <div className="wq-card-actions">
            <button className="wq-btn wq-btn--primary" onClick={() => onAction(event, primary)}>
              {primary}
            </button>
            {secondary.map(a => (
              <button key={a} className="wq-btn wq-btn--ghost" onClick={() => onAction(event, a)}>
                {a}
              </button>
            ))}
          </div>
          <div className="wq-card-links">
            <button className="wq-link" onClick={() => onAskTeammate(event)}>Ask teammate</button>
            <button className="wq-link" onClick={() => onAction(event, 'Escalate')}>Escalate</button>
            <button className="wq-link" onClick={() => onSkip(event)}>Skip</button>
          </div>
        </>
      )}
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

// ─── Main Queue tab ───────────────────────────────────────────────────────────
export default function WQQueue() {
  const { currentUser } = useOutletContext()
  const [searchParams] = useSearchParams()

  const [mode, setMode]           = useState('my')
  const [search, setSearch]       = useState('')
  const [studioFilter, setStudioFilter] = useState([])
  const [typeFilter,   setTypeFilter]   = useState([])
  const [traceEvent,   setTraceEvent]   = useState(null)

  // Modal state
  const [activeModal,    setActiveModal]    = useState(null) // { event, action }
  const [attestTarget,   setAttestTarget]   = useState(null) // { event, mode }
  const [escalateTarget, setEscalateTarget] = useState(null) // event

  // Event status sets
  const [skippedIds,   setSkippedIds]   = useState(new Set())
  const [resolvedIds,  setResolvedIds]  = useState(new Set())
  const [escalatedIds, setEscalatedIds] = useState(new Set())
  const [toast, setToast] = useState(null)

  // Severity deep-link from Overview CTAs
  const initSev = searchParams.get('severity')
  const [sevFilter] = useState(initSev ? [initSev] : [])

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

  const handleEscalateConfirm = ({ recipient, urgency, event: escEvent }) => {
    const target = escEvent || activeModal?.event
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return baseEvents.filter(e => {
      if (resolvedIds.has(e.id)) return false
      if (studioFilter.length && !studioFilter.includes(e.studio)) return false
      if (typeFilter.length && !typeFilter.includes(e.type)) return false
      if (sevFilter.length && !sevFilter.includes(e.severity)) return false
      if (q && !e.title.toLowerCase().includes(q) && !e.detail.toLowerCase().includes(q) && !e.spec.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [baseEvents, resolvedIds, search, studioFilter, typeFilter, sevFilter])

  const grouped = SEVERITY_ORDER.map(sev => {
    const events = filtered.filter(e => e.severity === sev)
    // Skipped events sink to the bottom of their group
    const sorted = [
      ...events.filter(e => !skippedIds.has(e.id)),
      ...events.filter(e =>  skippedIds.has(e.id)),
    ]
    return { sev, events: sorted }
  }).filter(g => g.events.length > 0)

  const studioOptions = Object.values(STUDIOS).map(s => ({
    value: s.key, label: s.name,
    count: baseEvents.filter(e => e.studio === s.key).length,
  }))

  const typeOptions = Object.values(EVENT_TYPES).map(t => ({
    value: t.key, label: t.label,
    count: baseEvents.filter(e => e.type === t.key).length,
  }))

  const activeFilters = [
    ...studioFilter.map(v => ({ key: `s:${v}`, label: STUDIOS[v]?.short,      clear: () => setStudioFilter(f => f.filter(x => x !== v)) })),
    ...typeFilter.map(v   => ({ key: `t:${v}`, label: EVENT_TYPES[v]?.label,   clear: () => setTypeFilter(f   => f.filter(x => x !== v)) })),
  ]

  const clearAll = () => { setStudioFilter([]); setTypeFilter([]) }

  return (
    <div className="wq-queue">
      {/* My / Team toggle */}
      <div className="wq-mode-toggle">
        <button
          className={`wq-mode-btn${mode === 'my' ? ' wq-mode-btn--active' : ''}`}
          onClick={() => setMode('my')}
        >
          My Queue
        </button>
        <button
          className={`wq-mode-btn${mode === 'team' ? ' wq-mode-btn--active' : ''}`}
          onClick={() => setMode('team')}
        >
          <Users size={13} /> Team Queue
        </button>
      </div>

      {/* Filter bar */}
      <div className="wq-filter-bar">
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
        <MultiSelect label="Studio"     options={studioOptions} selected={studioFilter} onChange={setStudioFilter} />
        <MultiSelect label="Event Type" options={typeOptions}   selected={typeFilter}   onChange={setTypeFilter}   />
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
