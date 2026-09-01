import { useState, useRef, useEffect, Fragment } from 'react'
import { Search, X } from 'lucide-react'
import { AUDIT_LOG } from '../data/workQueueData'

function fmtTs(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Audit Ledger ─────────────────────────────────────────────────────────────
// A single "Modified" dropdown instead of a row of range pills — filtering
// here is only ever by date, so a dropdown (DS Filters pattern) makes better
// use of the horizontal space than a "24h/7d/30d/All" pill row.
const DATE_RANGES = [
  { value: 'today',     label: 'Today',        hours: 24  },
  { value: 'yesterday', label: 'Yesterday',    hours: 48  },
  { value: '7d',        label: 'Last 7 days',  hours: 168 },
  { value: '30d',       label: 'Last 30 days', hours: 720 },
  { value: 'all',       label: 'All time',     hours: null },
]

const RISK_CLASS = { none: 'wq-risk--none', low: 'wq-risk--low', medium: 'wq-risk--medium', high: 'wq-risk--high', critical: 'wq-risk--critical' }

function ModifiedFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const current = DATE_RANGES.find(r => r.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="wq-modified-filter" ref={wrapRef}>
      <button className="wq-multiselect-trigger" onClick={() => setOpen(o => !o)}>
        <span>Modified{current && current.value !== 'all' ? `: ${current.label}` : ''}</span>
      </button>
      {open && (
        <div className="wq-modified-filter-panel">
          <div className="wq-modified-filter-header">
            <span>Modified</span>
            <button onClick={() => setOpen(false)}><X size={13} /></button>
          </div>
          {DATE_RANGES.map(r => (
            <label key={r.value} className="wq-modified-filter-option">
              <input
                type="radio"
                name="modified-range"
                checked={value === r.value}
                onChange={() => { onChange(r.value); setOpen(false) }}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function AuditTab() {
  const [range, setRange] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const ref = new Date('2026-06-17T11:00:00Z')
  const filtered = AUDIT_LOG.filter(a => {
    const ts = new Date(a.timestamp)
    const cfg = DATE_RANGES.find(r => r.value === range)
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
        <div className="wq-search-wrap wq-search-wrap--sm">
          <Search size={12} className="wq-search-icon" />
          <input
            className="wq-search-input"
            placeholder="Search audit log…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <ModifiedFilter value={range} onChange={setRange} />
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
