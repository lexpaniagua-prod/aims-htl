import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import {
  EVENT_TYPES, PEOPLE, ATTESTATIONS, AUDIT_LOG, EVENT_MODAL_DATA,
} from '../data/workQueueData'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTs(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const SEV_COLORS = { now: '#f43f5e', red: '#ef4444', yellow: '#f59e0b', green: '#10b981' }

function getInitialView(type, action) {
  const MAP = {
    approve:     { Review: 'detail', Approve: 'confirm-approve', Reject: 'confirm-reject' },
    review:      { 'Open Review': 'detail', 'Request Changes': 'change-request', Approve: 'confirm-approve' },
    respond:     { 'View Details': 'detail', Respond: 'respond' },
    resolve:     { 'Review Conflict': 'detail', Resolve: 'resolve' },
    acknowledge: { View: 'detail' },
    train:       { 'Review and Edit': 'detail', Promote: 'confirm-promote', Reject: 'confirm-reject' },
  }
  return MAP[type]?.[action] ?? 'detail'
}

// ── Shared trace timeline ──────────────────────────────────────────────────────

function TraceTimeline({ steps }) {
  const ICON = { done: '✓', paused: '⏸', error: '✗', blocked: '⊘', pending: '·' }
  const CLS  = { done: 'evm-step--done', paused: 'evm-step--paused', error: 'evm-step--error', blocked: 'evm-step--error', pending: 'evm-step--pending' }
  return (
    <div className="evm-trace">
      {steps.map((s, i) => (
        <div key={i} className={`evm-trace-step ${CLS[s.status] || ''}`}>
          <div className="evm-trace-marker">
            <span className="evm-trace-icon">{ICON[s.status] || '·'}</span>
            {i < steps.length - 1 && <div className="evm-trace-line" />}
          </div>
          <div className="evm-trace-body">
            <div className="evm-trace-row">
              <span className="evm-trace-num">Step {s.step}</span>
              <span className="evm-trace-lbl">{s.label}</span>
              {s.timestamp && (
                <span className="evm-trace-ts">
                  {new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="evm-trace-detail">{s.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── APPROVE detail ─────────────────────────────────────────────────────────────

function ApproveDetail({ event }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  const [expandedConflict, setExpandedConflict] = useState(null)

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
        {event.blastRadius?.workflows > 0 && (
          <div className="evm-blast-inline">
            <AlertTriangle size={12} />
            <span>
              <strong>{event.blastRadius.workflows} workflows</strong> and{' '}
              <strong>{event.blastRadius.agents} agents</strong> are blocked until you decide.
            </span>
          </div>
        )}
      </div>

      {event.sourceWorkflow && (
        <div className="evm-section">
          <div className="evm-section-title">SOURCE WORKFLOW</div>
          <div className="evm-wf-id">{event.sourceWorkflow.id} · {event.sourceWorkflow.name}</div>
          <TraceTimeline steps={event.sourceWorkflow.steps} />
        </div>
      )}

      {md.claims && (
        <div className="evm-section">
          <div className="evm-section-title">CLAIMS EXTRACTED ({md.claims.length})</div>
          <div className="evm-claims-list">
            {md.claims.map(c => (
              <div key={c.id} className={`evm-claim${c.conflict ? ' evm-claim--conflict' : ''}`}>
                <div className="evm-claim-header">
                  <span className="evm-claim-id">{c.id}</span>
                  <span className="evm-claim-conf"
                    style={{ color: c.confidence > 0.85 ? 'var(--accent-green)' : c.confidence > 0.7 ? 'var(--accent-amber)' : '#ef4444' }}>
                    {Math.round(c.confidence * 100)}%
                  </span>
                  {c.conflict && <span className="evm-claim-conflict-badge">CONFLICT</span>}
                </div>
                <div className="evm-claim-text">{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {md.conflicts?.length > 0 && (
        <div className="evm-section">
          <div className="evm-section-title">KNOWLEDGE CONFLICTS ({md.conflicts.length})</div>
          {md.conflicts.map((cf, i) => (
            <div key={i} className="evm-conflict-block">
              <button className="evm-conflict-header"
                onClick={() => setExpandedConflict(expandedConflict === i ? null : i)}>
                <span className="evm-conflict-claim">→ Claim {cf.claimId}</span>
                <span className="evm-conflict-toggle">{expandedConflict === i ? '▲' : '▼'}</span>
              </button>
              {expandedConflict === i && (
                <div className="evm-conflict-sources">
                  {['sourceA', 'sourceB'].map((key, si) => {
                    const src = cf[key]
                    return (
                      <div key={key} className="evm-source-block">
                        <div className="evm-source-label">Source {si === 0 ? 'A' : 'B'}</div>
                        <div className="evm-source-name">{src.name}</div>
                        <div className="evm-source-value">{src.value}</div>
                        <div className="evm-source-date">Verified {src.lastVerified}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {md.draftEmail && (
        <div className="evm-section">
          <div className="evm-section-title">DRAFT MESSAGE</div>
          <div className="evm-email-block">
            <div className="evm-email-meta"><span className="evm-email-label">To:</span><span>{md.draftEmail.to}</span></div>
            <div className="evm-email-meta"><span className="evm-email-label">Subject:</span><span>{md.draftEmail.subject}</span></div>
            <pre className="evm-email-body">{md.draftEmail.body}</pre>
          </div>
        </div>
      )}

      {md.docs && (
        <div className="evm-section">
          <div className="evm-section-title">QUEUED DOCUMENTS ({md.docs.length})</div>
          {md.docs.map((doc, i) => (
            <div key={i} className="evm-doc-row">
              <FileText size={13} className="evm-doc-icon" />
              <div className="evm-doc-info">
                <span className="evm-doc-name">{doc.name}</span>
                <span className="evm-doc-meta">{doc.size} · {doc.pages} pages</span>
              </div>
              <span className="evm-doc-status">validated</span>
            </div>
          ))}
        </div>
      )}

      {md.justification && (
        <div className="evm-section">
          <div className="evm-section-title">BREAK GLASS REQUEST</div>
          <div className="evm-bg-grid">
            <div className="evm-bg-row"><span className="evm-bg-label">Requestor</span><span>{md.requestor} — {md.requestorRole}</span></div>
            <div className="evm-bg-row"><span className="evm-bg-label">Target partition</span><span>{md.targetPartition}</span></div>
            <div className="evm-bg-row"><span className="evm-bg-label">Duration</span><span>{md.duration}</span></div>
            <div className="evm-bg-row"><span className="evm-bg-label">First approval</span><span>{md.firstApprover} at {fmtTs(md.firstApprovalTime)}</span></div>
            <div className="evm-bg-row">
              <span className="evm-bg-label">Approvals</span>
              <span style={{ color: 'var(--accent-amber)' }}>{md.approvalReceived} of {md.approvalRequired} received</span>
            </div>
          </div>
          <p className="evm-situation-text" style={{ marginTop: 12 }}>{md.justification}</p>
        </div>
      )}

      {md.flaggedFields && (
        <div className="evm-section">
          <div className="evm-section-title">FLAGGED PII FIELDS</div>
          <div className="evm-pii-table">
            {md.flaggedFields.map((f, i) => (
              <div key={i} className="evm-pii-row">
                <span className="evm-pii-field">{f.field}</span>
                <span className="evm-pii-count">{f.count} instances</span>
                <span className="evm-pii-rows">{f.rows}</span>
              </div>
            ))}
          </div>
          <div className="evm-pii-meta">
            {md.totalRows} total rows · {md.uploadedBy} · {fmtTs(md.uploadedAt)}
          </div>
        </div>
      )}

      {event.blastRadius?.description && (
        <div className="evm-section">
          <div className="evm-section-title">BLAST RADIUS</div>
          <div className="evm-blast-box">
            <div className="evm-blast-stats">
              <div className="evm-blast-stat">
                <span className="evm-blast-num">{event.blastRadius.workflows}</span>
                <span className="evm-blast-lbl">workflows</span>
              </div>
              <div className="evm-blast-stat">
                <span className="evm-blast-num">{event.blastRadius.agents}</span>
                <span className="evm-blast-lbl">agents</span>
              </div>
            </div>
            <p className="evm-blast-desc">{event.blastRadius.description}</p>
            {md.workflowsBlockedNames && (
              <div className="evm-blast-affected">
                {md.workflowsBlockedNames.map(n => <span key={n} className="evm-blast-chip">{n}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── REVIEW detail ──────────────────────────────────────────────────────────────

function ReviewDetail({ event }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  const [certified, setCertified] = useState(new Set())

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
      </div>

      {md.kbuText && (
        <div className="evm-section">
          <div className="evm-section-title">CURRENT STATE · KBU TEXT</div>
          <pre className="evm-kbu-text">{md.kbuText}</pre>
          <div className="evm-kbu-meta">
            <span>v{md.history.version}</span>
            <span>Modified {md.history.lastModified} by {md.history.by}</span>
            <span className={`evm-ttl-badge${md.ttlDays <= 7 ? ' evm-ttl-badge--urgent' : ''}`}>
              Expires in {md.ttlDays} days
            </span>
          </div>
          {md.usedBy && (
            <div className="evm-kbu-used">
              <span className="evm-kbu-used-label">Used by:</span>
              {md.usedBy.map(u => <span key={u} className="evm-blast-chip">{u}</span>)}
            </div>
          )}
        </div>
      )}

      {md.contractTerms && (
        <div className="evm-section">
          <div className="evm-section-title">CURRENT STATE · CONTRACT TERMS</div>
          <pre className="evm-kbu-text">{md.contractTerms}</pre>
          <div className="evm-kbu-meta">
            <span>Issued {md.history.issued} by {md.history.by}</span>
          </div>
          {md.usedBy && (
            <div className="evm-kbu-used">
              <span className="evm-kbu-used-label">Used by:</span>
              {md.usedBy.map(u => <span key={u} className="evm-blast-chip">{u}</span>)}
            </div>
          )}
        </div>
      )}

      {md.accessGrants && (
        <div className="evm-section">
          <div className="evm-section-title">CURRENT STATE · ACCESS GRANTS</div>
          <div className="evm-certify-table">
            {md.accessGrants.map((g, i) => (
              <div key={i} className="evm-certify-row">
                <div className="evm-certify-info">
                  <span className="evm-certify-name">{g.name}</span>
                  <span className="evm-certify-access">{g.access}</span>
                  <span className="evm-certify-date">Last reviewed {g.lastReviewed}</span>
                </div>
                {certified.has(i) ? (
                  <span className="evm-certify-done"><CheckCircle size={12} /> Certified</span>
                ) : (
                  <button className="wq-btn wq-btn--ghost evm-certify-btn"
                    onClick={() => setCertified(prev => new Set([...prev, i]))}>
                    Certify
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="evm-certify-summary">{certified.size} of {md.accessGrants.length} certified</div>
        </div>
      )}

      {md.history && (
        <div className="evm-section">
          <div className="evm-section-title">HISTORY</div>
          <div className="evm-hist-row">
            <span className="evm-hist-date">{md.history.lastModified || md.history.issued}</span>
            <span className="evm-hist-actor">{md.history.by}</span>
            <span className="evm-hist-action">Last modification — v{md.history.version}</span>
          </div>
        </div>
      )}
    </>
  )
}

// ── RESPOND resolution options ─────────────────────────────────────────────────

const RESPOND_CONFIG = {
  'EVT-005': {
    consequence: '57 workflows lose CRM data access. The DIAN intake pipeline stops entirely. SalesForecastPA goes blind — no Salesforce data after Jun 21.',
    options: [
      { id: 'rotate',   label: 'Rotate token now',          icon: '↻', kind: 'direct',               successMsg: 'OAuth token rotated. New expiry: Jun 21, 2027.' },
      { id: 'delegate', label: 'Delegate to IT Operations', icon: '→', kind: 'delegate', deptHint: 'IT' },
      { id: 'snooze',   label: 'Snooze 24h',                icon: '⏸', kind: 'snooze',               doneMsg: 'Snoozed — resurfaces Jun 19 at 09:00' },
    ],
  },
  'EVT-008': {
    consequence: "AgentSpec pinned to retiring Truth v3.1. ForecastAgent's responses degrade after Jul 1 deprecation.",
    options: [
      { id: 'pin',      label: 'Pin to current version',    icon: '✓', kind: 'direct',               successMsg: 'AgentSpec pinned to Truth v3.2 (stable).' },
      { id: 'spec',     label: 'Review WorkflowSpec YAML',  icon: '⌥', kind: 'view-spec' },
      { id: 'delegate', label: 'Delegate to Engineering',   icon: '→', kind: 'delegate', deptHint: 'AI Ops' },
    ],
  },
  'EVT-010': {
    consequence: 'Claim RC-4412 stays blocked in KCON. Regional pricing multiplier remains unverified at 1.12. QuoteBot uses the stale fallback.',
    options: [
      { id: 'approve',  label: 'Approve Claim RC-4412',     icon: '✓', kind: 'confirm-approve-claim', confirmText: 'Approve RC-4412: "regional multiplier = 1.15"?' },
      { id: 'reject',   label: 'Reject Claim RC-4412',      icon: '✗', kind: 'confirm-reject-claim' },
      { id: 'sme',      label: 'Request SME review',        icon: '→', kind: 'delegate', deptHint: 'All' },
    ],
  },
  'EVT-013': {
    consequence: 'Search relevance degrades across all SRAG queries until the refresh runs. Affects ~847 queries/day.',
    options: [
      { id: 'schedule', label: 'Schedule refresh window',   icon: '📅', kind: 'schedule' },
      { id: 'run-now',  label: 'Run now',                   icon: '↻', kind: 'run-now' },
    ],
  },
}

const SPEC_YAML = `name: ForecastAgent
version: 3.0
truth_pin:
  version: "3.1"  # retiring Jul 1
  partition: financial
tools:
  - salesforce_read
  - crm_write
  - forecast_compute
schedule: "0 6 * * 1-5"`

function ResolutionOptions({ event, onDecide }) {
  const config = RESPOND_CONFIG[event.id]
  const [step,           setStep]           = useState(null)
  const [delegatePerson, setDelegatePerson] = useState(null)
  const [claimRejectRsn, setClaimRejectRsn] = useState('')
  const [scheduleTime,   setScheduleTime]   = useState('')
  const [running,        setRunning]        = useState(false)
  const [runDone,        setRunDone]        = useState(false)

  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => { setRunning(false); setRunDone(true) }, 1800)
    return () => clearTimeout(t)
  }, [running])

  if (!config) return (
    <div className="evm-section">
      <div className="evm-section-title">RESOLUTION OPTIONS</div>
      <p className="evm-situation-text">{event.detail}</p>
    </div>
  )

  if (runDone) return (
    <div className="evm-section">
      <div className="evm-section-title">RESOLUTION OPTIONS</div>
      <div className="evm-resolve-success">
        <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
        <div>
          <div className="evm-resolve-success-title">Embedding index refresh started</div>
          <div className="evm-resolve-success-sub">Estimated completion: ~12 minutes.</div>
        </div>
        <button className="wq-btn wq-btn--primary" onClick={() => onDecide('Index refresh running — estimated 12 minutes')}>Done</button>
      </div>
    </div>
  )

  if (running) return (
    <div className="evm-section">
      <div className="evm-section-title">RESOLUTION OPTIONS</div>
      <div className="evm-resolve-running"><div className="evm-spinner" /><span>Starting refresh…</span></div>
    </div>
  )

  if (step?.type === 'success') return (
    <div className="evm-section">
      <div className="evm-section-title">RESOLUTION OPTIONS</div>
      <div className="evm-resolve-success">
        <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
        <div><div className="evm-resolve-success-title">{step.msg}</div></div>
        <button className="wq-btn wq-btn--primary" onClick={() => onDecide(step.msg)}>Done</button>
      </div>
    </div>
  )

  if (step?.type === 'view-spec') return (
    <div className="evm-section">
      <div className="evm-section-title">WORKFLOWSPEC — SPEC-FA-009</div>
      <pre className="evm-spec-yaml">{SPEC_YAML}</pre>
      <button className="wq-btn wq-btn--ghost" style={{ marginTop: 8 }} onClick={() => setStep(null)}>← Back</button>
    </div>
  )

  if (step?.type === 'delegate') {
    const candidates = step.deptHint === 'All' ? PEOPLE : PEOPLE.filter(p => p.dept === step.deptHint)
    return (
      <div className="evm-section">
        <div className="evm-section-title">DELEGATE TO — {step.deptHint}</div>
        <div className="evm-delegate-list">
          {candidates.map(p => (
            <button key={p.id}
              className={`evm-delegate-person${delegatePerson?.id === p.id ? ' evm-delegate-person--on' : ''}`}
              onClick={() => setDelegatePerson(delegatePerson?.id === p.id ? null : p)}>
              <span className="evm-delegate-initials">{p.initials}</span>
              <div>
                <span className="evm-delegate-name">{p.name}</span>
                <span className="evm-delegate-role"> · {p.role} · {p.dept}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="evm-delegate-actions">
          <button className="wq-btn wq-btn--ghost" onClick={() => setStep(null)}>← Back</button>
          <button className="wq-btn wq-btn--primary" disabled={!delegatePerson}
            onClick={() => onDecide(`Delegated to ${delegatePerson.name} — logged to audit`)}>
            Confirm Delegation
          </button>
        </div>
      </div>
    )
  }

  if (step?.type === 'confirm-approve-claim') return (
    <div className="evm-section">
      <div className="evm-section-title">CONFIRM CLAIM APPROVAL</div>
      <div className="evm-confirm-prompt">
        <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }} />
        <div><div className="evm-confirm-title">{step.confirmText}</div></div>
      </div>
      <div className="evm-delegate-actions">
        <button className="wq-btn wq-btn--ghost" onClick={() => setStep(null)}>Cancel</button>
        <button className="wq-btn wq-btn--primary" onClick={() => onDecide('Claim RC-4412 approved — logged to audit')}>
          Confirm Approve
        </button>
      </div>
    </div>
  )

  if (step?.type === 'confirm-reject-claim') return (
    <div className="evm-section">
      <div className="evm-section-title">REJECT CLAIM RC-4412</div>
      <label className="evm-form-label">Reason <span style={{ color: 'var(--accent-coral)' }}>*</span></label>
      <textarea className="evm-form-textarea" rows={3}
        placeholder="Explain why this claim is rejected…"
        value={claimRejectRsn} onChange={e => setClaimRejectRsn(e.target.value)} />
      <div className="evm-delegate-actions">
        <button className="wq-btn wq-btn--ghost" onClick={() => setStep(null)}>Cancel</button>
        <button className="wq-btn wq-btn--danger" disabled={!claimRejectRsn.trim()}
          onClick={() => onDecide('Claim RC-4412 rejected — logged to audit')}>Confirm Reject</button>
      </div>
    </div>
  )

  if (step?.type === 'schedule') return (
    <div className="evm-section">
      <div className="evm-section-title">SCHEDULE REFRESH WINDOW</div>
      <label className="evm-form-label">Preferred window</label>
      <input type="datetime-local" className="evm-form-input"
        value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
      <div className="evm-delegate-actions">
        <button className="wq-btn wq-btn--ghost" onClick={() => setStep(null)}>Cancel</button>
        <button className="wq-btn wq-btn--primary" disabled={!scheduleTime}
          onClick={() => onDecide(`Refresh scheduled for ${new Date(scheduleTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — logged to audit`)}>
          Confirm Schedule
        </button>
      </div>
    </div>
  )

  return (
    <div className="evm-section">
      <div className="evm-section-title">RESOLUTION OPTIONS</div>
      <div className="evm-respond-opts">
        {config.options.map(opt => (
          <button key={opt.id} className="evm-respond-opt" onClick={() => {
            if (opt.kind === 'direct')               setStep({ type: 'success', msg: opt.successMsg })
            else if (opt.kind === 'snooze')          onDecide(opt.doneMsg)
            else if (opt.kind === 'delegate')        setStep({ type: 'delegate', deptHint: opt.deptHint })
            else if (opt.kind === 'view-spec')       setStep({ type: 'view-spec' })
            else if (opt.kind === 'confirm-approve-claim') setStep({ type: 'confirm-approve-claim', confirmText: opt.confirmText })
            else if (opt.kind === 'confirm-reject-claim')  setStep({ type: 'confirm-reject-claim' })
            else if (opt.kind === 'schedule')        setStep({ type: 'schedule' })
            else if (opt.kind === 'run-now')         setRunning(true)
          }}>
            <span className="evm-respond-opt-icon">{opt.icon}</span>
            <span className="evm-respond-opt-label">{opt.label}</span>
            <span className="evm-respond-opt-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function RespondDetail({ event, onDecide }) {
  const config = RESPOND_CONFIG[event.id]
  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
      </div>
      {config && (
        <div className="evm-section">
          <div className="evm-section-title">IF NOT RESOLVED</div>
          <div className="evm-consequence-block">
            <AlertTriangle size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 2 }} />
            <p>{config.consequence}</p>
          </div>
        </div>
      )}
      <ResolutionOptions event={event} onDecide={onDecide} />
    </>
  )
}

// ── RESOLVE detail ─────────────────────────────────────────────────────────────

function ChainViz({ chain }) {
  const SC = { ok: 'var(--accent-green)', error: '#ef4444', blocked: 'var(--text-muted)' }
  const SI = { ok: '✓', error: '✗', blocked: '⊘' }
  return (
    <div className="evm-chain">
      {chain.map((node, i) => (
        <div key={i} className="evm-chain-node-wrap">
          <div className="evm-chain-node"
            style={{ borderColor: SC[node.status] + '55', background: SC[node.status] + '0d' }}>
            <div className="evm-chain-node-header" style={{ color: SC[node.status] }}>
              <span>{SI[node.status]}</span>
              <span className="evm-chain-node-name">{node.name}</span>
              {node.version && <span className="evm-chain-node-ver">v{node.version}</span>}
            </div>
            <div className="evm-chain-node-note">{node.note}</div>
          </div>
          {i < chain.length - 1 && <div className="evm-chain-arrow">→</div>}
        </div>
      ))}
    </div>
  )
}

function ResolveDetail({ event, choice, setChoice }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  const isEntity = event.id === 'EVT-018'

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SITUATION</div>
        <p className="evm-situation-text">{event.detail}</p>
        {event.blastRadius?.workflows > 0 && (
          <div className="evm-blast-inline">
            <AlertTriangle size={12} />
            <span>{event.blastRadius.workflows} workflows and {event.blastRadius.agents} agents affected.</span>
          </div>
        )}
      </div>

      {md.chain && (
        <div className="evm-section">
          <div className="evm-section-title">CHAIN VISUALIZATION</div>
          <ChainViz chain={md.chain} />
        </div>
      )}

      {md.sourceA && md.sourceB && (
        <div className="evm-section">
          <div className="evm-section-title">{isEntity ? 'ENTITY COMPARISON' : 'TWO-SOURCE COMPARISON'}</div>
          <p className="evm-two-source-hint">Click a source card to select it, then accept via the footer.</p>
          <div className="evm-two-source">
            {['sourceA', 'sourceB'].map(key => {
              const src = md[key]
              const letter = key === 'sourceA' ? 'A' : 'B'
              const isChosen = choice === key
              return (
                <button key={key}
                  className={`evm-source-card${isChosen ? ' evm-source-card--chosen' : ''}`}
                  onClick={() => setChoice(isChosen ? null : key)}>
                  <div className="evm-source-card-header">
                    <span className={`evm-source-badge evm-source-badge--${letter.toLowerCase()}`}>Source {letter}</span>
                    {isChosen && <span className="evm-chosen-marker">✓ Selected</span>}
                  </div>
                  <div className="evm-source-card-name">{src.name}</div>
                  {src.value    && <div className="evm-source-card-value">{src.value}</div>}
                  {src.records  != null && <div className="evm-source-detail-row"><span>Records</span><span>{src.records}</span></div>}
                  {src.source   && <div className="evm-source-detail-row"><span>Source</span><span>{src.source}</span></div>}
                  {src.owner    && <div className="evm-source-detail-row"><span>Owner</span><span>{src.owner}</span></div>}
                  {src.lastVerified && <div className="evm-source-detail-row"><span>Verified</span><span>{src.lastVerified}</span></div>}
                  {src.lastUpdated  && <div className="evm-source-detail-row"><span>Updated</span><span>{src.lastUpdated}</span></div>}
                  {src.confidence != null && (
                    <div className="evm-source-detail-row">
                      <span>Confidence</span>
                      <span style={{ color: src.confidence > 0.85 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                        {Math.round(src.confidence * 100)}%
                      </span>
                    </div>
                  )}
                  {isEntity && key === 'sourceA' && md.matchSignals && (
                    <div className="evm-match-signals">
                      {md.matchSignals.map(s => <span key={s} className="evm-match-signal">{s}</span>)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {(md.affectedAgents || md.affectedWorkflows || md.canonRecord) && (
        <div className="evm-section">
          <div className="evm-section-title">IMPACT</div>
          {md.affectedAgents && (
            <div className="evm-impact-group">
              <span className="evm-impact-label">Agents</span>
              <div className="evm-blast-affected">
                {md.affectedAgents.map(n => <span key={n} className="evm-blast-chip">{n}</span>)}
              </div>
            </div>
          )}
          {md.affectedWorkflows && (
            <div className="evm-impact-group">
              <span className="evm-impact-label">Workflows</span>
              <div className="evm-blast-affected">
                {md.affectedWorkflows.map(n => <span key={n} className="evm-blast-chip">{n}</span>)}
              </div>
            </div>
          )}
          {md.canonRecord && (
            <div className="evm-impact-group">
              <span className="evm-impact-label">Canon record</span>
              <code className="evm-canon-code">{md.canonRecord}</code>
            </div>
          )}
          {isEntity && (
            <div className="evm-impact-group">
              <span className="evm-impact-label">Model confidence</span>
              <span style={{ color: 'var(--accent-amber)' }}>{Math.round(md.modelConfidence * 100)}% same entity</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ── ACKNOWLEDGE detail ─────────────────────────────────────────────────────────

function AcknowledgeDetail({ event }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  const [certified, setCertified] = useState(new Set())

  if (md.budgetLimit) {
    const pct = Math.round((md.budgetSpent / md.budgetLimit) * 100)
    const barColor = pct >= 80 ? 'var(--accent-coral)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-green)'
    return (
      <>
        <div className="evm-section">
          <div className="evm-section-title">SITUATION</div>
          <p className="evm-situation-text">{event.detail}</p>
        </div>
        <div className="evm-section">
          <div className="evm-section-title">BUDGET STATUS · {md.period}</div>
          <div className="evm-budget-bar-wrap">
            <div className="evm-budget-bar-track">
              <div className="evm-budget-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <div className="evm-budget-bar-labels">
              <span style={{ color: barColor, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 22 }}>{pct}%</span>
              <span className="evm-budget-bar-meta">${(md.budgetSpent / 1000).toFixed(0)}k of ${(md.budgetLimit / 1000).toFixed(0)}k consumed</span>
            </div>
          </div>
          <div className="evm-budget-wf-title">Top workflows by spend</div>
          {md.topWorkflows.map((w, i) => {
            const wPct = Math.round((w.spend / md.budgetSpent) * 100)
            return (
              <div key={i} className="evm-budget-wf-row">
                <span className="evm-budget-wf-name">{w.name}</span>
                <div className="evm-budget-wf-bar"><div className="evm-budget-wf-fill" style={{ width: `${wPct}%` }} /></div>
                <span className="evm-budget-wf-spend">${(w.spend / 1000).toFixed(1)}k</span>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  if (md.reportMetrics) {
    const r = md.reportMetrics
    return (
      <>
        <div className="evm-section">
          <div className="evm-section-title">SITUATION</div>
          <p className="evm-situation-text">{event.detail}</p>
        </div>
        <div className="evm-section">
          <div className="evm-section-title">ENGAGEMENT METRICS · {r.period}</div>
          <div className="evm-metrics-grid">
            {[
              { num: r.interactions,   lbl: 'Interactions',    color: null },
              { num: r.resolutionRate, lbl: 'Resolution Rate',  color: 'var(--accent-green)' },
              { num: r.avgHandleTime,  lbl: 'Avg Handle Time',  color: null },
              { num: r.escalations,    lbl: 'Escalations',      color: r.escalations > 5 ? 'var(--accent-amber)' : null },
            ].map(({ num, lbl, color }) => (
              <div key={lbl} className="evm-metric-card">
                <span className="evm-metric-num" style={color ? { color } : {}}>{num}</span>
                <span className="evm-metric-lbl">{lbl}</span>
              </div>
            ))}
          </div>
          <div className="evm-impact-group">
            <span className="evm-impact-label">Top topics</span>
            <div className="evm-blast-affected">
              {r.topTopics.map(t => <span key={t} className="evm-blast-chip">{t}</span>)}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (md.accessGrants) {
    return (
      <>
        <div className="evm-section">
          <div className="evm-section-title">SITUATION</div>
          <p className="evm-situation-text">{event.detail}</p>
        </div>
        <div className="evm-section">
          <div className="evm-section-title">ACCESS GRANTS TO REVIEW</div>
          <div className="evm-certify-table">
            {md.accessGrants.map((g, i) => (
              <div key={i} className="evm-certify-row">
                <div className="evm-certify-info">
                  <span className="evm-certify-name">{g.name}</span>
                  <span className="evm-certify-access">{g.access}</span>
                  <span className="evm-certify-date">Last reviewed {g.lastReviewed}</span>
                </div>
                {certified.has(i) ? (
                  <span className="evm-certify-done"><CheckCircle size={12} /> Certified</span>
                ) : (
                  <button className="wq-btn wq-btn--ghost evm-certify-btn"
                    onClick={() => setCertified(prev => new Set([...prev, i]))}>Certify</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="evm-section">
      <div className="evm-section-title">SITUATION</div>
      <p className="evm-situation-text">{event.detail}</p>
    </div>
  )
}

// ── TRAIN detail ───────────────────────────────────────────────────────────────

function TrainDetail({ event, editVal, setEditVal }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  const [isEditing, setIsEditing] = useState(false)

  return (
    <>
      <div className="evm-section">
        <div className="evm-section-title">SUBMISSION</div>
        {md.currentValue && (
          <div className="evm-train-submission">
            <div className="evm-train-field-row">
              <div className="evm-train-field-block">
                <span className="evm-train-label">Current model value</span>
                <span className="evm-train-value evm-train-value--current">{md.currentValue}</span>
              </div>
              <span className="evm-train-arrow">→</span>
              <div className="evm-train-field-block">
                <span className="evm-train-label">Proposed value</span>
                <span className="evm-train-value evm-train-value--proposed">{md.proposedValue}</span>
              </div>
            </div>
            <div className="evm-train-meta">
              <span>Submitted by {md.submitter}</span>
              <span>{fmtTs(md.submittedAt)}</span>
            </div>
            {md.note && <p className="evm-train-note">{md.note}</p>}
          </div>
        )}
      </div>

      {md.canonRecord && (
        <div className="evm-section">
          <div className="evm-section-title">SOURCE REFERENCE</div>
          <div className="evm-impact-group">
            <span className="evm-impact-label">Canon record</span>
            <code className="evm-canon-code">{md.canonRecord}</code>
          </div>
          {md.affectedAgents && (
            <div className="evm-impact-group" style={{ marginTop: 10 }}>
              <span className="evm-impact-label">Affected agents</span>
              <div className="evm-blast-affected">
                {md.affectedAgents.map(a => <span key={a} className="evm-blast-chip">{a}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="evm-section">
        <div className="evm-section-title">EDIT VALUE</div>
        {isEditing ? (
          <div className="evm-train-edit">
            <input className="evm-form-input" value={editVal}
              onChange={e => setEditVal(e.target.value)} autoFocus />
            <button className="wq-btn wq-btn--ghost" style={{ marginTop: 8 }} onClick={() => setIsEditing(false)}>
              Save edit
            </button>
          </div>
        ) : (
          <div className="evm-train-edit-row">
            <span className="evm-train-edit-val">{editVal || md.proposedValue || '—'}</span>
            <button className="wq-btn wq-btn--ghost"
              onClick={() => { setEditVal(editVal || md.proposedValue || ''); setIsEditing(true) }}>
              Edit value
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Confirm / form bodies ──────────────────────────────────────────────────────

function ConfirmApproveBody({ event, note, setNote }) {
  return (
    <div className="evm-section">
      <div className="evm-confirm-prompt">
        <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="evm-confirm-title">Approve "{event.title.slice(0, 60)}"?</div>
          <div className="evm-confirm-sub">Logged to audit trail with your identity and timestamp.</div>
        </div>
      </div>
      <label className="evm-form-label" style={{ marginTop: 16 }}>Note (optional)</label>
      <textarea className="evm-form-textarea" rows={3}
        placeholder="Add a note to the audit log…" value={note} onChange={e => setNote(e.target.value)} />
    </div>
  )
}

function ConfirmRejectBody({ event, reason, setReason }) {
  return (
    <div className="evm-section">
      <div className="evm-confirm-prompt evm-confirm-prompt--danger">
        <X size={18} style={{ color: 'var(--accent-coral)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="evm-confirm-title">Reject "{event.title.slice(0, 60)}"?</div>
          <div className="evm-confirm-sub">Requester will be notified. This action is logged.</div>
        </div>
      </div>
      <label className="evm-form-label" style={{ marginTop: 16 }}>
        Reason <span style={{ color: 'var(--accent-coral)' }}>*</span>
      </label>
      <textarea className="evm-form-textarea" rows={3}
        placeholder="Required — describe why this is being rejected…"
        value={reason} onChange={e => setReason(e.target.value)} />
    </div>
  )
}

function ChangeRequestBody({ event, changeRequest, setChangeRequest, assignTo, setAssignTo, dueBy, setDueBy }) {
  return (
    <div className="evm-section">
      <div className="evm-confirm-prompt">
        <div>
          <div className="evm-confirm-title">Request changes to "{event.title.slice(0, 55)}"</div>
          <div className="evm-confirm-sub">The owner receives your feedback and is asked to revise.</div>
        </div>
      </div>
      <label className="evm-form-label" style={{ marginTop: 16 }}>
        Changes requested <span style={{ color: 'var(--accent-coral)' }}>*</span>
      </label>
      <textarea className="evm-form-textarea" rows={4}
        placeholder="Describe the changes needed…"
        value={changeRequest} onChange={e => setChangeRequest(e.target.value)} />
      <label className="evm-form-label" style={{ marginTop: 12 }}>Assign to</label>
      <select className="evm-form-select" value={assignTo || ''}
        onChange={e => setAssignTo(e.target.value || null)}>
        <option value="">— auto-assign to owner —</option>
        {PEOPLE.filter(p => p.scope !== 'executive').map(p =>
          <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
        )}
      </select>
      <label className="evm-form-label" style={{ marginTop: 12 }}>Due by (optional)</label>
      <input type="date" className="evm-form-input" value={dueBy} onChange={e => setDueBy(e.target.value)} />
    </div>
  )
}

function ConfirmPromoteBody({ event, editVal }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  return (
    <div className="evm-section">
      <div className="evm-confirm-prompt">
        <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="evm-confirm-title">Promote to Canon?</div>
          <div className="evm-confirm-sub">Trains the model. This change is permanent and immutable.</div>
        </div>
      </div>
      {md.currentValue && (
        <div className="evm-promote-summary">
          <span className="evm-promote-from">{md.currentValue}</span>
          <span className="evm-promote-arrow">→</span>
          <span className="evm-promote-to">{editVal || md.proposedValue}</span>
        </div>
      )}
      {md.affectedAgents && (
        <div className="evm-impact-group" style={{ marginTop: 14 }}>
          <span className="evm-impact-label">Will retrain {md.affectedAgents.length} agents</span>
          <div className="evm-blast-affected">
            {md.affectedAgents.map(a => <span key={a} className="evm-blast-chip">{a}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

function AcceptConfirmBody({ event, choice }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  const src = choice === 'sourceA' ? md.sourceA : md.sourceB
  const letter = choice === 'sourceA' ? 'A' : 'B'
  const isEntity = event.id === 'EVT-018'

  return (
    <div className="evm-section">
      <div className="evm-confirm-prompt">
        <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="evm-confirm-title">Accept Source {letter}?</div>
          <div className="evm-confirm-sub">
            {isEntity
              ? `"${src?.name}" becomes the canonical entity record.`
              : `"${src?.value}" becomes the canon value. Affects ${md.affectedAgents?.length || 0} agents.`
            }
          </div>
        </div>
      </div>
      {src && (
        <div className="evm-accept-summary">
          <span className={`evm-source-badge evm-source-badge--${letter.toLowerCase()}`}>Source {letter}</span>
          <span className="evm-accept-val">{src.value || src.name}</span>
          <span className="evm-accept-owner">from {src.name || src.source}</span>
        </div>
      )}
    </div>
  )
}

// ── Attestation + Audit block ──────────────────────────────────────────────────

function AttestAuditBlock({ event, onRequestAttestation }) {
  const linked = ATTESTATIONS.filter(a => a.linkedEvent === event.id)
  const eventLogs = AUDIT_LOG
    .filter(a => a.artifact?.includes(event.id) || a.artifact?.includes(event.spec))
    .slice(-3).reverse()

  return (
    <div className="evm-footer">
      {linked.length > 0 && (
        <div className="evm-footer-section">
          <div className="evm-footer-title">ATTESTATIONS</div>
          {linked.map(a => (
            <div key={a.id} className="evm-footer-att">
              <span className={`evm-att-dot evm-att-dot--${a.status}`} />
              <span className="evm-footer-att-id">{a.id}</span>
              <span className="evm-footer-att-q">{a.question.slice(0, 80)}…</span>
            </div>
          ))}
        </div>
      )}
      {eventLogs.length > 0 && (
        <div className="evm-footer-section">
          <div className="evm-footer-title">AUDIT TRAIL</div>
          {eventLogs.map(a => (
            <div key={a.id} className="evm-footer-audit-row">
              <span className="evm-footer-audit-actor">{a.actor}</span>
              <span className="evm-footer-audit-action">{a.action}</span>
              <span className="evm-footer-audit-ts">{fmtTs(a.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
      <button className="evm-footer-link" onClick={onRequestAttestation}>Request verification →</button>
    </div>
  )
}

// ── Footer actions ─────────────────────────────────────────────────────────────

function FooterActions({ view, event, reason, changeRequest, setView, setChoice, onEscalate, onDecide, onClose }) {
  const type = event.type

  if (view === 'confirm-approve') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('detail')}>Cancel</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--primary" onClick={() => onDecide('Approved — logged to audit')}>
        Confirm Approve
      </button>
    </>
  )

  if (view === 'confirm-reject') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('detail')}>Cancel</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--danger" disabled={!reason.trim()}
        onClick={() => onDecide('Rejected — logged to audit')}>
        Confirm Reject
      </button>
    </>
  )

  if (view === 'change-request') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('detail')}>Cancel</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--primary" disabled={!changeRequest.trim()}
        onClick={() => onDecide('Change request sent — logged to audit')}>
        Send Request
      </button>
    </>
  )

  if (view === 'confirm-promote') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('detail')}>Cancel</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--primary" onClick={() => onDecide('Promoted to Canon — model will retrain')}>
        Confirm Promotion
      </button>
    </>
  )

  if (view === 'accept-confirm') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => { setView('resolve') }}>Cancel</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--primary"
        onClick={() => onDecide('Source accepted — canon record updated')}>
        Confirm Resolution
      </button>
    </>
  )

  // ── Detail / respond / resolve views ──
  if (type === 'approve') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('confirm-reject')}>Reject</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--ghost evm-escalate-btn" onClick={onEscalate}>Escalate</button>
      <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-approve')}>Approve →</button>
    </>
  )

  if (type === 'review') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('change-request')}>Request Changes</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--ghost evm-escalate-btn" onClick={onEscalate}>Escalate</button>
      <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-approve')}>Approve →</button>
    </>
  )

  if (type === 'respond') return (
    <>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--ghost evm-escalate-btn" onClick={onEscalate}>Escalate</button>
    </>
  )

  if (type === 'resolve') {
    const isEntity = event.id === 'EVT-018'
    return (
      <>
        <button className="wq-btn wq-btn--ghost"
          onClick={() => { setChoice('sourceA'); setView('accept-confirm') }}>
          {isEntity ? 'Keep Source A' : 'Accept Source A'}
        </button>
        <button className="wq-btn wq-btn--ghost"
          onClick={() => { setChoice('sourceB'); setView('accept-confirm') }}>
          {isEntity ? 'Merge into Source B' : 'Accept Source B'}
        </button>
        <div style={{ flex: 1 }} />
        <button className="wq-btn wq-btn--ghost evm-escalate-btn" onClick={onEscalate}>Escalate</button>
      </>
    )
  }

  if (type === 'acknowledge') return (
    <>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--primary" onClick={() => onDecide('Acknowledged — logged to audit')}>
        Acknowledge
      </button>
    </>
  )

  if (type === 'train') return (
    <>
      <button className="wq-btn wq-btn--ghost" onClick={() => setView('confirm-reject')}>Reject</button>
      <div style={{ flex: 1 }} />
      <button className="wq-btn wq-btn--ghost evm-escalate-btn" onClick={onEscalate}>Escalate</button>
      <button className="wq-btn wq-btn--primary" onClick={() => setView('confirm-promote')}>Promote →</button>
    </>
  )

  return <button className="wq-btn wq-btn--ghost" onClick={onClose}>Close</button>
}

// ── Body router ────────────────────────────────────────────────────────────────

function BodyContent({ view, event, note, setNote, reason, setReason, choice, setChoice, editVal, setEditVal, changeRequest, setChangeRequest, assignTo, setAssignTo, dueBy, setDueBy, onDecide }) {
  if (view === 'confirm-approve') return <ConfirmApproveBody event={event} note={note} setNote={setNote} />
  if (view === 'confirm-reject')  return <ConfirmRejectBody  event={event} reason={reason} setReason={setReason} />
  if (view === 'change-request')  return <ChangeRequestBody  event={event} changeRequest={changeRequest} setChangeRequest={setChangeRequest} assignTo={assignTo} setAssignTo={setAssignTo} dueBy={dueBy} setDueBy={setDueBy} />
  if (view === 'confirm-promote') return <ConfirmPromoteBody event={event} editVal={editVal} />
  if (view === 'accept-confirm')  return <AcceptConfirmBody  event={event} choice={choice} />
  if (view === 'respond')         return <ResolutionOptions  event={event} onDecide={onDecide} />
  if (view === 'resolve')         return <ResolveDetail      event={event} choice={choice} setChoice={setChoice} />

  switch (event.type) {
    case 'approve':     return <ApproveDetail     event={event} />
    case 'review':      return <ReviewDetail      event={event} />
    case 'respond':     return <RespondDetail     event={event} onDecide={onDecide} />
    case 'resolve':     return <ResolveDetail     event={event} choice={choice} setChoice={setChoice} />
    case 'acknowledge': return <AcknowledgeDetail event={event} />
    case 'train':       return <TrainDetail       event={event} editVal={editVal} setEditVal={setEditVal} />
    default:            return <div className="evm-section"><p className="evm-situation-text">{event.detail}</p></div>
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

const CONFIRM_VIEWS = new Set(['confirm-approve', 'confirm-reject', 'change-request', 'confirm-promote', 'accept-confirm'])

const VIEW_LABELS = {
  detail:           'Event Detail',
  respond:          'Resolution Options',
  resolve:          'Source Comparison',
  'confirm-approve': 'Confirm Approval',
  'confirm-reject':  'Confirm Rejection',
  'change-request':  'Request Changes',
  'confirm-promote': 'Confirm Promotion',
  'accept-confirm':  'Confirm Resolution',
}

export default function EventModal({ event, action, onClose, onRequestAttestation, onEscalate, onDecide }) {
  const [view,          setView]          = useState(() => getInitialView(event?.type, action))
  const [note,          setNote]          = useState('')
  const [reason,        setReason]        = useState('')
  const [choice,        setChoice]        = useState(null)
  const [editVal,       setEditVal]       = useState(() => EVENT_MODAL_DATA[event?.id]?.proposedValue || '')
  const [changeRequest, setChangeRequest] = useState('')
  const [assignTo,      setAssignTo]      = useState(null)
  const [dueBy,         setDueBy]         = useState('')

  useEffect(() => {
    document.body.classList.add('evm-active')
    return () => document.body.classList.remove('evm-active')
  }, [])

  if (!event) return null

  const etype    = EVENT_TYPES[event.type]
  const sevColor = SEV_COLORS[event.severity]
  const showAudit = !CONFIRM_VIEWS.has(view)

  return (
    <>
      <div className="evm-overlay" onClick={onClose} />
      <div className="evm-drawer" role="dialog" aria-modal="true">

        <div className="evm-sev-strip" style={{ background: sevColor }} />

        <div className="evm-header">
          <div className="evm-header-top">
            <div className="evm-header-meta">
              <span className="evm-header-id">{event.id}</span>
              <span className="evm-header-sep">·</span>
              <span className="evm-header-spec">{event.spec}</span>
              <span className="evm-header-sep">·</span>
              <span className="evm-header-kind">{event.kind}</span>
              <span className="evm-header-type" style={{ color: etype.color }}>{etype.label.toUpperCase()}</span>
            </div>
            <button className="evm-close-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
          <div className="evm-header-title">{event.title}</div>
          <div className="evm-header-sub">
            <span className="evm-header-view-label">{VIEW_LABELS[view] || 'Event Detail'}</span>
            <span className="evm-header-due">{event.dueLabel}</span>
          </div>
        </div>

        <div className="evm-scroll">
          <div className="evm-body">
            <BodyContent
              view={view} event={event}
              note={note} setNote={setNote}
              reason={reason} setReason={setReason}
              choice={choice} setChoice={setChoice}
              editVal={editVal} setEditVal={setEditVal}
              changeRequest={changeRequest} setChangeRequest={setChangeRequest}
              assignTo={assignTo} setAssignTo={setAssignTo}
              dueBy={dueBy} setDueBy={setDueBy}
              onDecide={onDecide}
            />
          </div>
          {showAudit && (
            <AttestAuditBlock event={event} onRequestAttestation={onRequestAttestation} />
          )}
        </div>

        <div className="evm-action-footer">
          <FooterActions
            view={view} event={event}
            reason={reason} changeRequest={changeRequest}
            setView={setView} setChoice={setChoice}
            onEscalate={onEscalate} onDecide={onDecide} onClose={onClose}
          />
        </div>

      </div>
    </>
  )
}
