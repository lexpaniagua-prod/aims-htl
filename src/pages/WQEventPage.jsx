import { useState, useRef } from 'react'
import { useParams, useNavigate, useLocation, useOutletContext, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { EVENTS, EVENT_TYPES, SEVERITY, STUDIOS, ATTESTATIONS, AUDIT_LOG, PEOPLE } from '../data/workQueueData'
import {
  BodyContent, FooterActions, getInitialView, VIEW_LABELS, SEV_COLORS, fmtTs,
} from './EventModal'
import { DecisionSurface } from './EventTypeBlocks'
import CommentsSection from './EventComments'
import EscalationModal from './EscalationModal'
import QuestionModal from './QuestionModal'
import AttestModal from './AttestModal'

function person(id) {
  return PEOPLE.find(p => p.id === id)
}

// ── Attestation strip (right column) ────────────────────────────────────────────
function AttestationStrip({ event, onRequestVerification }) {
  const linked = ATTESTATIONS.filter(a => a.linkedEvent === event.id)
  return (
    <div className="wqep-side-block">
      {linked.length === 0 ? (
        <div className="wqep-side-empty">No attestations linked to this event.</div>
      ) : (
        <div className="wqep-attest-list">
          {linked.map(a => {
            const attester = person(a.to)
            return (
              <div key={a.id} className="wqep-attest-row">
                <span className={`evm-att-dot evm-att-dot--${a.status}`} />
                <div className="wqep-attest-info">
                  <span className="wqep-attest-name">{attester?.name || a.to}</span>
                  <span className="wqep-attest-date">{fmtTs(a.requestedDate)}</span>
                </div>
                <span className={`wqep-attest-status wqep-attest-status--${a.status}`}>{a.status}</span>
              </div>
            )
          })}
        </div>
      )}
      <button className="evm-footer-link" onClick={onRequestVerification}>Request verification →</button>
    </div>
  )
}

// ── Audit trail (right column) ──────────────────────────────────────────────────
function AuditTrailBlock({ event, onViewFullAudit }) {
  const [expandedId, setExpandedId] = useState(null)
  const logs = AUDIT_LOG
    .filter(a => a.artifact?.includes(event.id) || a.artifact?.includes(event.spec))
    .slice(-10)
    .reverse()
  return (
    <div className="wqep-side-block">
      {logs.length === 0 ? (
        <div className="wqep-side-empty">No audit activity yet for this event.</div>
      ) : (
        <div className="wqep-audit-list">
          {logs.map(a => {
            const expanded = expandedId === a.id
            return (
              <button
                key={a.id}
                type="button"
                className={`wqep-audit-row${expanded ? ' wqep-audit-row--expanded' : ''}`}
                onClick={() => setExpandedId(expanded ? null : a.id)}
              >
                <div className="wqep-audit-row-top">
                  <span className="wqep-audit-actor">{a.actor}</span>
                  <span className="wqep-audit-action">{a.action}</span>
                  <span className="wqep-audit-ts">{fmtTs(a.timestamp)}</span>
                </div>
                {expanded && (
                  <div className="wqep-audit-detail">
                    <span><span className="wqep-audit-detail-label">Artifact</span> {a.artifact}</span>
                    <span><span className="wqep-audit-detail-label">Risk</span> {a.risk}</span>
                    <span><span className="wqep-audit-detail-label">Outcome</span> {a.outcome}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      <button className="evm-footer-link" onClick={onViewFullAudit}>View full audit →</button>
    </div>
  )
}

// ── Full-page event view ───────────────────────────────────────────────────────
// Level 2 of the two-level pattern: full screen, all information, full decision
// flows. Reached only via the Details button on a card or in the slideout.
export default function WQEventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    currentUser, commentThreads, addComment, closeThread, reopenThread, notify, markResolved, markEscalated,
    questionEvents, createQuestion, markQuestionAnswered,
  } = useOutletContext()

  const event = [...EVENTS, ...questionEvents].find(e => e.id === id)

  const [view,          setView]          = useState(() => getInitialView(event?.type, undefined))
  const [note,          setNote]          = useState('')
  const [reason,        setReason]        = useState('')
  const [choice,        setChoice]        = useState(null)
  const [editVal,       setEditVal]       = useState('')
  const [changeRequest, setChangeRequest] = useState('')
  const [assignTo,      setAssignTo]      = useState(null)
  const [dueBy,         setDueBy]         = useState('')
  const [escalateOpen,  setEscalateOpen]  = useState(false)
  const [attestOpen,    setAttestOpen]    = useState(false)
  const [toast,         setToast]         = useState(null)
  const [status,        setStatus]        = useState('Open')
  const [commentsSignal, setCommentsSignal] = useState(location.state?.focusComments ? 1 : 0)
  const [activeTab, setActiveTab] = useState('thread') // thread | attestation | audit
  const [questionOpen, setQuestionOpen] = useState(false)
  const commentsRef = useRef(null)

  const handleBack = () => {
    const returnUrl = sessionStorage.getItem('htl-wq-return-url') || '/work-queue/work-queues?view=my-work'
    navigate(returnUrl)
  }

  // Ask opens the Question modal — it no longer scrolls to the thread.
  const handleAsk = () => setQuestionOpen(true)

  const handleQuestionSubmit = ({ recipient, question, why, dueDate }) => {
    createQuestion({ originatingEvent: event, recipient, question, why, dueDate })
    notify(`Question sent to ${recipient.name} — added to their Work Queue`)
    setQuestionOpen(false)
  }

  const handleMarkAnswered = (c) => {
    markQuestionAnswered({ eventId: event.id, questionEventId: c.linkedQuestionEventId, responseText: 'Responded to this question.' })
  }

  // Response composer on a Question event's own full page.
  const handleAnswerQuestion = (responseText) => {
    markQuestionAnswered({ eventId: event.linkedEventId, questionEventId: event.id, responseText })
    const asker = PEOPLE.find(p => p.id === event.askedById)
    setStatus('Resolved')
    setToast(`Response sent — ${asker?.name || 'the sender'} has been notified`)
    setTimeout(handleBack, 1500)
  }

  if (!event) {
    return (
      <div className="wqep-notfound">
        <p>Event not found.</p>
        <Link to="/work-queue/work-queues" className="wq-btn wq-btn--ghost">← Work Queues</Link>
      </div>
    )
  }

  const etype    = EVENT_TYPES[event.type]
  const sev      = SEVERITY[event.severity]
  const studio   = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: (event.studio || '??').toUpperCase(), accentColor: '#6b7280' }
  const sevColor = SEV_COLORS[event.severity]

  const handleDecide = (msg) => {
    setStatus('Resolved')
    markResolved(event.id)
    setToast(msg)
    setTimeout(handleBack, 1500)
  }

  const handleEscalateConfirm = ({ recipient, urgency }) => {
    setEscalateOpen(false)
    setStatus('Escalated')
    markEscalated(event.id)
    setToast(`Escalated to ${recipient?.name || 'team'}${urgency === 'urgent' ? ' — marked urgent' : ''}`)
  }

  return (
    <div className="wqep-root">
      <div className="wqep-sticky-header">
        <button className="wqep-back" onClick={handleBack}>
          <ArrowLeft size={13} /> Work Queues
        </button>
        <div className="wqep-sticky-row">
          <div className="wqep-header-meta">
            <span className={`wq-badge wq-badge--sev wq-badge--${event.severity}`}>{sev.label}</span>
            <span className="wq-badge wq-badge--studio" style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}>
              {studio.short}
            </span>
            <span className="evm-header-id">{event.id}</span>
            <span className="evm-header-sep">·</span>
            <span className="evm-header-spec">{event.spec}</span>
            <span className="evm-header-sep">·</span>
            <span className="evm-header-kind">{event.kind}</span>
            <span className="evm-header-type" style={{ color: etype.color }}>{etype.label.toUpperCase()}</span>
            {event.missionCritical && (
              <span className="wq-badge wq-badge--critical">
                <AlertTriangle size={9} /> Mission Critical
              </span>
            )}
          </div>
          <div className="wqep-sticky-right">
            <span className="evm-header-due">{event.dueLabel}</span>
            <span className={`wqep-status wqep-status--${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
          </div>
        </div>
        <h1 className="wqep-title">{event.title}</h1>
      </div>

      <div className="wqep-sev-strip" style={{ background: sevColor }} />

      <div className="wqep-columns">
        {/* Left — event detail / decision surface */}
        <div className="wqep-detail">
          {event.eventCategory ? (
            <div className="wqep-body">
              <DecisionSurface
                event={event}
                onDecide={handleDecide}
                onAsk={handleAsk}
                onEscalate={() => setEscalateOpen(true)}
                thread={commentThreads?.[event.id]}
                onCloseThread={closeThread}
                notify={notify}
                status={status}
                onStatusChange={setStatus}
                currentUser={currentUser}
                onAnswer={handleAnswerQuestion}
                onNavigateToEvent={(eventId) => navigate(`/work-queue/event/${eventId}`)}
              />
            </div>
          ) : (
            <>
              <div className="wqep-body">
                <div className="evm-header-sub" style={{ marginBottom: 12 }}>
                  <span className="evm-header-view-label">{VIEW_LABELS[view] || 'Event Detail'}</span>
                </div>
                <BodyContent
                  view={view} event={event}
                  note={note} setNote={setNote}
                  reason={reason} setReason={setReason}
                  choice={choice} setChoice={setChoice}
                  editVal={editVal} setEditVal={setEditVal}
                  changeRequest={changeRequest} setChangeRequest={setChangeRequest}
                  assignTo={assignTo} setAssignTo={setAssignTo}
                  dueBy={dueBy} setDueBy={setDueBy}
                  onDecide={handleDecide}
                  onReviewDetail={() => setView('detail')}
                />
              </div>

              <div className="wqep-footer">
                <FooterActions
                  view={view} event={event}
                  reason={reason} changeRequest={changeRequest}
                  setView={setView} setChoice={setChoice}
                  onEscalate={() => setEscalateOpen(true)}
                  onDecide={handleDecide}
                  onClose={handleBack}
                />
              </div>
            </>
          )}
        </div>

        {/* Right — thread / attestation / audit trail, tabbed */}
        <div className="wqep-side">
          <div className="wqep-tabs">
            <button
              className={`wqep-tab${activeTab === 'thread' ? ' wqep-tab--active' : ''}`}
              onClick={() => setActiveTab('thread')}
            >
              Thread
            </button>
            <button
              className={`wqep-tab${activeTab === 'attestation' ? ' wqep-tab--active' : ''}`}
              onClick={() => setActiveTab('attestation')}
            >
              Attestation
            </button>
            <button
              className={`wqep-tab${activeTab === 'audit' ? ' wqep-tab--active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Trail
            </button>
          </div>

          <div className="wqep-tab-panel">
            {activeTab === 'thread' && (
              <div className="wqep-comments" ref={commentsRef}>
                <CommentsSection
                  event={event}
                  thread={commentThreads?.[event.id]}
                  currentUser={currentUser}
                  onAddComment={addComment}
                  onCloseThread={closeThread}
                  onReopenThread={reopenThread}
                  notify={notify}
                  focusSignal={commentsSignal}
                  onMarkAnswered={handleMarkAnswered}
                />
              </div>
            )}
            {activeTab === 'attestation' && (
              <AttestationStrip event={event} onRequestVerification={() => setAttestOpen(true)} />
            )}
            {activeTab === 'audit' && (
              <AuditTrailBlock event={event} onViewFullAudit={() => navigate(`/work-queue/activity?artifact=${event.id}`)} />
            )}
          </div>
        </div>
      </div>

      {escalateOpen && (
        <EscalationModal
          event={event}
          onClose={() => setEscalateOpen(false)}
          onConfirm={handleEscalateConfirm}
        />
      )}

      {questionOpen && (
        <QuestionModal
          event={event}
          onClose={() => setQuestionOpen(false)}
          onSubmit={handleQuestionSubmit}
        />
      )}

      {attestOpen && (
        <AttestModal
          event={event}
          defaultMode="formal"
          currentUserId={currentUser.id}
          onClose={() => setAttestOpen(false)}
        />
      )}

      {toast && <div className="wq-toast">{toast}</div>}
    </div>
  )
}
