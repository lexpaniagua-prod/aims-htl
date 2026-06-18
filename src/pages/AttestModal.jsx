import { useState, useMemo } from 'react'
import { Search, Check } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PEOPLE } from '../data/workQueueData'

function getExpertiseTags(person) {
  const tags = []
  if (person.partitions?.includes('compliance')) tags.push('Compliance')
  if (person.partitions?.includes('finance'))    tags.push('Finance')
  if (person.partitions?.includes('pii') || person.partitions?.includes('security')) tags.push('PII / Security')
  if (person.studios?.includes('gov'))     tags.push('Truth Plane')
  if (person.studios?.includes('data'))    tags.push('Data Ops')
  if (person.studios?.includes('agentic')) tags.push('Agentic')
  if (person.partitions?.includes('knowledge')) tags.push('Knowledge Base')
  return tags.slice(0, 3)
}

export default function AttestModal({ event, defaultMode = 'formal', currentUserId = 'p1', onClose }) {
  const [mode, setMode]           = useState(defaultMode)
  const [query, setQuery]         = useState('')
  const [recipient, setRecipient] = useState(null)
  const [question, setQuestion]   = useState(
    event ? `Please verify the information in ${event.id}: "${event.title}".` : ''
  )
  const [attachCtx,    setAttachCtx]    = useState(true)
  const [byEOD,        setByEOD]        = useState(false)
  const [notifyComp,   setNotifyComp]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)

  const candidates = useMemo(() => {
    const q = query.toLowerCase()
    return PEOPLE.filter(p =>
      p.id !== currentUserId &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.dept.toLowerCase().includes(q))
    )
  }, [query, currentUserId])

  if (submitted) {
    return (
      <Modal open onClose={onClose} title={mode === 'formal' ? 'Attestation Created' : 'Message Sent'}>
        <div className="atm-success">
          <Check size={28} className="atm-success-icon" />
          <p className="atm-success-text">
            {mode === 'formal'
              ? `Formal verification request sent to ${recipient?.name}. An attestation record with an audit hash has been created.`
              : `Your question was sent to ${recipient?.name}.`
            }
          </p>
          <button className="wq-btn wq-btn--ghost atm-close-btn" onClick={onClose}>Close</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'formal' ? 'Request Formal Verification' : 'Ask a Teammate'}
      subtitle={event ? `${event.id} · ${event.title.slice(0, 60)}` : undefined}
      size="md"
      footer={
        <div className="atm-footer">
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="wq-btn wq-btn--primary"
            disabled={!recipient || !question.trim()}
            onClick={() => setSubmitted(true)}
          >
            {mode === 'formal' ? 'Create Attestation' : 'Send Message'}
          </button>
        </div>
      }
    >
      <div className="atm-body">
        {/* Mode toggle */}
        <div className="atm-mode-toggle">
          <button
            className={`atm-mode-btn${mode === 'formal' ? ' atm-mode-btn--active' : ''}`}
            onClick={() => setMode('formal')}
          >
            Formal Verification
          </button>
          <button
            className={`atm-mode-btn${mode === 'informal' ? ' atm-mode-btn--active' : ''}`}
            onClick={() => setMode('informal')}
          >
            Informal Question
          </button>
        </div>

        {mode === 'formal' && (
          <div className="atm-info-block">
            <div className="atm-info-title">What gets recorded</div>
            <ul className="atm-info-list">
              <li>Attestation record with unique audit hash</li>
              <li>Linked to this event in the audit trail</li>
              <li>Recipient's response is cryptographically sealed</li>
              <li>Visible to Compliance and your manager</li>
            </ul>
          </div>
        )}

        {/* Recipient */}
        <div className="atm-field">
          <label className="atm-label">Recipient</label>
          <div className="atm-search-wrap">
            <Search size={12} className="atm-search-icon" />
            <input
              className="atm-search-input"
              placeholder="Search by name, role, or department…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="atm-people">
            {candidates.map(p => {
              const tags = getExpertiseTags(p)
              const isOn = recipient?.id === p.id
              return (
                <button
                  key={p.id}
                  className={`atm-person${isOn ? ' atm-person--on' : ''}${p.ooo ? ' atm-person--ooo' : ''}`}
                  onClick={() => setRecipient(isOn ? null : p)}
                >
                  <span className="atm-initials">{p.initials}</span>
                  <div className="atm-person-info">
                    <span className="atm-person-name">
                      {p.name}
                      {p.ooo && <span className="atm-ooo-badge">OOO until {p.ooo.until.slice(5)}</span>}
                    </span>
                    <span className="atm-person-role">{p.role} · {p.dept}</span>
                    {tags.length > 0 && (
                      <div className="atm-tags">
                        {tags.map(t => <span key={t} className="atm-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                  {isOn && <Check size={13} className="atm-check-icon" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Statement / question */}
        <div className="atm-field">
          <label className="atm-label">
            {mode === 'formal' ? 'Attestation Statement' : 'Your Question'}
          </label>
          <textarea
            className="atm-textarea"
            rows={4}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={
              mode === 'formal'
                ? 'Describe what the recipient needs to formally attest to…'
                : 'Ask your question…'
            }
          />
        </div>

        {/* Formal-only options */}
        {mode === 'formal' && (
          <div className="atm-options">
            <label className="atm-check-row">
              <input type="checkbox" checked={attachCtx} onChange={e => setAttachCtx(e.target.checked)} />
              <span>Attach event context and audit history</span>
            </label>
            <label className="atm-check-row">
              <input type="checkbox" checked={byEOD} onChange={e => setByEOD(e.target.checked)} />
              <span>Request response by end of day</span>
            </label>
            <label className="atm-check-row">
              <input type="checkbox" checked={notifyComp} onChange={e => setNotifyComp(e.target.checked)} />
              <span>Notify Compliance team on completion</span>
            </label>
          </div>
        )}
      </div>
    </Modal>
  )
}
