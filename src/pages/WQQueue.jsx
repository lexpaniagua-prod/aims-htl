import { useState, useMemo, useRef, useEffect } from 'react'
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ChevronDown, X, GitBranch, AlertTriangle, CalendarDays, Flame, Zap, MoreVertical, Check, MessageSquare
} from 'lucide-react'
import { Drawer, Modal } from '../components/Modal'
import {
  EVENTS, SEVERITY, SEVERITY_ORDER, EVENT_TYPES, STUDIOS, PEOPLE, TEAMS
} from '../data/workQueueData'
import EventSlideout from './EventSlideout'
import EscalationModal from './EscalationModal'
import QuestionModal from './QuestionModal'

const CATEGORY_OPTIONS = [
  { value: 'htl-continuation',   label: 'HTL Continuation',   group: 'eventCategory' },
  { value: 'htl-handoff',        label: 'HTL Handoff',        group: 'eventCategory' },
  { value: 'inbound-question',   label: 'Question',           group: 'eventCategory' },
  { value: 'train-me',           label: 'Train Me',           group: 'eventCategory' },
  { value: 'gov-promotion',      label: 'Gov Promotion',      group: 'eventCategory' },
  { value: 'gov-review',         label: 'Gov Review',         group: 'eventCategory' },
  { value: 'gov-break-glass',    label: 'Gov Break Glass',    group: 'eventCategory' },
  { value: 'gov-change-request', label: 'Gov Change Request', group: 'eventCategory' },
  { value: 'customer',           label: 'Customer',           group: 'origin' },
  { value: 'internal',           label: 'Internal',           group: 'origin' },
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

// ─── Card overflow menu (My Team: Take it / Nudge / Reassign) ─────────────────
function CardMenu({ onTakeIt, onNudge, onReassign }) {
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
        className="wq-card-menu-btn"
        title="More actions"
        onClick={() => setOpen(o => !o)}
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <div className="wq-card-menu">
          <button onClick={() => pick(onTakeIt)}>Take it</button>
          <button onClick={() => pick(onNudge)}>Nudge</button>
          <button onClick={() => pick(onReassign)}>Reassign</button>
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
        {/* Trace + overflow menu + Skip + meta */}
        <div className="wq-card-right">
          <button className="wq-trace-btn" onClick={() => onTrace(event)}>
            <GitBranch size={10} /> Trace
          </button>
          {teamMode && !isSkipped && (
            <CardMenu
              onTakeIt={() => onTakeIt(event)}
              onNudge={() => onNudge(event)}
              onReassign={() => onReassign(event)}
            />
          )}
          {!isSkipped && (
            <button
              className="wq-skip-icon-btn"
              title="Skip — resurfaces in 2h"
              onClick={() => onSkip(event)}
            >
              <ChevronDown size={13} />
            </button>
          )}
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
        </div>
      </div>

      {/* Body: content (left) + actions row (right, fills the empty space) */}
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
          <div className="wq-card-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => onDetails(event)}>Details</button>
            <button className="wq-btn wq-btn--ghost" onClick={() => onAskTeammate(event)}>Ask</button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => onEscalate(event)}>Escalate</button>
          </div>
        )}
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
  const { currentUser, commentThreads, addComment, notify, resolvedIds, escalatedIds, markEscalated, questionEvents, createQuestion } = useOutletContext()
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

  // Local ownership overrides (Take it / Reassign) — never mutates workQueueData.js
  const [ownerOverrides, setOwnerOverrides] = useState({})

  // Comment threads the current persona has opened this session — drives the unread indicator
  const [readThreads, setReadThreads] = useState(new Set())

  const [sortMode,       setSortMode]       = useState('default')
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
      if (sortMode === 'today')    return e.dueToday === true
      if (sortMode === 'act-now')  return e.severity === 'now'
      if (sortMode === 'critical') return e.severity === 'now' || e.severity === 'red'
      return true
    })
  }, [baseEvents, resolvedIds, search, studioFilter, combinedTypeFilter, categoryFilter, ownerFilter, teamFilter, dueFilter, sortMode, mode])

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

    const sortedActive = sortMode === 'due-date'
      ? [...active].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
        })
      : active

    return [...sortedActive, ...skipped]
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
    setSortMode('default')
  }

  return (
    <div className="wq-queue">

      {/* ── Severity stat chips ─────────────────────────────────────────── */}
      <div className="wq-sev-chips">
        {SEVERITY_ORDER.map(sev => {
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
        <MultiSelect label="Team"      options={teamOptions}     selected={teamFilter}         onChange={setTeamFilter}        />
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
