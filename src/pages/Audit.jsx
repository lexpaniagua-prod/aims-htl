import { useState, useEffect, useRef, Fragment } from 'react'
import {
  Download, ChevronDown, ChevronRight, Search,
  Package, Link2, GitFork, CheckCircle, Radio,
  GraduationCap, Users, SlidersHorizontal, X
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import './Audit.css'

// ─── Event type metadata ──────────────────────────────────────────────────────

const EVENT_META = {
  'Pack published':         { variant: 'blue',   icon: Package          },
  'Pack attached':          { variant: 'purple', icon: Link2            },
  'Item routed':            { variant: 'teal',   icon: GitFork          },
  'Item resolved':          { variant: 'teal',   icon: CheckCircle      },
  'Sensitive signal fired': { variant: 'coral',  icon: Radio            },
  'Train Me submitted':     { variant: 'amber',  icon: GraduationCap    },
  'Roster changed':         { variant: 'purple', icon: Users            },
  'Rule modified':          { variant: 'blue',   icon: SlidersHorizontal },
}

const EVENT_TYPES = Object.keys(EVENT_META)

// ─── 25 mock audit entries ────────────────────────────────────────────────────

const AUDIT_ENTRIES = [
  {
    id: 'aud-2025', ts: '2026-05-28 14:47:02',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Pack published',
    entity: 'Customer Escalation — Tier 1 v3.2',
    detail: 'New version published with updated keyword triggers and SLA target reduced from 15 min to 10 min.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2024', ts: '2026-05-28 14:32:11',
    actor: 'Maya R.',        actorRole: 'Senior Support Specialist',
    eventType: 'Item resolved',
    entity: 'htl-9901',
    detail: 'Resolved Webchat escalation — Maria Chen. Manual payment override applied. 1-month credit issued.',
    ip: '10.0.2.44',
  },
  {
    id: 'aud-2023', ts: '2026-05-28 14:28:55',
    actor: 'System',         actorRole: 'Automated',
    eventType: 'Sensitive signal fired',
    entity: 'htl-9905',
    detail: 'Safety classifier triggered at confidence 0.94. Crisis protocol v3.1 activated. Conversation autonomy paused.',
    ip: '—',
  },
  {
    id: 'aud-2022', ts: '2026-05-28 14:15:30',
    actor: 'Carlos Vega',    actorRole: 'AE Mid-Market',
    eventType: 'Item routed',
    entity: 'htl-9906',
    detail: 'Hot lead routed from 6sense intent signal. Intent score: 94. Pack: Hot Lead Closure. AE: Carlos Vega.',
    ip: '172.16.8.12',
  },
  {
    id: 'aud-2021', ts: '2026-05-28 13:54:07',
    actor: 'David Osei',     actorRole: 'Finance Director',
    eventType: 'Item resolved',
    entity: 'htl-9902',
    detail: 'Invoice #INV-2026-0841 approved. $48,500 authorised. Note: aligns with Q2 CRM project budget envelope.',
    ip: '10.0.2.11',
  },
  {
    id: 'aud-2020', ts: '2026-05-28 13:41:22',
    actor: 'Yuki Tanaka',    actorRole: 'Principal Solutions Engineer',
    eventType: 'Train Me submitted',
    entity: 'htl-9907',
    detail: 'AI mis-summarised WebSocket reconnect behavior in §3.2. Correct: client must wait 200ms before retry, not 100ms.',
    ip: '10.0.5.88',
  },
  {
    id: 'aud-2019', ts: '2026-05-28 13:20:45',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Rule modified',
    entity: 'Routing Rule — Billing Keywords',
    detail: 'Added keyword "invoice dispute" to trigger set. Keyword count: 14 → 15. Match logic: ANY.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2018', ts: '2026-05-28 12:58:14',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Roster changed',
    entity: 'Whistleblower & Compliance Roster',
    detail: 'Added Rachel Ng as primary responder. minRequired changed 1 → 2. mandatoryAck: disabled → enabled.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2017', ts: '2026-05-28 12:33:07',
    actor: 'System',         actorRole: 'Automated',
    eventType: 'Sensitive signal fired',
    entity: 'htl-9910',
    detail: 'HR signal — employee retaliation complaint (EMP-0842). HR + Legal co-notification initiated per policy §4.2.',
    ip: '—',
  },
  {
    id: 'aud-2016', ts: '2026-05-28 12:11:59',
    actor: 'Priya Kapoor',   actorRole: 'Sales Operations',
    eventType: 'Item routed',
    entity: 'htl-9902',
    detail: 'Invoice approval routed to Finance Director (Stage 2 of 2). Stage 1 completed by Priya Kapoor.',
    ip: '10.0.4.7',
  },
  {
    id: 'aud-2015', ts: '2026-05-28 11:47:33',
    actor: 'Fatima Al-Rashid', actorRole: 'Head of Procurement',
    eventType: 'Pack attached',
    entity: 'Procurement Gate — Mid-Market',
    detail: 'Pack attached to HRIS Onboarding Trigger workflow. Binding node: HTL Stage Gate. Network: Procurement Automation.',
    ip: '10.0.3.21',
  },
  {
    id: 'aud-2014', ts: '2026-05-28 11:22:18',
    actor: 'Sandra Voss',    actorRole: 'Legal Counsel',
    eventType: 'Train Me submitted',
    entity: 'htl-9903',
    detail: 'AI risk rating correction: unlimited liability clause should be Critical (rated Medium). Contract value: $2.1M.',
    ip: '10.0.6.55',
  },
  {
    id: 'aud-2013', ts: '2026-05-28 11:05:44',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Pack published',
    entity: 'Invoice Approval — Finance v2.1',
    detail: 'Version 2.1 published. Auto-approve threshold $5k → $10k. SLA target extended to 4 hours. Changelog attached.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2012', ts: '2026-05-28 10:48:21',
    actor: 'Jordan S.',      actorRole: 'Senior Support Specialist',
    eventType: 'Item resolved',
    entity: 'htl-9912',
    detail: 'SSO misconfiguration resolved. Azure AD ACS URL corrected. CSAT: 5/5. Resolution time: 22 min.',
    ip: '10.0.2.44',
  },
  {
    id: 'aud-2011', ts: '2026-05-28 10:31:09',
    actor: 'System',         actorRole: 'Automated',
    eventType: 'Item routed',
    entity: 'htl-9911',
    detail: 'Onboarding coordination step 3 of 5 routed to Fatima Al-Rashid. Software license bundle pending approval.',
    ip: '—',
  },
  {
    id: 'aud-2010', ts: '2026-05-28 10:14:55',
    actor: 'Rachel Ng',      actorRole: 'Chief Compliance Officer',
    eventType: 'Roster changed',
    entity: 'HR Confidential Roster',
    detail: 'Added Lena Brandt as backup responder. Escalation path updated: Rachel Ng → General Counsel → Board.',
    ip: '10.0.7.33',
  },
  {
    id: 'aud-2009', ts: '2026-05-28 09:58:40',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Rule modified',
    entity: 'SLA Rule — Hot Lead Closure',
    detail: 'SLA target 15 min → 10 min. Breach action: silent → immediate AE manager Slack notification.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2008', ts: '2026-05-28 09:42:17',
    actor: 'Carlos Vega',    actorRole: 'AE Mid-Market',
    eventType: 'Train Me submitted',
    entity: 'htl-9906',
    detail: 'Draft improvement: AI should include company employee count and current WMS in opening outreach context.',
    ip: '172.16.8.12',
  },
  {
    id: 'aud-2007', ts: '2026-05-28 09:25:03',
    actor: 'System',         actorRole: 'Automated',
    eventType: 'Sensitive signal fired',
    entity: 'htl-9904',
    detail: 'Whistleblower report WB-2026-0042 received. Expense falsification allegation ($12k). Co-notification: HR + Legal.',
    ip: '—',
  },
  {
    id: 'aud-2006', ts: '2026-05-27 17:44:28',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Pack attached',
    entity: 'Legal Sensitive — Contract Review',
    detail: 'Pack attached to Legal Operations pipeline. Overrides applied: sensitiveMode=true, composerDisabled=true.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2005', ts: '2026-05-27 16:30:14',
    actor: 'Ben Cooper',     actorRole: 'Infrastructure Lead',
    eventType: 'Item routed',
    entity: 'htl-9908',
    detail: 'Vendor selection routed to Fatima Al-Rashid (Stage 1 of 4). AWS vs Azure, $340K. Migration risk: Medium.',
    ip: '10.0.9.42',
  },
  {
    id: 'aud-2004', ts: '2026-05-27 15:18:50',
    actor: 'Lena Brandt',    actorRole: 'Finance Manager',
    eventType: 'Train Me submitted',
    entity: 'htl-9909',
    detail: 'AI refund calculation error: $2,200 at 62 days prorated should be $1,743 not $1,833. Formula flaw in refund pack.',
    ip: '10.0.2.77',
  },
  {
    id: 'aud-2003', ts: '2026-05-27 14:55:37',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Roster changed',
    entity: 'Customer Safety Roster',
    detail: 'New roster created. 4 members added: Maya R., Jordan S., Sam V., Lena K. mandatoryAck: enabled. Crisis protocol linked.',
    ip: '192.168.1.101',
  },
  {
    id: 'aud-2002', ts: '2026-05-27 14:22:08',
    actor: 'System',         actorRole: 'Automated',
    eventType: 'Pack published',
    entity: 'Whistleblower & Compliance v1.3',
    detail: 'Automated deploy from CI pipeline. Classification keywords updated for EMEA jurisdiction. Changelog: 6 additions.',
    ip: '—',
  },
  {
    id: 'aud-2001', ts: '2026-05-27 13:47:44',
    actor: 'Alexa M.',       actorRole: 'Admin',
    eventType: 'Rule modified',
    entity: 'Priority Override — Safety Signals',
    detail: 'Safety signals now bypass SLA queue and route immediately to on-call roster regardless of depth. Effective immediately.',
    ip: '192.168.1.101',
  },
]

// ─── Build full event JSON for expanded row ───────────────────────────────────

function buildEventJson(entry) {
  return {
    eventId:   entry.id,
    timestamp: entry.ts,
    actor:     { name: entry.actor, role: entry.actorRole, ip: entry.ip },
    event:     { type: entry.eventType, entity: entry.entity, detail: entry.detail },
    platform:  { version: '2.4.1', environment: 'production', region: 'us-east-1' },
    signature: `sha256:${entry.id.replace('aud-', '').padStart(8, '0')}a4f2e9b1c...`,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Audit() {
  const [search,          setSearch]   = useState('')
  const [eventTypeFilter, setEvType]   = useState('All')
  const [actorFilter,     setActor]    = useState('')
  const [dateFrom,        setDateFrom] = useState('')
  const [dateTo,          setDateTo]   = useState('')
  const [itemIdFilter,    setItemId]   = useState('')
  const [expanded,        setExpanded] = useState(null)
  const [toast,           setToast]    = useState(false)
  const toastTimer = useRef(null)

  function handleExport() {
    setToast(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 3000)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = AUDIT_ENTRIES.filter(e => {
    if (eventTypeFilter !== 'All' && e.eventType !== eventTypeFilter) return false
    if (actorFilter && !e.actor.toLowerCase().includes(actorFilter.toLowerCase())) return false
    if (itemIdFilter && !e.entity.toLowerCase().includes(itemIdFilter.toLowerCase())) return false
    const q = search.toLowerCase()
    if (q &&
      !e.actor.toLowerCase().includes(q) &&
      !e.entity.toLowerCase().includes(q) &&
      !e.detail.toLowerCase().includes(q) &&
      !e.eventType.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Complete platform activity history — all actors, all events, all changes</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="aud-filters">
        {/* Date range */}
        <div className="aud-filter-group">
          <span className="aud-filter-label">Date</span>
          <input
            type="date"
            className="aud-filter-date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="From date"
          />
          <span className="aud-filter-sep">→</span>
          <input
            type="date"
            className="aud-filter-date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="To date"
          />
        </div>

        <div className="aud-filter-divider" />

        {/* Event type */}
        <div className="aud-filter-group">
          <span className="aud-filter-label">Event</span>
          <select
            className="aud-filter-select"
            value={eventTypeFilter}
            onChange={e => setEvType(e.target.value)}
          >
            <option value="All">All types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="aud-filter-divider" />

        {/* Actor */}
        <div className="aud-filter-group">
          <span className="aud-filter-label">Actor</span>
          <input
            type="text"
            className="aud-filter-text"
            placeholder="Filter by name…"
            value={actorFilter}
            onChange={e => setActor(e.target.value)}
          />
        </div>

        {/* Entity / Pack */}
        <div className="aud-filter-group">
          <span className="aud-filter-label">Entity</span>
          <input
            type="text"
            className="aud-filter-text"
            placeholder="Item ID or pack…"
            value={itemIdFilter}
            onChange={e => setItemId(e.target.value)}
          />
        </div>

        <div className="aud-filter-spacer" />

        {/* Global search */}
        <div className="aud-search-wrap">
          <Search size={12} className="aud-search-icon" />
          <input
            type="text"
            className="aud-search-input"
            placeholder="Search all fields…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="aud-search-clear" onClick={() => setSearch('')}>
              <X size={11} />
            </button>
          )}
        </div>
        <span className="aud-count">{filtered.length} events</span>
      </div>

      {/* ── Audit table ─────────────────────────────────────────────────── */}
      <div className="aud-table-wrap">
        <table className="aud-table">
          <thead>
            <tr>
              <th style={{ width: 24 }} />
              <th style={{ width: 148 }}>Timestamp</th>
              <th style={{ width: 200 }}>Actor</th>
              <th style={{ width: 190 }}>Event Type</th>
              <th style={{ width: 220 }}>Entity</th>
              <th>Detail</th>
              <th style={{ width: 110 }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => {
              const meta      = EVENT_META[entry.eventType] ?? { variant: 'blue', icon: SlidersHorizontal }
              const EventIcon = meta.icon
              const isExp     = expanded === entry.id

              return (
                <Fragment key={entry.id}>
                  {/* ── Main row ───────────────────────────────────────── */}
                  <tr
                    className={`aud-row${isExp ? ' aud-row--expanded' : ''}`}
                    onClick={() => setExpanded(isExp ? null : entry.id)}
                  >
                    <td className="aud-expand-cell">
                      {isExp
                        ? <ChevronDown  size={12} className="aud-chevron" />
                        : <ChevronRight size={12} className="aud-chevron" />}
                    </td>
                    <td className="aud-ts">{entry.ts}</td>
                    <td>
                      <div className="aud-actor-name">{entry.actor}</div>
                      <div className="aud-actor-role">{entry.actorRole}</div>
                    </td>
                    <td>
                      <div className="aud-event-type">
                        <EventIcon size={11} className={`aud-event-icon aud-event-icon--${meta.variant}`} />
                        <Badge label={entry.eventType} variant={meta.variant} size="sm" />
                      </div>
                    </td>
                    <td className="aud-entity">{entry.entity}</td>
                    <td className="aud-detail">{entry.detail}</td>
                    <td className="aud-ip">{entry.ip}</td>
                  </tr>

                  {/* ── Expanded JSON row ──────────────────────────────── */}
                  {isExp && (
                    <tr className="aud-json-row">
                      <td colSpan={7}>
                        <div className="aud-json-wrap">
                          <div className="aud-json-label">Full event payload</div>
                          <pre className="aud-json-block">
                            {JSON.stringify(buildEventJson(entry), null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="aud-empty">
                  No events match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Export toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div className="aud-toast">
          <Download size={13} />
          Preparing export… CSV will download shortly.
          <button className="aud-toast-close" onClick={() => setToast(false)}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
