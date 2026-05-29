import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  GitBranch, RefreshCw, Plus, ChevronDown, ChevronUp,
  ChevronRight, Check, AlertTriangle, Info, Zap, Shield,
  Bell, Clock, Globe, ListChecks, ArrowRight,
  Save, CheckCircle, Lock, FileText, MessageSquare,
  Navigation, ArrowUp, ArrowDown, Eye, X, Activity, Workflow,
} from 'lucide-react'
import Button from '../components/Button.jsx'
import { Input, Select, Textarea } from '../components/FormFields.jsx'
import Badge from '../components/Badge.jsx'
import { packs, networks } from '../data/mockData.js'
import './PackBuilder.css'

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1,  label: 'Pattern'           },
  { id: 2,  label: 'Triggers'          },
  { id: 3,  label: 'Routing Logic'     },
  { id: 4,  label: 'Destination'       },
  { id: 5,  label: 'Handoff Packet'    },
  { id: 6,  label: 'Composer Scope'    },
  { id: 7,  label: 'Macros'            },
  { id: 8,  label: 'Escalation Policy' },
  { id: 9,  label: 'Sensitive Signals' },
  { id: 10, label: 'Notifications'     },
  { id: 11, label: 'SLA'               },
  { id: 12, label: 'Availability'      },
  { id: 13, label: 'Jurisdiction'      },
  { id: 14, label: 'Test & Preview'    },
  { id: 15, label: 'Review & Publish'  },
]

// ─── Module-scope constants ───────────────────────────────────────────────────
const PACKET_FIELDS = [
  { id: 'summary',         label: 'Conversation Summary', hint: 'AI-generated summary of the conversation' },
  { id: 'aiReasoning',     label: 'AI Reasoning',         hint: 'Why the AI decided to trigger this pack' },
  { id: 'suggestedAction', label: 'Suggested Action',     hint: 'AI-recommended next step for the agent' },
  { id: 'context',         label: 'Context Payload',      hint: 'Full session metadata: device, channel, history' },
  { id: 'sentiment',       label: 'Sentiment Score',      hint: 'Customer sentiment trend over conversation' },
  { id: 'timeline',        label: 'Event Timeline',       hint: 'Chronological log of all AI actions taken' },
]

const MOCK_MACROS = [
  { id: 'm1', name: 'Apologize & Escalate',     category: 'replies',  trigger: 'frustration signal',    scope: 'Full',    attached: true  },
  { id: 'm2', name: 'Request Order Number',      category: 'replies',  trigger: 'order inquiry',         scope: 'Full',    attached: true  },
  { id: 'm3', name: 'Transfer to Billing',       category: 'actions',  trigger: 'billing keyword',       scope: 'Full',    attached: true  },
  { id: 'm4', name: 'Log CSAT Drop',             category: 'actions',  trigger: 'csat < 3',              scope: 'Minimal', attached: false },
  { id: 'm5', name: 'Schedule Callback',         category: 'replies',  trigger: 'callback request',      scope: 'Full',    attached: false },
  { id: 'm6', name: 'Account Cancellation Flow', category: 'actions',  trigger: '"cancel account"',      scope: 'Full',    attached: true  },
  { id: 'm7', name: 'Express Empathy',           category: 'replies',  trigger: 'any escalation',        scope: 'Minimal', attached: true  },
  { id: 'm8', name: 'Close & CSAT Request',      category: 'replies',  trigger: 'resolution confirmed',  scope: 'Full',    attached: true  },
]

const SIGNAL_CLASSES = [
  { id: 'safety',     label: 'Safety & Crisis',      color: 'coral',  desc: 'Self-harm, abuse, emergency keywords' },
  { id: 'legal',      label: 'Legal & Litigation',   color: 'amber',  desc: 'Lawsuit threats, liability keywords' },
  { id: 'hr',         label: 'HR & Conduct',         color: 'purple', desc: 'Harassment, discrimination, misconduct' },
  { id: 'financial',  label: 'Financial PII',        color: 'blue',   desc: 'Card numbers, SSN, bank account data' },
  { id: 'compliance', label: 'Compliance / GDPR',    color: 'teal',   desc: 'Data subject requests, regulatory flags' },
]

// ─── Draft factory ────────────────────────────────────────────────────────────
function initDraft(pack) {
  return {
    name:        pack?.name        ?? 'Untitled Pack',
    description: pack?.description ?? '',
    pattern:     pack?.pattern     ?? 'Handoff',
    status:      pack?.status      ?? 'Draft',
    destination: pack?.destination ?? 'Inbox',
    version:     pack?.version     ?? 'v1.0',
    triggers:    pack?.triggers
      ? pack.triggers.map((t, i) => ({ id: i, value: t }))
      : [],
    routing:     pack?.routing     ?? '',
    slaMinutes:  pack?.slaMinutes  ?? 60,
    sensitiveSignalEnabled: pack?.sensitiveSignalEnabled ?? false,
    composerScope: (pack?.composerScope ?? '').split(/[—\s]/)[0] || 'Full',
    macroCount:  pack?.macroCount  ?? 0,
    // Extended fields
    packetFields: {
      summary:         true,
      aiReasoning:     true,
      suggestedAction: true,
      context:         true,
      sentiment:       pack?.pattern === 'Handoff',
      timeline:        false,
    },
    escalationPolicy:  'reassign',
    slaBreachAction:   'escalate-tier2',
    notifyOnAssign:    true,
    notifyOnSlaBreach: true,
    notifyOnResolve:   false,
    sensitiveClasses: {
      safety:     pack?.sensitiveSignalEnabled ?? false,
      legal:      false,
      hr:         false,
      financial:  false,
      compliance: false,
    },
    fallbackChain: ['Tier 1 Support', 'Tier 2 Support', 'Support Manager'],
    requireAck:    false,
    allowReassign: true,
    coverageZone:  'US-East',
    coverageHours: '09:00–18:00',
    oooHandling:   'queue',
    jurisdiction:  '',
  }
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div
      className={`toggle-switch toggle-switch--${on ? 'on' : 'off'}`}
      onClick={() => onChange(!on)}
    >
      <div className="toggle-switch-knob" />
    </div>
  )
}

// ─── Step 1: Pattern ──────────────────────────────────────────────────────────
function Step1Pattern({ draft, update }) {
  const patterns = [
    {
      id: 'Handoff',
      Icon: GitBranch,
      tagline: '"AI yields control to human"',
      desc: 'AI processes signals, packages context, and hands the item directly to a human agent. No return loop — the human takes it from here.',
    },
    {
      id: 'Continuation',
      Icon: RefreshCw,
      tagline: '"AI assists, human approves each step"',
      desc: 'AI continues to work alongside the human. Each step is presented for review and approval. The loop continues until resolved or manually closed.',
    },
  ]

  const flowNodes = {
    Handoff:      ['AI processes', 'Pack evaluates', 'Packet built', 'Human inbox', 'Agent handles'],
    Continuation: ['AI processes', 'Step ready', 'Human reviews', 'Approved', 'AI continues ↺'],
  }

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Choose a Pack Pattern</div>
        <div className="pb-step-desc">
          The pattern defines how the AI hands off to — and interacts with — a human agent throughout the item's lifecycle.
        </div>
      </div>

      <div className="pattern-cards">
        {patterns.map(({ id, Icon, tagline, desc }) => {
          const sel = draft.pattern === id
          const key = id.toLowerCase()
          return (
            <div
              key={id}
              className={`pattern-card pattern-card--${key}${sel ? ` pattern-card--selected-${key}` : ''}`}
              onClick={() => update('pattern', id)}
            >
              <div className="pattern-card-check">
                {sel && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
              <div className="pattern-card-icon"><Icon size={20} /></div>
              <div className="pattern-card-name">{id}</div>
              <div className="pattern-card-tagline">{tagline}</div>
              <div className="pattern-card-desc">{desc}</div>
            </div>
          )
        })}
      </div>

      <div className="pattern-diagram">
        <div className="pattern-diagram-title">Flow preview — {draft.pattern}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {flowNodes[draft.pattern].map((node, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--bg-app)', border: '1px solid var(--border)',
                fontSize: 12,
                color: i >= 3
                  ? (draft.pattern === 'Handoff' ? 'var(--accent-purple)' : 'var(--accent-teal)')
                  : 'var(--text-secondary)',
                fontWeight: i >= 3 ? 500 : 400,
              }}>{node}</span>
              {i < arr.length - 1 && <ChevronRight size={12} color="var(--text-tertiary)" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Triggers ────────────────────────────────────────────────────────
function Step2Triggers({ draft, update }) {
  const [newVal, setNewVal] = useState('')

  const addTrigger = () => {
    if (!newVal.trim()) return
    update('triggers', [...draft.triggers, { id: Date.now(), value: newVal.trim() }])
    setNewVal('')
  }

  const removeTrigger = (id) => update('triggers', draft.triggers.filter(t => t.id !== id))

  const TRIGGER_TYPES = [
    { id: 'signal',  label: 'Signal',  desc: 'Intent score, CSAT, sentiment' },
    { id: 'keyword', label: 'Keyword', desc: 'Phrase match in conversation' },
    { id: 'event',   label: 'Event',   desc: 'Form submit, status change' },
    { id: 'manual',  label: 'Manual',  desc: 'Agent-initiated escalation' },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Configure Triggers</div>
        <div className="pb-step-desc">
          Define when this pack fires. Triggers are evaluated in order — any match activates the pack.
        </div>
      </div>

      <div className="trigger-list">
        {draft.triggers.map(t => (
          <div key={t.id} className="trigger-chip">
            <span className="trigger-chip-type">signal</span>
            <span className="trigger-chip-value">{t.value}</span>
            <button
              style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
              onClick={() => removeTrigger(t.id)}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder="e.g. CSAT signal < 3 or 'cancel account'"
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" icon={Plus} onClick={addTrigger}>Add</Button>
      </div>

      <div className="pb-section-label">Trigger Type Reference</div>
      <div className="trigger-type-grid">
        {TRIGGER_TYPES.map(tt => (
          <div key={tt.id} className="trigger-type-option">
            <Zap size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{tt.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tt.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Routing Logic ────────────────────────────────────────────────────
function Step3Routing({ draft, update }) {
  const moveChain = (i, dir) => {
    const arr = [...draft.fallbackChain]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    update('fallbackChain', arr)
  }

  const SAMPLE_RULES = [
    { condition: 'queue.tier1.available == true', action: 'Route to Tier 1 Support' },
    { condition: 'agent.oo == true',              action: 'Route to Fallback Queue'  },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Routing Logic</div>
        <div className="pb-step-desc">
          Define the primary routing rule and fallback chain. If the primary queue is unavailable, items cascade in order.
        </div>
      </div>

      <div className="pb-section-label">Primary Rule</div>
      <div style={{ marginBottom: 24 }}>
        <Textarea
          value={draft.routing}
          onChange={e => update('routing', e.target.value)}
          placeholder="e.g. Round-robin across Tier 1 Support queue, fallback to Tier 2 after 15 min"
          rows={2}
        />
      </div>

      <div className="pb-section-label">IF / THEN Conditions</div>
      {SAMPLE_RULES.map((rule, i) => (
        <div key={i} className="routing-rule">
          <span className="routing-label">IF</span>
          <div style={{ flex: 1, fontFamily: 'DM Mono', fontSize: 12, padding: '6px 10px', background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)' }}>
            {rule.condition}
          </div>
          <span className="routing-then-arrow">→</span>
          <span className="routing-label">THEN</span>
          <div style={{ flex: 1, fontSize: 13, padding: '6px 10px', background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)' }}>
            {rule.action}
          </div>
        </div>
      ))}
      <Button variant="secondary" size="sm" icon={Plus} style={{ marginTop: 8 }}>Add Rule</Button>

      <div className="pb-section-label" style={{ marginTop: 24 }}>Fallback Chain</div>
      <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
        Items cascade through this order when agents are unavailable.
      </div>
      {draft.fallbackChain.map((item, i) => (
        <div key={i} className="fallback-item">
          <span className="fallback-order">{i + 1}.</span>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{item}</span>
          <div className="fallback-reorder">
            <button onClick={() => moveChain(i, -1)} disabled={i === 0}><ArrowUp size={10} /></button>
            <button onClick={() => moveChain(i, 1)} disabled={i === draft.fallbackChain.length - 1}><ArrowDown size={10} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Step 4: Destination ──────────────────────────────────────────────────────
const DEST_OPTIONS = [
  { id: 'Inbox',       emoji: '📥', name: 'Inbox',        desc: 'Full agent UI with reply, close, and reassign actions' },
  { id: 'Mixed',       emoji: '⚡', name: 'Mixed',        desc: 'Inbox + external system write-back (CRM, ticketing, Slack)' },
  { id: 'Lightweight', emoji: '🪶', name: 'Lightweight',  desc: 'Minimal card — approve or reject only, no full context view' },
  { id: 'External',    emoji: '🔗', name: 'External',     desc: 'Bypass HTL inbox, route directly to external webhook' },
]

function Step4Destination({ draft, update }) {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Choose Destination</div>
        <div className="pb-step-desc">
          Where should items from this pack be delivered? The destination determines the agent's interaction surface.
        </div>
      </div>

      <div className="destination-cards">
        {DEST_OPTIONS.map(d => (
          <div
            key={d.id}
            className={`dest-card${draft.destination === d.id ? ' dest-card--selected' : ''}`}
            onClick={() => update('destination', d.id)}
          >
            {draft.destination === d.id && (
              <div className="dest-card-check"><Check size={10} strokeWidth={3} /></div>
            )}
            <div className="dest-card-icon">{d.emoji}</div>
            <div className="dest-card-name">{d.name}</div>
            <div className="dest-card-desc">{d.desc}</div>
          </div>
        ))}
      </div>

      {draft.destination === 'External' && (
        <div className="pb-banner pb-banner--warning">
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>External routing bypasses the HTL inbox.</strong> Agents will not see items in Queue. Ensure the target webhook is configured under Settings → Integrations before activating.
          </div>
        </div>
      )}
      {draft.destination === 'Mixed' && (
        <div className="pb-banner pb-banner--info">
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>Mixed destinations require at least one external channel. Link channels under <strong>Settings → Channels</strong>.</div>
        </div>
      )}
    </div>
  )
}

// ─── Step 5: Handoff Packet ───────────────────────────────────────────────────
const PACKET_PREVIEW_TEXT = {
  summary:         'Customer expressed frustration about delayed shipping. Third escalation in 7 days.',
  aiReasoning:     'Unresolved turns exceeded threshold (4 of 3). CSAT < 3 signal also detected.',
  suggestedAction: 'Offer expedited shipping credit or connect with logistics team.',
  context:         '{ channel: "web-chat", session: "s-8f2a", duration: "14m" }',
  sentiment:       'Declining — 0.81 → 0.34 → 0.19 over 3 turns',
  timeline:        '14:02 trigger eval · 14:03 pack fired · 14:03 packet built',
}

function Step5HandoffPacket({ draft, updatePacket }) {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Configure Handoff Packet</div>
        <div className="pb-step-desc">
          The packet is the context bundle the AI prepares for the human agent. Toggle which fields are included.
        </div>
      </div>

      <div className="packet-layout">
        <div>
          <div className="pb-section-label">Packet Fields</div>
          {PACKET_FIELDS.map(f => (
            <div key={f.id} className="packet-field-row">
              <div>
                <div className="packet-field-label">{f.label}</div>
                <div className="packet-field-hint">{f.hint}</div>
              </div>
              <Toggle on={!!draft.packetFields[f.id]} onChange={val => updatePacket(f.id, val)} />
            </div>
          ))}
        </div>

        <div className="packet-preview">
          <div className="packet-preview-label">Live Preview</div>
          {PACKET_FIELDS.filter(f => draft.packetFields[f.id]).map(f => (
            <div key={f.id} className="packet-preview-field">
              <div className="packet-preview-key">{f.label}</div>
              <div className="packet-preview-val">{PACKET_PREVIEW_TEXT[f.id]}</div>
            </div>
          ))}
          {!PACKET_FIELDS.some(f => draft.packetFields[f.id]) && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No fields enabled — packet will be empty.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Composer Scope ───────────────────────────────────────────────────
const SCOPE_OPTIONS = [
  { id: 'None',     desc: 'Disable AI suggestions entirely for this pack' },
  { id: 'Minimal',  desc: 'Approve / reject only — no reply drafts' },
  { id: 'Standard', desc: 'Reply drafts + close action suggestions' },
  { id: 'Full',     desc: 'Reply, next-step, CRM notes, and close actions' },
]

function Step6ComposerScope({ draft, update }) {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Composer Scope</div>
        <div className="pb-step-desc">
          Controls what the AI Composer suggests to the human agent while they work this item.
        </div>
      </div>

      <div className="composer-scope-cards">
        {SCOPE_OPTIONS.map(s => (
          <div
            key={s.id}
            className={`scope-card${draft.composerScope === s.id ? ' scope-card--selected' : ''}`}
            onClick={() => update('composerScope', s.id)}
          >
            <div className="scope-card-name">{s.id}</div>
            <div className="scope-card-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      {draft.composerScope === 'None' && (
        <div className="pb-banner pb-banner--warning">
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Disabling the composer means agents receive no AI assistance on these items. Only recommended for compliance-sensitive packs.</span>
        </div>
      )}
      {draft.composerScope === 'Full' && (
        <div className="pb-banner pb-banner--info">
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Full scope activates macro suggestions. Configure attached macros in Step 7.</span>
        </div>
      )}
    </div>
  )
}

// ─── Step 7: Macros ───────────────────────────────────────────────────────────
function Step7Macros() {
  const [tab, setTab] = useState('attached')
  const [macros, setMacros] = useState(MOCK_MACROS)

  const toggleMacro = (id) => setMacros(ms => ms.map(m => m.id === id ? { ...m, attached: !m.attached } : m))

  const tabs = [
    { id: 'attached', label: 'Attached', count: macros.filter(m => m.attached).length },
    { id: 'all',      label: 'All Macros', count: macros.length },
  ]

  const visible = tab === 'attached' ? macros.filter(m => m.attached) : macros

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Macros</div>
        <div className="pb-step-desc">
          Attach pre-built reply and action macros that the AI Composer will suggest when this pack fires.
        </div>
      </div>

      <div className="macro-tabs">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`macro-tab${tab === t.id ? ' macro-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: 'var(--bg-card-elevated)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              {t.count}
            </span>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div className="macro-row macro-row-header">
          <span>Name</span>
          <span>Trigger phrase</span>
          <span>Category</span>
          <span>Scope</span>
          <span>Attached</span>
        </div>
        {visible.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
            No macros attached. Switch to All Macros to add some.
          </div>
        ) : (
          visible.map(m => (
            <div key={m.id} className="macro-row">
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-secondary)' }}>{m.trigger}</span>
              <Badge label={m.category} variant={m.category === 'replies' ? 'blue' : 'purple'} size="sm" />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.scope}</span>
              <Toggle on={m.attached} onChange={() => toggleMacro(m.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Step 8: Escalation Policy ────────────────────────────────────────────────
const ESCALATION_POLICIES = [
  { id: 'reassign',     name: 'Auto-reassign on timeout',    meta: 'Reassign to next agent in queue after SLA breach' },
  { id: 'escalate-mgr', name: 'Escalate to manager',         meta: 'Flag to team lead after 2× SLA breach' },
  { id: 'hold-notify',  name: 'Hold & notify',               meta: 'Keep assigned, send breach alert to agent + supervisor' },
  { id: 'manual',       name: 'Manual review only',          meta: 'Do not auto-escalate; queue for next available' },
]

function Step8EscalationPolicy({ draft, update }) {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Escalation Policy</div>
        <div className="pb-step-desc">
          What should happen when a human agent doesn't act on this item within the SLA window?
        </div>
      </div>

      {ESCALATION_POLICIES.map(p => (
        <div
          key={p.id}
          className={`policy-option${draft.escalationPolicy === p.id ? ' policy-option--selected' : ''}`}
          onClick={() => update('escalationPolicy', p.id)}
        >
          <div>
            <div className="policy-option-name">{p.name}</div>
            <div className="policy-option-meta">{p.meta}</div>
          </div>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${draft.escalationPolicy === p.id ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
            background: draft.escalationPolicy === p.id ? 'var(--accent-blue)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {draft.escalationPolicy === p.id && <Check size={10} color="#fff" strokeWidth={3} />}
          </div>
        </div>
      ))}

      <div className="pb-section-label" style={{ marginTop: 20 }}>Additional Options</div>
      {[
        { key: 'requireAck',    label: 'Require acknowledgment',    hint: 'SLA clock starts when agent explicitly accepts the item' },
        { key: 'allowReassign', label: 'Allow agent self-reassign', hint: 'Agents can pass the item to a colleague' },
      ].map(opt => (
        <div key={opt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--bg-row)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{opt.hint}</div>
          </div>
          <Toggle on={!!draft[opt.key]} onChange={val => update(opt.key, val)} />
        </div>
      ))}
    </div>
  )
}

// ─── Step 9: Sensitive Signals ────────────────────────────────────────────────
function Step9SensitiveSignals({ draft, update }) {
  const [expanded, setExpanded] = useState({})
  const toggleExpand = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const updateClass = (cls, val) => {
    const next = { ...draft.sensitiveClasses, [cls]: val }
    update('sensitiveClasses', next)
    update('sensitiveSignalEnabled', Object.values(next).some(Boolean))
  }

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Sensitive Signals</div>
        <div className="pb-step-desc">
          Enable signal classes that require special handling — multi-reviewer acknowledgment, redaction, and restricted access.
        </div>
      </div>

      {SIGNAL_CLASSES.map(sc => (
        <div key={sc.id} className="signal-class-card">
          <div className="signal-class-header" onClick={() => toggleExpand(sc.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={13} style={{ color: `var(--accent-${sc.color})`, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{sc.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sc.desc}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle on={!!draft.sensitiveClasses[sc.id]} onChange={val => updateClass(sc.id, val)} />
              {expanded[sc.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </div>
          {expanded[sc.id] && (
            <div className="signal-class-body">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                When a <strong>{sc.label}</strong> signal is detected, this pack will:
              </div>
              {[
                'Require acknowledgment from ≥ 2 designated reviewers',
                'Redact signal details from the standard audit log',
                'Disable AI Composer for this item',
                'Notify the Compliance Officer role immediately',
              ].map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Check size={11} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                  {rule}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {draft.sensitiveSignalEnabled && (
        <div className="pb-banner pb-banner--warning" style={{ marginTop: 16 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Sensitive signal protection active. Ensure designated reviewers are configured in <strong>Configure → Sensitive Signals</strong>.</span>
        </div>
      )}
    </div>
  )
}

// ─── Step 10: Notifications ───────────────────────────────────────────────────
function Step10Notifications({ draft, update }) {
  const NOTIFS = [
    { key: 'notifyOnAssign',    label: 'On assignment',   hint: 'Notify the agent when an item is assigned to them',             Icon: Bell         },
    { key: 'notifyOnSlaBreach', label: 'On SLA breach',   hint: 'Alert agent and supervisor when the SLA window expires',        Icon: Clock        },
    { key: 'notifyOnResolve',   label: 'On resolution',   hint: 'Confirm to the originating agent when the item is closed',      Icon: CheckCircle  },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Notifications</div>
        <div className="pb-step-desc">
          Configure which events trigger notifications, and which channels they're sent through.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {NOTIFS.map(({ key, label, hint, Icon }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-row)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Icon size={14} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>
              </div>
            </div>
            <Toggle on={!!draft[key]} onChange={val => update(key, val)} />
          </div>
        ))}
      </div>

      <div className="pb-section-label">Notification Channels</div>
      <div className="pb-2col">
        {[
          { label: 'Email',  on: true  },
          { label: 'Slack',  on: false },
          { label: 'In-app', on: true  },
          { label: 'SMS',    on: false },
        ].map(ch => (
          <div key={ch.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-row)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ch.label}</span>
            <Toggle on={ch.on} onChange={() => {}} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 11: SLA ─────────────────────────────────────────────────────────────
const SLA_BREACH_ACTIONS = [
  { id: 'escalate-tier2', label: 'Escalate to Tier 2',       desc: 'Move item to next support tier automatically' },
  { id: 'notify-mgr',     label: 'Notify manager',           desc: 'Send breach alert to team lead; keep item in queue' },
  { id: 'auto-close',     label: 'Auto-close with template', desc: 'Send a closing message and archive the item' },
  { id: 'hold',           label: 'Hold open indefinitely',   desc: 'Mark as breached; leave open for manual review' },
]

function Step11SLA({ draft, update }) {
  const hours = Math.floor(draft.slaMinutes / 60)
  const mins  = draft.slaMinutes % 60

  const setHours = h => update('slaMinutes', Math.max(0, parseInt(h) || 0) * 60 + mins)
  const setMins  = m => update('slaMinutes', hours * 60 + Math.min(59, Math.max(0, parseInt(m) || 0)))

  const fmtSLA = (total) => {
    if (total >= 1440) return `${(total / 1440).toFixed(1)}d`
    if (total >= 60)   return `${(total / 60).toFixed(1)}h`
    return `${total}m`
  }

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">SLA Configuration</div>
        <div className="pb-step-desc">
          Set the maximum time a human agent has to act on items from this pack.
        </div>
      </div>

      <div className="pb-section-label">Response Window</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            value={hours}
            min={0}
            max={168}
            onChange={e => setHours(e.target.value)}
            style={{ width: 64, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'DM Mono', textAlign: 'center' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>h</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            value={mins}
            min={0}
            max={59}
            onChange={e => setMins(e.target.value)}
            style={{ width: 64, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'DM Mono', textAlign: 'center' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>min</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'DM Mono', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', borderRadius: 4, padding: '3px 8px' }}>
          = {fmtSLA(draft.slaMinutes)}
        </span>
      </div>

      <div className="pb-section-label">On SLA Breach</div>
      {SLA_BREACH_ACTIONS.map(a => (
        <div
          key={a.id}
          className={`sla-breach-option${draft.slaBreachAction === a.id ? ' sla-breach-option--selected' : ''}`}
          onClick={() => update('slaBreachAction', a.id)}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            border: `2px solid ${draft.slaBreachAction === a.id ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
            background: draft.slaBreachAction === a.id ? 'var(--accent-blue)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {draft.slaBreachAction === a.id && <Check size={10} color="#fff" strokeWidth={3} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{a.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Step 12: Availability ────────────────────────────────────────────────────
function Step12Availability({ draft, update }) {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Availability & Coverage</div>
        <div className="pb-step-desc">
          Define when human agents are available to handle items from this pack. Out-of-hours items are queued or rerouted per your policy.
        </div>
      </div>

      <div className="pb-2col" style={{ marginBottom: 24 }}>
        <div>
          <div className="pb-section-label">Coverage Zone</div>
          <Select
            value={draft.coverageZone}
            onChange={e => update('coverageZone', e.target.value)}
            options={['US-East', 'US-West', 'EU-Central', 'AP-Southeast', 'Global 24/7'].map(z => ({ value: z, label: z }))}
          />
        </div>
        <div>
          <div className="pb-section-label">Active Hours</div>
          <Select
            value={draft.coverageHours}
            onChange={e => update('coverageHours', e.target.value)}
            options={['06:00–18:00', '08:00–20:00', '09:00–18:00', '09:00–17:00', '24/7'].map(h => ({ value: h, label: h }))}
          />
        </div>
      </div>

      <div className="pb-section-label">Out-of-Hours Handling</div>
      {[
        { id: 'queue',    label: 'Queue for next available agent', desc: 'Item waits; SLA clock paused outside coverage hours' },
        { id: 'reroute',  label: 'Re-route to on-call team',       desc: 'Forward to designated on-call queue outside hours' },
        { id: 'auto-ack', label: 'Send auto-acknowledgment',       desc: 'Reply with an ETA template; agent picks up when available' },
      ].map(opt => (
        <div
          key={opt.id}
          className={`policy-option${draft.oooHandling === opt.id ? ' policy-option--selected' : ''}`}
          onClick={() => update('oooHandling', opt.id)}
        >
          <div>
            <div className="policy-option-name">{opt.label}</div>
            <div className="policy-option-meta">{opt.desc}</div>
          </div>
          <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${draft.oooHandling === opt.id ? 'var(--accent-blue)' : 'var(--border-strong)'}`, background: draft.oooHandling === opt.id ? 'var(--accent-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {draft.oooHandling === opt.id && <Check size={10} color="#fff" strokeWidth={3} />}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Step 13: Jurisdiction (Premium) ─────────────────────────────────────────
const FAKE_JURISDICTIONS = [
  { code: 'GDPR',   region: 'European Union' },
  { code: 'CCPA',   region: 'California, USA' },
  { code: 'PDPA',   region: 'Thailand' },
  { code: 'LGPD',   region: 'Brazil' },
  { code: 'PIPEDA', region: 'Canada' },
  { code: 'POPIA',  region: 'South Africa' },
]

function Step13Jurisdiction() {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Jurisdiction & Compliance Scope</div>
        <div className="pb-step-desc">
          Restrict or modify pack behavior based on geographic or regulatory jurisdiction.
        </div>
      </div>

      <div className="premium-overlay">
        <div className="premium-overlay-blur">
          <div className="pb-3col">
            {FAKE_JURISDICTIONS.map(j => (
              <div key={j.code} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-row)' }}>
                <div style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{j.code}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{j.region}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="premium-overlay-cta">
          <Lock size={28} style={{ color: 'var(--accent-purple)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Jurisdiction Scoping</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.55 }}>
              Available on the Enterprise plan. Configure per-region pack behavior, GDPR data residency, and cross-border routing restrictions.
            </div>
          </div>
          <Button variant="primary" size="sm" icon={Zap}>Upgrade to Enterprise</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 14: Test & Preview ──────────────────────────────────────────────────
function Step14TestPreview({ draft }) {
  const [selected, setSelected] = useState(draft.triggers[0]?.value ?? '')
  const [simulated, setSimulated] = useState(false)

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Test & Preview</div>
        <div className="pb-step-desc">
          Simulate a trigger to preview the inbox item the human agent will receive.
        </div>
      </div>

      <div className="pb-section-label">Simulate a Trigger</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <Select
            value={selected}
            onChange={e => { setSelected(e.target.value); setSimulated(false) }}
            options={
              draft.triggers.length > 0
                ? draft.triggers.map(t => ({ value: t.value, label: t.value }))
                : [{ value: '', label: 'No triggers configured' }]
            }
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Zap}
          onClick={() => setSimulated(true)}
        >
          Run Simulation
        </Button>
      </div>

      {simulated ? (
        <div>
          <div className="pb-banner pb-banner--success">
            <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Pack fired successfully. The preview below shows what the agent will see in their inbox.</span>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginTop: 16 }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-card-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                <GitBranch size={13} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{draft.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {draft.pattern} · {draft.destination} · SLA {draft.slaMinutes}m
                </div>
              </div>
              <Badge label="Simulated" variant="amber" size="sm" />
            </div>
            <div style={{ padding: 16 }}>
              {PACKET_FIELDS.filter(f => draft.packetFields[f.id]).slice(0, 4).map(f => (
                <div key={f.id} className="packet-preview-field">
                  <div className="packet-preview-key">{f.label}</div>
                  <div className="packet-preview-val">
                    {f.id === 'summary'         && 'Customer expressed frustration about delayed shipping order #10482.'}
                    {f.id === 'aiReasoning'     && `Trigger matched: "${selected}". Threshold exceeded.`}
                    {f.id === 'suggestedAction' && 'Offer expedited shipping credit or connect with logistics team.'}
                    {f.id === 'context'         && '{ channel: "web-chat", session: "s-8f2a", customer: "pro" }'}
                    {f.id === 'sentiment'       && 'Declining — 0.81 → 0.34 → 0.19 over 3 turns'}
                    {f.id === 'timeline'        && '14:02 trigger eval · 14:03 pack fired · 14:03 packet built'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '40px 24px', border: '1px dashed var(--border)', borderRadius: 10, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          Select a trigger above and run the simulation to preview the agent's inbox item.
        </div>
      )}
    </div>
  )
}

// ─── Step 15: Review & Publish ────────────────────────────────────────────────
function Step15Review({ draft }) {
  const [open, setOpen] = useState({ pattern: true, triggers: true, routing: false, sla: false, packet: false, composer: false })
  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }))

  const fmtSLA = m => m >= 1440 ? `${(m / 1440).toFixed(1)}d` : m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`

  const checks = [
    { pass: !!draft.pattern,           label: `Pattern: ${draft.pattern}` },
    { pass: draft.triggers.length > 0, label: `${draft.triggers.length} trigger${draft.triggers.length !== 1 ? 's' : ''} defined` },
    { pass: !!draft.routing,           label: 'Routing rule set' },
    { pass: !!draft.destination,       label: `Destination: ${draft.destination}` },
    { pass: draft.slaMinutes > 0,      label: `SLA: ${fmtSLA(draft.slaMinutes)}` },
  ]

  const sections = [
    {
      id: 'pattern',
      label: 'Pattern & Identity',
      rows: [
        ['Pattern',      draft.pattern],
        ['Name',         draft.name],
        ['Version',      draft.version],
        ['Status',       draft.status],
        ['Description',  draft.description || '—'],
      ],
    },
    {
      id: 'triggers',
      label: 'Triggers',
      rows: draft.triggers.length > 0
        ? draft.triggers.map((t, i) => [`Trigger ${i + 1}`, t.value])
        : [['—', 'No triggers configured']],
    },
    {
      id: 'routing',
      label: 'Routing & Destination',
      rows: [
        ['Destination',    draft.destination],
        ['Primary rule',   draft.routing || '—'],
        ['Fallback chain', draft.fallbackChain.join(' → ')],
      ],
    },
    {
      id: 'sla',
      label: 'SLA & Escalation',
      rows: [
        ['SLA window',        fmtSLA(draft.slaMinutes)],
        ['On SLA breach',     draft.slaBreachAction],
        ['Escalation policy', draft.escalationPolicy],
        ['Require ack',       draft.requireAck ? 'Yes' : 'No'],
        ['Allow reassign',    draft.allowReassign ? 'Yes' : 'No'],
      ],
    },
    {
      id: 'packet',
      label: 'Handoff Packet',
      rows: PACKET_FIELDS.map(f => [f.label, draft.packetFields[f.id] ? '✓ Included' : '— Excluded']),
    },
    {
      id: 'composer',
      label: 'Composer & Macros',
      rows: [
        ['Composer scope',   draft.composerScope],
        ['Attached macros',  `${MOCK_MACROS.filter(m => m.attached).length} of ${MOCK_MACROS.length}`],
        ['Sensitive signals', draft.sensitiveSignalEnabled ? 'Enabled' : 'Disabled'],
        ['Notifications',    [draft.notifyOnAssign && 'assign', draft.notifyOnSlaBreach && 'breach', draft.notifyOnResolve && 'resolve'].filter(Boolean).join(', ') || 'None'],
      ],
    },
  ]

  const allPass = checks.every(c => c.pass)

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Review & Publish</div>
        <div className="pb-step-desc">
          Review your configuration before publishing. Published packs are immediately available to attach to workflows.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: c.pass ? 'var(--accent-teal-dim)' : 'var(--accent-coral-dim)', border: `1px solid ${c.pass ? 'var(--accent-teal-border)' : 'var(--accent-coral-border)'}`, borderRadius: 6 }}>
            {c.pass
              ? <CheckCircle size={11} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
              : <AlertTriangle size={11} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: c.pass ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {sections.map(sec => (
        <div key={sec.id} className="review-section">
          <div className="review-section-header" onClick={() => toggle(sec.id)}>
            <span>{sec.label}</span>
            {open[sec.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
          {open[sec.id] && (
            <div className="review-section-body">
              {sec.rows.map(([k, v], i) => (
                <div key={i} className="review-kv">
                  <span className="review-kv-key">{k}</span>
                  <span className="review-kv-value">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {!allPass && (
        <div className="pb-banner pb-banner--warning" style={{ marginTop: 16 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Some required fields are incomplete. Go back and fill them in before publishing.</span>
        </div>
      )}
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ draft, sourcePack, navigate, id }) {
  const fmtSLA = m => m >= 1440 ? `${(m/1440).toFixed(1)}d` : m >= 60 ? `${(m/60).toFixed(1)}h` : `${m}m`
  const attachedCount = networks.filter(n => n.htlPackId === sourcePack?.id).length

  return (
    <div className="pb-overview">
      <div className="pb-overview-hero">
        <div className={`pack-icon pack-icon--${(draft.pattern||'handoff').toLowerCase()}`} style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0 }}>
          {draft.pattern === 'Handoff' ? <GitBranch size={18} /> : <RefreshCw size={18} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne', color: 'var(--text-primary)', marginBottom: 4 }}>{draft.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {draft.description || 'No description provided.'}
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate(`/configure/packs/${id}/edit`)}>
          Edit Pack
        </Button>
      </div>

      <div className="pb-overview-grid">
        {[
          ['Pattern',           draft.pattern],
          ['Status',            draft.status],
          ['Version',           draft.version],
          ['Destination',       draft.destination],
          ['SLA',               fmtSLA(draft.slaMinutes)],
          ['Sensitive Signals', draft.sensitiveSignalEnabled ? 'Enabled' : 'Disabled'],
          ['Attached Workflows', String(attachedCount)],
        ].map(([k, v]) => (
          <div key={k} className="pb-overview-kv">
            <div className="pb-overview-key">{k}</div>
            <div className="pb-overview-val">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Workflows tab ────────────────────────────────────────────────────────────
function WorkflowsTab({ sourcePack }) {
  const attached = networks.filter(n => n.htlPackId === sourcePack?.id)
  const [pinned,   setPinned]   = useState({})
  const [detached, setDetached] = useState(new Set())

  function relT(iso) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const visible = attached.filter(n => !detached.has(n.id))

  return (
    <div>
      {visible.length > 0 && (
        <div className="pb-banner pb-banner--warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Blast radius:</strong> {visible.length} active workflow{visible.length !== 1 ? 's' : ''} use this pack.
            Publishing a new version will immediately apply to all unversioned attachments.
          </span>
        </div>
      )}

      <div className="pb-wf-table">
        <div className="pb-wf-header">
          <span className="pb-wf-c pb-wf-c--name">Workflow / Network</span>
          <span className="pb-wf-c pb-wf-c--node">Binding Node</span>
          <span className="pb-wf-c pb-wf-c--ver">Version</span>
          <span className="pb-wf-c pb-wf-c--time">Last Triggered</span>
          <span className="pb-wf-c pb-wf-c--count">Items 30d</span>
          <span className="pb-wf-c pb-wf-c--pin">Pin Version</span>
          <span className="pb-wf-c pb-wf-c--action"></span>
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
            No workflows are attached to this pack yet.
          </div>
        ) : visible.map(net => (
          <div key={net.id} className="pb-wf-row">
            <div className="pb-wf-c pb-wf-c--name">
              <div className="pb-wf-name">{net.name}</div>
              <div className="pb-wf-sub">{net.studio} · {net.activeNodes} nodes</div>
            </div>
            <div className="pb-wf-c pb-wf-c--node">
              <code className="pb-wf-code">{net.bindingNode}</code>
            </div>
            <div className="pb-wf-c pb-wf-c--ver">
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-tertiary)' }}>
                {sourcePack?.version ?? '—'}
              </span>
            </div>
            <div className="pb-wf-c pb-wf-c--time">
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-tertiary)' }}>
                {relT(net.lastTriggered)}
              </span>
            </div>
            <div className="pb-wf-c pb-wf-c--count">
              <span style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {net.triggerCount30d.toLocaleString()}
              </span>
            </div>
            <div className="pb-wf-c pb-wf-c--pin">
              <Toggle on={!!pinned[net.id]} onChange={v => setPinned(p => ({ ...p, [net.id]: v }))} />
            </div>
            <div className="pb-wf-c pb-wf-c--action">
              <button className="pb-wf-detach" onClick={() => setDetached(d => new Set([...d, net.id]))}>
                Detach
              </button>
            </div>
          </div>
        ))}
      </div>

      {detached.size > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
          {detached.size} workflow{detached.size !== 1 ? 's' : ''} detached — publish to apply.
        </div>
      )}
    </div>
  )
}

// ─── Versions tab ─────────────────────────────────────────────────────────────
function VersionsTab({ draft }) {
  const rows = [
    { ver: draft.version, date: 'Current',     author: 'Alexa M.', note: 'Current live version',           status: 'Active'     },
    { ver: 'v2.2',        date: '12d ago',      author: 'Alexa M.', note: 'Updated routing conditions',     status: 'Archived'   },
    { ver: 'v2.1',        date: '1 month ago',  author: 'Ben C.',   note: 'Added sensitive signal support',  status: 'Archived'   },
    { ver: 'v2.0',        date: '2 months ago', author: 'Ben C.',   note: 'Major rewrite — new pattern',    status: 'Deprecated' },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Version History</div>
        <div className="pb-step-desc">All published versions of this pack. Branch or rollback from any previous checkpoint.</div>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {rows.map((v, i) => (
          <div key={v.ver} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
            background: i === 0 ? 'var(--bg-card-elevated)' : 'transparent',
          }}>
            <span style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 44 }}>{v.ver}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{v.note}</span>
            <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-tertiary)', minWidth: 90 }}>{v.date}</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', minWidth: 80 }}>{v.author}</span>
            <Badge label={v.status} variant={v.status === 'Active' ? 'teal' : v.status === 'Archived' ? 'gray' : 'amber'} size="sm" />
            {i === 0
              ? <Badge label="Current" variant="blue" size="sm" />
              : <Button variant="ghost" size="sm">Rollback</Button>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step navigator ───────────────────────────────────────────────────────────
function StepNav({ current, visited, onGoto }) {
  return (
    <div className="pb-nav">
      {STEPS.map(s => {
        const isActive   = current === s.id
        const isComplete = visited.has(s.id) && !isActive
        let cls = 'pb-nav-item'
        if (isActive)   cls += ' pb-nav-item--active'
        if (isComplete) cls += ' pb-nav-item--complete'
        return (
          <div key={s.id} className={cls} onClick={() => onGoto(s.id)}>
            <div className="pb-nav-node">
              {isComplete ? <Check size={10} strokeWidth={3} /> : s.id}
            </div>
            <span className="pb-nav-label">{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PackBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const loc    = useLocation()
  const isNew  = !id || id === 'new'

  const sourcePack = isNew ? null : (packs.find(p => p.id === id) ?? packs[0])

  const activeTab =
    loc.pathname.endsWith('/workflows') ? 'workflows' :
    loc.pathname.endsWith('/versions')  ? 'versions'  :
    loc.pathname.endsWith('/edit')      ? 'builder'   :
    isNew                               ? 'builder'   :
    'overview'

  const tabPath = (tabId) => {
    if (isNew) return '/configure/packs/new'
    switch (tabId) {
      case 'overview':  return `/configure/packs/${id}`
      case 'builder':   return `/configure/packs/${id}/edit`
      case 'workflows': return `/configure/packs/${id}/workflows`
      case 'versions':  return `/configure/packs/${id}/versions`
      default:          return `/configure/packs/${id}`
    }
  }

  const [draft,   setDraft]   = useState(() => initDraft(sourcePack))
  const [step,    setStep]    = useState(1)
  const [visited, setVisited] = useState(new Set([1]))
  const [toast,   setToast]   = useState(null)

  const update       = (key, val) => setDraft(d => ({ ...d, [key]: val }))
  const updatePacket = (key, val) => setDraft(d => ({ ...d, packetFields: { ...d.packetFields, [key]: val } }))

  const goTo = (n) => {
    setStep(n)
    setVisited(v => new Set([...v, n]))
  }

  const next = () => { if (step < 15) goTo(step + 1) }
  const prev = () => { if (step > 1)  goTo(step - 1) }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const saveDraft = () => showToast('Draft saved')

  const publish = () => {
    showToast('Pack published!')
    setTimeout(() => navigate('/configure/packs'), 1600)
  }

  const p = { draft, update }

  function renderStep() {
    switch (step) {
      case 1:  return <Step1Pattern         {...p} />
      case 2:  return <Step2Triggers        {...p} />
      case 3:  return <Step3Routing         {...p} />
      case 4:  return <Step4Destination     {...p} />
      case 5:  return <Step5HandoffPacket   draft={draft} updatePacket={updatePacket} />
      case 6:  return <Step6ComposerScope   {...p} />
      case 7:  return <Step7Macros          />
      case 8:  return <Step8EscalationPolicy {...p} />
      case 9:  return <Step9SensitiveSignals {...p} />
      case 10: return <Step10Notifications  {...p} />
      case 11: return <Step11SLA            {...p} />
      case 12: return <Step12Availability   {...p} />
      case 13: return <Step13Jurisdiction   />
      case 14: return <Step14TestPreview    draft={draft} />
      case 15: return <Step15Review         draft={draft} />
      default: return null
    }
  }

  const PACK_TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'builder',    label: 'Builder' },
    { id: 'workflows',  label: 'Workflows & Agents' },
    { id: 'versions',   label: 'Version History' },
  ]

  return (
    <div>
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="pb-topbar">
        <div className="pb-name-wrap">
          <input
            className="pb-name-input"
            value={draft.name}
            onChange={e => update('name', e.target.value)}
            placeholder="Pack name…"
          />
        </div>
        <div className="pb-topbar-meta">
          <Badge
            label={draft.pattern}
            variant={draft.pattern === 'Handoff' ? 'purple' : 'teal'}
            size="sm"
          />
          <Badge
            label={draft.status}
            variant={draft.status === 'Active' ? 'teal' : 'amber'}
            size="sm"
          />
          <span className="pb-version">{draft.version}</span>
          <span className="pb-workflows-link">
            <Workflow size={12} />
            {sourcePack?.attachedWorkflows ?? 0} workflow{(sourcePack?.attachedWorkflows ?? 0) !== 1 ? 's' : ''}
          </span>
          <Button variant="secondary" size="sm" icon={Save} onClick={saveDraft}>
            Save Draft
          </Button>
        </div>
      </div>

      {/* ── Tab bar (existing packs only) ─────────────────────────────────── */}
      {!isNew && (
        <div className="pb-tab-bar">
          {PACK_TABS.map(t => (
            <button
              key={t.id}
              className={`pb-tab${activeTab === t.id ? ' pb-tab--active' : ''}`}
              onClick={() => navigate(tabPath(t.id))}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Builder tab ───────────────────────────────────────────────────── */}
      {activeTab === 'builder' && (
        <div className="pb-body">
          <StepNav current={step} visited={visited} onGoto={goTo} />

          <div className="pb-content">
            {renderStep()}

            <div className="pb-footer">
              <Button variant="secondary" size="sm" onClick={() => navigate('/configure/packs')}>
                Cancel
              </Button>
              <div className="pb-footer-spacer" />
              <span className="pb-step-count">{step} / {STEPS.length}</span>
              {step > 1 && (
                <Button variant="secondary" size="sm" onClick={prev}>Back</Button>
              )}
              {step < 15 ? (
                <Button variant="primary" size="sm" onClick={next}>Next</Button>
              ) : (
                <Button variant="primary" size="sm" icon={CheckCircle} onClick={publish}>
                  Publish Pack
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Overview tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ paddingTop: 24 }}>
          <OverviewTab draft={draft} sourcePack={sourcePack} navigate={navigate} id={id} />
        </div>
      )}

      {/* ── Workflows & Agents tab ────────────────────────────────────────── */}
      {activeTab === 'workflows' && (
        <div style={{ paddingTop: 24 }}>
          <WorkflowsTab sourcePack={sourcePack} />
        </div>
      )}

      {/* ── Version History tab ───────────────────────────────────────────── */}
      {activeTab === 'versions' && (
        <div style={{ paddingTop: 24 }}>
          <VersionsTab draft={draft} />
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="pb-toast">
          <CheckCircle size={15} style={{ color: 'var(--accent-teal)' }} />
          {toast}
        </div>
      )}
    </div>
  )
}
