import { useState, Fragment } from 'react'
import { Search } from 'lucide-react'
import { AUDIT_LOG } from '../data/workQueueData'

function fmtTs(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Audit Ledger ─────────────────────────────────────────────────────────────
const DATE_RANGES = [
  { label: '24h',  hours: 24  },
  { label: '7d',   hours: 168 },
  { label: '30d',  hours: 720 },
  { label: 'All',  hours: null },
]

const RISK_CLASS = { none: 'wq-risk--none', low: 'wq-risk--low', medium: 'wq-risk--medium', high: 'wq-risk--high', critical: 'wq-risk--critical' }

function AuditTab() {
  const [range, setRange] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const ref = new Date('2026-06-17T11:00:00Z')
  const filtered = AUDIT_LOG.filter(a => {
    const ts = new Date(a.timestamp)
    const cfg = DATE_RANGES.find(r => r.label === range)
    if (cfg.hours && (ref - ts) / 3600000 > cfg.hours) return false
    if (search) {
      const q = search.toLowerCase()
      return a.actor.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.artifact.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="wq-audit">
      <div className="wq-audit-toolbar">
        <div className="wq-range-pills">
          {DATE_RANGES.map(r => (
            <button
              key={r.label}
              className={`wq-range-pill${range === r.label ? ' wq-range-pill--active' : ''}`}
              onClick={() => setRange(r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="wq-search-wrap wq-search-wrap--sm">
          <Search size={12} className="wq-search-icon" />
          <input
            className="wq-search-input"
            placeholder="Search audit log…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="wq-table-wrap">
        <table className="wq-table">
          <thead>
            <tr>
              <th>ID</th><th>Timestamp</th><th>Actor</th><th>Action</th>
              <th>Studio</th><th>Artifact</th><th>Risk</th><th>Outcome</th><th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <Fragment key={a.id}>
                <tr
                  key={a.id}
                  className="wq-audit-row"
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                >
                  <td className="wq-td-mono">{a.id}</td>
                  <td className="wq-td-muted">{fmtTs(a.timestamp)}</td>
                  <td>{a.actor}</td>
                  <td>{a.action}</td>
                  <td><span className="wq-studio-tag">{a.studio.toUpperCase()}</span></td>
                  <td className="wq-td-mono">{a.artifact}</td>
                  <td><span className={`wq-risk-tag ${RISK_CLASS[a.risk] || ''}`}>{a.risk}</span></td>
                  <td>{a.outcome}</td>
                  <td className="wq-td-hash">{a.hash}</td>
                </tr>
                {expanded === a.id && (
                  <tr key={`${a.id}-exp`} className="wq-audit-expanded">
                    <td colSpan={9}>
                      <div className="wq-audit-detail">
                        <div><strong>ID:</strong> {a.id}</div>
                        <div><strong>Previous hash:</strong> <code>{a.prevHash}</code></div>
                        <div><strong>This hash:</strong> <code>{a.hash}</code></div>
                        <div><strong>Full artifact:</strong> {a.artifact}</div>
                        <div><strong>Outcome:</strong> {a.outcome}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Activity layout ──────────────────────────────────────────────────────────
export default function WQActivity() {
  return (
    <div className="wq-activity">
      <div className="wq-sub-content">
        <AuditTab />
      </div>
    </div>
  )
}
