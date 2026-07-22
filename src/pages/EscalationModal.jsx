import { useState, useMemo } from 'react'
import { ArrowUp, Search, X } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PEOPLE, SEVERITY, EVENT_MODAL_DATA } from '../data/workQueueData'

const REASONS = [
  { value: 'expert',   label: 'Needs expert input' },
  { value: 'conflict', label: 'Conflicting evidence' },
  { value: 'risk',     label: 'High risk / sensitive' },
  { value: 'policy',   label: 'Unclear policy' },
  { value: 'other',    label: 'Other' },
]

const RISK_LABEL = { now: 'High risk', red: 'High risk', yellow: 'Medium risk', green: 'Low risk' }

const AVATAR_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1']

function avatarColor(id) {
  const n = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length]
}

export default function EscalationModal({ event, onClose, onConfirm }) {
  const [reason,        setReason]        = useState(null)
  const [collaborators, setCollaborators]  = useState([])
  const [query,         setQuery]         = useState('')
  const [message,       setMessage]       = useState('')
  const [priority,      setPriority]      = useState('normal')

  const md  = event ? (EVENT_MODAL_DATA[event.id] || {}) : {}
  const sev = event ? SEVERITY[event.severity] : null

  const candidates = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return PEOPLE
      .filter(p => !collaborators.some(c => c.id === p.id))
      .filter(p => p.name.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q) || p.dept?.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, collaborators])

  const addCollaborator = (p) => {
    setCollaborators(prev => [...prev, p])
    setQuery('')
  }
  const removeCollaborator = (id) => setCollaborators(prev => prev.filter(c => c.id !== id))

  const canSubmit = !!reason && collaborators.length > 0 && message.trim().length > 0

  const handleConfirm = () => {
    onConfirm?.({
      recipient: collaborators[0],
      collaborators,
      reason,
      message,
      urgency: priority === 'high' ? 'urgent' : 'normal',
      priority,
      event,
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      icon={<div className="esc-header-icon"><ArrowUp size={17} /></div>}
      title="Escalate"
      subtitle="Ask for help or decision from other collaborators"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="esc-submit-btn" disabled={!canSubmit} onClick={handleConfirm}>
            <ArrowUp size={13} /> Escalate
          </button>
        </div>
      }
    >
      <div className="esc-body" data-tour="wq-escalate-modal">

        {/* ── Item summary ────────────────────────────────────────────── */}
        {event && (
          <div className="esc-summary-card">
            <div className="esc-summary-top">
              <span className="esc-summary-title">{event.title}</span>
              <span className="esc-summary-spec">{event.spec || event.id}</span>
            </div>
            <div className="esc-summary-bottom">
              {event.kind && (
                <span className="esc-summary-badge" style={{ color: sev?.color, borderColor: sev?.color + '44' }}>
                  {event.kind}
                </span>
              )}
              <div className="esc-summary-meta">
                {typeof md.confidence === 'number' && (
                  <span className="esc-summary-conf">{Math.round(md.confidence * 100)}% conf</span>
                )}
                {sev && (
                  <span className="esc-summary-risk" style={{ color: sev.color }}>{RISK_LABEL[event.severity]}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Why ─────────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Why are you escalating? <span className="esc-required">*</span></label>
          <div className="esc-chip-row">
            {REASONS.map(r => (
              <button
                key={r.value}
                className={`esc-chip${reason === r.value ? ' esc-chip--on' : ''}`}
                onClick={() => setReason(reason === r.value ? null : r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Assign collaborators ───────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Assign collaborators <span className="esc-required">*</span></label>
          {collaborators.length > 0 && (
            <div className="esc-collab-chips">
              {collaborators.map(c => (
                <span key={c.id} className="esc-collab-chip">
                  <span className="esc-collab-avatar" style={{ background: avatarColor(c.id) }}>{c.initials}</span>
                  <span className="esc-collab-name">{c.name}</span>
                  <span className="esc-collab-role">{c.role}</span>
                  <button className="esc-collab-remove" onClick={() => removeCollaborator(c.id)}><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="esc-search-wrap">
            <Search size={12} className="esc-search-icon" />
            <input
              className="esc-search-input"
              placeholder="Search collaborators…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          {candidates.length > 0 && (
            <div className="esc-candidate-list">
              {candidates.map(p => (
                <button key={p.id} className="esc-candidate-row" onClick={() => addCollaborator(p)}>
                  <span className="esc-collab-avatar" style={{ background: avatarColor(p.id) }}>{p.initials}</span>
                  <span className="esc-person-info">
                    <span className="esc-person-name">{p.name}</span>
                    <span className="esc-person-role">{p.role} · {p.dept}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Message ─────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Message <span className="esc-required">*</span></label>
          <textarea
            className="atm-textarea"
            rows={3}
            placeholder="Explain what you need help with…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        {/* ── Priority ────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Priority <span className="esc-label-hint">(optional)</span></label>
          <div className="esc-chip-row">
            <button
              className={`esc-chip${priority === 'normal' ? ' esc-chip--on' : ''}`}
              onClick={() => setPriority('normal')}
            >
              Normal
            </button>
            <button
              className={`esc-chip esc-chip--high${priority === 'high' ? ' esc-chip--on esc-chip--high-on' : ''}`}
              onClick={() => setPriority('high')}
            >
              High
            </button>
          </div>
        </div>

      </div>
    </Modal>
  )
}
