import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pencil, Search, X, Check, ChevronRight } from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { triggerLibrary } from '../data/mockData.js'
import './ConditionDetail.css'
import './Triggers.css'

// ── Constants (mirrored from Triggers.jsx) ────────────────────────────────────
const TYPE_CFG = {
  'Customer behavior': { variant: 'blue',   icon: '💬' },
  'AI confidence':     { variant: 'purple', icon: '🤖' },
  'Score threshold':   { variant: 'amber',  icon: '📊' },
  'Specific event':    { variant: 'teal',   icon: '⚡' },
}

const TYPE_LIST = [
  { id: 'Customer behavior', icon: '💬', name: 'Customer behavior', desc: 'Detects intent or language patterns in customer messages' },
  { id: 'AI confidence',     icon: '🤖', name: 'AI confidence',     desc: "Fires when the AI's certainty drops below a threshold"   },
  { id: 'Score threshold',   icon: '📊', name: 'Score threshold',   desc: 'Triggers when a numeric score crosses a defined value'   },
  { id: 'Specific event',    icon: '⚡', name: 'Specific event',    desc: 'Activates when a concrete system event occurs'           },
]

const STUDIOS = ['Agentic Studio', 'Helix Governance Studio', 'Helix Data Studio', 'All Studios']
const STUDIO_CFG = {
  'Agentic Studio':          { bg: 'var(--accent-purple-dim)', border: 'var(--accent-purple-border)', color: 'var(--accent-purple)' },
  'Helix Governance Studio': { bg: 'var(--accent-teal-dim)',   border: 'var(--accent-teal-border)',   color: 'var(--accent-teal)'   },
  'Helix Data Studio':       { bg: 'var(--accent-blue-dim)',   border: 'var(--accent-blue-border)',   color: 'var(--accent-blue)'   },
  'All Studios':             { bg: 'var(--bg-card-elevated)',  border: 'var(--border)',               color: 'var(--text-tertiary)' },
}

const FORMS_CATALOG = [
  { id: 'purchase-intent-form', label: 'Purchase Intent Form',       desc: 'Submitted when a prospect signals purchase readiness'   },
  { id: 'demo-request-form',    label: 'Demo Request Form',          desc: 'Submitted from the website when a visitor requests a demo' },
  { id: 'support-ticket-form',  label: 'Support Ticket Submission',  desc: 'Customer submits a new support case'                    },
  { id: 'cancellation-survey',  label: 'Cancellation Survey',        desc: 'Customer completes the exit survey before cancelling'   },
  { id: 'refund-request-form',  label: 'Refund Request Form',        desc: 'Customer submits a formal refund request'               },
  { id: 'escalation-form',      label: 'Manual Escalation Form',     desc: 'Agent manually escalates an item to a senior queue'     },
  { id: 'onboarding-checklist', label: 'Onboarding Checklist',       desc: 'New customer completes the setup checklist'             },
  { id: 'feedback-survey',      label: 'Customer Feedback Survey',   desc: 'Post-interaction CSAT or NPS survey submission'         },
]

const STATUS_BY_ENTITY = {
  'Leads':            ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'On Hold', 'Awaiting Customer', 'Won', 'Lost'],
  'Deals':            ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'On Hold', 'Awaiting Customer', 'Closed Won', 'Closed Lost'],
  'Support Tickets':  ['Open', 'Pending', 'In Review', 'Awaiting Customer', 'On Hold', 'Escalated', 'Resolved', 'Breached', 'Closed'],
  'Invoices':         ['Draft', 'Pending Approval', 'Approved', 'Sent', 'On Hold', 'Overdue', 'Paid', 'Cancelled'],
  'Onboarding Tasks': ['Not Started', 'In Progress', 'Awaiting Customer', 'Blocked', 'Completed'],
  'Contracts':        ['Draft', 'Under Review', 'Pending Signature', 'Active', 'On Hold', 'Expired', 'Terminated'],
}
const STATUS_ENTITIES = Object.keys(STATUS_BY_ENTITY)

const TAGS_CATALOG = [
  'high-priority', 'vip-customer', 'churn-risk', 'billing-issue',
  'technical-escalation', 'compliance-flag', 'fraud-suspected',
  'win-back', 'renewal-at-risk', 'nps-detractor', 'enterprise-account',
  'trial-user', 'first-response', 'sla-at-risk', 'outage-related',
]

// ── Mock data for tab 2, 3, 4 ─────────────────────────────────────────────────
const MOCK_PACK_INFO = {
  'Customer Escalation — Tier 1':  { studio: 'Agentic Studio',          pattern: 'Handoff',      status: 'Active', lastTriggered: '2h ago'  },
  'Hot Lead Closure':              { studio: 'Agentic Studio',          pattern: 'Continuation', status: 'Active', lastTriggered: '4h ago'  },
  'Procurement Gate':              { studio: 'Helix Governance Studio', pattern: 'Approval',     status: 'Active', lastTriggered: '1d ago'  },
  'Procurement Gate — Mid-Market': { studio: 'Helix Governance Studio', pattern: 'Approval',     status: 'Active', lastTriggered: '1d ago'  },
  'Invoice Approval — Finance':    { studio: 'Helix Governance Studio', pattern: 'Approval',     status: 'Active', lastTriggered: '2d ago'  },
  'SME Content Review':            { studio: 'Helix Data Studio',       pattern: 'Review',       status: 'Active', lastTriggered: '3d ago'  },
}

const VERSION_HISTORY = [
  { version: 'v1.2', changedBy: 'Alexa M.', date: '2d ago', summary: 'Added exclusion: informational cancellation questions'  },
  { version: 'v1.1', changedBy: 'Alexa M.', date: '5d ago', summary: "Expanded signal keywords: added 'want to leave'"        },
  { version: 'v1.0', changedBy: 'Alexa M.', date: '7d ago', summary: 'Initial condition created'                              },
]

const ACTIVITY_LOG = [
  { icon: '✏️', actor: 'Alexa M.',  action: 'edited this condition',                              time: '2d ago' },
  { icon: '🔗', actor: 'Alexa M.',  action: 'attached to Pack "Customer Escalation — Tier 1"',   time: '3d ago' },
  { icon: '👁',  actor: 'Thomas G.', action: 'viewed this condition',                              time: '5d ago' },
]

// ── StudioBadge ───────────────────────────────────────────────────────────────
function StudioBadge({ studio }) {
  const sc = STUDIO_CFG[studio] || STUDIO_CFG['All Studios']
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
      borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap',
    }}>
      {studio}
    </span>
  )
}

// ── Tab 1: Configuration ──────────────────────────────────────────────────────
function ConfigTab({ initial }) {
  const [studio,      setStudio]      = useState(initial?.studio      || 'All Studios')
  const [type,        setType]        = useState(initial?.type        || 'Customer behavior')
  const [typeSearch,  setTypeSearch]  = useState('')
  const [status,      setStatus]      = useState(initial?.status      || 'active')
  const [description, setDescription] = useState(initial?.description || '')
  const [keywords,    setKeywords]    = useState(initial?.keywords    || [])
  const [kwInput,     setKwInput]     = useState('')
  const [examples,    setExamples]    = useState(initial?.examples    || [])
  const [exInput,     setExInput]     = useState('')
  const [exclusions,  setExclusions]  = useState(initial?.exclusions  || '')
  const [sensitivity, setSensitivity] = useState(initial?.sensitivity || 'balanced')
  const [threshold,   setThreshold]   = useState(initial?.threshold   || 60)
  const [scoreType,   setScoreType]   = useState(initial?.scoreType   || 'CSAT')
  const [operator,    setOperator]    = useState(initial?.operator    || 'below')
  const [scoreValue,  setScoreValue]  = useState(initial?.value !== undefined ? String(initial.value) : '3')
  const [eventType,      setEventType]      = useState(initial?.event        || 'form_submit')
  const [selectedForm,   setSelectedForm]   = useState(initial?.formId       || '')
  const [statusEntity,   setStatusEntity]   = useState(initial?.statusEntity || '')
  const [fromStatus,     setFromStatus]     = useState(initial?.fromStatus   || '')
  const [toStatus,       setToStatus]       = useState(initial?.toStatus     || '')
  const [selectedTags,   setSelectedTags]   = useState(initial?.tags         || [])
  const [customEvtName,  setCustomEvtName]  = useState(initial?.customEvent  || '')
  const [customProps,    setCustomProps]    = useState(initial?.customProps   || [])
  const [propKey,        setPropKey]        = useState('')
  const [propVal,        setPropVal]        = useState('')

  const addKeyword = () => {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw)) { setKeywords(ks => [...ks, kw]); setKwInput('') }
  }
  const addExample = () => {
    const ex = exInput.trim()
    if (ex && !examples.includes(ex)) { setExamples(es => [...es, ex]); setExInput('') }
  }
  const addProp = () => {
    if (propKey.trim()) {
      setCustomProps(ps => [...ps, { key: propKey.trim(), value: propVal.trim() }])
      setPropKey(''); setPropVal('')
    }
  }

  const echo = () => {
    if (type === 'AI confidence')   return `Fires when AI confidence drops below ${threshold}%`
    if (type === 'Score threshold') return `Fires when ${scoreType} goes ${operator} ${scoreValue}`
    if (type === 'Specific event') {
      if (eventType === 'form_submit')   return selectedForm ? `Fires when the "${selectedForm}" form is submitted` : 'Fires when a form is submitted'
      if (eventType === 'status_change') {
        const where = statusEntity ? ` in ${statusEntity}` : ''
        if (fromStatus && toStatus) return `Fires when${where} status changes from "${fromStatus}" to "${toStatus}"`
        if (toStatus)               return `Fires when${where} status changes to "${toStatus}"`
        return `Fires when${where} item status changes`
      }
      if (eventType === 'tag_applied') return selectedTags.length > 0 ? `Fires when tag${selectedTags.length > 1 ? 's' : ''} [${selectedTags.join(', ')}] ${selectedTags.length > 1 ? 'are' : 'is'} applied` : 'Fires when a tag is applied'
      if (eventType === 'custom')      return customEvtName ? `Fires when event "${customEvtName}" occurs` : 'Fires when a custom event occurs'
    }
    return ''
  }

  const typeVisible = (() => {
    const q = typeSearch.trim().toLowerCase()
    return q ? TYPE_LIST.filter(t => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) : TYPE_LIST
  })()

  return (
    <div className="cd-config">

      {/* Studio */}
      <div className="tl-field">
        <label className="tl-label">Studio</label>
        <div className="tl-assign-row">
          {STUDIOS.map(s => (
            <button key={s} className={`tl-assign-btn${studio === s ? ' tl-assign-btn--sel' : ''}`} onClick={() => setStudio(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="tl-field">
        <label className="tl-label">Type <span className="tl-req">*</span></label>
        <div className="tl-type-search-wrap">
          <Search size={13} className="tl-type-search-icon" />
          <input className="tl-type-search-input" placeholder="Search condition types…" value={typeSearch} onChange={e => setTypeSearch(e.target.value)} />
        </div>
        <div className="tl-type-list">
          {typeVisible.length === 0 && <div className="tl-type-no-results">No types match your search.</div>}
          {typeVisible.map(t => {
            const sel = type === t.id
            return (
              <div key={t.id} className={`tl-type-opt${sel ? ' tl-type-opt--sel' : ''}`} onClick={() => setType(t.id)}>
                <span className="tl-type-opt-icon">{t.icon}</span>
                <div className="tl-type-opt-body">
                  <div className="tl-type-opt-name">{t.name}</div>
                  <div className="tl-type-opt-desc">{t.desc}</div>
                </div>
                {sel && <Check size={14} className="tl-type-opt-check" />}
              </div>
            )
          })}
          {!typeSearch.trim() && (
            <div className="tl-type-opt tl-type-opt--more">
              <span className="tl-type-opt-icon tl-type-opt-icon--more">+</span>
              <div className="tl-type-opt-body">
                <div className="tl-type-opt-name tl-type-opt-name--more">More condition types</div>
                <div className="tl-type-opt-desc">Additional types will be available as the platform expands</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer behavior ─────────────────────────────────────────────── */}
      {type === 'Customer behavior' && (<>
        <div className="tl-field">
          <label className="tl-label">Intent description <span className="tl-req">*</span></label>
          <div className="tl-hint" style={{ marginBottom: 6 }}>Write a detailed description of what the customer is saying, feeling, or doing. The AI reads this as its primary guide — be specific about intent, tone, and context.</div>
          <textarea className="tl-textarea" rows={8} style={{ fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6 }}
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="tl-field">
          <label className="tl-label">Example messages that should fire this trigger</label>
          <div className="tl-hint" style={{ marginBottom: 8 }}>Paste real examples from your conversations. These train the AI on your specific customer language and phrasing.</div>
          {examples.length > 0 && (
            <div className="tl-ex-list">
              {examples.map((ex, i) => (
                <div key={i} className="tl-ex-item">
                  <span className="tl-ex-quote">"{ex}"</span>
                  <button className="tl-ex-remove" onClick={() => setExamples(es => es.filter((_, j) => j !== i))}><X size={10} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="tl-kw-row">
            <input className="tl-input" placeholder='e.g. "I want to cancel my account immediately"'
              value={exInput} onChange={e => setExInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExample()} />
            <Button variant="secondary" size="sm" onClick={addExample}>Add</Button>
          </div>
        </div>

        <div className="tl-field">
          <label className="tl-label">Signal keywords</label>
          <div className="tl-hint" style={{ marginBottom: 8 }}>Key words or phrases that strongly indicate this behavior. The AI treats these as strong signals — not exact matches.</div>
          {keywords.length > 0 && (
            <div className="tl-kw-pills">
              {keywords.map(kw => (
                <span key={kw} className="tl-kw-pill">
                  {kw}
                  <button onClick={() => setKeywords(ks => ks.filter(k => k !== kw))}><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="tl-kw-row">
            <input className="tl-input" placeholder="Add keyword and press Enter…"
              value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} />
            <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
          </div>
        </div>

        <div className="tl-field">
          <label className="tl-label">What should NOT trigger this (exclusions)</label>
          <div className="tl-hint" style={{ marginBottom: 6 }}>Describe cases that look similar but should be ignored. Helps prevent false positives.</div>
          <textarea className="tl-textarea" rows={4} style={{ fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6 }}
            value={exclusions} onChange={e => setExclusions(e.target.value)} />
        </div>

        <div className="tl-field">
          <label className="tl-label">Detection sensitivity</label>
          <div className="tl-hint" style={{ marginBottom: 8 }}>Controls how broadly the AI interprets signals.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'strict',   label: 'Strict',   hint: 'Only clear, explicit statements'       },
              { id: 'balanced', label: 'Balanced', hint: 'Explicit + strong implied intent'       },
              { id: 'broad',    label: 'Broad',    hint: 'Includes indirect or subtle signals'    },
            ].map(s => (
              <button key={s.id} title={s.hint} className={`tl-type-btn${sensitivity === s.id ? ' tl-type-btn--sel' : ''}`}
                style={{ flex: 1, flexDirection: 'column', gap: 3, padding: '8px 10px' }} onClick={() => setSensitivity(s.id)}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 400, textAlign: 'center' }}>{s.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </>)}

      {/* ── AI confidence ─────────────────────────────────────────────────── */}
      {type === 'AI confidence' && (
        <div className="tl-field">
          <label className="tl-label">Confidence threshold</label>
          <div className="tl-slider-row">
            <span className="tl-slider-edge">30%</span>
            <input type="range" min={30} max={90} step={5} value={threshold} className="tl-slider"
              onChange={e => setThreshold(Number(e.target.value))} />
            <span className="tl-slider-edge">90%</span>
            <span className="tl-slider-val">{threshold}%</span>
          </div>
          <div className="tl-echo">Fires when AI confidence drops below <strong>{threshold}%</strong></div>
        </div>
      )}

      {/* ── Score threshold ───────────────────────────────────────────────── */}
      {type === 'Score threshold' && (
        <div className="tl-field">
          <label className="tl-label">Condition</label>
          <div className="tl-score-row">
            <select className="tl-sel" value={scoreType} onChange={e => setScoreType(e.target.value)}>
              <option>CSAT</option><option>Deal value</option><option>Risk score</option><option>Invoice amount</option><option>Custom</option>
            </select>
            <select className="tl-sel" value={operator} onChange={e => setOperator(e.target.value)}>
              <option value="below">below</option><option value="above">above</option>
            </select>
            <input type="text" className="tl-input-sm" value={scoreValue} onChange={e => setScoreValue(e.target.value)} placeholder="e.g. 3" />
          </div>
          <div className="tl-echo">Fires when <strong>{scoreType}</strong> goes <strong>{operator}</strong> <strong>{scoreValue}</strong></div>
        </div>
      )}

      {/* ── Specific event ────────────────────────────────────────────────── */}
      {type === 'Specific event' && (<>
        <div className="tl-field">
          <label className="tl-label">Event type</label>
          <div className="tl-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              { id: 'form_submit',   label: 'Form submitted', emoji: '📋' },
              { id: 'status_change', label: 'Status changes',  emoji: '🔄' },
              { id: 'tag_applied',   label: 'Tag applied',     emoji: '🏷' },
              { id: 'custom',        label: 'Custom event',    emoji: '⚙️' },
            ].map(ev => (
              <button key={ev.id} className={`tl-type-btn${eventType === ev.id ? ' tl-type-btn--sel' : ''}`} onClick={() => setEventType(ev.id)}>
                <span>{ev.emoji}</span><span>{ev.label}</span>
              </button>
            ))}
          </div>
        </div>

        {eventType === 'form_submit' && (
          <div className="tl-field">
            <label className="tl-label">Which form?</label>
            <div className="tl-hint" style={{ marginBottom: 8 }}>Select the form that should fire this trigger when submitted.</div>
            <div className="tl-ev-cards">
              {FORMS_CATALOG.map(f => (
                <div key={f.id} className={`tl-ev-card${selectedForm === f.id ? ' tl-ev-card--sel' : ''}`} onClick={() => setSelectedForm(f.id)}>
                  <div className="tl-ev-card-name">{f.label}</div>
                  <div className="tl-ev-card-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eventType === 'status_change' && (
          <div className="tl-field">
            <label className="tl-label">Status transition</label>
            <div className="tl-hint" style={{ marginBottom: 12 }}>Select the entity first — available statuses depend on where the change happens.</div>
            <div style={{ marginBottom: 14 }}>
              <div className="tl-col-label">In <span style={{ color: 'var(--accent-coral)' }}>*</span></div>
              <div className="tl-entity-grid">
                {STATUS_ENTITIES.map(ent => (
                  <button key={ent} className={`tl-entity-btn${statusEntity === ent ? ' tl-entity-btn--sel' : ''}`}
                    onClick={() => { setStatusEntity(ent); setFromStatus(''); setToStatus('') }}>{ent}</button>
                ))}
              </div>
            </div>
            {statusEntity ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div className="tl-col-label">From (optional)</div>
                  <select className="tl-sel-full" value={fromStatus} onChange={e => setFromStatus(e.target.value)}>
                    <option value="">Any status</option>
                    {STATUS_BY_ENTITY[statusEntity].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ fontSize: 18, color: 'var(--text-tertiary)', paddingTop: 18 }}>→</div>
                <div style={{ flex: 1 }}>
                  <div className="tl-col-label">To <span style={{ color: 'var(--accent-coral)' }}>*</span></div>
                  <select className="tl-sel-full" value={toStatus} onChange={e => setToStatus(e.target.value)}>
                    <option value="">Select status…</option>
                    {STATUS_BY_ENTITY[statusEntity].filter(s => s !== fromStatus).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px 14px', background: 'var(--bg-card-elevated)', border: '1px dashed var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                ↑ Select an entity above to see available statuses
              </div>
            )}
          </div>
        )}

        {eventType === 'tag_applied' && (
          <div className="tl-field">
            <label className="tl-label">Which tag(s)?</label>
            <div className="tl-hint" style={{ marginBottom: 8 }}>Trigger fires when ANY of the selected tags is applied.</div>
            <div className="tl-tag-grid">
              {TAGS_CATALOG.map(tag => {
                const sel = selectedTags.includes(tag)
                return (
                  <button key={tag} className={`tl-tag-opt${sel ? ' tl-tag-opt--sel' : ''}`}
                    onClick={() => setSelectedTags(ts => sel ? ts.filter(t => t !== tag) : [...ts, tag])}>{tag}</button>
                )
              })}
            </div>
            {selectedTags.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>{selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected</div>}
          </div>
        )}

        {eventType === 'custom' && (<>
          <div className="tl-field">
            <label className="tl-label">Event name <span className="tl-req">*</span></label>
            <div className="tl-hint" style={{ marginBottom: 6 }}>The exact event identifier sent from your integration or webhook. Case-sensitive.</div>
            <input className="tl-input" style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}
              placeholder="e.g. deal.stage_changed  or  invoice.overdue"
              value={customEvtName} onChange={e => setCustomEvtName(e.target.value)} />
          </div>
          <div className="tl-field">
            <label className="tl-label">Filter by event properties (optional)</label>
            {customProps.length > 0 && (
              <div className="tl-prop-list">
                {customProps.map((p, i) => (
                  <div key={i} className="tl-prop-row">
                    <code className="tl-prop-key">{p.key}</code>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>=</span>
                    <code className="tl-prop-val">{p.value}</code>
                    <button className="tl-ex-remove" onClick={() => setCustomProps(ps => ps.filter((_, j) => j !== i))}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
              <input className="tl-input" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} placeholder="property key" value={propKey} onChange={e => setPropKey(e.target.value)} />
              <input className="tl-input" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} placeholder="expected value" value={propVal} onChange={e => setPropVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProp()} />
              <Button variant="secondary" size="sm" onClick={addProp}>Add</Button>
            </div>
          </div>
        </>)}

        {echo() && <div className="tl-echo">{echo()}</div>}
      </>)}

      {/* Status */}
      <div className="tl-field">
        <label className="tl-label">Status</label>
        <div className="tl-status-row">
          {[{ id: 'active', label: 'Active' }, { id: 'draft', label: 'Draft' }].map(s => (
            <button key={s.id} className={`tl-status-btn${status === s.id ? ' tl-status-btn--sel' : ''}`} onClick={() => setStatus(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab 2: Packs ──────────────────────────────────────────────────────────────
function PacksTab({ condition }) {
  const packs = condition.usedInPackNames || []
  if (packs.length === 0) {
    return <div className="cd-empty">No packs are using this condition yet.</div>
  }
  return (
    <div className="cd-table-wrap">
      <table className="cd-table">
        <thead>
          <tr>
            <th className="cd-th">Pack name</th>
            <th className="cd-th">Studio</th>
            <th className="cd-th">Pattern</th>
            <th className="cd-th">Status</th>
            <th className="cd-th">Last triggered</th>
          </tr>
        </thead>
        <tbody>
          {packs.map(p => {
            const info = MOCK_PACK_INFO[p] || { studio: 'Agentic Studio', pattern: 'Handoff', status: 'Active', lastTriggered: '—' }
            return (
              <tr key={p} className="cd-tr">
                <td className="cd-td"><span className="cd-pack-link">{p}</span></td>
                <td className="cd-td cd-td--mono">{info.studio}</td>
                <td className="cd-td cd-td--mono">{info.pattern}</td>
                <td className="cd-td">
                  <Badge label={info.status} variant="teal" size="sm" />
                </td>
                <td className="cd-td cd-td--mono">{info.lastTriggered}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Tab 3: Version History ────────────────────────────────────────────────────
function HistoryTab() {
  const [expanded, setExpanded] = useState({})
  const toggle = v => setExpanded(e => ({ ...e, [v]: !e[v] }))
  return (
    <div className="cd-hist-list">
      {VERSION_HISTORY.map(v => (
        <div key={v.version} className="cd-hist-row">
          <div className="cd-hist-hdr" onClick={() => toggle(v.version)}>
            <span className="cd-hist-version">{v.version}</span>
            <div className="cd-hist-summary">{v.summary}</div>
            <div className="cd-hist-meta">{v.changedBy} · {v.date}</div>
            <ChevronRight size={14} className={`cd-hist-chevron${expanded[v.version] ? ' cd-hist-chevron--open' : ''}`} />
          </div>
          {expanded[v.version] && (
            <div className="cd-hist-body">Configuration updated</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab 4: Activity ───────────────────────────────────────────────────────────
function ActivityTab() {
  return (
    <div className="cd-activity-list">
      {ACTIVITY_LOG.map((a, i) => (
        <div key={i} className="cd-activity-row">
          <div className="cd-activity-icon">{a.icon}</div>
          <div className="cd-activity-body">
            <div>
              <span className="cd-activity-actor">{a.actor}</span>
              {' '}
              <span className="cd-activity-action">{a.action}</span>
            </div>
            <div className="cd-activity-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'config',   label: 'Configuration'   },
  { id: 'packs',    label: 'Packs using this' },
  { id: 'history',  label: 'Version History'  },
  { id: 'activity', label: 'Activity'         },
]

export default function ConditionDetail() {
  const { id } = useParams()
  const condition = triggerLibrary.find(t => t.id === id) || triggerLibrary[0]

  const [name,        setName]        = useState(condition.name)
  const [nameEditing, setNameEditing] = useState(false)
  const [activeTab,   setActiveTab]   = useState('config')
  const [saved,       setSaved]       = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const cfg = TYPE_CFG[condition.type] || TYPE_CFG['Customer behavior']

  return (
    <div>
      {/* Back link */}
      <Link to="/settings/triggers" className="cd-back">← Conditions</Link>

      {/* Header */}
      <div className="cd-header">
        <div className="cd-name-area">
          {nameEditing ? (
            <input
              className="cd-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setNameEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setNameEditing(false)}
              autoFocus
            />
          ) : (
            <div className="cd-name-wrap" onClick={() => setNameEditing(true)}>
              <h1 className="cd-name">{name}</h1>
              <Pencil size={14} className="cd-name-edit-icon" />
            </div>
          )}
          <div className="cd-badges">
            <Badge label={condition.type} variant={cfg.variant} size="sm" />
            <StudioBadge studio={condition.studio} />
            <Badge
              label={condition.status === 'active' ? 'Active' : 'Draft'}
              variant={condition.status === 'active' ? 'teal' : 'amber'}
              size="sm"
            />
          </div>
        </div>
        <div className="cd-header-actions">
          {saved && <span className="cd-saved-note">Changes saved</span>}
          <Button variant="secondary" size="sm">Archive</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save changes</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cd-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`cd-tab${activeTab === t.id ? ' cd-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab bodies */}
      {activeTab === 'config'   && <ConfigTab  initial={condition} key={condition.id} />}
      {activeTab === 'packs'    && <PacksTab   condition={condition} />}
      {activeTab === 'history'  && <HistoryTab />}
      {activeTab === 'activity' && <ActivityTab />}
    </div>
  )
}
