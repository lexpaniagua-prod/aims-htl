import { useState, useMemo } from 'react'
import { Search, Check } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PEOPLE } from '../data/workQueueData'

const GROUPS = [
  { id: 'g-gov',  name: 'Governance Team',  initials: 'GT', role: 'Team', dept: 'Governance', scope: 'group', studios: [], partitions: [] },
  { id: 'g-it',   name: 'IT Operations',    initials: 'IT', role: 'Team', dept: 'IT',         scope: 'group', studios: [], partitions: [] },
  { id: 'g-comp', name: 'Compliance Team',  initials: 'CT', role: 'Team', dept: 'Compliance', scope: 'group', studios: [], partitions: [] },
  { id: 'g-ai',   name: 'AI Ops Team',      initials: 'AO', role: 'Team', dept: 'AI Ops',     scope: 'group', studios: [], partitions: [] },
  { id: 'g-exec', name: 'Executive Team',   initials: 'ET', role: 'Team', dept: 'Executive',  scope: 'group', studios: [], partitions: [] },
]

const ALL_DEPTS = ['All', ...Array.from(new Set([
  ...GROUPS.map(g => g.dept),
  ...PEOPLE.map(p => p.dept),
]))]

export default function EscalationModal({ event, onClose, onConfirm }) {
  const [recipient,  setRecipient]  = useState(null)
  const [deptFilter, setDeptFilter] = useState('All')
  const [query,      setQuery]      = useState('')
  const [why,        setWhy]        = useState('')
  const [what,       setWhat]       = useState(
    event ? `${event.title}\n\n${event.detail}` : ''
  )
  const [urgency, setUrgency] = useState('normal')

  const candidates = useMemo(() => {
    const all = [...GROUPS, ...PEOPLE]
    const q = query.toLowerCase()
    return all.filter(c =>
      (deptFilter === 'All' || c.dept === deptFilter) &&
      (!q || c.name.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q) || c.dept?.toLowerCase().includes(q))
    )
  }, [deptFilter, query])

  const canSubmit = recipient && why.trim()

  const handleConfirm = () => {
    onConfirm?.({ recipient, why, what, urgency, event })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Escalate Event"
      subtitle={event ? `${event.id} · ${event.title.slice(0, 55)}` : undefined}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="wq-btn wq-btn--primary"
            disabled={!canSubmit}
            onClick={handleConfirm}
            style={urgency === 'urgent' ? { background: 'var(--accent-coral)', borderColor: 'var(--accent-coral)' } : {}}
          >
            {urgency === 'urgent' ? 'Escalate Urgently' : 'Confirm Escalation'}
          </button>
        </div>
      }
    >
      <div className="esc-body">

        {/* ── Who ─────────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Who <span className="esc-required">*</span></label>
          <div className="esc-who-filters">
            <div className="esc-search-wrap">
              <Search size={12} className="esc-search-icon" />
              <input
                className="esc-search-input"
                placeholder="Search person or team…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select
              className="esc-dept-select"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              {ALL_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="esc-people">
            {candidates.map(c => {
              const isOn = recipient?.id === c.id
              return (
                <button
                  key={c.id}
                  className={`esc-person${isOn ? ' esc-person--on' : ''}`}
                  onClick={() => setRecipient(isOn ? null : c)}
                >
                  <span className="esc-initials">{c.initials}</span>
                  <div className="esc-person-info">
                    <span className="esc-person-name">{c.name}</span>
                    <span className="esc-person-role">{c.role} · {c.dept}</span>
                  </div>
                  {isOn && <Check size={13} style={{ color: 'var(--accent-blue)', marginLeft: 'auto' }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Why ─────────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Why <span className="esc-required">*</span></label>
          <textarea
            className="atm-textarea"
            rows={3}
            placeholder="Describe why this needs escalation…"
            value={why}
            onChange={e => setWhy(e.target.value)}
          />
        </div>

        {/* ── What ────────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">What <span className="esc-label-hint">(auto-filled, editable)</span></label>
          <textarea
            className="atm-textarea"
            rows={3}
            value={what}
            onChange={e => setWhat(e.target.value)}
          />
        </div>

        {/* ── Urgency ─────────────────────────────────────────────────── */}
        <div className="esc-field">
          <label className="esc-label">Urgency</label>
          <div className="esc-urgency-toggle">
            <button
              className={`esc-urgency-btn${urgency === 'normal' ? ' esc-urgency-btn--on' : ''}`}
              onClick={() => setUrgency('normal')}
            >
              Normal
            </button>
            <button
              className={`esc-urgency-btn esc-urgency-btn--is-urgent${urgency === 'urgent' ? ' esc-urgency-btn--on esc-urgency-btn--urgent-on' : ''}`}
              onClick={() => setUrgency('urgent')}
            >
              Urgent
            </button>
          </div>
        </div>

      </div>
    </Modal>
  )
}
