import { useState } from 'react'
import { Check } from 'lucide-react'
import { PEOPLE, EVENT_MODAL_DATA } from '../data/workQueueData'
import { fmtTs, TraceTimeline } from './EventModal'

// ── Shared helpers ───────────────────────────────────────────────────────────────

function person(id) {
  return PEOPLE.find(p => p.id === id)
}

function confidenceColor(score) {
  if (score >= 0.85) return 'var(--accent-green)'
  if (score >= 0.70) return 'var(--accent-amber)'
  return '#ef4444'
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Small reusable inline confirm banner used by several decision surfaces below.
function ConfirmBar({ text, children, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false, disabled = false }) {
  return (
    <div className="etb-confirm-bar">
      <p className="etb-confirm-text">{text}</p>
      {children}
      <div className="etb-confirm-actions">
        <button className="wq-btn wq-btn--ghost" onClick={onCancel}>Cancel</button>
        <button
          className={`wq-btn ${danger ? 'wq-btn--danger' : 'wq-btn--primary'}`}
          disabled={disabled}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

// Secondary Ask / Escalate links shown under every decision surface on the full page.
function SecondaryLinks({ onAsk, onEscalate }) {
  return (
    <div className="etb-secondary-links">
      <button className="etb-secondary-link" onClick={onAsk}>Ask</button>
      <span className="etb-secondary-sep">·</span>
      <button className="etb-secondary-link etb-secondary-link--coral" onClick={onEscalate}>Escalate</button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLIDEOUT TYPE CONTEXT BLOCKS — compact, 3-5 lines, per eventCategory
   ══════════════════════════════════════════════════════════════════════════════ */

function ContinuationSlide({ event, md }) {
  const isGE = md.geClass === 'GE-COMM'
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Agent</span><span className="etb-slide-val">{md.agent} · {event.sourceWorkflow?.name}</span></div>
      <p className="etb-slide-line">About to send an external communication on this workflow's behalf.</p>
      <div className="etb-slide-row">
        <span className="etb-slide-label">Confidence</span>
        <span className="etb-slide-val" style={{ color: confidenceColor(md.confidence), fontWeight: 700 }}>{Math.round(md.confidence * 100)}%</span>
      </div>
      {md.draftEmail?.to && (
        <div className={`etb-slide-row${isGE ? ' etb-slide-row--rose' : ''}`}>
          <span className="etb-slide-label">Recipient</span>
          <span className="etb-slide-val">{md.draftEmail.to}</span>
        </div>
      )}
      <p className="etb-slide-footer-note">Workflow paused — resuming requires your decision.</p>
    </div>
  )
}

function HandoffSlide({ event, md }) {
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Entity</span><span className="etb-slide-val">{md.entityName}</span></div>
      <p className="etb-slide-line">{md.nextSuggestedAction}</p>
      <p className="etb-slide-line etb-slide-line--muted">{md.handoffReason}</p>
      <p className="etb-slide-footer-note">You now own this — agent will not continue.</p>
    </div>
  )
}

function MessageSlide({ event, thread }) {
  const sender = thread ? person(thread.comments[0]?.authorId) : null
  const body = thread?.comments[0]?.body || ''
  return (
    <div className="etb-slide-block">
      {sender && (
        <div className="etb-slide-row"><span className="etb-slide-label">From</span><span className="etb-slide-val">{sender.name} · {sender.role}</span></div>
      )}
      <p className="etb-slide-line etb-slide-clamp">{body}</p>
      <p className="etb-slide-footer-note">{thread?.comments.length > 1 ? `${thread.comments.length} messages in this thread` : 'Message thread'}</p>
    </div>
  )
}

function TrainMeSlide({ event, md }) {
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Submitted by</span><span className="etb-slide-val">{md.submitter} · {md.submitterRole}</span></div>
      <div className="etb-slide-compare">
        <span className="etb-slide-current">{md.currentValue}</span>
        <span className="etb-slide-arrow">→</span>
        <span className="etb-slide-proposed">{md.proposedValue}</span>
      </div>
      <div className="etb-slide-row"><span className="etb-slide-label">Record</span><span className="etb-slide-val">{md.canonRecord}</span></div>
      <p className="etb-slide-line etb-slide-line--muted">{md.note}</p>
    </div>
  )
}

function GovProposalSlide({ event, md }) {
  const conflictCount = md.claims?.filter(c => c.conflict).length || 0
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Document</span><span className="etb-slide-val">{event.sourceWorkflow?.name || event.spec}</span></div>
      <div className="etb-slide-row">
        <span className="etb-slide-label">Claims</span>
        <span className="etb-slide-val">{md.claims?.length || 0} extracted{conflictCount > 0 && <span style={{ color: 'var(--accent-amber)' }}> · {conflictCount} conflicting</span>}</span>
      </div>
      <div className="etb-slide-row"><span className="etb-slide-label">Destination</span><span className="etb-slide-val">Truth Plane</span></div>
      {event.blastRadius?.workflows > 0 && (
        <p className="etb-slide-line etb-slide-line--rose">Blocks {event.blastRadius.workflows} workflows until resolved.</p>
      )}
    </div>
  )
}

function GovReviewSlide({ event, md }) {
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Record</span><span className="etb-slide-val">{event.kind}</span></div>
      {md.ttlDays != null && (
        <p className="etb-slide-line">Auto-expires in {md.ttlDays} days.</p>
      )}
      <div className="etb-slide-row"><span className="etb-slide-label">Version</span><span className="etb-slide-val">v{md.history?.version} · {md.history?.by}</span></div>
      {md.usedBy && (
        <p className="etb-slide-line etb-slide-line--muted">Used by {md.usedBy.length} agent{md.usedBy.length === 1 ? '' : 's'}.</p>
      )}
    </div>
  )
}

function GovBreakGlassSlide({ event, md }) {
  const approver1 = person(PEOPLE.find(p => p.name === md.firstApprover)?.id)
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Requester</span><span className="etb-slide-val">{md.requestor} · {md.requestorRole}</span></div>
      <div className="etb-slide-row"><span className="etb-slide-label">Partition</span><span className="etb-slide-val">{md.targetPartition}</span></div>
      <div className="etb-slide-row"><span className="etb-slide-label">Duration</span><span className="etb-slide-val">{md.duration}</span></div>
      <p className="etb-slide-line etb-slide-line--rose">{md.justification}</p>
      <div className="etb-slide-approval-status">
        {approver1 && <span className="etb-mini-avatar">{approver1.initials}</span>}
        <span>{md.approvalReceived} of {md.approvalRequired} approvers confirmed</span>
      </div>
    </div>
  )
}

function GovChangeRequestSlide({ event, md }) {
  return (
    <div className="etb-slide-block">
      <div className="etb-slide-row"><span className="etb-slide-label">Submitted by</span><span className="etb-slide-val">{md.submitter} · {md.submitterRole}</span></div>
      <div className="etb-slide-row"><span className="etb-slide-label">Record</span><span className="etb-slide-val">{md.canonRecord}</span></div>
      <div className="etb-slide-compare">
        <span className="etb-slide-current">{md.sourceA?.value}</span>
        <span className="etb-slide-arrow">→</span>
        <span className="etb-slide-proposed">{md.sourceB?.value}</span>
      </div>
      <p className="etb-slide-line etb-slide-line--muted">{md.rationale?.slice(0, 80)}{md.rationale?.length > 80 ? '…' : ''}</p>
      {md.affectedAgents && (
        <p className="etb-slide-line">Affects {md.affectedAgents.length} agents.</p>
      )}
    </div>
  )
}

export function SlideoutTypeContext({ event, thread }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  switch (event.eventCategory) {
    case 'htl-continuation':    return <ContinuationSlide    event={event} md={md} />
    case 'htl-handoff':         return <HandoffSlide         event={event} md={md} />
    case 'message':             return <MessageSlide         event={event} thread={thread} />
    case 'train-me':            return <TrainMeSlide         event={event} md={md} />
    case 'gov-proposal':        return <GovProposalSlide     event={event} md={md} />
    case 'gov-review':          return <GovReviewSlide       event={event} md={md} />
    case 'gov-break-glass':     return <GovBreakGlassSlide   event={event} md={md} />
    case 'gov-change-request':  return <GovChangeRequestSlide event={event} md={md} />
    default: return null
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   FULL PAGE — situation + decision surface per eventCategory
   ══════════════════════════════════════════════════════════════════════════════ */

// ── 1. HTL-Continuation ──────────────────────────────────────────────────────────
function ContinuationFull({ event, md, onDecide, onAsk, onEscalate }) {
  const [view, setView] = useState('idle') // idle | confirm-approve | editing | confirm-edit | confirm-block
  const [editedBody, setEditedBody] = useState(md.draftEmail?.body || '')
  const [blockReason, setBlockReason] = useState('')

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
        <div className="etb-fact-grid">
          <div><span className="etb-fact-label">Workflow</span><span className="etb-fact-val">{event.sourceWorkflow?.name}</span></div>
          <div><span className="etb-fact-label">Agent</span><span className="etb-fact-val">{md.agent}</span></div>
          <div><span className="etb-fact-label">Model</span><span className="etb-fact-val">{md.model}</span></div>
          <div><span className="etb-fact-label">GE Classification</span><span className="etb-fact-val">{md.geClass}</span></div>
        </div>
        <div className="etb-confidence-display">
          <span className="etb-confidence-num" style={{ color: confidenceColor(md.confidence) }}>{Math.round(md.confidence * 100)}%</span>
          <span className="etb-confidence-label">confidence</span>
        </div>
      </div>

      {md.draftEmail && (
        <div className="evm-section">
          <div className="evm-section-title">WHAT THE AGENT PREPARED</div>
          {view === 'editing' || view === 'confirm-edit' ? (
            <textarea className="evm-form-textarea" rows={8} value={editedBody} onChange={e => setEditedBody(e.target.value)} />
          ) : (
            <div className="etb-code-block">{editedBody}</div>
          )}
          <div className="etb-fact-grid" style={{ marginTop: 10 }}>
            <div><span className="etb-fact-label">Recipient</span><span className="etb-fact-val">{md.draftEmail.to}</span></div>
            <div><span className="etb-fact-label">Subject</span><span className="etb-fact-val">{md.draftEmail.subject}</span></div>
            <div><span className="etb-fact-label">Channel</span><span className="etb-fact-val">Email</span></div>
          </div>
        </div>
      )}

      {event.sourceWorkflow && (
        <div className="evm-section">
          <div className="evm-section-title">WORKFLOW TRACE</div>
          <div className="evm-wf-id">{event.sourceWorkflow.id} · {event.sourceWorkflow.name}</div>
          <TraceTimeline steps={event.sourceWorkflow.steps} />
        </div>
      )}

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>

        {view === 'confirm-approve' && (
          <ConfirmBar
            text={`This will send the prepared output on behalf of ${md.agent}. Logged to audit.`}
            confirmLabel="Confirm Send"
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Approved — sent on behalf of agent')}
          />
        )}
        {view === 'confirm-edit' && (
          <ConfirmBar
            text="Send the edited output? This will be logged to audit."
            confirmLabel="Confirm Send"
            onCancel={() => setView('editing')}
            onConfirm={() => onDecide('Edited output sent — logged to audit')}
          />
        )}
        {view === 'confirm-block' && (
          <ConfirmBar
            text="Blocking will terminate this workflow. This cannot be undone."
            confirmLabel="Confirm Block"
            danger
            disabled={!blockReason.trim()}
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Blocked — workflow terminated')}
          >
            <textarea className="evm-form-textarea" rows={2} placeholder="Reason for blocking…" value={blockReason} onChange={e => setBlockReason(e.target.value)} />
          </ConfirmBar>
        )}

        {view === 'idle' && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-approve')}>Approve and send</button>
            <button className="wq-btn wq-btn--ghost" onClick={() => setView('editing')}>Edit then send</button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => setView('confirm-block')}>Block</button>
          </div>
        )}
        {view === 'editing' && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--ghost" onClick={() => setView('idle')}>Cancel</button>
            <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-edit')}>Confirm Send</button>
          </div>
        )}

        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 2. HTL-Handoff ───────────────────────────────────────────────────────────────
function HandoffFull({ event, md, onDecide, onAsk, onEscalate, status, onStatusChange }) {
  const [reassignOpen, setReassignOpen] = useState(false)

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
        <div className="etb-fact-grid">
          <div><span className="etb-fact-label">Workflow</span><span className="etb-fact-val">{event.sourceWorkflow?.name}</span></div>
          <div><span className="etb-fact-label">Entity</span><span className="etb-fact-val">{md.entityName}</span></div>
          <div><span className="etb-fact-label">Record ID</span><span className="etb-fact-val">{md.recordId}</span></div>
          <div><span className="etb-fact-label">Source</span><span className="etb-fact-val">{md.sourceSystem}</span></div>
        </div>
        <p className="etb-reason-note">{md.handoffReason}</p>
      </div>

      <div className="evm-section">
        <div className="evm-section-title">WHAT THE AGENT PREPARED FOR YOU</div>
        {md.keyFacts && (
          <div className="etb-list-group">
            <span className="etb-list-label">Key facts</span>
            <ul className="etb-bullet-list">
              {md.keyFacts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
        {md.recommendations && (
          <div className="etb-list-group">
            <span className="etb-list-label">Recommendations</span>
            <ul className="etb-bullet-list">
              {md.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        <div className="etb-fact-grid" style={{ marginTop: 8 }}>
          <div><span className="etb-fact-label">CRM record</span><span className="etb-fact-val">{md.crmRecord}</span></div>
          <div><span className="etb-fact-label">Knowledge Contract</span><span className="etb-fact-val">{md.knowledgeContract}</span></div>
        </div>
        {md.transcriptSummary && (
          <p className="etb-reason-note" style={{ marginTop: 8 }}>{md.transcriptSummary}</p>
        )}
      </div>

      {event.sourceWorkflow && (
        <div className="evm-section">
          <div className="evm-section-title">WORKFLOW TRACE</div>
          <div className="evm-wf-id">{event.sourceWorkflow.id} · {event.sourceWorkflow.name}</div>
          <TraceTimeline steps={event.sourceWorkflow.steps} />
        </div>
      )}

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>

        {status !== 'In Progress' && status !== 'Resolved' && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => { onStatusChange('In Progress'); }}>
              Acknowledge and take ownership
            </button>
            <button className="wq-btn wq-btn--ghost" onClick={() => setReassignOpen(o => !o)}>Reassign</button>
          </div>
        )}
        {status === 'In Progress' && (
          <div className="etb-inprogress-note">
            <Check size={13} style={{ color: 'var(--accent-green)' }} /> Ownership acknowledged — logged to audit.
            <button className="wq-btn wq-btn--primary" style={{ marginLeft: 'auto' }} onClick={() => onDecide('Marked resolved — logged to audit')}>
              Mark resolved
            </button>
          </div>
        )}
        {reassignOpen && (
          <div className="etb-reassign-list">
            {PEOPLE.filter(p => p.studios?.includes(event.studio)).map(p => (
              <button key={p.id} className="etb-reassign-option" onClick={() => { onDecide(`Reassigned to ${p.name}`) }}>
                <span className="etb-mini-avatar">{p.initials}</span>{p.name} · {p.role}
              </button>
            ))}
          </div>
        )}

        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 3. Message ───────────────────────────────────────────────────────────────────
function MessageFull({ event, thread, onAsk, onEscalate, onCloseThread, notify }) {
  const first = thread?.comments[0]
  const sender = first ? person(first.authorId) : null

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">MESSAGE</div>
        {sender && (
          <div className="etb-message-header">
            <span className="evc-comment-avatar">{sender.initials}</span>
            <div>
              <div className="etb-message-sender">{sender.name}</div>
              <div className="etb-message-role">{sender.role} · {fmtTs(first.timestamp)}</div>
            </div>
          </div>
        )}
        <p className="evm-situation-text" style={{ marginTop: 10 }}>{first?.body}</p>
      </div>

      <div className="evm-section">
        <div className="etb-action-row">
          <button className="wq-btn wq-btn--primary" onClick={onAsk}>Reply</button>
          <button className="wq-btn wq-btn--ghost" onClick={() => notify?.('Forward — recipient picker not yet wired in this prototype')}>Forward</button>
          <button className="wq-btn wq-btn--ghost" onClick={() => notify?.('Marked as read')}>Mark as read</button>
          {thread?.status === 'open' && (
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => onCloseThread(event.id)}>Close thread</button>
          )}
        </div>
        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 4. Train Me ──────────────────────────────────────────────────────────────────
function TrainMeFull({ event, md, onDecide, onAsk, onEscalate }) {
  const [editVal, setEditVal] = useState(md.proposedValue || '')
  const [view, setView] = useState('idle') // idle | confirm-promote | confirm-reject
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SUBMISSION</div>
        <div className="etb-message-header">
          <span className="evc-comment-avatar">{person(PEOPLE.find(p => p.name === md.submitter)?.id)?.initials || md.submitter?.slice(0, 2)}</span>
          <div>
            <div className="etb-message-sender">{md.submitter}</div>
            <div className="etb-message-role">{md.submitterRole} · {fmtDate(md.submittedAt)}</div>
          </div>
        </div>
        <p className="evm-situation-text" style={{ marginTop: 10 }}>{md.note}</p>
        <div className="evm-train-field-row" style={{ marginTop: 10 }}>
          <div className="evm-train-field-block">
            <span className="evm-train-label">Current value</span>
            <span className="evm-train-value evm-train-value--current">{md.currentValue}</span>
          </div>
          <span className="evm-train-arrow">→</span>
          <div className="evm-train-field-block">
            <span className="evm-train-label">Proposed value</span>
            <span className="evm-train-value" style={{ color: 'var(--accent-amber)' }}>{md.proposedValue}</span>
          </div>
        </div>
        <div className="etb-fact-grid" style={{ marginTop: 10 }}>
          <div><span className="etb-fact-label">Record</span><span className="etb-fact-val">{md.canonRecord}</span></div>
        </div>
      </div>

      <div className="evm-section">
        <div className="evm-section-title">REVIEW AND EDIT BEFORE PROMOTING</div>
        <input className="evm-form-input" value={editVal} onChange={e => setEditVal(e.target.value)} />
        {editVal !== md.proposedValue && (
          <button className="etb-reset-link" onClick={() => setEditVal(md.proposedValue)}>Reset to proposed value</button>
        )}
      </div>

      {md.affectedAgents && (
        <div className="evm-section">
          <div className="evm-section-title">IMPACT</div>
          <div className="evm-impact-group">
            <span className="evm-impact-label">Agents</span>
            <div className="evm-blast-affected">
              {md.affectedAgents.map(a => <span key={a} className="evm-blast-chip">{a}</span>)}
            </div>
          </div>
          <p className="etb-reason-note">Promoting will update on next retrieval by {md.affectedAgents.length} agents.</p>
        </div>
      )}

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>
        {view === 'confirm-promote' && (
          <ConfirmBar
            text={`This updates ${md.canonRecord}. ${md.currentValue} → ${editVal}. ${md.affectedAgents?.length || 0} agents update on next retrieval.`}
            confirmLabel="Confirm Promotion"
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Promoted to Canon — model will retrain')}
          >
            <textarea className="evm-form-textarea" rows={2} placeholder="Note (optional)…" value={note} onChange={e => setNote(e.target.value)} />
          </ConfirmBar>
        )}
        {view === 'confirm-reject' && (
          <ConfirmBar
            text="Reject this submission?"
            confirmLabel="Confirm Rejection"
            danger
            disabled={!reason.trim()}
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Rejected — submitter will be notified')}
          >
            <textarea className="evm-form-textarea" rows={2} placeholder="Reason for rejection…" value={reason} onChange={e => setReason(e.target.value)} />
          </ConfirmBar>
        )}
        {view === 'idle' && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-promote')}>Promote to Canon</button>
            <button className="wq-btn wq-btn--ghost" onClick={() => setView('confirm-reject')}>Reject</button>
          </div>
        )}
        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 5. Governance Proposal ───────────────────────────────────────────────────────
function GovProposalFull({ event, md, onDecide, onAsk, onEscalate }) {
  const [decisions, setDecisions] = useState({}) // claimId -> 'approve' | 'reject'
  const [view, setView] = useState('idle')
  const claims = md.claims || []
  const conflictIds = new Set((md.conflicts || []).map(c => c.claimId))

  const setDecision = (id, val) => setDecisions(prev => ({ ...prev, [id]: prev[id] === val ? undefined : val }))
  const approveAllClear = () => {
    const next = { ...decisions }
    claims.filter(c => !c.conflict).forEach(c => { next[c.id] = 'approve' })
    setDecisions(next)
  }
  const conflictsResolved = [...conflictIds].every(id => decisions[id])
  const approvedCount = Object.values(decisions).filter(v => v === 'approve').length
  const rejectedCount = Object.values(decisions).filter(v => v === 'reject').length
  const flaggedCount = claims.length - approvedCount - rejectedCount

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
        <div className="etb-pipeline-flow">
          {['Indexing', 'Claim Detection', 'Conflict Check', 'KCON Routing'].map((s, i, arr) => (
            <span key={s} className="etb-pipeline-step">
              {s}{i < arr.length - 1 && <span className="etb-pipeline-arrow">→</span>}
            </span>
          ))}
        </div>
        <div className="etb-fact-grid" style={{ marginTop: 8 }}>
          <div><span className="etb-fact-label">Destination</span><span className="etb-fact-val">Truth Plane</span></div>
        </div>
      </div>

      <div className="evm-section">
        <div className="evm-section-title">CLAIMS EXTRACTED ({claims.length})</div>
        <div className="evm-claims-list">
          {claims.map(c => {
            const conflict = (md.conflicts || []).find(cf => cf.claimId === c.id)
            const decision = decisions[c.id]
            return (
              <div key={c.id} className={`evm-claim${c.conflict ? ' evm-claim--conflict' : ''}`}>
                <div className="evm-claim-header">
                  <span className="evm-claim-id">{c.id}</span>
                  <span className="evm-claim-conf" style={{ color: confidenceColor(c.confidence) }}>{Math.round(c.confidence * 100)}%</span>
                  {c.conflict && <span className="evm-claim-conflict-badge">CONFLICT</span>}
                </div>
                <div className="evm-claim-text">{c.text}</div>
                {conflict && (
                  <div className="etb-mini-compare">
                    <div className="etb-mini-source"><span className="evm-source-badge evm-source-badge--a">Source A</span> {conflict.sourceA.name} — {conflict.sourceA.value}</div>
                    <div className="etb-mini-source"><span className="evm-source-badge evm-source-badge--b">Source B</span> {conflict.sourceB.name} — {conflict.sourceB.value}</div>
                  </div>
                )}
                <div className="etb-claim-actions">
                  <button className={`etb-claim-btn${decision === 'approve' ? ' etb-claim-btn--approve-on' : ''}`} onClick={() => setDecision(c.id, 'approve')}>Approve</button>
                  <button className={`etb-claim-btn${decision === 'reject' ? ' etb-claim-btn--reject-on' : ''}`} onClick={() => setDecision(c.id, 'reject')}>Reject</button>
                  <button className="etb-claim-btn" onClick={() => setDecision(c.id, 'correct')}>Correct</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>
        {view === 'confirm-submit' ? (
          <ConfirmBar
            text={`${approvedCount} claims will be promoted to Truth Plane. ${rejectedCount} rejected. ${flaggedCount} flagged.`}
            confirmLabel="Confirm Attestation"
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Attestation submitted — logged to audit')}
          />
        ) : (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--ghost" onClick={approveAllClear}>Approve all non-conflicted</button>
            <button className="wq-btn wq-btn--primary" disabled={!conflictsResolved} onClick={() => setView('confirm-submit')}>
              Submit attestation
            </button>
          </div>
        )}
        {!conflictsResolved && view === 'idle' && conflictIds.size > 0 && (
          <p className="etb-hint-text">Requires at least one decision per conflict before submitting.</p>
        )}
        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 6. Governance Review ─────────────────────────────────────────────────────────
function GovReviewFull({ event, md, onDecide, onAsk, onEscalate }) {
  const [view, setView] = useState('idle') // idle | edit | replace | confirm-archive | confirm-extend
  const [content, setContent] = useState(md.kbuText || '')
  const [newSource, setNewSource] = useState('')
  const [newTtl, setNewTtl] = useState('30')
  const [expanded, setExpanded] = useState(null)

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">CURRENT STATE</div>
        {view === 'edit' ? (
          <textarea className="evm-form-textarea" rows={8} value={content} onChange={e => setContent(e.target.value)} />
        ) : (
          <div className="etb-code-block">{content}</div>
        )}
        <div className="etb-fact-grid" style={{ marginTop: 10 }}>
          <div><span className="etb-fact-label">Version</span><span className="etb-fact-val">v{md.history?.version}</span></div>
          <div><span className="etb-fact-label">Last modified</span><span className="etb-fact-val">{md.history?.lastModified} by {md.history?.by}</span></div>
        </div>
        {md.usedBy && (
          <div className="evm-impact-group" style={{ marginTop: 10 }}>
            <span className="evm-impact-label">Used by</span>
            <div className="evm-blast-affected">
              {md.usedBy.map(u => <span key={u} className="evm-blast-chip">{u}</span>)}
            </div>
          </div>
        )}
      </div>

      {md.versionHistory && (
        <div className="evm-section">
          <div className="evm-section-title">HISTORY</div>
          <div className="etb-version-list">
            {md.versionHistory.map(v => (
              <div key={v.version} className="etb-version-row" onClick={() => setExpanded(expanded === v.version ? null : v.version)}>
                <div className="etb-version-top">
                  <span className="etb-version-num">v{v.version}</span>
                  <span className="etb-version-author">{v.author}</span>
                  <span className="etb-version-date">{v.date}</span>
                </div>
                {expanded === v.version && <p className="etb-version-summary">{v.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>
        {view === 'confirm-extend' && (
          <ConfirmBar
            text={`Extend TTL by ${newTtl} days?`}
            confirmLabel="Confirm Extend"
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide(`TTL extended by ${newTtl} days`)}
          >
            <input className="evm-form-input" type="number" value={newTtl} onChange={e => setNewTtl(e.target.value)} style={{ maxWidth: 120 }} />
          </ConfirmBar>
        )}
        {view === 'confirm-archive' && (
          <ConfirmBar
            text={`Archiving removes this record from active retrieval. ${md.usedBy?.length || 0} agents will degrade.`}
            confirmLabel="Confirm Archive"
            danger
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Archived — removed from active retrieval')}
          />
        )}
        {view === 'replace' && (
          <ConfirmBar
            text="Select a replacement source to link to this record."
            confirmLabel="Confirm Replace"
            disabled={!newSource.trim()}
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide(`Replaced with ${newSource}`)}
          >
            <input className="evm-form-input" placeholder="Source document or file name…" value={newSource} onChange={e => setNewSource(e.target.value)} />
          </ConfirmBar>
        )}
        {view === 'idle' && (
          <div className="etb-action-row">
            {md.ttlDays != null && <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-extend')}>Extend TTL</button>}
            <button className="wq-btn wq-btn--ghost" onClick={() => setView(view === 'edit' ? 'idle' : 'edit')}>
              {view === 'edit' ? 'Cancel edit' : 'Update content'}
            </button>
            <button className="wq-btn wq-btn--ghost" onClick={() => setView('replace')}>Replace</button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => setView('confirm-archive')}>Archive</button>
          </div>
        )}
        {view === 'edit' && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => onDecide('Content updated — logged to audit')}>Save changes</button>
          </div>
        )}
        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 7. Governance Break Glass ────────────────────────────────────────────────────
function GovBreakGlassFull({ event, md, onDecide, onAsk, onEscalate, currentUser }) {
  const [view, setView] = useState('idle') // idle | confirm-approve | confirm-deny
  const [denyReason, setDenyReason] = useState('')
  const isSecondApprover = currentUser?.name === md.secondApprover
  const approvalNum = md.approvalReceived + 1

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">REQUEST</div>
        <div className="etb-message-header">
          <span className="evc-comment-avatar">{person(PEOPLE.find(p => p.name === md.requestor)?.id)?.initials}</span>
          <div>
            <div className="etb-message-sender">{md.requestor}</div>
            <div className="etb-message-role">{md.requestorRole} · {fmtTs(md.requestTime)}</div>
          </div>
        </div>
        <div className="etb-fact-grid" style={{ marginTop: 10 }}>
          <div><span className="etb-fact-label">Partition</span><span className="etb-fact-val">{md.targetPartition}</span></div>
          <div><span className="etb-fact-label">Classification</span><span className="etb-fact-val">{md.partitionClassification}</span></div>
          <div><span className="etb-fact-label">Access scope</span><span className="etb-fact-val">{md.accessScope}</span></div>
          <div><span className="etb-fact-label">Duration</span><span className="etb-fact-val">{md.duration}</span></div>
        </div>
        <p className="etb-reason-note etb-reason-note--rose">{md.justification}</p>
        {md.incidentRef && <div className="etb-fact-grid"><div><span className="etb-fact-label">Incident</span><span className="etb-fact-val">{md.incidentRef}</span></div></div>}
      </div>

      <div className="evm-section">
        <div className="evm-section-title">SECURITY CONTEXT</div>
        <div className="etb-fact-grid">
          <div><span className="etb-fact-label">Risk classification</span><span className="etb-fact-val" style={{ color: '#ef4444' }}>Critical</span></div>
        </div>
        {md.lastBreakGlass && (
          <p className="etb-reason-note">Last Break Glass for this partition: {md.lastBreakGlass.date} by {md.lastBreakGlass.requester} — {md.lastBreakGlass.outcome}.</p>
        )}
      </div>

      <div className="evm-section">
        <div className="evm-section-title">APPROVER STATUS — TWO-KEY GATE</div>
        <div className="etb-approver-row">
          <span className="evc-comment-avatar">{person(PEOPLE.find(p => p.name === md.firstApprover)?.id)?.initials}</span>
          <div className="etb-approver-info">
            <span className="etb-approver-name">{md.firstApprover}</span>
            <span className="etb-approver-status etb-approver-status--confirmed">Confirmed · {fmtTs(md.firstApprovalTime)}</span>
          </div>
        </div>
        <div className="etb-approver-row">
          <span className="evc-comment-avatar">{person(PEOPLE.find(p => p.name === md.secondApprover)?.id)?.initials}</span>
          <div className="etb-approver-info">
            <span className="etb-approver-name">{md.secondApprover}</span>
            <span className="etb-approver-status etb-approver-status--pending">Pending</span>
          </div>
        </div>
        <p className="etb-hint-text">Both approvers must confirm before access is granted.</p>
      </div>

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>
        {view === 'confirm-approve' && (
          <ConfirmBar
            text={`Granting temporary PII access to ${md.requestor} for ${md.duration}. Access expires automatically. Logged to immutable audit ledger.`}
            confirmLabel="Confirm Approval"
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide(`Access approved (${approvalNum} of ${md.approvalRequired}) — logged to audit`)}
          />
        )}
        {view === 'confirm-deny' && (
          <ConfirmBar
            text="Deny this access request?"
            confirmLabel="Confirm Deny"
            danger
            disabled={!denyReason.trim()}
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Access denied — requester notified')}
          >
            <textarea className="evm-form-textarea" rows={2} placeholder="Reason for denial…" value={denyReason} onChange={e => setDenyReason(e.target.value)} />
          </ConfirmBar>
        )}
        {view === 'idle' && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-approve')}>
              Approve access ({approvalNum} of {md.approvalRequired})
            </button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => setView('confirm-deny')}>Deny</button>
          </div>
        )}
        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── 8. Governance Change Request ─────────────────────────────────────────────────
function GovChangeRequestFull({ event, md, onDecide, onAsk, onEscalate }) {
  const [view, setView] = useState('idle') // idle | modify | confirm-accept | confirm-reject | request-info
  const [modifiedVal, setModifiedVal] = useState(md.sourceB?.value || '')
  const [modified, setModified] = useState(false)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">CHANGE DETAIL</div>
        <div className="etb-message-header">
          <span className="evc-comment-avatar">{person(PEOPLE.find(p => p.name === md.submitter)?.id)?.initials}</span>
          <div>
            <div className="etb-message-sender">{md.submitter}</div>
            <div className="etb-message-role">{md.submitterRole} · {fmtDate(md.submittedAt)}</div>
          </div>
        </div>
        <p className="evm-situation-text" style={{ marginTop: 10 }}>{md.rationale}</p>
        <div className="etb-fact-grid"><div><span className="etb-fact-label">Change type</span><span className="etb-fact-val">{md.changeType}</span></div></div>
      </div>

      <div className="evm-section">
        <div className="evm-section-title">COMPARISON</div>
        <div className="evm-two-source">
          <div className="evm-source-card">
            <div className="evm-source-card-header"><span className="evm-source-badge evm-source-badge--a">Current</span></div>
            <div className="evm-source-card-name">{md.sourceA?.name}</div>
            <div className="evm-source-card-value">{md.sourceA?.value}</div>
            <div className="evm-source-detail-row"><span>Confidence</span><span style={{ color: confidenceColor(md.sourceA?.confidence || 0) }}>{Math.round((md.sourceA?.confidence || 0) * 100)}%</span></div>
            <div className="evm-source-detail-row"><span>Verified</span><span>{md.sourceA?.lastVerified}</span></div>
            <div className="evm-source-detail-row"><span>Owner</span><span>{md.sourceA?.owner}</span></div>
          </div>
          <div className="evm-source-card">
            <div className="evm-source-card-header"><span className="evm-source-badge evm-source-badge--b">Proposed</span></div>
            <div className="evm-source-card-name">{md.sourceB?.name}</div>
            <div className="evm-source-card-value">{md.sourceB?.value}</div>
            <div className="evm-source-detail-row"><span>Confidence</span><span style={{ color: confidenceColor(md.sourceB?.confidence || 0) }}>{Math.round((md.sourceB?.confidence || 0) * 100)}%</span></div>
            <div className="evm-source-detail-row"><span>Verified</span><span>{md.sourceB?.lastVerified}</span></div>
            <div className="evm-source-detail-row"><span>Owner</span><span>{md.sourceB?.owner}</span></div>
          </div>
        </div>
        {md.affectedAgents && (
          <div className="evm-impact-group" style={{ marginTop: 10 }}>
            <span className="evm-impact-label">Impact</span>
            <div className="evm-blast-affected">
              {md.affectedAgents.map(a => <span key={a} className="evm-blast-chip">{a}</span>)}
            </div>
          </div>
        )}
        <p className="etb-hint-text">Accepting this change affects {md.affectedAgents?.length || 0} agents on next retrieval.</p>
      </div>

      {view === 'modify' && (
        <div className="evm-section">
          <div className="evm-section-title">MODIFY BEFORE ACCEPTING</div>
          <input className="evm-form-input" value={modifiedVal} onChange={e => { setModifiedVal(e.target.value); setModified(true) }} />
          {modified && (
            <button className="etb-reset-link" onClick={() => { setModifiedVal(md.sourceB?.value); setModified(false) }}>Reset to proposed</button>
          )}
        </div>
      )}

      <div className="evm-section">
        <div className="evm-section-title">DECISION</div>
        {view === 'confirm-accept' && (
          <ConfirmBar
            text={`This updates ${md.canonRecord}. ${md.affectedAgents?.length || 0} agents will use the new value on next retrieval.`}
            confirmLabel="Confirm"
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide(modified ? 'Accepted with modifications — logged to audit' : 'Change accepted — logged to audit')}
          >
            <textarea className="evm-form-textarea" rows={2} placeholder="Note (optional)…" value={note} onChange={e => setNote(e.target.value)} />
          </ConfirmBar>
        )}
        {view === 'confirm-reject' && (
          <ConfirmBar
            text="Reject this change request?"
            confirmLabel="Confirm Rejection"
            danger
            disabled={!reason.trim()}
            onCancel={() => setView('idle')}
            onConfirm={() => onDecide('Rejected — submitter notified')}
          >
            <textarea className="evm-form-textarea" rows={2} placeholder="Reason for rejection…" value={reason} onChange={e => setReason(e.target.value)} />
          </ConfirmBar>
        )}
        {view === 'request-info' && (
          <ConfirmBar
            text={`Send a question to ${md.submitter}? This opens the comment thread, addressed to them and linked to this event.`}
            confirmLabel="Open thread"
            onCancel={() => setView('idle')}
            onConfirm={onAsk}
          />
        )}
        {(view === 'idle' || view === 'modify') && (
          <div className="etb-action-row">
            <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-accept')}>Accept change</button>
            {view === 'modify' ? (
              <button className="wq-btn wq-btn--ghost" disabled={!modified} onClick={() => setView('confirm-accept')}>Accept with modifications</button>
            ) : (
              <button className="wq-btn wq-btn--ghost" onClick={() => setView('modify')}>Modify before accepting</button>
            )}
            <button className="wq-btn wq-btn--ghost" onClick={() => setView('confirm-reject')}>Reject</button>
            <button className="wq-btn wq-btn--ghost" onClick={() => setView('request-info')}>Request more information</button>
          </div>
        )}
        <SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
      </div>
    </>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────────────
export function DecisionSurface({ event, onDecide, onAsk, onEscalate, thread, onCloseThread, notify, status, onStatusChange, currentUser }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  switch (event.eventCategory) {
    case 'htl-continuation':
      return <ContinuationFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'htl-handoff':
      return <HandoffFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} status={status} onStatusChange={onStatusChange} />
    case 'message':
      return <MessageFull event={event} thread={thread} onAsk={onAsk} onEscalate={onEscalate} onCloseThread={onCloseThread} notify={notify} />
    case 'train-me':
      return <TrainMeFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'gov-proposal':
      return <GovProposalFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'gov-review':
      return <GovReviewFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'gov-break-glass':
      return <GovBreakGlassFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} currentUser={currentUser} />
    case 'gov-change-request':
      return <GovChangeRequestFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    default:
      return null
  }
}
