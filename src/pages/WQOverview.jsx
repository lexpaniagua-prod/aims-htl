import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  EVENTS, SEVERITY, SEVERITY_ORDER, STUDIOS,
  MESSAGES, ATTESTATIONS, PEOPLE,
} from '../data/workQueueData'

// ─── Persona-aware event filtering ───────────────────────────────────────────
function delegateOf(event) {
  const owner = PEOPLE.find(p => p.id === event.ownerId)
  return owner?.ooo?.delegate ?? null
}

function getPersonaEvents(user) {
  if (user.scope === 'executive') return EVENTS
  if (user.scope === 'manager') {
    return EVENTS.filter(e => {
      const owner = PEOPLE.find(p => p.id === e.ownerId)
      return owner && user.studios.some(s => owner.studios.includes(s))
    })
  }
  // individual — own events + OOO delegated
  return EVENTS.filter(e =>
    e.ownerId === user.id || delegateOf(e) === user.id
  )
}

// ─── Studio health config ─────────────────────────────────────────────────────
const STUDIO_HEALTH = [
  { key: 'gov',     score: 78 },
  { key: 'data',    score: 87 },
  { key: 'agentic', score: 92 },
]

function healthStatus(score) {
  if (score >= 85) return 'green'
  if (score >= 70) return 'amber'
  return 'red'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTs(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const SEV_CONFIG = [
  {
    sev: 'now',
    accent: 'var(--accent-coral)',
    border: 'rgba(244,63,94,0.35)',
    bg: 'rgba(244,63,94,0.07)',
    workflows: true,
    agents: true,
  },
  {
    sev: 'red',
    accent: '#ef4444',
    border: 'rgba(239,68,68,0.35)',
    bg: 'rgba(239,68,68,0.07)',
    workflows: true,
    agents: false,
  },
  {
    sev: 'yellow',
    accent: 'var(--accent-amber)',
    border: 'rgba(245,158,11,0.35)',
    bg: 'rgba(245,158,11,0.07)',
    workflows: false,
    agents: false,
  },
  {
    sev: 'green',
    accent: 'var(--accent-green)',
    border: 'rgba(16,185,129,0.35)',
    bg: 'rgba(16,185,129,0.07)',
    workflows: false,
    agents: false,
  },
]

export default function WQOverview() {
  const navigate = useNavigate()
  const { currentUser } = useOutletContext()
  const [expandedMsg, setExpandedMsg] = useState(null)

  const personaEvents = getPersonaEvents(currentUser)

  // Per-severity stats
  const sevStats = {}
  for (const sev of SEVERITY_ORDER) {
    const evts = personaEvents.filter(e => e.severity === sev)
    sevStats[sev] = {
      count: evts.length,
      workflows: evts.reduce((s, e) => s + (e.blastRadius?.workflows || 0), 0),
      agents:    evts.reduce((s, e) => s + (e.blastRadius?.agents    || 0), 0),
    }
  }

  // Pinned messages
  const pinnedMessages = MESSAGES.filter(m => m.pinned).slice(0, 2)

  // Attestations pending for this persona
  const pendingAttestations = ATTESTATIONS.filter(
    a => a.status === 'pending' && a.to === currentUser.id
  )

  return (
    <div className="wqov-root">

      {/* ── 1. Severity summary cards ─────────────────────────────────────── */}
      <div className="wqov-sev-grid">
        {SEV_CONFIG.map(({ sev, accent, border, bg }) => {
          const { count, workflows, agents } = sevStats[sev]
          const meta = SEVERITY[sev]
          const isEmpty = count === 0
          return (
            <div
              key={sev}
              className="wqov-sev-card"
              style={{
                borderLeftColor: accent,
                background: bg,
                opacity: isEmpty ? 0.45 : 1,
              }}
            >
              <div className="wqov-sev-card-top">
                <span className="wqov-sev-count" style={{ color: accent, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                  {count}
                </span>
                <span className="wqov-sev-label">{meta.label}</span>
              </div>

              {(workflows > 0 || agents > 0) && (
                <div className="wqov-sev-impact">
                  {workflows > 0 && (
                    <span className="wqov-impact-chip wqov-impact-chip--workflows">
                      {workflows} workflow{workflows !== 1 ? 's' : ''} blocked
                    </span>
                  )}
                  {agents > 0 && (
                    <span className="wqov-impact-chip wqov-impact-chip--agents">
                      {agents} agent{agents !== 1 ? 's' : ''} halted
                    </span>
                  )}
                </div>
              )}

              <button
                className="wqov-sev-cta"
                style={{ color: accent, borderColor: border }}
                onClick={() => navigate(`/work-queue/queue?severity=${sev}`)}
                disabled={isEmpty}
              >
                Go to {meta.label} →
              </button>
            </div>
          )
        })}
      </div>

      {/* ── 2. Studio health strip ────────────────────────────────────────── */}
      <section className="wqov-section">
        <h3 className="wqov-section-label">Studio Health</h3>
        <div className="wqov-health-strip">
          {STUDIO_HEALTH.map(({ key, score }) => {
            const studio = STUDIOS[key]
            const status = healthStatus(score)
            return (
              <div
                key={key}
                className="wqov-health-chip"
                style={{ borderColor: studio.accentColor + '55' }}
              >
                <span
                  className="wqov-health-dot"
                  style={{ background: status === 'green' ? 'var(--accent-green)' : status === 'amber' ? 'var(--accent-amber)' : '#ef4444' }}
                />
                <span className="wqov-health-studio-name">{studio.name}</span>
                <span
                  className="wqov-health-score"
                  style={{ color: status === 'green' ? 'var(--accent-green)' : status === 'amber' ? 'var(--accent-amber)' : '#ef4444' }}
                >
                  {score}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 3. Pinned messages ────────────────────────────────────────────── */}
      {pinnedMessages.length > 0 && (
        <section className="wqov-section">
          <h3 className="wqov-section-label">From your team</h3>
          <div className="wqov-pinned-list">
            {pinnedMessages.map(msg => {
              const sender = PEOPLE.find(p => p.id === msg.from)
              const isOpen = expandedMsg === msg.id
              return (
                <div key={msg.id} className="wqov-pinned-row">
                  <button
                    className="wqov-pinned-row-header"
                    onClick={() => setExpandedMsg(isOpen ? null : msg.id)}
                  >
                    <div className="wqov-pinned-sender">
                      <span className="wqov-pinned-sender-name">{sender?.name}</span>
                      <span className="wqov-pinned-sender-role">{sender?.role}</span>
                    </div>
                    <div className="wqov-pinned-title">{msg.subject}</div>
                    <div className="wqov-pinned-right">
                      <span className="wqov-pinned-ts">{fmtTs(msg.timestamp)}</span>
                      {isOpen
                        ? <ChevronUp  size={13} className="wqov-pinned-chevron" />
                        : <ChevronDown size={13} className="wqov-pinned-chevron" />
                      }
                    </div>
                  </button>
                  {isOpen && (
                    <div className="wqov-pinned-body">{msg.body}</div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 4. Attestations callout ───────────────────────────────────────── */}
      {pendingAttestations.length > 0 && (
        <section className="wqov-section">
          <div className="wqov-att-callout">
            <span className="wqov-att-callout-text">
              You have{' '}
              <strong>
                {pendingAttestations.length} attestation
                {pendingAttestations.length !== 1 ? 's' : ''}
              </strong>{' '}
              awaiting response.
            </span>
            <button
              className="wqov-att-callout-link"
              onClick={() => navigate('/work-queue/attestations')}
            >
              View attestations →
            </button>
          </div>
        </section>
      )}

    </div>
  )
}
