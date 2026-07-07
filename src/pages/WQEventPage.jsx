import { useState } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { EVENTS, EVENT_TYPES, SEVERITY } from '../data/workQueueData'
import {
  BodyContent, FooterActions, AttestAuditBlock, getInitialView, CONFIRM_VIEW_SET, VIEW_LABELS, SEV_COLORS,
} from './EventModal'
import CommentsSection from './EventComments'
import EscalationModal from './EscalationModal'
import AttestModal from './AttestModal'

// ─── Full-page event view ───────────────────────────────────────────────────────
// Same content as the slideout, laid out wide: decision surface on the left,
// full-height Comments on the right. Slideout = fast actions, this = complex work.
export default function WQEventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, commentThreads, addComment, closeThread, reopenThread, notify } = useOutletContext()

  const event = EVENTS.find(e => e.id === id)

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
  const sevColor = SEV_COLORS[event.severity]
  const showAudit = !CONFIRM_VIEW_SET.has(view)

  const handleDecide = (msg) => {
    setToast(msg)
    setTimeout(() => navigate('/work-queue/work-queues'), 900)
  }

  return (
    <div className="wqep-root">
      <button className="wqep-back" onClick={() => navigate('/work-queue/work-queues')}>
        <ArrowLeft size={13} /> Work Queues
      </button>

      <div className="wqep-sev-strip" style={{ background: sevColor }} />

      <div className="wqep-columns">
        {/* Left — event detail / decision surface */}
        <div className="wqep-detail">
          <div className="wqep-header">
            <div className="wqep-header-meta">
              <span className={`wq-badge wq-badge--sev wq-badge--${event.severity}`}>{sev.label}</span>
              <span className="evm-header-id">{event.id}</span>
              <span className="evm-header-sep">·</span>
              <span className="evm-header-spec">{event.spec}</span>
              <span className="evm-header-sep">·</span>
              <span className="evm-header-kind">{event.kind}</span>
              <span className="evm-header-type" style={{ color: etype.color }}>{etype.label.toUpperCase()}</span>
            </div>
            <h1 className="wqep-title">{event.title}</h1>
            <div className="evm-header-sub">
              <span className="evm-header-view-label">{VIEW_LABELS[view] || 'Event Detail'}</span>
              <span className="evm-header-due">{event.dueLabel}</span>
            </div>
            {event.missionCritical && event.blastRadius?.workflows > 0 && (
              <div className="wq-card-blast" style={{ marginTop: 10 }}>
                <AlertTriangle size={11} />
                Blocks {event.blastRadius.workflows} workflow{event.blastRadius.workflows !== 1 ? 's' : ''} · {event.blastRadius.agents} agent{event.blastRadius.agents !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="wqep-body">
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
            {showAudit && (
              <AttestAuditBlock event={event} onRequestAttestation={() => setAttestOpen(true)} />
            )}
          </div>

          <div className="wqep-footer">
            <FooterActions
              view={view} event={event}
              reason={reason} changeRequest={changeRequest}
              setView={setView} setChoice={setChoice}
              onEscalate={() => setEscalateOpen(true)}
              onDecide={handleDecide}
              onClose={() => navigate('/work-queue/work-queues')}
            />
          </div>
        </div>

        {/* Right — full-height comments */}
        <div className="wqep-comments">
          <CommentsSection
            event={event}
            thread={commentThreads?.[event.id]}
            currentUser={currentUser}
            onAddComment={addComment}
            onCloseThread={closeThread}
            onReopenThread={reopenThread}
            notify={notify}
          />
        </div>
      </div>

      {escalateOpen && (
        <EscalationModal
          event={event}
          onClose={() => setEscalateOpen(false)}
          onConfirm={({ recipient, urgency }) => {
            setEscalateOpen(false)
            setToast(`Escalated to ${recipient?.name || 'team'}${urgency === 'urgent' ? ' — marked urgent' : ''}`)
          }}
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
