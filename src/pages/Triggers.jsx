import { useState } from 'react'
import { Plus, Pencil, X, MoreHorizontal } from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { triggerLibrary } from '../data/mockData.js'
import './Triggers.css'

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  'Customer behavior': { variant: 'blue',   icon: '💬' },
  'AI confidence':     { variant: 'purple', icon: '🤖' },
  'Score threshold':   { variant: 'amber',  icon: '📊' },
  'Specific event':    { variant: 'teal',   icon: '⚡' },
}
const TYPE_TABS = ['Customer behavior', 'AI confidence', 'Score threshold', 'Specific event']

// ─── Specific event — reference data ─────────────────────────────────────────
const FORMS_CATALOG = [
  { id: 'purchase-intent-form',   label: 'Purchase Intent Form',        desc: 'Submitted when a prospect signals purchase readiness' },
  { id: 'demo-request-form',      label: 'Demo Request Form',           desc: 'Submitted from the website when a visitor requests a demo' },
  { id: 'support-ticket-form',    label: 'Support Ticket Submission',   desc: 'Customer submits a new support case' },
  { id: 'cancellation-survey',    label: 'Cancellation Survey',         desc: 'Customer completes the exit survey before cancelling' },
  { id: 'refund-request-form',    label: 'Refund Request Form',         desc: 'Customer submits a formal refund request' },
  { id: 'escalation-form',        label: 'Manual Escalation Form',      desc: 'Agent manually escalates an item to a senior queue' },
  { id: 'onboarding-checklist',   label: 'Onboarding Checklist',        desc: 'New customer completes the setup checklist' },
  { id: 'feedback-survey',        label: 'Customer Feedback Survey',    desc: 'Post-interaction CSAT or NPS survey submission' },
]

const STATUS_BY_ENTITY = {
  'Leads':           ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'On Hold', 'Awaiting Customer', 'Won', 'Lost'],
  'Deals':           ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'On Hold', 'Awaiting Customer', 'Closed Won', 'Closed Lost'],
  'Support Tickets': ['Open', 'Pending', 'In Review', 'Awaiting Customer', 'On Hold', 'Escalated', 'Resolved', 'Breached', 'Closed'],
  'Invoices':        ['Draft', 'Pending Approval', 'Approved', 'Sent', 'On Hold', 'Overdue', 'Paid', 'Cancelled'],
  'Onboarding Tasks':['Not Started', 'In Progress', 'Awaiting Customer', 'Blocked', 'Completed'],
  'Contracts':       ['Draft', 'Under Review', 'Pending Signature', 'Active', 'On Hold', 'Expired', 'Terminated'],
}
const STATUS_ENTITIES = Object.keys(STATUS_BY_ENTITY)
const STATUS_VALUES = ['Open', 'Pending', 'Resolved', 'Escalated', 'On Hold', 'Breached', 'Closed', 'Awaiting Customer', 'In Review']

const TAGS_CATALOG = [
  'high-priority', 'vip-customer', 'churn-risk', 'billing-issue',
  'technical-escalation', 'compliance-flag', 'fraud-suspected',
  'win-back', 'renewal-at-risk', 'nps-detractor', 'enterprise-account',
  'trial-user', 'first-response', 'sla-at-risk', 'outage-related',
]

// ─── Drawer ───────────────────────────────────────────────────────────────────
function TriggerDrawer({ trigger, onSave, onClose }) {
  const [name,        setName]        = useState(trigger?.name        || '')
  const [type,        setType]        = useState(trigger?.type        || 'Customer behavior')
  const [status,      setStatus]      = useState(trigger?.status      || 'active')
  const [description, setDescription] = useState(trigger?.description || '')
  const [keywords,    setKeywords]    = useState(trigger?.keywords    || [])
  const [kwInput,     setKwInput]     = useState('')
  // Customer behavior extras
  const [examples,    setExamples]    = useState(trigger?.examples    || [])
  const [exInput,     setExInput]     = useState('')
  const [exclusions,  setExclusions]  = useState(trigger?.exclusions  || '')
  const [sensitivity, setSensitivity] = useState(trigger?.sensitivity || 'balanced')
  // Other types
  const [threshold,   setThreshold]   = useState(trigger?.threshold   || 60)
  const [scoreType,   setScoreType]   = useState(trigger?.scoreType   || 'CSAT')
  const [operator,    setOperator]    = useState(trigger?.operator    || 'below')
  const [scoreValue,  setScoreValue]  = useState(trigger?.value       !== undefined ? String(trigger.value) : '3')
  const [eventType,       setEventType]       = useState(trigger?.event         || 'form_submit')
  // form_submit
  const [selectedForm,    setSelectedForm]    = useState(trigger?.formId        || '')
  // status_change
  const [statusEntity,    setStatusEntity]    = useState(trigger?.statusEntity  || '')
  const [fromStatus,      setFromStatus]      = useState(trigger?.fromStatus    || '')
  const [toStatus,        setToStatus]        = useState(trigger?.toStatus      || '')
  // tag_applied
  const [selectedTags,    setSelectedTags]    = useState(trigger?.tags          || [])
  const [tagSearch,       setTagSearch]       = useState('')
  // custom
  const [customEvtName,   setCustomEvtName]   = useState(trigger?.customEvent   || '')
  const [customProps,     setCustomProps]     = useState(trigger?.customProps    || [])
  const [propKey,         setPropKey]         = useState('')
  const [propVal,         setPropVal]         = useState('')

  const addExample = () => {
    const ex = exInput.trim()
    if (ex && !examples.includes(ex)) { setExamples(es => [...es, ex]); setExInput('') }
  }

  const addKeyword = () => {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw)) { setKeywords(ks => [...ks, kw]); setKwInput('') }
  }

  const echo = () => {
    if (type === 'AI confidence')   return `Fires when AI confidence drops below ${threshold}%`
    if (type === 'Score threshold') return `Fires when ${scoreType} goes ${operator} ${scoreValue}`
    if (type === 'Specific event') {
      if (eventType === 'form_submit')    return selectedForm ? `Fires when the "${selectedForm}" form is submitted` : 'Fires when a form is submitted'
      if (eventType === 'status_change') {
        const where = statusEntity ? ` in ${statusEntity}` : ''
        if (fromStatus && toStatus) return `Fires when${where} status changes from "${fromStatus}" to "${toStatus}"`
        if (toStatus)               return `Fires when${where} status changes to "${toStatus}"`
        return `Fires when${where} item status changes`
      }
      if (eventType === 'tag_applied')    return selectedTags.length > 0 ? `Fires when tag${selectedTags.length > 1 ? 's' : ''} [${selectedTags.join(', ')}] ${selectedTags.length > 1 ? 'are' : 'is'} applied` : 'Fires when a tag is applied'
      if (eventType === 'custom')         return customEvtName ? `Fires when event "${customEvtName}" occurs` : 'Fires when a custom event occurs'
    }
    return ''
  }

  const handleSave = () => {
    if (!name.trim()) return
    const base = { name, type, status }
    let extra = {}
    if (type === 'Customer behavior') extra = { description, keywords, examples, exclusions, sensitivity }
    if (type === 'AI confidence')     extra = { threshold }
    if (type === 'Score threshold')   extra = { scoreType, operator, value: parseFloat(scoreValue) || 0 }
    if (type === 'Specific event')    extra = { event: eventType, formId: selectedForm, statusEntity, fromStatus, toStatus, tags: selectedTags, customEvent: customEvtName, customProps }
    onSave({ ...base, ...extra })
  }

  return (
    <>
      <div className="tl-overlay" onClick={onClose} />
      <div className="tl-drawer">
        {/* Header */}
        <div className="tl-drawer-hdr">
          <span className="tl-drawer-title">{trigger ? 'Edit Trigger' : 'New Trigger'}</span>
          <button className="tl-drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="tl-drawer-body">

          {/* Name */}
          <div className="tl-field">
            <label className="tl-label">Name <span className="tl-req">*</span></label>
            <input
              className="tl-input"
              placeholder="e.g. Customer asks to cancel"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="tl-field">
            <label className="tl-label">Type <span className="tl-req">*</span></label>
            <div className="tl-type-grid">
              {TYPE_TABS.map(t => {
                const sel = type === t
                const cfg = TYPE_CFG[t]
                return (
                  <button
                    key={t}
                    className={`tl-type-btn${sel ? ' tl-type-btn--sel' : ''}`}
                    onClick={() => setType(t)}
                  >
                    <span>{cfg.icon}</span>
                    <span>{t}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type-specific config */}
          {type === 'Customer behavior' && (
            <>
              {/* ── Intent description ─────────────────────────────── */}
              <div className="tl-field">
                <label className="tl-label">Intent description <span className="tl-req">*</span></label>
                <div className="tl-hint" style={{ marginBottom: 6 }}>
                  Write a detailed description of what the customer is saying, feeling, or doing. The AI reads this as its primary guide — be specific about intent, tone, and context.
                </div>
                <textarea
                  className="tl-textarea"
                  placeholder={`Describe the customer behavior or intent you want to detect. Include tone, context, and variations.

Example:
"This trigger should fire when a customer clearly indicates they intend to cancel their subscription or account. This includes direct requests ('I want to cancel', 'please close my account', 'I'd like to terminate my subscription'), frustrated statements hinting at leaving ('I'm done with this service', 'this isn't worth it anymore'), expressions of switching to a competitor ('I'm moving to another provider'), or ultimatums ('fix this or I'm cancelling').

The customer may be angry, disappointed, or simply making an administrative request — intent to leave is the key signal regardless of tone. Detect even indirect signals like 'I don't think I need this anymore' or 'how do I get a refund' when combined with frustration context."`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={8}
                  style={{ fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6 }}
                />
              </div>

              {/* ── Trigger examples ───────────────────────────────── */}
              <div className="tl-field">
                <label className="tl-label">Example messages that should fire this trigger</label>
                <div className="tl-hint" style={{ marginBottom: 8 }}>
                  Paste real examples from your conversations. These train the AI on your specific customer language and phrasing.
                </div>
                {examples.length > 0 && (
                  <div className="tl-ex-list">
                    {examples.map((ex, i) => (
                      <div key={i} className="tl-ex-item">
                        <span className="tl-ex-quote">"{ex}"</span>
                        <button className="tl-ex-remove" onClick={() => setExamples(es => es.filter((_, j) => j !== i))}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="tl-kw-row">
                  <input
                    className="tl-input"
                    placeholder='e.g. "I want to cancel my account immediately"'
                    value={exInput}
                    onChange={e => setExInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addExample()}
                  />
                  <Button variant="secondary" size="sm" onClick={addExample}>Add</Button>
                </div>
              </div>

              {/* ── Keywords ───────────────────────────────────────── */}
              <div className="tl-field">
                <label className="tl-label">Signal keywords</label>
                <div className="tl-hint" style={{ marginBottom: 8 }}>
                  Key words or phrases that strongly indicate this behavior. The AI treats these as strong signals — not exact matches.
                </div>
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
                  <input
                    className="tl-input"
                    placeholder="Add keyword and press Enter…"
                    value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  />
                  <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
                </div>
              </div>

              {/* ── Exclusion criteria ─────────────────────────────── */}
              <div className="tl-field">
                <label className="tl-label">What should NOT trigger this (exclusions)</label>
                <div className="tl-hint" style={{ marginBottom: 6 }}>
                  Describe cases that look similar but should be ignored. Helps prevent false positives.
                </div>
                <textarea
                  className="tl-textarea"
                  placeholder={`Example:
"Do NOT fire when a customer is asking about the cancellation policy without expressing intent to actually cancel. Also exclude questions like 'how do I cancel in the future' that are informational, not requests. General billing questions or refund inquiries without cancellation language should not trigger this unless combined with strong exit intent."`}
                  value={exclusions}
                  onChange={e => setExclusions(e.target.value)}
                  rows={4}
                  style={{ fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6 }}
                />
              </div>

              {/* ── Detection sensitivity ──────────────────────────── */}
              <div className="tl-field">
                <label className="tl-label">Detection sensitivity</label>
                <div className="tl-hint" style={{ marginBottom: 8 }}>
                  Controls how broadly the AI interprets signals. Higher sensitivity catches more edge cases but may increase false positives.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'strict',   label: 'Strict',   hint: 'Only clear, explicit statements' },
                    { id: 'balanced', label: 'Balanced', hint: 'Explicit + strong implied intent' },
                    { id: 'broad',    label: 'Broad',    hint: 'Includes indirect or subtle signals' },
                  ].map(s => (
                    <button
                      key={s.id}
                      title={s.hint}
                      className={`tl-type-btn${sensitivity === s.id ? ' tl-type-btn--sel' : ''}`}
                      style={{ flex: 1, flexDirection: 'column', gap: 3, padding: '8px 10px' }}
                      onClick={() => setSensitivity(s.id)}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 400, whiteSpace: 'nowrap' }}>{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'AI confidence' && (
            <div className="tl-field">
              <label className="tl-label">Confidence threshold</label>
              <div className="tl-slider-row">
                <span className="tl-slider-edge">30%</span>
                <input
                  type="range" min={30} max={90} step={5}
                  value={threshold}
                  className="tl-slider"
                  onChange={e => setThreshold(Number(e.target.value))}
                />
                <span className="tl-slider-edge">90%</span>
                <span className="tl-slider-val">{threshold}%</span>
              </div>
              <div className="tl-echo">Fires when AI confidence drops below <strong>{threshold}%</strong></div>
            </div>
          )}

          {type === 'Score threshold' && (
            <div className="tl-field">
              <label className="tl-label">Condition</label>
              <div className="tl-score-row">
                <select className="tl-sel" value={scoreType} onChange={e => setScoreType(e.target.value)}>
                  <option>CSAT</option>
                  <option>Deal value</option>
                  <option>Risk score</option>
                  <option>Invoice amount</option>
                  <option>Custom</option>
                </select>
                <select className="tl-sel" value={operator} onChange={e => setOperator(e.target.value)}>
                  <option value="below">below</option>
                  <option value="above">above</option>
                </select>
                <input
                  type="text"
                  className="tl-input-sm"
                  value={scoreValue}
                  onChange={e => setScoreValue(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="tl-echo">Fires when <strong>{scoreType}</strong> goes <strong>{operator}</strong> <strong>{scoreValue}</strong></div>
            </div>
          )}

          {type === 'Specific event' && (
            <>
              {/* Event sub-type selector */}
              <div className="tl-field">
                <label className="tl-label">Event type</label>
                <div className="tl-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {[
                    { id: 'form_submit',   label: 'Form submitted',  emoji: '📋' },
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

              {/* ── Form submitted ────────────────────────────────── */}
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

              {/* ── Status changes ────────────────────────────────── */}
              {eventType === 'status_change' && (
                <div className="tl-field">
                  <label className="tl-label">Status transition</label>
                  <div className="tl-hint" style={{ marginBottom: 12 }}>
                    Select the entity first — available statuses depend on where the change happens. Leave "From" empty to fire on any change to the target status.
                  </div>

                  {/* IN — entity picker */}
                  <div style={{ marginBottom: 14 }}>
                    <div className="tl-col-label">In <span style={{ color: 'var(--accent-coral)' }}>*</span></div>
                    <div className="tl-entity-grid">
                      {STATUS_ENTITIES.map(ent => (
                        <button
                          key={ent}
                          className={`tl-entity-btn${statusEntity === ent ? ' tl-entity-btn--sel' : ''}`}
                          onClick={() => { setStatusEntity(ent); setFromStatus(''); setToStatus('') }}
                        >
                          {ent}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FROM → TO — only shown once entity is selected */}
                  {statusEntity ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div className="tl-col-label">From (optional)</div>
                        <select
                          className="tl-sel-full"
                          value={fromStatus}
                          onChange={e => setFromStatus(e.target.value)}
                        >
                          <option value="">Any status</option>
                          {STATUS_BY_ENTITY[statusEntity].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ fontSize: 18, color: 'var(--text-tertiary)', paddingTop: 18 }}>→</div>
                      <div style={{ flex: 1 }}>
                        <div className="tl-col-label">To <span style={{ color: 'var(--accent-coral)' }}>*</span></div>
                        <select
                          className="tl-sel-full"
                          value={toStatus}
                          onChange={e => setToStatus(e.target.value)}
                        >
                          <option value="">Select status…</option>
                          {STATUS_BY_ENTITY[statusEntity]
                            .filter(s => s !== fromStatus)
                            .map(s => <option key={s}>{s}</option>)}
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

              {/* ── Tag applied ───────────────────────────────────── */}
              {eventType === 'tag_applied' && (
                <div className="tl-field">
                  <label className="tl-label">Which tag(s)?</label>
                  <div className="tl-hint" style={{ marginBottom: 8 }}>Trigger fires when ANY of the selected tags is applied. Click to select.</div>
                  <div className="tl-tag-grid">
                    {TAGS_CATALOG.map(tag => {
                      const sel = selectedTags.includes(tag)
                      return (
                        <button key={tag} className={`tl-tag-opt${sel ? ' tl-tag-opt--sel' : ''}`}
                          onClick={() => setSelectedTags(ts => sel ? ts.filter(t => t !== tag) : [...ts, tag])}>
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                  {selectedTags.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              )}

              {/* ── Custom event ─────────────────────────────────── */}
              {eventType === 'custom' && (
                <>
                  <div className="tl-field">
                    <label className="tl-label">Event name <span className="tl-req">*</span></label>
                    <div className="tl-hint" style={{ marginBottom: 6 }}>The exact event identifier sent from your integration or webhook. Case-sensitive.</div>
                    <input className="tl-input" style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}
                      placeholder="e.g. deal.stage_changed  or  invoice.overdue"
                      value={customEvtName} onChange={e => setCustomEvtName(e.target.value)} />
                  </div>
                  <div className="tl-field">
                    <label className="tl-label">Filter by event properties (optional)</label>
                    <div className="tl-hint" style={{ marginBottom: 8 }}>
                      Only fire when the event payload contains these key-value pairs. Leave empty to fire on all occurrences.
                    </div>
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
                        onKeyDown={e => { if (e.key === 'Enter' && propKey.trim()) { setCustomProps(ps => [...ps, { key: propKey.trim(), value: propVal.trim() }]); setPropKey(''); setPropVal('') }}} />
                      <Button variant="secondary" size="sm" onClick={() => { if (propKey.trim()) { setCustomProps(ps => [...ps, { key: propKey.trim(), value: propVal.trim() }]); setPropKey(''); setPropVal('') }}}>Add</Button>
                    </div>
                    <div className="tl-hint" style={{ marginTop: 6 }}>Example: <code style={{ fontFamily: 'DM Mono', fontSize: 11 }}>deal.stage</code> = <code style={{ fontFamily: 'DM Mono', fontSize: 11 }}>Closed Lost</code></div>
                  </div>
                </>
              )}

              {/* Live echo */}
              {echo() && <div className="tl-echo">{echo()}</div>}
            </>
          )}

          {/* Status */}
          <div className="tl-field">
            <label className="tl-label">Status</label>
            <div className="tl-status-row">
              {[
                { id: 'active', label: 'Active' },
                { id: 'draft',  label: 'Draft'  },
              ].map(s => (
                <button
                  key={s.id}
                  className={`tl-status-btn${status === s.id ? ' tl-status-btn--sel' : ''}`}
                  onClick={() => setStatus(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="tl-drawer-foot">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save Trigger
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Triggers() {
  const [triggers,     setTriggers]     = useState(triggerLibrary)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [hoveredPacks, setHoveredPacks] = useState(null)

  const filtered = triggers.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter   !== 'All' && t.type   !== typeFilter)   return false
    if (statusFilter !== 'All' && t.status !== statusFilter) return false
    return true
  })

  const openNew  = () => { setEditId(null); setDrawerOpen(true) }
  const openEdit = id => { setEditId(id);   setDrawerOpen(true) }
  const close    = () => { setDrawerOpen(false); setEditId(null) }

  const save = (data) => {
    if (editId) {
      setTriggers(ts => ts.map(t => t.id === editId ? { ...t, ...data, lastModified: 'just now' } : t))
    } else {
      const newId = 'trg-' + String(triggers.length + 1).padStart(3, '0')
      setTriggers(ts => [...ts, { id: newId, usedInPacks: 0, usedInPackNames: [], createdBy: 'Alexa M.', lastModified: 'just now', ...data }])
    }
    close()
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Triggers</h1>
          <p className="page-subtitle">
            Define reusable trigger conditions. Once created, they're available to select
            in any Pack's Triggers step — no need to rebuild the same logic each time.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={openNew}>
            New Trigger
          </Button>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="tl-filter-bar">
        <div className="tl-search-wrap">
          <input
            className="tl-search-input"
            placeholder="Search triggers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="tl-sel" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {TYPE_TABS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="tl-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <span className="tl-count">
          {filtered.length} trigger{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Trigger list ──────────────────────────────────────────────────── */}
      <div className="tl-list">
        {filtered.length === 0 && (
          <div className="tl-empty">No triggers match the current filters.</div>
        )}
        {filtered.map(t => {
          const cfg = TYPE_CFG[t.type] || TYPE_CFG['Customer behavior']
          return (
            <div key={t.id} className="tl-row">
              {/* Type icon */}
              <div className="tl-row-icon">{cfg.icon}</div>

              {/* Body */}
              <div className="tl-row-body">
                <div className="tl-row-name">{t.name}</div>
                {t.description && (
                  <div className="tl-row-desc">{t.description}</div>
                )}
                <div className="tl-row-meta">
                  <Badge label={t.type} variant={cfg.variant} size="sm" />
                  <div
                    className="tl-packs-chip"
                    onMouseEnter={() => setHoveredPacks(t.id)}
                    onMouseLeave={() => setHoveredPacks(null)}
                  >
                    Used in {t.usedInPacks} pack{t.usedInPacks !== 1 ? 's' : ''}
                    {hoveredPacks === t.id && t.usedInPackNames?.length > 0 && (
                      <div className="tl-packs-pop">
                        {t.usedInPackNames.map(p => (
                          <div key={p} className="tl-packs-pop-item">{p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="tl-meta-sep">·</span>
                  <span className="tl-meta-by">{t.createdBy}</span>
                  <span className="tl-meta-sep">·</span>
                  <span className="tl-meta-time">{t.lastModified}</span>
                </div>
              </div>

              {/* Right */}
              <div className="tl-row-right">
                <Badge
                  label={t.status === 'active' ? 'Active' : 'Draft'}
                  variant={t.status === 'active' ? 'teal' : 'amber'}
                  size="sm"
                />
                <button className="tl-edit-btn" onClick={() => openEdit(t.id)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="tl-icon-btn" title="More">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Drawer ────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <TriggerDrawer
          trigger={editId ? triggers.find(t => t.id === editId) : null}
          onSave={save}
          onClose={close}
        />
      )}
    </div>
  )
}
