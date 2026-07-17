import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sparkles, X, SkipForward, Folder, Shield } from 'lucide-react'
import { PEOPLE, COMMENT_THREADS } from '../data/workQueueData'
import './WorkQueue.css'

const TABS = [
  { label: 'Overview',     path: '/work-queue/overview',          notV1: true },
  { label: 'Work Queues',  path: '/work-queue/work-queues'  },
  { label: 'Messages',     path: '/work-queue/messages',          notV1: true },
  { label: 'Messages',     path: '/work-queue/messages-proposal', proposal: true, notV1: true },
  { label: 'Activity',     path: '/work-queue/activity'     },
  { label: 'Attestations', path: '/work-queue/attestations',      notV1: true },
  { label: 'Task View',    path: '/work-queue/task-view',   proposal: true, notV1: true },
]

const WQ_PERSONA_KEY = 'htl-wq-persona'
const WQ_WHATSNEW_KEY = 'htl-wq-whatsnew-seen'
const WQ_SHOW_NOT_V1_KEY = 'htl-wq-show-not-v1'

// ─── What's New Modal ─────────────────────────────────────────────────────────
function WhatsnewModal({ onClose, onNavigate }) {
  return (
    <div className="wqwn-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wqwn-modal" role="dialog" aria-modal="true">

        <button className="wqwn-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="wqwn-header">
          <div className="wqwn-icon-badge">
            <Sparkles size={17} />
          </div>
          <div className="wqwn-eyebrow">What's New · HTL Work Queue</div>
          <h2 className="wqwn-title">Work Queue is live — here's what's in it</h2>
          <p className="wqwn-subtitle">
            A guided summary of what's built, what's interactive, and what's coming.
            You can reopen this any time from the What's New button.
          </p>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="wqwn-body">

          {/* Shipped banner */}
          <div className="wqwn-section-banner wqwn-section-banner--shipped">
            <span className="wqwn-section-banner-label">SHIPPED — Phase 1</span>
            <span className="wqwn-section-banner-sub">Core structure, mock data, and all four tabs are live.</span>
          </div>

          <div className="wqwn-cards">

            {/* Card 1 — Skip */}
            <div className="wqwn-card">
              <div className="wqwn-card-icon wqwn-card-icon--skip">
                <SkipForward size={15} />
              </div>
              <div className="wqwn-card-body">
                <div className="wqwn-card-eyebrow">YOU CAN NOW</div>
                <div className="wqwn-card-headline">You have an escape for Act Now items.</div>
                <p className="wqwn-card-desc">
                  Skip moves the item to the bottom of its severity group and
                  resurfaces it in 2 hours. Logged to audit.
                </p>
                <button className="wqwn-cta" onClick={() => onNavigate('/work-queue/work-queues?severity=now')}>
                  Find an Act Now item →
                </button>
              </div>
            </div>

            {/* Card 2 — Watch-folder */}
            <div className="wqwn-card">
              <div className="wqwn-card-icon wqwn-card-icon--folder">
                <Folder size={15} />
              </div>
              <div className="wqwn-card-body">
                <div className="wqwn-card-eyebrow">YOU CAN NOW</div>
                <div className="wqwn-card-headline">Watch-folder ingest is a first-class event.</div>
                <p className="wqwn-card-desc">
                  When files land in a watched drive, an approval event appears
                  in your queue before extraction begins.
                </p>
                <button className="wqwn-cta" onClick={() => onNavigate('/work-queue/work-queues?studio=gov&type=approve')}>
                  See watch-folder event →
                </button>
              </div>
            </div>

            {/* Card 3 — Break Glass */}
            <div className="wqwn-card">
              <div className="wqwn-card-icon wqwn-card-icon--shield">
                <Shield size={15} />
              </div>
              <div className="wqwn-card-body">
                <div className="wqwn-card-eyebrow">YOU CAN NOW</div>
                <div className="wqwn-card-headline">Break Glass requests appear as Act Now events.</div>
                <p className="wqwn-card-desc">
                  Two-key gate — both approvers must act. Logged to audit ledger
                  with requester, reason, and timestamp.
                </p>
                <button className="wqwn-cta" onClick={() => onNavigate('/work-queue/work-queues?severity=now')}>
                  See break-glass request →
                </button>
              </div>
            </div>

          </div>

          {/* Staged banner */}
          <div className="wqwn-section-banner wqwn-section-banner--staged">
            <span className="wqwn-section-banner-label">STAGED FOR NEXT PHASE</span>
          </div>
          <ul className="wqwn-staged-list">
            <li>Full modal flows for all event types — Approve, Review, Respond, Resolve, Acknowledge, Train</li>
            <li>Escalation modal with person/group selector</li>
            <li>Trace slideout with workflow step timeline</li>
            <li>Attestation verification request wired end-to-end</li>
            <li>Reports section in HTL Reports area</li>
          </ul>

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="wqwn-footer">
          <span className="wqwn-footer-hint">
            Switch persona to see Team Queue and manager-scoped views.
          </span>
          <button className="wq-btn wq-btn--primary" onClick={onClose}>
            Got it — start exploring
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function WorkQueueLayout() {
  const [personaId, setPersonaId] = useState(
    () => localStorage.getItem(WQ_PERSONA_KEY) || 'p1'
  )
  const [whatsnewOpen, setWhatsnewOpen] = useState(
    () => !sessionStorage.getItem(WQ_WHATSNEW_KEY)
  )
  const [showNotV1, setShowNotV1] = useState(
    () => localStorage.getItem(WQ_SHOW_NOT_V1_KEY) !== '0'
  )
  // Comment threads live here (not in WQQueue.jsx) so both the Work Queues list
  // and the standalone full-page event view share the same state.
  const [commentThreads, setCommentThreads] = useState(
    () => JSON.parse(JSON.stringify(COMMENT_THREADS))
  )
  // Resolved/escalated status also lives here so a decision made on the full
  // event page is reflected back in the Work Queues list after navigating back.
  const [resolvedIds,  setResolvedIds]  = useState(new Set())
  const [escalatedIds, setEscalatedIds] = useState(new Set())
  const markResolved  = (id) => setResolvedIds(prev => new Set([...prev, id]))
  const markEscalated = (id) => setEscalatedIds(prev => new Set([...prev, id]))
  // Questions created via Ask — dynamic events layered on top of the static
  // mock data, so both the recipient's queue and the originating thread see them.
  const [questionEvents, setQuestionEvents] = useState([])
  const [toast, setToast] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  const currentUser = PEOPLE.find(p => p.id === personaId) || PEOPLE[0]

  const visibleTabs = TABS.filter(t => showNotV1 || !t.notV1)

  const handlePersonaChange = (id) => {
    setPersonaId(id)
    localStorage.setItem(WQ_PERSONA_KEY, id)
  }

  const handleToggleNotV1 = () => {
    setShowNotV1(prev => {
      const next = !prev
      localStorage.setItem(WQ_SHOW_NOT_V1_KEY, next ? '1' : '0')
      return next
    })
  }

  // If hiding non-V1 tabs while sitting on one of them, bounce to Work Queues
  useEffect(() => {
    if (showNotV1) return
    const onHiddenTab = TABS.some(t => t.notV1 && (location.pathname === t.path || location.pathname.startsWith(t.path + '/')))
    if (onHiddenTab) navigate('/work-queue/work-queues', { replace: true })
  }, [showNotV1, location.pathname, navigate])

  // Toast auto-dismiss for comment-thread notifications
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const notify = (msg) => setToast(msg)

  const addComment = (eventId, { authorId, body, mentions, addParticipantIds }) => {
    setCommentThreads(prev => {
      const existing = prev[eventId]
      const newComment = { id: `CMT-${eventId}-${Date.now()}`, authorId, timestamp: new Date().toISOString(), body, mentions }
      if (existing) {
        const participants = [...new Set([...existing.participants, authorId, ...addParticipantIds])]
        return {
          ...prev,
          [eventId]: { ...existing, participants, comments: [...existing.comments, newComment] },
        }
      }
      const participants = [...new Set([authorId, ...addParticipantIds])]
      return {
        ...prev,
        [eventId]: { status: 'open', initiatorId: authorId, participants, comments: [newComment] },
      }
    })
  }

  const closeThread = (eventId) => {
    setCommentThreads(prev => prev[eventId] ? { ...prev, [eventId]: { ...prev[eventId], status: 'closed' } } : prev)
    notify('Thread closed')
  }

  const reopenThread = (eventId) => {
    setCommentThreads(prev => prev[eventId] ? { ...prev, [eventId]: { ...prev[eventId], status: 'open' } } : prev)
    notify('Thread reopened')
  }

  // Ask creates a Question event owned by the recipient, and drops a distinct
  // question entry into the originating event's thread linking the two.
  const createQuestion = ({ originatingEvent, recipient, question, why, dueDate }) => {
    const words = question.trim().split(/\s+/)
    const preview = words.slice(0, 8).join(' ')
    const questionId = `EVT-Q-${Date.now()}`
    const askedAt = new Date().toISOString()

    const newEvent = {
      id: questionId,
      severity: 'yellow',
      studio: originatingEvent.studio,
      ownerId: recipient.id,
      title: `Question from ${currentUser.name}: ${preview}${words.length > 8 ? '...' : ''}`,
      detail: question,
      type: 'question',
      origin: 'internal',
      dueToday: false,
      missionCritical: false,
      eventCategory: 'question',
      quickActions: ['Respond'],
      spec: `Q-${questionId.slice(-6)}`,
      kind: 'Question',
      dueLabel: dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date',
      dueDate: dueDate || null,
      blastRadius: { workflows: 0, agents: 0, description: '' },
      questionText: question,
      whyText: why,
      askedById: currentUser.id,
      askedAt,
      linkedEventId: originatingEvent.id,
      linkedEvent: { id: originatingEvent.id, title: originatingEvent.title },
    }

    setQuestionEvents(prev => [...prev, newEvent])

    const questionComment = {
      id: `CMT-Q-${Date.now()}`,
      type: 'question',
      authorId: currentUser.id,
      timestamp: askedAt,
      questionText: question,
      assignedToId: recipient.id,
      status: 'awaiting',
      responseText: null,
      responseTimestamp: null,
      linkedQuestionEventId: questionId,
    }
    setCommentThreads(prev => {
      const existing = prev[originatingEvent.id]
      if (existing) {
        const participants = [...new Set([...existing.participants, currentUser.id, recipient.id])]
        return { ...prev, [originatingEvent.id]: { ...existing, participants, comments: [...existing.comments, questionComment] } }
      }
      const participants = [...new Set([currentUser.id, recipient.id])]
      return { ...prev, [originatingEvent.id]: { status: 'open', initiatorId: currentUser.id, participants, comments: [questionComment] } }
    })

    return newEvent
  }

  // Marks a question answered wherever it's triggered from — the demo "Mark
  // answered" button on the thread bubble, or the Question event's own full
  // page response composer. `eventId` is the originating event whose thread
  // holds the question entry; `questionEventId` is the Question event's id.
  const markQuestionAnswered = ({ eventId, questionEventId, responseText }) => {
    setCommentThreads(prev => {
      const existing = prev[eventId]
      if (!existing) return prev
      const comments = existing.comments.map(c =>
        c.type === 'question' && c.linkedQuestionEventId === questionEventId
          ? { ...c, status: 'answered', responseText, responseTimestamp: new Date().toISOString() }
          : c
      )
      return { ...prev, [eventId]: { ...existing, comments } }
    })
    markResolved(questionEventId)
  }

  const openModal  = () => setWhatsnewOpen(true)
  const closeModal = () => {
    setWhatsnewOpen(false)
    sessionStorage.setItem(WQ_WHATSNEW_KEY, '1')
  }
  const handleModalNav = (path) => {
    closeModal()
    navigate(path)
  }

  return (
    <>
      <div className="wq-root">
        <div className="wq-subnav">
          <nav className="wq-tabs">
            {visibleTabs.map(t => {
              const active = location.pathname === t.path || location.pathname.startsWith(t.path + '/')
              return (
                <NavLink
                  key={t.path}
                  to={t.path}
                  className={`wq-tab${active ? ' wq-tab--active' : ''}`}
                >
                  {t.proposal
                    ? <>{t.label} <span className="wq-tab-proposal-badge">Proposal</span></>
                    : t.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="wq-persona-row">
            <button className="wqwn-trigger-btn" onClick={openModal}>
              <Sparkles size={11} />
              What's new
            </button>
            <label className="wq-notv1-toggle">
              <span className="wq-notv1-toggle-label">Not for V1</span>
              <button
                type="button"
                role="switch"
                aria-checked={showNotV1}
                className={`wq-switch${showNotV1 ? ' wq-switch--on' : ''}`}
                onClick={handleToggleNotV1}
              >
                <span className="wq-switch-knob" />
              </button>
            </label>
            <span className="wq-persona-label">Persona:</span>
            <select
              className="wq-persona-select"
              value={personaId}
              onChange={e => handlePersonaChange(e.target.value)}
            >
              {PEOPLE.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.scope})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="wq-page">
          <Outlet context={{
            currentUser, personaId, commentThreads, addComment, closeThread, reopenThread, notify,
            resolvedIds, markResolved, escalatedIds, markEscalated,
            questionEvents, createQuestion, markQuestionAnswered,
          }} />
        </div>
      </div>

      {whatsnewOpen && (
        <WhatsnewModal onClose={closeModal} onNavigate={handleModalNav} />
      )}

      {toast && <div className="wq-toast">{toast}</div>}
    </>
  )
}
