import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, ChevronRight,
  GraduationCap, RotateCcw, Calendar, ExternalLink,
  Sun, Briefcase, Users,
} from 'lucide-react'
import {
  EVENTS, SEVERITY, SEVERITY_ORDER, STUDIOS, EVENT_TYPES,
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
  return EVENTS.filter(e =>
    e.ownerId === user.id || delegateOf(e) === user.id
  )
}

// ─── Studio health base data ──────────────────────────────────────────────────
const STUDIO_HEALTH = [
  { key: 'gov',     score: 78, trend: -2, criticalCount: 1 },
  { key: 'data',    score: 87, trend: +3, criticalCount: 0 },
  { key: 'agentic', score: 92, trend: +4, criticalCount: 0 },
]

// ─── Mock partition health data ───────────────────────────────────────────────
const PARTITION_HEALTH = {
  gov: [
    {
      id: 'gov-finance', name: 'Finance Controls',
      score: 85, trend: +3, status: 'healthy', gap: 15,
      summary: 'Policy refresh pending, connector token healthy.',
      actions: [
        { id: 1, title: 'Extend Return Policy TTL (6d)', lift: 8,  cta: 'extend',   link: 'E-2002', studio: 'Gov'  },
        { id: 2, title: 'Review quarterly compliance report',       lift: 4,  cta: 'open',     link: null,     studio: 'Gov'  },
        { id: 3, title: 'Verify attestation signatures on 3 certs', lift: 3,  cta: 'open',     link: null,     studio: 'Gov'  },
      ],
    },
    {
      id: 'gov-legal', name: 'Legal & Compliance',
      score: 72, trend: -1, status: 'watch', gap: 28,
      summary: 'Contract review backlog growing. Two KBUs near expiry.',
      actions: [
        { id: 1, title: 'Approve contract amendment — vendor MSA',  lift: 12, cta: 'open',     link: 'E-3001', studio: 'Gov'  },
        { id: 2, title: 'Refresh KBU: Legal Terms v2.1',            lift: 4,  cta: 'open',     link: null,     studio: 'Gov'  },
        { id: 3, title: 'Audit data retention policy adherence',    lift: 12, cta: 'open',     link: null,     studio: 'Gov'  },
      ],
    },
    {
      id: 'gov-regulatory', name: 'Regulatory Reporting',
      score: 90, trend: +2, status: 'healthy', gap: 10,
      summary: 'All reports filed. Next cycle opens July 1.',
      actions: [
        { id: 1, title: 'Pre-verify Q3 filing templates',           lift: 5,  cta: 'open',     link: null,     studio: 'Gov'  },
        { id: 2, title: 'Schedule semi-annual audit walkthrough',    lift: 5,  cta: 'schedule', link: null,     studio: 'Gov'  },
      ],
    },
  ],
  data: [
    {
      id: 'data-crm', name: 'CRM Ingestion',
      score: 88, trend: +5, status: 'healthy', gap: 12,
      summary: 'Salesforce rotation pending but otherwise strong.',
      actions: [
        { id: 1, title: 'Rotate Salesforce OAuth token (4d)',       lift: 10, cta: 'rotate',   link: 'E-2001', studio: 'Data' },
        { id: 2, title: 'Close HubSpot schema drift warning',       lift: 2,  cta: 'open',     link: null,     studio: 'Data' },
      ],
    },
    {
      id: 'data-trading', name: 'Trading System Feeds',
      score: 95, trend: +1, status: 'healthy', gap: 5,
      summary: 'All feeds green.',
      actions: [
        { id: 1, title: 'Schedule monthly embedding index refresh', lift: 3,  cta: 'schedule', link: 'E-4001', studio: 'Data' },
        { id: 2, title: 'Verify exchange cut-off times for DST',    lift: 2,  cta: 'open',     link: null,     studio: 'Data' },
      ],
    },
    {
      id: 'data-pii', name: 'PII Data Lake',
      score: 70, trend: -3, status: 'watch', gap: 30,
      summary: 'Access recertification overdue. Encryption key rotation needed.',
      actions: [
        { id: 1, title: 'Complete Q2 access recertification',       lift: 15, cta: 'open',     link: 'E-3002', studio: 'Data' },
        { id: 2, title: 'Rotate encryption key — 45d overdue',      lift: 10, cta: 'rotate',   link: null,     studio: 'Data' },
        { id: 3, title: 'Review stale user access grants',          lift: 5,  cta: 'open',     link: null,     studio: 'Data' },
      ],
    },
  ],
  agentic: [
    {
      id: 'agnt-orch', name: 'Agent Orchestration',
      score: 91, trend: +2, status: 'healthy', gap: 9,
      summary: 'All orchestration pipelines healthy. One model pin expiring.',
      actions: [
        { id: 1, title: 'Update workflow spec pin from Truth v3.1', lift: 5,  cta: 'open',     link: 'E-4002', studio: 'Agentic' },
        { id: 2, title: 'Review SalesForecastPA confidence thresholds', lift: 4, cta: 'open',  link: null,     studio: 'Agentic' },
      ],
    },
    {
      id: 'agnt-routing', name: 'Model Routing',
      score: 78, trend: +1, status: 'watch', gap: 22,
      summary: 'Two routes using deprecated model endpoints.',
      actions: [
        { id: 1, title: 'Migrate deprecated model routes to current versions', lift: 12, cta: 'open',     link: null, studio: 'Agentic' },
        { id: 2, title: 'Validate confidence routing logic post-migration',    lift: 5,  cta: 'schedule', link: null, studio: 'Agentic' },
        { id: 3, title: 'Update fallback route thresholds',                    lift: 5,  cta: 'open',     link: null, studio: 'Agentic' },
      ],
    },
    {
      id: 'agnt-workflow', name: 'Workflow Automation',
      score: 65, trend: -5, status: 'critical', gap: 35,
      summary: 'Cross-studio schema mismatch blocking quote pipeline.',
      actions: [
        { id: 1, title: 'Apply schema patch — CHAIN-0712 (blocking now)', lift: 20, cta: 'open', link: 'E-2003', studio: 'Agentic' },
        { id: 2, title: 'Re-enable QuoteBot after patch applied',          lift: 10, cta: 'open', link: null,     studio: 'Agentic' },
        { id: 3, title: 'Run regression test on quote pipeline',           lift: 5,  cta: 'open', link: null,     studio: 'Agentic' },
      ],
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function healthStatus(score) {
  if (score >= 85) return 'green'
  if (score >= 70) return 'amber'
  return 'red'
}

function statusColor(status) {
  if (status === 'healthy') return 'var(--accent-green)'
  if (status === 'watch')   return 'var(--accent-amber)'
  return '#ef4444'
}

function statusLabel(status) {
  if (status === 'healthy') return 'Healthy'
  if (status === 'watch')   return 'Watch'
  return 'Critical'
}

function fmtTs(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function personaStudios(user) {
  if (user.scope === 'executive') return ['gov', 'data', 'agentic']
  return user.studios
}

// ─── SEV config ───────────────────────────────────────────────────────────────
const SEV_CONFIG = [
  { sev: 'now',    accent: 'var(--accent-coral)', border: 'rgba(244,63,94,0.35)',  bg: 'rgba(244,63,94,0.07)'  },
  { sev: 'red',    accent: '#ef4444',             border: 'rgba(239,68,68,0.35)',  bg: 'rgba(239,68,68,0.07)'  },
  { sev: 'yellow', accent: 'var(--accent-amber)', border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.07)' },
  { sev: 'green',  accent: 'var(--accent-green)', border: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.07)' },
]

// ─── DonutScore ───────────────────────────────────────────────────────────────
function DonutScore({ score, color }) {
  const r    = 26
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="wqov-donut">
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle
        cx="34" cy="34" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <text
        x="34" y="39" textAnchor="middle"
        fontSize="16" fontWeight="700"
        fontFamily="'Inter', sans-serif"
        fill={color}
      >
        {score}
      </text>
    </svg>
  )
}

// ─── SchedulePopover ──────────────────────────────────────────────────────────
function SchedulePopover({ onConfirm, onClose }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  return (
    <div className="wqov-sched-popover">
      <div className="wqov-sched-row">
        <label className="wqov-sched-label">
          Date
          <input type="date" className="wqov-sched-input" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <label className="wqov-sched-label">
          Time
          <input type="time" className="wqov-sched-input" value={time} onChange={e => setTime(e.target.value)} />
        </label>
      </div>
      <div className="wqov-sched-actions">
        <button className="wq-btn wq-btn--ghost wq-btn--sm" onClick={onClose}>Cancel</button>
        <button className="wq-btn wq-btn--primary wq-btn--sm" disabled={!date} onClick={() => onConfirm(`${date} at ${time}`)}>
          Confirm
        </button>
      </div>
    </div>
  )
}

// ─── PartitionCard ────────────────────────────────────────────────────────────
function PartitionCard({ partition, studioKey }) {
  const [schedOpen, setSchedOpen] = useState(null)
  const [toast, setToast]         = useState(null)

  const studio  = STUDIOS[studioKey]
  const sColor  = statusColor(partition.status)
  const sLabel  = statusLabel(partition.status)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="wqov-partition-card">
      {toast && <div className="wqov-partition-toast">{toast}</div>}

      {/* Header: donut + meta */}
      <div className="wqov-partition-header">
        <DonutScore score={partition.score} color={sColor} />
        <div className="wqov-partition-meta">
          <div className="wqov-partition-badges">
            <span className="wqov-part-badge" style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}>
              {studio.short}
            </span>
            <span className="wqov-part-badge wqov-part-badge--name">{partition.name}</span>
            <span className="wqov-part-badge" style={{ color: sColor, borderColor: sColor.replace('var', '') + '44' }}>
              {sLabel}
            </span>
          </div>
          <div className="wqov-partition-trend" style={{ color: partition.trend >= 0 ? 'var(--accent-green)' : '#ef4444' }}>
            {partition.trend >= 0 ? '↑' : '↓'} {Math.abs(partition.trend)} pts vs last week
          </div>
          <div className="wqov-partition-summary">{partition.summary}</div>
        </div>
      </div>

      {/* PATH TO 100% */}
      <div className="wqov-path-section">
        <div className="wqov-path-header">
          <span className="wqov-path-label">PATH TO 100%</span>
          <span className="wqov-path-gap">Gap to close: {partition.gap} pts</span>
        </div>
        <p className="wqov-path-desc">
          Do these in order and you'll reach 100% health on this partition.
          Estimated lift: +{partition.gap} pts.
        </p>
        <ol className="wqov-action-list">
          {partition.actions.map(action => (
            <li key={action.id} className="wqov-action-item">
              <span className="wqov-action-step">{action.id}</span>
              <div className="wqov-action-main">
                <span className="wqov-action-title">{action.title}</span>
                <div className="wqov-action-chips">
                  {action.link && (
                    <span className="wqov-chip wqov-chip--link">Linked: {action.link}</span>
                  )}
                  <span className="wqov-chip wqov-chip--studio">Opens in {action.studio}</span>
                  <span className="wqov-chip wqov-chip--lift">+{action.lift}%</span>
                </div>
              </div>
              <div className="wqov-action-btn-col">
                {action.cta === 'rotate' && (
                  <button className="wq-btn wq-btn--primary wq-btn--sm" onClick={() => showToast('Rotation scheduled — token will refresh within 4 hours')}>
                    <RotateCcw size={10} style={{ marginRight: 4 }} />Rotate now
                  </button>
                )}
                {action.cta === 'schedule' && (
                  <div className="wqov-sched-wrap">
                    <button className="wq-btn wq-btn--ghost wq-btn--sm" onClick={() => setSchedOpen(a => a === action.id ? null : action.id)}>
                      <Calendar size={10} style={{ marginRight: 4 }} />Schedule
                    </button>
                    {schedOpen === action.id && (
                      <SchedulePopover
                        onClose={() => setSchedOpen(null)}
                        onConfirm={dt => { setSchedOpen(null); showToast(`Scheduled for ${dt}`) }}
                      />
                    )}
                  </div>
                )}
                {action.cta === 'extend' && (
                  <button className="wq-btn wq-btn--primary wq-btn--sm" onClick={() => showToast('TTL extended by 90 days')}>
                    Extend now
                  </button>
                )}
                {action.cta === 'open' && (
                  <button className="wq-btn wq-btn--ghost wq-btn--sm" onClick={() => showToast(`Opening ${partition.name} in ${action.studio}…`)}>
                    <ExternalLink size={10} style={{ marginRight: 4 }} />Open in {action.studio}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ─── Studio health section (compact ↔ expanded) ───────────────────────────────
function StudioHealthSection({ currentUser }) {
  const [expandedKey, setExpandedKey] = useState(null)
  const [exportToast, setExportToast] = useState(false)

  const visibleStudios = personaStudios(currentUser)
  const studioData     = STUDIO_HEALTH.filter(s => visibleStudios.includes(s.key))
  const isExpanded     = expandedKey !== null

  const expandHeader = currentUser.scope === 'individual'
    ? 'Your partition health'
    : currentUser.scope === 'manager'
    ? 'Studio health & partition breakdown'
    : 'Platform health — all studios'

  const expandSubtitle = currentUser.scope === 'individual'
    ? `You own ${currentUser.partitions.includes('*') ? 'all' : currentUser.partitions.length} partition${currentUser.partitions.length !== 1 ? 's' : ''}. Each one is scored independently. Get each to 100% and your studio moves with you.`
    : currentUser.scope === 'manager'
    ? 'Overall scores for the studios you manage, plus every partition underneath.'
    : 'Full rollup including exec-only partitions.'

  const partitions = expandedKey ? (PARTITION_HEALTH[expandedKey] || []) : []

  function handleExport() {
    setExportToast(true)
    setTimeout(() => setExportToast(false), 2500)
  }

  return (
    <section className="wqov-section">
      <h3 className="wqov-section-label">Studio Health</h3>

      {!isExpanded ? (
        /* ── Compact chips ── */
        <div className="wqov-health-strip">
          {studioData.map(({ key, score, trend, criticalCount }) => {
            const studio = STUDIOS[key]
            const hs     = healthStatus(score)
            const dotClr = hs === 'green' ? 'var(--accent-green)' : hs === 'amber' ? 'var(--accent-amber)' : '#ef4444'
            const scoreClr = dotClr
            return (
              <button
                key={key}
                className="wqov-health-chip wqov-health-chip--btn"
                style={{ borderColor: studio.accentColor + '55' }}
                onClick={() => setExpandedKey(key)}
              >
                <span className="wqov-health-dot" style={{ background: dotClr }} />
                <span className="wqov-health-studio-name">{studio.name}</span>
                <span className="wqov-health-score" style={{ color: scoreClr }}>{score}</span>
                {trend !== 0 && (
                  <span className="wqov-health-trend" style={{ color: trend > 0 ? 'var(--accent-green)' : '#ef4444' }}>
                    {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}
                  </span>
                )}
                {criticalCount > 0 && (
                  <span className="wqov-health-crit">{criticalCount} critical</span>
                )}
                <ChevronRight size={11} className="wqov-health-chevron" />
              </button>
            )
          })}
        </div>
      ) : (
        /* ── Expanded panel ── */
        <div className="wqov-health-expanded">
          <div className="wqov-expanded-top">
            <div className="wqov-expanded-heading">
              <div className="wqov-expanded-title">{expandHeader}</div>
              <div className="wqov-expanded-subtitle">{expandSubtitle}</div>
            </div>
            <div className="wqov-expanded-actions">
              {exportToast
                ? <span className="wqov-export-toast">Preparing export…</span>
                : <button className="wq-btn wq-btn--ghost" onClick={handleExport}>Export report</button>
              }
              <button className="wqov-compact-link" onClick={() => setExpandedKey(null)}>
                View compact ↑
              </button>
            </div>
          </div>

          {/* Studio tab selector */}
          <div className="wqov-studio-tabs">
            {studioData.map(({ key, score }) => {
              const studio  = STUDIOS[key]
              const isActive = expandedKey === key
              return (
                <button
                  key={key}
                  className={`wqov-studio-tab${isActive ? ' wqov-studio-tab--active' : ''}`}
                  style={isActive ? { borderBottomColor: studio.accentColor, color: studio.accentColor } : {}}
                  onClick={() => setExpandedKey(key)}
                >
                  {studio.short}
                  <span
                    className="wqov-studio-tab-score"
                    style={{ color: healthStatus(score) === 'green' ? 'var(--accent-green)' : healthStatus(score) === 'amber' ? 'var(--accent-amber)' : '#ef4444' }}
                  >
                    {score}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Partition grid */}
          <div className="wqov-partition-grid">
            {partitions.map(p => (
              <PartitionCard key={p.id} partition={p} studioKey={expandedKey} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Train Me card ────────────────────────────────────────────────────────────
function TrainMeCard({ personaEvents, navigate }) {
  const trainEvents = personaEvents.filter(e => e.type === 'train')
  const count  = trainEvents.length
  const isEmpty = count === 0

  return (
    <div className="wqov-trainme-card" style={{ opacity: isEmpty ? 0.55 : 1 }}>
      <div className="wqov-trainme-icon-wrap">
        <GraduationCap size={22} />
      </div>
      <div className="wqov-trainme-body">
        <div className="wqov-trainme-label">Train Me</div>
        <div className="wqov-trainme-count" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
          {count}
        </div>
        <div className="wqov-trainme-sub">
          {isEmpty ? 'No Train Me items right now' : 'submissions awaiting your review'}
        </div>
      </div>
      <button
        className="wqov-trainme-cta"
        onClick={() => navigate('/work-queue/work-queues?view=my-work&type=train')}
        disabled={isEmpty}
      >
        Review Train Me items →
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WQOverview() {
  const navigate = useNavigate()
  const { currentUser } = useOutletContext()
  const [expandedMsg, setExpandedMsg] = useState(null)

  const personaEvents = getPersonaEvents(currentUser)

  const sevStats = {}
  for (const sev of SEVERITY_ORDER) {
    const evts = personaEvents.filter(e => e.severity === sev)
    sevStats[sev] = {
      count:     evts.length,
      workflows: evts.reduce((s, e) => s + (e.blastRadius?.workflows || 0), 0),
      agents:    evts.reduce((s, e) => s + (e.blastRadius?.agents    || 0), 0),
    }
  }

  // Part 4: type count cards
  const TYPE_CARDS = Object.values(EVENT_TYPES).map(et => ({
    ...et,
    count: personaEvents.filter(e => e.type === et.key).length,
  }))

  // Part 6: 2 most recent messages by timestamp
  const recentMessages = [...MESSAGES]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 2)

  const pendingAttestations = ATTESTATIONS.filter(
    a => a.status === 'pending' && a.to === currentUser.id
  )

  return (
    <div className="wqov-root">

      {/* ── 1. Severity summary cards ─────────────────────────────────── */}
      <div className="wqov-sev-grid">
        {SEV_CONFIG.map(({ sev, accent, border, bg }) => {
          const { count, workflows, agents } = sevStats[sev]
          const meta    = SEVERITY[sev]
          const isEmpty = count === 0
          return (
            <div
              key={sev}
              className="wqov-sev-card"
              style={{ borderLeftColor: accent, background: bg, opacity: isEmpty ? 0.45 : 1 }}
            >
              <div className="wqov-sev-card-top">
                <span className="wqov-sev-count" style={{ color: accent, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
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
                onClick={() => navigate(`/work-queue/work-queues?view=my-work&severity=${sev}`)}
                disabled={isEmpty}
              >
                Go to {meta.label} →
              </button>
            </div>
          )
        })}
      </div>

      {/* ── 2. Studio health (expandable) ─────────────────────────────── */}
      <StudioHealthSection currentUser={currentUser} />

      {/* ── 3. Event-type count cards ─────────────────────────────────── */}
      <section className="wqov-section">
        <h3 className="wqov-section-label">By event type</h3>
        <div className="wqov-type-grid">
          {TYPE_CARDS.map(et => (
            <button
              key={et.key}
              className={`wqov-type-card${et.count === 0 ? ' wqov-type-card--empty' : ''}`}
              style={{ borderTopColor: et.color }}
              onClick={() => navigate(`/work-queue/work-queues?view=my-work&type=${et.key}`)}
              disabled={et.count === 0}
            >
              <span className="wqov-type-count" style={{ color: et.color, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                {et.count}
              </span>
              <span className="wqov-type-label">{et.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 5. Navigation shortcut cards ─────────────────────────────── */}
      <section className="wqov-section">
        <h3 className="wqov-section-label">Jump to</h3>
        <div className="wqov-shortcut-grid">
          <button className="wqov-shortcut-card" onClick={() => navigate('/work-queue/work-queues?view=my-day')}>
            <Sun size={20} className="wqov-shortcut-icon wqov-shortcut-icon--day" />
            <div className="wqov-shortcut-body">
              <div className="wqov-shortcut-title">My Day</div>
              <div className="wqov-shortcut-desc">AI-assembled daily view — Start Here card, critical items, and your focus time estimate.</div>
            </div>
            <ChevronRight size={14} className="wqov-shortcut-arrow" />
          </button>
          <button className="wqov-shortcut-card" onClick={() => navigate('/work-queue/work-queues?view=my-work')}>
            <Briefcase size={20} className="wqov-shortcut-icon wqov-shortcut-icon--work" />
            <div className="wqov-shortcut-body">
              <div className="wqov-shortcut-title">My Work</div>
              <div className="wqov-shortcut-desc">All events assigned to you — grouped by severity, fully filterable by studio and type.</div>
            </div>
            <ChevronRight size={14} className="wqov-shortcut-arrow" />
          </button>
          <button className="wqov-shortcut-card" onClick={() => navigate('/work-queue/work-queues?view=my-team')}>
            <Users size={20} className="wqov-shortcut-icon wqov-shortcut-icon--team" />
            <div className="wqov-shortcut-body">
              <div className="wqov-shortcut-title">My Team</div>
              <div className="wqov-shortcut-desc">Everyone's events across your studios — owner visible on each card so you can cover or reassign.</div>
            </div>
            <ChevronRight size={14} className="wqov-shortcut-arrow" />
          </button>
        </div>
      </section>

      {/* ── 6. Last messages ─────────────────────────────────────────── */}
      {recentMessages.length > 0 && (
        <section className="wqov-section">
          <div className="wqov-section-header-row">
            <h3 className="wqov-section-label">Last messages from your team</h3>
            <button className="wqov-see-all-link" onClick={() => navigate('/work-queue/messages')}>
              See all messages →
            </button>
          </div>
          <div className="wqov-pinned-list">
            {recentMessages.map(msg => {
              const sender = PEOPLE.find(p => p.id === msg.from)
              const isOpen = expandedMsg === msg.id
              return (
                <div
                  key={msg.id}
                  className="wqov-pinned-row wqov-pinned-row--clickable"
                  onClick={() => navigate('/work-queue/messages')}
                >
                  <div className="wqov-pinned-row-header">
                    <div className="wqov-pinned-sender">
                      <span className="wqov-pinned-sender-name">{sender?.name}</span>
                      <span className="wqov-pinned-sender-role">{sender?.role}</span>
                    </div>
                    <div className="wqov-pinned-title">{msg.subject}</div>
                    <div className="wqov-pinned-right">
                      <span className="wqov-pinned-ts">{fmtTs(msg.timestamp)}</span>
                      <ChevronRight size={13} className="wqov-pinned-chevron" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 7. Attestations callout ───────────────────────────────────── */}
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
