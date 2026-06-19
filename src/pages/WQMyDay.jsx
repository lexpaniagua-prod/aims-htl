import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, AlertTriangle, UserCircle, ChevronsDown } from 'lucide-react'
import {
  EVENTS, SEVERITY, STUDIOS, EVENT_TYPES, MESSAGES, PEOPLE,
} from '../data/workQueueData'
import EventModal    from './EventModal'
import AttestModal   from './AttestModal'
import EscalationModal from './EscalationModal'

// ─── shared with WQQueue ──────────────────────────────────────────────────────
const TYPE_ACTIONS = {
  approve:     ['Review', 'Approve', 'Reject'],
  review:      ['Open Review', 'Request Changes', 'Approve'],
  respond:     ['View Details', 'Respond'],
  resolve:     ['Review Conflict', 'Resolve'],
  acknowledge: ['View', 'Acknowledge'],
  train:       ['Review and Edit', 'Promote', 'Reject'],
}

function delegatedTo(event) {
  const owner = PEOPLE.find(p => p.id === event.ownerId)
  return owner?.ooo?.delegate ?? null
}

function getMyEvents(user) {
  return EVENTS.filter(e =>
    e.ownerId === user.id || delegatedTo(e) === user.id
  )
}

function personName(id) {
  return PEOPLE.find(p => p.id === id)?.name || id
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function WQToast({ text, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [text, onDismiss])
  return <div className="wq-toast">{text}</div>
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ event, currentUser, onClose, onConfirm }) {
  const [selectedId, setSelectedId] = useState('')
  return (
    <div className="wqd-assign-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wqd-assign-panel">
        <div className="wqd-assign-title">Assign event</div>
        <div className="wqd-assign-sub">{event.title}</div>
        <select
          className="wq-form-select"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">Select person…</option>
          {PEOPLE.filter(p => p.id !== currentUser.id).map(p => (
            <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
          ))}
        </select>
        <div className="wqd-assign-footer">
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="wq-btn wq-btn--primary"
            disabled={!selectedId}
            onClick={() => onConfirm(selectedId)}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── My Day EventCard ─────────────────────────────────────────────────────────
function MyDayEventCard({ event, currentUser, onAction, onAsk, onEscalate, onSnooze, onAssign, isSnoozed, isEscalated }) {
  const navigate = useNavigate()
  const sev    = SEVERITY[event.severity]
  const etype  = EVENT_TYPES[event.type]
  const studio = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: (event.studio || '??').toUpperCase(), accentColor: '#6b7280' }
  const [primary] = TYPE_ACTIONS[event.type] || ['View']

  return (
    <div className={`wqd-event-card${isSnoozed ? ' wqd-event-card--snoozed' : ''}`}>
      {/* Header */}
      <div className="wq-card-header">
        <div className="wq-card-badges">
          <span className={`wq-badge wq-badge--sev wq-badge--${event.severity}`}>{sev.label}</span>
          <button
            className="wq-badge wq-badge--studio wqd-studio-btn"
            style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}
            onClick={() => navigate(`/work-queue/work-queues?view=my-work&studio=${event.studio}`)}
          >
            {studio.short}
          </button>
          <span className="wq-badge wq-badge--type" style={{ color: etype.color, borderColor: etype.color + '44' }}>
            {etype.label}
          </span>
          {isSnoozed && <span className="wqd-snooze-chip">Snoozed · returns tomorrow</span>}
          {isEscalated && <span className="wq-badge wq-badge--escalated">Escalated</span>}
        </div>
        <div className="wq-card-right">
          <span className="wq-card-id">{event.id}</span>
          <span className="wq-card-due">{event.dueLabel}</span>
        </div>
      </div>

      {/* Content + right action panel */}
      <div className="wqd-card-body">
        <div className="wqd-card-content">
          <div className="wq-card-title">{event.title}</div>
          <div className="wq-card-detail">{event.detail}</div>
          {event.missionCritical && event.blastRadius?.workflows > 0 && (
            <div className="wq-card-blast">
              <AlertTriangle size={11} />
              Blocks {event.blastRadius.workflows} workflow{event.blastRadius.workflows !== 1 ? 's' : ''} · {event.blastRadius.agents} agent{event.blastRadius.agents !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="wqd-action-panel">
          <button className="wq-btn wq-btn--primary" onClick={() => onAction(event, primary)}>
            {primary}
          </button>
          <button className="wq-btn wq-btn--ghost" onClick={() => onAssign(event)}>
            <UserCircle size={12} style={{ marginRight: 4 }} />Assign
          </button>
          <button className="wq-btn wq-btn--ghost" onClick={() => onSnooze(event)} disabled={isSnoozed}>
            Snooze 24h
          </button>
          <div className="wqd-panel-secondary">
            <button className="wq-btn wq-btn--ask" onClick={() => onAsk(event)}>Ask</button>
            {event.type === 'train' && (
              <button className="wq-btn wq-btn--train" onClick={() => onAction(event, 'Review and Edit')}>Train</button>
            )}
            <button className="wq-btn wq-btn--escalate" onClick={() => onEscalate(event)}>Escalate</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WQMyDay({ currentUser }) {
  const navigate = useNavigate()

  const [activeModal,    setActiveModal]    = useState(null)
  const [attestTarget,   setAttestTarget]   = useState(null)
  const [escalateTarget, setEscalateTarget] = useState(null)
  const [assignTarget,   setAssignTarget]   = useState(null)

  const [resolvedIds,  setResolvedIds]  = useState(new Set())
  const [snoozedIds,   setSnoozedIds]   = useState(new Set())
  const [escalatedIds, setEscalatedIds] = useState(new Set())
  const [startHereIdx, setStartHereIdx] = useState(0)
  const [toast, setToast] = useState(null)

  function showToast(msg) { setToast(msg) }

  const allMy    = getMyEvents(currentUser)
  const myEvents = allMy.filter(e => !resolvedIds.has(e.id))

  const actNow   = myEvents.filter(e => e.severity === 'now')
  const critical = myEvents.filter(e => e.severity === 'red')
  const focusMin = actNow.length * 8 + critical.length * 5

  const highPriority = [...actNow, ...critical]
  const startHereEvent = highPriority[Math.min(startHereIdx, highPriority.length - 1)] || null

  const dailyMsg = MESSAGES.find(m => m.pinned)

  const studiasToday = [...new Set(myEvents.map(e => e.studio).filter(Boolean))]
  const expiringCount = myEvents.filter(e => e.dueLabel && /\d+d/.test(e.dueLabel)).length

  // Remaining events (exclude the Start Here event from the list below)
  const remaining = myEvents.filter(e => e.id !== startHereEvent?.id)

  const sectionDefs = [
    { id: 'critical', label: 'Critical — within 7 days or blocking', color: '#ef4444', filter: e => e.severity === 'now' || e.severity === 'red'  },
    { id: 'action',   label: 'Action — this week',                   color: '#f59e0b', filter: e => e.severity === 'yellow' },
    { id: 'headsup',  label: 'Heads-up — on your radar',             color: '#10b981', filter: e => e.severity === 'green'  },
  ]

  // Handlers
  function handleAction(event, action) {
    if (action === 'Acknowledge') {
      setResolvedIds(prev => new Set([...prev, event.id]))
      showToast('Acknowledged — logged to audit')
      return
    }
    setActiveModal({ event, action })
  }

  function handleDecide(msg) {
    if (activeModal) {
      setResolvedIds(prev => new Set([...prev, activeModal.event.id]))
      setActiveModal(null)
    }
    showToast(msg)
  }

  function handleAsk(event) {
    setAttestTarget({ event, mode: 'informal' })
  }

  function handleEscalate(event) {
    setEscalateTarget(event)
  }

  function handleSnooze(event) {
    setSnoozedIds(prev => new Set([...prev, event.id]))
    showToast('Snoozed — returns tomorrow')
  }

  function handleEscalateConfirm({ recipient }) {
    if (escalateTarget) setEscalatedIds(prev => new Set([...prev, escalateTarget.id]))
    showToast(`Escalated to ${recipient?.name || 'team'}`)
    setEscalateTarget(null)
  }

  return (
    <div className="wqd-root">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="wqd-header-bar">
        <span className="wqd-header-label">YOUR DAY — ASSEMBLED FOR YOU</span>
        {focusMin > 0 && (
          <span className="wqd-focus-time">Est. focus time · ~{focusMin} min</span>
        )}
      </div>

      {/* ── Top area: Start Here + Daily message ────────────────────────── */}
      <div className="wqd-top-grid">

        {/* Start Here card */}
        <div className="wqd-start-col">
          {startHereEvent ? (
            <div className="wqd-start-card">
              <div className="wqd-start-label">START HERE</div>
              <div className="wqd-start-badges">
                <span className={`wq-badge wq-badge--sev wq-badge--${startHereEvent.severity}`}>
                  {SEVERITY[startHereEvent.severity].label}
                </span>
                {STUDIOS[startHereEvent.studio] && (
                  <span className="wq-badge wq-badge--studio" style={{ color: STUDIOS[startHereEvent.studio].accentColor, borderColor: STUDIOS[startHereEvent.studio].accentColor + '44' }}>
                    {STUDIOS[startHereEvent.studio].short}
                  </span>
                )}
                <span className="wq-card-id">{startHereEvent.id}</span>
              </div>
              <div className="wqd-start-title">{startHereEvent.title}</div>
              <div className="wqd-start-detail">{startHereEvent.detail}</div>
              <div className="wqd-start-footer">
                <button
                  className="wq-btn wq-btn--primary"
                  onClick={() => handleAction(startHereEvent, (TYPE_ACTIONS[startHereEvent.type] || ['View'])[0])}
                >
                  Start with this
                </button>
                <button
                  className="wq-btn wq-btn--ghost"
                  onClick={() => setStartHereIdx(i => i + 1)}
                  disabled={startHereIdx >= highPriority.length - 1}
                >
                  Skip for now
                </button>
                {startHereEvent.dueLabel && (
                  <span className="wqd-start-due">{startHereEvent.dueLabel}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="wqd-start-empty">
              <Sun size={24} />
              <span>All Act Now and Critical items handled.</span>
            </div>
          )}

          {/* Info chips */}
          <div className="wqd-info-chips">
            <div className="wqd-info-chip">
              <div className="wqd-chip-label">Studios you'll touch today</div>
              <div className="wqd-chip-studios">
                {studiasToday.length === 0 && <span className="wqd-chip-empty">None</span>}
                {studiasToday.map(key => {
                  const s = STUDIOS[key] || { short: (key || '').toUpperCase(), accentColor: '#6b7280' }
                  return (
                    <button
                      key={key}
                      className="wq-badge wq-badge--studio wqd-studio-btn"
                      style={{ color: s.accentColor, borderColor: s.accentColor + '44' }}
                      onClick={() => navigate(`/work-queue/work-queues?view=my-work&studio=${key}`)}
                    >
                      {s.short}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="wqd-info-chip">
              <div className="wqd-chip-label">What you'll actually do</div>
              <div className="wqd-chip-row">
                {(actNow.length + critical.length) > 0 && (
                  <span className="wqd-chip-stat" style={{ color: '#ef4444' }}>
                    {actNow.length + critical.length} critical item{(actNow.length + critical.length) !== 1 ? 's' : ''}
                  </span>
                )}
                {expiringCount > 0 && (
                  <span className="wqd-chip-stat" style={{ color: 'var(--accent-amber)' }}>
                    {expiringCount} expiring soon
                  </span>
                )}
                {(actNow.length + critical.length) === 0 && expiringCount === 0 && (
                  <span className="wqd-chip-empty">All clear</span>
                )}
              </div>
            </div>

            <div className="wqd-info-chip">
              <div className="wqd-chip-label">If you need help</div>
              <div className="wqd-chip-help">
                Use{' '}
                <button className="wqd-inline-link" onClick={() => navigate('/work-queue/attestations')}>
                  Attestations
                </button>{' '}
                to get a formal verification from anyone in the company — including people without studio access.
              </div>
            </div>
          </div>
        </div>

        {/* Daily message card */}
        {dailyMsg && (() => {
          const sender = PEOPLE.find(p => p.id === dailyMsg.from)
          const ts = new Date(dailyMsg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          return (
            <div className="wqd-daily-card">
              <div className="wqd-daily-label">DAILY MESSAGE · {ts}</div>
              <div className="wqd-daily-subject">{dailyMsg.subject}</div>
              <div className="wqd-daily-body">{dailyMsg.body}</div>
              {sender && (
                <div className="wqd-daily-sender">
                  <span className="wqd-daily-avatar">{sender.initials}</span>
                  <div className="wqd-daily-sender-info">
                    <span className="wqd-daily-name">{sender.name}</span>
                    <span className="wqd-daily-role">{sender.role}</span>
                  </div>
                </div>
              )}
              <button className="wqd-daily-link" onClick={() => navigate('/work-queue/messages')}>
                Open messages →
              </button>
            </div>
          )
        })()}
      </div>

      {/* ── Event sections ───────────────────────────────────────────────── */}
      {sectionDefs.map(section => {
        const sectEvents = remaining.filter(section.filter)
        if (sectEvents.length === 0) return null
        const sorted = [
          ...sectEvents.filter(e => !snoozedIds.has(e.id)),
          ...sectEvents.filter(e =>  snoozedIds.has(e.id)),
        ]
        return (
          <div key={section.id} className="wqd-section">
            <div className="wqd-section-header">
              <span className="wqd-section-dot" style={{ background: section.color }} />
              <span className="wqd-section-label">{section.label}</span>
              <span className="wqd-section-count">{sorted.length}</span>
            </div>
            {sorted.map(e => (
              <MyDayEventCard
                key={e.id}
                event={e}
                currentUser={currentUser}
                onAction={handleAction}
                onAsk={handleAsk}
                onEscalate={handleEscalate}
                onSnooze={handleSnooze}
                onAssign={setAssignTarget}
                isSnoozed={snoozedIds.has(e.id)}
                isEscalated={escalatedIds.has(e.id)}
              />
            ))}
          </div>
        )
      })}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {activeModal && (
        <EventModal
          event={activeModal.event}
          action={activeModal.action}
          onClose={() => setActiveModal(null)}
          onDecide={handleDecide}
          onEscalate={() => setEscalateTarget(activeModal.event)}
          onRequestAttestation={() => setAttestTarget({ event: activeModal.event, mode: 'formal' })}
        />
      )}
      {escalateTarget && (
        <EscalationModal
          event={escalateTarget}
          onClose={() => setEscalateTarget(null)}
          onConfirm={handleEscalateConfirm}
        />
      )}
      {attestTarget && (
        <AttestModal
          event={attestTarget.event}
          defaultMode={attestTarget.mode}
          currentUserId={currentUser.id}
          onClose={() => setAttestTarget(null)}
        />
      )}
      {assignTarget && (
        <AssignModal
          event={assignTarget}
          currentUser={currentUser}
          onClose={() => setAssignTarget(null)}
          onConfirm={personId => {
            setAssignTarget(null)
            showToast(`Assigned to ${personName(personId)}`)
          }}
        />
      )}
      {toast && <WQToast text={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
