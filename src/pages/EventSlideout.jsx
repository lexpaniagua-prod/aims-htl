import { useRef, useEffect } from 'react'
import { X, AlertTriangle, GitBranch, ExternalLink, MessageSquare } from 'lucide-react'
import { SEVERITY, EVENT_TYPES, STUDIOS, PEOPLE, AUDIT_LOG } from '../data/workQueueData'
import { SlideoutTypeContext } from './EventTypeBlocks'
import { useSlideoutResize } from '../components/useSlideoutResize'

const SLIDEOUT_DEFAULT_WIDTH = 420

// ── Helpers ────────────────────────────────────────────────────────────────────

const TODAY = '2026-07-02'
const NOW   = new Date('2026-07-02T09:00:00Z')

function dueUrgency(event) {
  if (!event.dueDate) return 'none'
  if (event.dueDate < TODAY)  return 'overdue'
  if (event.dueDate === TODAY) return 'today'
  const diff = (new Date(event.dueDate) - new Date(TODAY)) / 86400000
  if (diff <= 7) return 'week'
  return 'future'
}

function timeAgo(iso) {
  const diffH = (NOW - new Date(iso)) / 3600000
  if (diffH < 1) return 'Just now'
  const diffD = Math.floor(diffH / 24)
  if (diffD >= 1) return `${diffD}d ago`
  return `${Math.floor(diffH)}h ago`
}

function person(id) {
  return PEOPLE.find(p => p.id === id)
}

// Earliest audit/trace timestamp we have for this event — used as a "created" stamp.
function earliestTimestamp(event) {
  const logTimes = AUDIT_LOG
    .filter(a => a.artifact?.includes(event.id) || a.artifact?.includes(event.spec))
    .map(a => a.timestamp)
  const stepTimes = (event.sourceWorkflow?.steps || []).map(s => s.timestamp).filter(Boolean)
  const all = [...logTimes, ...stepTimes].sort()
  return all[0] || null
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Event slideout — Level 1 fast-context drawer ────────────────────────────────
export default function EventSlideout({ event, thread, onClose, onOpenFullPage, onAsk, onViewThread, onEscalate, onTrace, onNavigateToEvent }) {
  const drawerRef = useRef(null)
  const { width, onPointerDown } = useSlideoutResize(SLIDEOUT_DEFAULT_WIDTH)

  useEffect(() => {
    document.body.classList.add('evsl-active')
    return () => document.body.classList.remove('evsl-active')
  }, [])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!event) return null

  const sev     = SEVERITY[event.severity]
  const etype   = EVENT_TYPES[event.type]
  const studio  = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: (event.studio || '??').toUpperCase(), accentColor: '#6b7280' }
  const urgency = dueUrgency(event)
  const created = earliestTimestamp(event)

  const comments     = thread?.comments || []
  const commentCount = comments.length
  const lastComment  = comments[comments.length - 1]
  const lastAuthor   = lastComment ? person(lastComment.authorId) : null
  const lastPreviewText = lastComment
    ? (lastComment.type === 'question' ? `Question: ${lastComment.questionText}` : lastComment.body)
    : ''

  return (
    <>
      <div className="evsl-overlay" onClick={onClose} />
      <div className="evsl-drawer" role="dialog" aria-modal="true" ref={drawerRef} style={{ width }}>
        <div className="evsl-resize-handle" onPointerDown={onPointerDown} />
        <div className="evsl-sev-strip" style={{ background: sev.color }} />

        <div className="evsl-content">
          {/* Header */}
          <div className="evsl-header">
            <div className="evsl-header-top">
              <div className="evsl-header-badges">
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
              </div>
              <button className="evsl-close-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
            </div>
            <span className="evsl-header-id">{event.id}</span>
          </div>

          {/* Title */}
          <div className="evsl-title-section">
            <h2 className="evsl-title">{event.title}</h2>
            {event.dueLabel && (
              <span className={`wq-card-due wq-card-due--${urgency}`}>{event.dueLabel}</span>
            )}
          </div>

          {/* Quick context */}
          <div className="evsl-context">
            <p className="evsl-detail">{event.detail}</p>
            {event.missionCritical && event.blastRadius?.workflows > 0 && (
              <div className="wq-card-blast">
                <AlertTriangle size={11} />
                Blocks {event.blastRadius.workflows} workflow{event.blastRadius.workflows !== 1 ? 's' : ''} · {event.blastRadius.agents} agent{event.blastRadius.agents !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Trace pill */}
          {event.sourceWorkflow && (
            <button className="evsl-trace-pill" onClick={() => onTrace(event)}>
              <GitBranch size={11} /> Trace · {event.sourceWorkflow.name}
            </button>
          )}

          {/* Type context block — event-category-specific summary */}
          {event.eventCategory && (
            <SlideoutTypeContext event={event} thread={thread} onNavigateToEvent={onNavigateToEvent} />
          )}

          {/* Actions */}
          <div className="evsl-actions">
            <button className="wq-btn wq-btn--primary evsl-details-btn" onClick={() => onOpenFullPage(event)}>
              Open full details <ExternalLink size={12} />
            </button>
            <button className="wq-btn wq-btn--ghost" onClick={() => onAsk(event)}>Ask</button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => onEscalate(event)}>Escalate</button>
          </div>

          {/* Comment indicator — thread lives only on the full page now.
              "View thread →" navigates there and lands on the Thread tab. */}
          <div className="evsl-comment-indicator">
            {commentCount > 0 ? (
              <>
                <div className="evsl-comment-count-row">
                  <MessageSquare size={13} />
                  <span>{commentCount} comment{commentCount === 1 ? '' : 's'}</span>
                </div>
                <div className="evsl-comment-preview">
                  <span className="evsl-comment-preview-line">
                    <span className="evsl-comment-preview-name">{lastAuthor?.name || 'Unknown'}:</span>{' '}
                    {lastPreviewText.slice(0, 90)}{lastPreviewText.length > 90 ? '…' : ''}
                  </span>
                </div>
                <button className="evsl-view-thread-link" onClick={() => onViewThread(event)}>View thread →</button>
              </>
            ) : (
              <span className="evsl-no-comments">
                No comments yet · <button className="evsl-view-thread-link evsl-view-thread-link--inline" onClick={() => onViewThread(event)}>View thread →</button>
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="evsl-footer">
            <span className="evsl-footer-id">{event.id}</span>
            {created && <span className="evsl-footer-sep">·</span>}
            {created && <span className="evsl-footer-created">Created {fmtDate(created)}</span>}
            <span className="evsl-footer-sep">·</span>
            <span className="evsl-footer-studio">{studio.name}</span>
          </div>
        </div>
      </div>
    </>
  )
}
