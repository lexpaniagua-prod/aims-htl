import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Sparkles, X, SkipForward, Folder, Shield } from 'lucide-react'
import { PEOPLE } from '../data/workQueueData'
import './WorkQueue.css'

const TABS = [
  { label: 'Overview',     path: '/work-queue/overview'     },
  { label: 'Work Queues',  path: '/work-queue/work-queues'  },
  { label: 'Messages',     path: '/work-queue/messages'     },
  { label: 'Activity',     path: '/work-queue/activity'     },
  { label: 'Attestations', path: '/work-queue/attestations' },
]

const WQ_PERSONA_KEY = 'htl-wq-persona'
const WQ_WHATSNEW_KEY = 'htl-wq-whatsnew-seen'

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
  const location = useLocation()
  const navigate = useNavigate()

  const currentUser = PEOPLE.find(p => p.id === personaId) || PEOPLE[0]

  const handlePersonaChange = (id) => {
    setPersonaId(id)
    localStorage.setItem(WQ_PERSONA_KEY, id)
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
            {TABS.map(t => {
              const active = location.pathname.startsWith(t.path)
              return (
                <NavLink
                  key={t.path}
                  to={t.path}
                  className={`wq-tab${active ? ' wq-tab--active' : ''}`}
                >
                  {t.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="wq-persona-row">
            <button className="wqwn-trigger-btn" onClick={openModal}>
              <Sparkles size={11} />
              What's new
            </button>
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
          <Outlet context={{ currentUser, personaId }} />
        </div>
      </div>

      {whatsnewOpen && (
        <WhatsnewModal onClose={closeModal} onNavigate={handleModalNav} />
      )}
    </>
  )
}
