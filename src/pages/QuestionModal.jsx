import { useState, useMemo } from 'react'
import { HelpCircle, Search, X } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PEOPLE } from '../data/workQueueData'
import { getExpertiseTags } from './EventComments'

export default function QuestionModal({ event, onClose, onSubmit }) {
  const [recipient, setRecipient] = useState(null)
  const [query,     setQuery]     = useState('')
  const [question,  setQuestion]  = useState('')
  const [why,       setWhy]       = useState('')
  const [dueDate,   setDueDate]   = useState('')

  const candidates = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return PEOPLE
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.dept.toLowerCase().includes(q) ||
        getExpertiseTags(p).some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [query])

  const canSubmit = !!recipient && question.trim().length > 0

  const handleSubmit = () => {
    onSubmit({ recipient, question: question.trim(), why: why.trim(), dueDate: dueDate || null })
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      icon={<div className="qm-header-icon"><HelpCircle size={17} /></div>}
      title="Ask a question"
      subtitle="This creates a task for the recipient and adds the question to this event's thread."
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="qm-submit-btn" disabled={!canSubmit} onClick={handleSubmit}>Send question</button>
        </div>
      }
    >
      <div className="qm-body">

        {/* ── To ──────────────────────────────────────────────────────── */}
        <div className="qm-field">
          <label className="qm-label">To <span className="qm-required">*</span></label>
          {recipient ? (
            <div className="qm-recipient-chip">
              <span className="qm-recipient-avatar">{recipient.initials}</span>
              <div className="qm-recipient-info">
                <span className="qm-recipient-name">{recipient.name}</span>
                <span className="qm-recipient-role">{recipient.role} · {recipient.dept}</span>
              </div>
              <button type="button" className="qm-recipient-remove" onClick={() => setRecipient(null)}><X size={12} /></button>
            </div>
          ) : (
            <>
              <div className="qm-search-wrap">
                <Search size={12} className="qm-search-icon" />
                <input
                  className="qm-search-input"
                  placeholder="Search by name, role, department…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              {candidates.length > 0 && (
                <div className="qm-candidate-list">
                  {candidates.map(p => {
                    const tags = getExpertiseTags(p)
                    return (
                      <button key={p.id} type="button" className="qm-candidate-row" onClick={() => { setRecipient(p); setQuery('') }}>
                        <span className="qm-recipient-avatar">{p.initials}</span>
                        <div className="qm-candidate-info">
                          <span className="qm-candidate-name">{p.name}</span>
                          <span className="qm-candidate-role">{p.role} · {p.dept}</span>
                          {tags.length > 0 && (
                            <div className="qm-candidate-tags">
                              {tags.map(t => <span key={t} className="qm-candidate-tag">{t}</span>)}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Question ────────────────────────────────────────────────── */}
        <div className="qm-field">
          <label className="qm-label">Question <span className="qm-required">*</span></label>
          <textarea
            className="atm-textarea"
            rows={3}
            placeholder="What do you need to know? Be specific — this becomes their task."
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>

        {/* ── Why ─────────────────────────────────────────────────────── */}
        <div className="qm-field">
          <label className="qm-label">Why you need this <span className="qm-label-hint">(optional)</span></label>
          <textarea
            className="atm-textarea"
            rows={2}
            placeholder="Give context so they can answer without going back and forth."
            value={why}
            onChange={e => setWhy(e.target.value)}
          />
        </div>

        {/* ── Due by ──────────────────────────────────────────────────── */}
        <div className="qm-field">
          <label className="qm-label">Response needed by <span className="qm-label-hint">(optional)</span></label>
          <input type="date" className="evm-form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

      </div>
    </Modal>
  )
}
