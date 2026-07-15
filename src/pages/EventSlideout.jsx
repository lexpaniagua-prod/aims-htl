import { useRef, useEffect, useState } from 'react'
import { X, AlertTriangle, GitBranch, ExternalLink } from 'lucide-react'
import { SEVERITY, EVENT_TYPES, STUDIOS, PEOPLE, AUDIT_LOG } from '../data/workQueueData'
import { SlideoutTypeContext } from './EventTypeBlocks'

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
export default function EventSlideout({ event, thread, askSignal, currentUser, onAddComment, notify, onClose, onOpenFullPage, onAsk, onViewThread, onEscalate, onTrace }) {
  const drawerRef       = useRef(null)
  const commentsAreaRef = useRef(null)
  const composerRef     = useRef(null)
  const [draft, setDraft] = useState('')
  const [highlightComments, setHighlightComments] = useState(false)

  useEffect(() => {
    document.body.classList.add('evsl-active')
    return () => document.body.classList.remove('evsl-active')
  }, [])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Ask (from the card, or re-clicked while the slideout is already open)
  // scrolls to and highlights the comments area, then focuses the composer —
  // the same position-and-focus behavior as Ask on the full details view.
  useEffect(() => {
    if (!askSignal) return
    const t = setTimeout(() => {
      commentsAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      composerRef.current?.focus()
      setHighlightComments(true)
    }, 60)
    const clearHighlight = setTimeout(() => setHighlightComments(false), 1400)
    return () => { clearTimeout(t); clearTimeout(clearHighlight) }
  }, [askSignal])

  if (!event) return null

  const sev     = SEVERITY[event.severity]
  const etype   = EVENT_TYPES[event.type]
  const studio  = STUDIOS[event.studio] || { key: event.studio, name: event.studio, short: (event.studio || '??').toUpperCase(), accentColor: '#6b7280' }
  const urgency = dueUrgency(event)
  const created = earliestTimestamp(event)

  const lastComment = thread?.comments?.[thread.comments.length - 1]
  const lastAuthor  = lastComment ? person(lastComment.authorId) : null

  const handlePost = () => {
    if (!draft.trim() || !currentUser) return
    onAddComment(event.id, { authorId: currentUser.id, body: draft.trim(), mentions: [], addParticipantIds: [] })
    notify?.('Comment posted')
    setDraft('')
  }

  return (
    <>
      <div className="evsl-overlay" onClick={onClose} />
      <div className="evsl-drawer" role="dialog" aria-modal="true" ref={drawerRef}>
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
            <SlideoutTypeContext event={event} thread={thread} />
          )}

          {/* Actions */}
          <div className="evsl-actions">
            <button className="wq-btn wq-btn--primary evsl-details-btn" onClick={() => onOpenFullPage(event)}>
              Open full details <ExternalLink size={12} />
            </button>
            <button className="wq-btn wq-btn--ghost" onClick={() => onAsk(event)}>Ask</button>
            <button className="wq-btn wq-btn--ghost wq-btn--escalate-text" onClick={() => onEscalate(event)}>Escalate</button>
          </div>

          {/* Comments area — indicator + composer. Scrolled to and highlighted
              by Ask, on the card or in the slideout, same as the full page. */}
          <div
            className={`evsl-comments-area${highlightComments ? ' evsl-comments-area--highlight' : ''}`}
            ref={commentsAreaRef}
          >
            {/* Comment indicator */}
            <div className="evsl-comment-indicator">
              {lastComment ? (
                <>
                  <div className="evsl-comment-preview">
                    <span className="evsl-comment-preview-name">{lastAuthor?.name || 'Unknown'}</span>
                    <span className="evsl-comment-preview-text">{lastComment.body.slice(0, 90)}{lastComment.body.length > 90 ? '…' : ''}</span>
                    <span className="evsl-comment-preview-time">{timeAgo(lastComment.timestamp)}</span>
                  </div>
                  <button className="evsl-view-thread-link" onClick={() => onViewThread(event)}>View thread →</button>
                </>
              ) : (
                <span className="evsl-no-comments">No comments yet</span>
              )}
            </div>

            {/* Minimal comment composer — same thread as the full page */}
            {currentUser && (
              <div className="evsl-composer">
                <textarea
                  ref={composerRef}
                  className="evsl-composer-input"
                  placeholder="Add a comment…"
                  rows={2}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                />
                <button className="wq-btn wq-btn--primary evsl-composer-post" disabled={!draft.trim()} onClick={handlePost}>
                  Post
                </button>
              </div>
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
