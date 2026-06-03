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
import { packs, networks, agents, packAgentBindings, packWorkflowBindings, integrations, lightweightChannels, teamsAndQueues } from '../data/mockData.js'
import './PackBuilder.css'

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1,  label: 'Pattern'            },
  { id: 2,  label: 'Triggers'           },
  { id: 3,  label: 'Routing & Response' },
  { id: 4,  label: 'Destination'        },
  { id: 5,  label: 'Handoff Packet'     },
  { id: 6,  label: 'Composer Scope'     },
  { id: 7,  label: 'Macros',             note: 'Optional' },
  { id: 8,  label: 'Sensitive Signals'  },
  { id: 9,  label: 'Notifications',     hidden: true },
  { id: 10, label: 'Availability',      note: 'Optional' },
  { id: 11, label: 'Jurisdiction',      note: 'Optional' },
  { id: 12, label: 'Test & Preview',    note: 'Optional' },
  { id: 13, label: 'Review & Publish'   },
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
  {
    id: 'm1', name: 'Apologize & Escalate', category: 'replies', trigger: 'frustration signal', scope: 'Full', attached: true,
    template: "I'm really sorry you've been experiencing this. I completely understand how frustrating this must be, and I want to make sure we get this resolved for you quickly.\n\nI'm escalating your case to our senior support team right now — you'll hear back within [X] hours with a resolution.",
  },
  {
    id: 'm2', name: 'Request Order Number', category: 'replies', trigger: 'order inquiry', scope: 'Full', attached: true,
    template: "Thanks for reaching out! To look into this quickly, could you share your order number? You'll find it in your confirmation email or under Orders in your account.",
  },
  {
    id: 'm3', name: 'Transfer to Billing', category: 'actions', trigger: 'billing keyword', scope: 'Full', attached: true,
    template: '→ Transfer conversation to Billing queue\n→ Apply tag: billing-escalation\n→ Notify: billing@company.com\n→ Set priority: High',
  },
  {
    id: 'm4', name: 'Log CSAT Drop', category: 'actions', trigger: 'csat < 3', scope: 'Minimal', attached: false,
    template: '→ Log CSAT drop event to analytics\n→ Tag conversation: low-csat\n→ Notify support lead\n→ Flag for quality review queue',
  },
  {
    id: 'm5', name: 'Schedule Callback', category: 'replies', trigger: 'callback request', scope: 'Full', attached: false,
    template: "I'd be happy to set up a callback. Our team is available Monday–Friday, 9am–6pm EST.\n\nPlease share your preferred time and best number to reach you — I'll get that booked straight away.",
  },
  {
    id: 'm6', name: 'Account Cancellation Flow', category: 'actions', trigger: '"cancel account"', scope: 'Full', attached: true,
    template: '→ Open cancellation retention flow\n→ Offer: Pause account for 1–3 months\n→ Offer: Downgrade to free tier\n→ Escalate to retention specialist if declined\n→ Log cancellation reason to CRM',
  },
  {
    id: 'm7', name: 'Express Empathy', category: 'replies', trigger: 'any escalation', scope: 'Minimal', attached: true,
    template: "Thank you for sharing this with us. I can hear how frustrating this experience has been, and I want you to know your experience truly matters to us.\n\nI'm personally making sure this is handled properly.",
  },
  {
    id: 'm8', name: 'Close & CSAT Request', category: 'replies', trigger: 'resolution confirmed', scope: 'Full', attached: true,
    template: "Great — looks like we got that sorted! So glad we could help. 😊\n\nBefore I close this out, would you mind rating your experience today? Your feedback helps us keep improving. A short survey is on its way to your inbox.",
  },
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
    routingPrimary:       'team-001',
    routingPrimaryCustom: '',
    routingCondition:     'always',
    routingConditionValue:'',
    routingFallbacks: [
      { id: 1, recipient: 'team-002', customRecipient: '', afterMin: 15 },
    ],
    routingFinalAction: ['requeue'],
    slaStages: [
      { id: 1, delayMinutes: 0,  delayUnit: 'minutes', action: 'escalate_next',  customTeam: '' },
      { id: 2, delayMinutes: 30, delayUnit: 'minutes', action: 'notify_manager', customTeam: '' },
    ],
    requireAck:    false,
    allowReassign: true,
    coverageZone:  'US-East',
    coverageHours: '09:00–18:00',
    oooHandling:   'queue',
    jurisdiction:  '',
    studio:        pack?.studio ?? 'All Studios',
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

      {/* ── Studio selector ───────────────────────────────── */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          Which studio will use this Pack?
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All Studios', 'Agentic Studio', 'Helix Governance Studio', 'Helix Data Studio'].map(s => {
            const sel = (draft.studio || 'All Studios') === s
            const colors = {
              'Agentic Studio':          { bg: 'var(--accent-purple-dim)', border: 'var(--accent-purple-border)', color: 'var(--accent-purple)' },
              'Helix Governance Studio': { bg: 'var(--accent-teal-dim)',   border: 'var(--accent-teal-border)',   color: 'var(--accent-teal)'   },
              'Helix Data Studio':       { bg: 'var(--accent-blue-dim)',   border: 'var(--accent-blue-border)',   color: 'var(--accent-blue)'   },
              'All Studios':             { bg: 'var(--bg-card-elevated)',  border: 'var(--border)',               color: 'var(--text-tertiary)' },
            }
            const c = sel ? colors[s] : { bg: 'var(--bg-card)', border: 'var(--border)', color: 'var(--text-tertiary)' }
            return (
              <button
                key={s}
                onClick={() => update('studio', s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: 'DM Mono, monospace',
                  fontWeight: sel ? 600 : 400,
                  background: c.bg,
                  border: `1.5px solid ${c.border}`,
                  color: c.color,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Routing recipient display names (shared between Step 3 and Review) ──────
const ROUTING_RECIPIENT_NAMES = {
  assigned: 'assigned agent',
  person:   'assigned person',
  // team IDs are resolved via RT_RECIPIENTS label lookup
}

// ─── Step 2: Triggers ────────────────────────────────────────────────────────
const TRIGGER_CATEGORIES = [
  {
    id: 'behavior', emoji: '💬', title: 'Customer behavior',
    desc: 'A customer does something specific — like asking to cancel, expressing frustration, or going silent for too long.',
    accent: 'var(--accent-blue)', dim: 'var(--accent-blue-dim)', border: 'var(--accent-blue-border)',
  },
  {
    id: 'confidence', emoji: '🤖', title: 'AI confidence',
    desc: "The AI isn't sure what to do and needs a human to decide. Set the confidence level at which it hands off.",
    accent: 'var(--accent-purple)', dim: 'var(--accent-purple-dim)', border: 'var(--accent-purple-border)',
  },
  {
    id: 'score', emoji: '📊', title: 'Score or threshold',
    desc: 'A number goes above or below a limit — like a satisfaction score dropping, a deal value exceeding your approval threshold, or a risk score spiking.',
    accent: 'var(--accent-amber)', dim: 'var(--accent-amber-dim)', border: 'var(--accent-amber-border)',
  },
  {
    id: 'event', emoji: '⚡', title: 'A specific event happens',
    desc: 'Something concrete occurs — a form is submitted, a status changes, or an agent manually decides to escalate.',
    accent: 'var(--accent-teal)', dim: 'var(--accent-teal-dim)', border: 'var(--accent-teal-border)',
  },
]

const BEHAVIOR_OPTS = [
  { id: 'cancel',      label: 'Asks to cancel' },
  { id: 'frustration', label: 'Expresses frustration' },
  { id: 'manager',     label: 'Requests a manager' },
  { id: 'silence',     label: 'Goes silent (no reply)' },
  { id: 'keywords',    label: 'Uses specific words →' },
  { id: 'other',       label: 'Something else →' },
]
const SCORE_TYPES = [
  { id: 'csat',   label: 'Customer satisfaction (CSAT)' },
  { id: 'deal',   label: 'Deal value' },
  { id: 'risk',   label: 'Risk score' },
  { id: 'custom', label: 'Custom score' },
]
const EVENT_OPTS = [
  { id: 'escalate', label: 'Agent clicks "Escalate" button' },
  { id: 'form',     label: 'Customer submits a form' },
  { id: 'status',   label: 'Status changes to' },
  { id: 'tag',      label: 'Ticket tag is applied:' },
  { id: 'custom',   label: 'Something else:' },
]

function Step2Triggers({ draft, update }) {
  const [expanded,      setExpanded]      = useState({})
  const [behaviorSel,   setBehaviorSel]   = useState('')
  const [behaviorCustom,setBehaviorCustom]= useState('')
  const [confidence,    setConfidence]    = useState(60)
  const [scoreType,     setScoreType]     = useState('csat')
  const [scoreDir,      setScoreDir]      = useState('below')
  const [scoreVal,      setScoreVal]      = useState('')
  const [selEvents,     setSelEvents]     = useState([])
  const [evStatus,      setEvStatus]      = useState('Escalated')
  const [evTag,         setEvTag]         = useState('')
  const [evCustom,      setEvCustom]      = useState('')
  const [advMode,       setAdvMode]       = useState(false)
  const [advText,       setAdvText]       = useState('')

  const [showGroupNote, setShowGroupNote] = useState(false)

  const toggleExpand    = id => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const toggleEvent     = id => setSelEvents(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const hasByType       = type => draft.triggers.some(t => t.type === type)

  // Remove trigger — ensure last item has no connector
  const removeTrigger = id => {
    const next = draft.triggers.filter(t => t.id !== id)
    if (next.length > 0) next[next.length - 1] = { ...next[next.length - 1], connector: null }
    update('triggers', next)
  }

  // Toggle AND ↔ OR on a connector between triggers
  const toggleConnector = id =>
    update('triggers', draft.triggers.map(t =>
      t.id === id ? { ...t, connector: (t.connector || 'OR') === 'OR' ? 'AND' : 'OR' } : t
    ))

  // Generate plain-language summary from triggers + their connectors
  const buildLogicSummary = ts => {
    if (ts.length === 0) return ''
    if (ts.length === 1) return 'This Pack fires when ' + (ts[0].label || ts[0].value) + '.'
    const labels = ts.map(t => t.label || t.value)
    const conns  = ts.slice(0, -1).map(t => t.connector || 'OR')
    const allAnd = conns.every(c => c === 'AND')
    const allOr  = conns.every(c => c === 'OR')
    if (allOr) {
      const last = labels.pop()
      return 'This Pack fires when ' + labels.join(', ') + ', OR ' + last + '.'
    }
    if (allAnd) {
      const last = labels.pop()
      return 'This Pack fires only when all of these are true: ' + labels.join(', ') + ', AND ' + last + '.'
    }
    // Mixed — inline connectors
    return 'This Pack fires when ' + ts.map((t, i) =>
      (t.label || t.value) + (t.connector ? ' ' + t.connector + ' ' : '')
    ).join('').trim() + '.'
  }

  const TRIG_ICONS = { behavior: '💬', confidence: '🤖', score: '📊', event: '⚡', advanced: '✏️' }

  // ── Label generators ───────────────────────────────────────────────────────
  const behaviorLabel = (sel, custom) => ({
    cancel:      'a customer asks to cancel',
    frustration: 'a customer expresses frustration',
    manager:     'a customer requests a manager',
    silence:     'a customer goes silent (no reply)',
    keywords:    `a customer uses specific words: "${custom}"`,
    other:       custom || 'a custom customer behavior',
  }[sel] || sel)

  const confidenceLabel = v => `AI hands off when less than ${v}% confident`

  const scoreLabel = (type, dir, val) => {
    const t = { csat: 'CSAT', deal: 'Deal value', risk: 'Risk score', custom: 'Custom score' }[type] || type
    return `${t} goes ${dir} ${val}`
  }

  const eventLabel = (evs, status, tag, custom) => {
    const parts = []
    if (evs.includes('escalate')) parts.push('Agent escalates')
    if (evs.includes('form'))     parts.push('Customer submits a form')
    if (evs.includes('status'))   parts.push(`Status changes to "${status}"`)
    if (evs.includes('tag') && tag)    parts.push(`Tag applied: "${tag}"`)
    if (evs.includes('custom') && custom) parts.push(custom)
    return parts.join(' · ') || 'Event trigger'
  }

  // ── Add trigger ────────────────────────────────────────────────────────────
  const addTrigger = (type) => {
    let label = '', config = {}
    if (type === 'behavior') {
      if (!behaviorSel) return
      if ((behaviorSel === 'keywords' || behaviorSel === 'other') && !behaviorCustom.trim()) return
      label  = behaviorLabel(behaviorSel, behaviorCustom)
      config = { behavior: behaviorSel, behaviorCustom }
    } else if (type === 'confidence') {
      label  = confidenceLabel(confidence)
      config = { confidenceThreshold: confidence }
    } else if (type === 'score') {
      if (!scoreVal.trim()) return
      label  = scoreLabel(scoreType, scoreDir, scoreVal)
      config = { scoreType, scoreDir, scoreVal }
    } else if (type === 'event') {
      if (selEvents.length === 0) return
      label  = eventLabel(selEvents, evStatus, evTag, evCustom)
      config = { events: [...selEvents], evStatus, evTag, evCustom }
    }
    // Give the current last trigger an OR connector before appending the new one
    const existing = draft.triggers.length > 0
      ? draft.triggers.map((t, i) =>
          i === draft.triggers.length - 1 && t.connector == null
            ? { ...t, connector: 'OR' }
            : t
        )
      : draft.triggers
    update('triggers', [...existing, { id: Date.now(), type, label, value: label, connector: null, ...config }])
  }

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">When should this Pack fire?</div>
        <div className="pb-step-desc">
          Choose the conditions that activate this Pack. Any matching condition will trigger it — you can add as many as you need.
        </div>
      </div>

      {/* ── 2×2 category cards ─────────────────────────────────────────── */}
      <div className="trig-cat-grid">
        {TRIGGER_CATEGORIES.map(cat => {
          const isOpen = !!expanded[cat.id]
          const hasTrig = hasByType(cat.id)
          return (
            <div
              key={cat.id}
              className={`trig-cat-card${isOpen ? ' trig-cat-card--open' : ''}${hasTrig ? ' trig-cat-card--done' : ''}`}
              style={{ '--ca': cat.accent, '--cd': cat.dim, '--cb': cat.border }}
              onClick={() => toggleExpand(cat.id)}
            >
              <div className="trig-cat-top">
                <span className="trig-cat-emoji">{cat.emoji}</span>
                {(isOpen || hasTrig) && <span className="trig-cat-dot" style={{ background: cat.accent }} />}
              </div>
              <div className="trig-cat-name">{cat.title}</div>
              <div className="trig-cat-desc">{cat.desc}</div>
              <div className="trig-cat-foot">
                {hasTrig && <span className="trig-cat-added" style={{ color: cat.accent }}>✓ Added</span>}
                <span className="trig-cat-cta" style={{ color: isOpen ? cat.accent : 'var(--text-tertiary)' }}>
                  {isOpen ? 'Collapse' : 'Configure'}&nbsp;
                  {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Accordion panels ───────────────────────────────────────────── */}
      {TRIGGER_CATEGORIES.map(cat => {
        const isOpen = !!expanded[cat.id]
        return (
          <div
            key={cat.id}
            className={`trig-accordion${isOpen ? ' trig-accordion--open' : ''}`}
            style={{ '--ca': cat.accent, '--cd': cat.dim }}
          >
            <div className="trig-acc-inner">
              {/* panel header */}
              <div className="trig-acc-hdr">
                <span className="trig-acc-emoji">{cat.emoji}</span>
                <span className="trig-acc-label" style={{ color: cat.accent }}>{cat.title}</span>
              </div>

              {/* ─ Customer behavior ─ */}
              {cat.id === 'behavior' && (
                <div className="trig-acc-body">
                  <div className="trig-field-label">When a customer says or does…</div>
                  <div className="trig-beh-opts">
                    {BEHAVIOR_OPTS.map(opt => (
                      <button
                        key={opt.id}
                        className={`trig-beh-btn${behaviorSel === opt.id ? ' trig-beh-btn--sel' : ''}`}
                        style={behaviorSel === opt.id
                          ? { borderColor: cat.accent, background: cat.dim, color: cat.accent }
                          : {}}
                        onClick={() => setBehaviorSel(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {(behaviorSel === 'keywords' || behaviorSel === 'other') && (
                    <input
                      className="trig-text-input"
                      placeholder={behaviorSel === 'keywords'
                        ? 'e.g. cancel, refund, speak to someone'
                        : 'Describe the behavior…'}
                      value={behaviorCustom}
                      onChange={e => setBehaviorCustom(e.target.value)}
                    />
                  )}
                  {behaviorSel && (
                    <div className="trig-preview">
                      This Pack fires when {behaviorLabel(behaviorSel, behaviorCustom)}.
                    </div>
                  )}
                  <Button
                    variant="secondary" size="sm" icon={Plus}
                    onClick={() => addTrigger('behavior')}
                    disabled={!behaviorSel ||
                      ((behaviorSel === 'keywords' || behaviorSel === 'other') && !behaviorCustom.trim())}
                  >Add this trigger</Button>
                </div>
              )}

              {/* ─ AI confidence ─ */}
              {cat.id === 'confidence' && (
                <div className="trig-acc-body">
                  <div className="trig-field-label">
                    Hand off when AI is less than{' '}
                    <strong style={{ color: cat.accent, fontSize: 15 }}>{confidence}%</strong> confident
                  </div>
                  <div className="trig-slider-row">
                    <span className="trig-slider-edge">30%</span>
                    <input
                      type="range" min={30} max={90} step={5}
                      value={confidence}
                      className="trig-slider"
                      style={{ accentColor: cat.accent }}
                      onChange={e => setConfidence(Number(e.target.value))}
                    />
                    <span className="trig-slider-edge">90%</span>
                    <div
                      className="trig-slider-val"
                      style={{ color: cat.accent, background: cat.dim, borderColor: cat.accent + '55' }}
                    >{confidence}%</div>
                  </div>
                  <div className="trig-preview">
                    The AI will hand off when it's less than {confidence}% sure about the right response.
                  </div>
                  <Button variant="secondary" size="sm" icon={Plus} onClick={() => addTrigger('confidence')}>
                    Add this trigger
                  </Button>
                </div>
              )}

              {/* ─ Score or threshold ─ */}
              {cat.id === 'score' && (
                <div className="trig-acc-body">
                  <div className="trig-field-label">When…</div>
                  <div className="trig-score-row">
                    <select className="trig-sel" value={scoreType} onChange={e => setScoreType(e.target.value)}>
                      {SCORE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <span className="trig-score-is">is</span>
                    <select className="trig-sel" value={scoreDir} onChange={e => setScoreDir(e.target.value)}>
                      <option value="below">below</option>
                      <option value="above">above</option>
                    </select>
                    <input
                      type="text"
                      className="trig-score-num"
                      placeholder="e.g. 3"
                      value={scoreVal}
                      onChange={e => setScoreVal(e.target.value)}
                    />
                  </div>
                  {scoreVal && (
                    <div className="trig-preview">
                      This Pack fires when {scoreLabel(scoreType, scoreDir, scoreVal).toLowerCase()}.
                    </div>
                  )}
                  <Button
                    variant="secondary" size="sm" icon={Plus}
                    onClick={() => addTrigger('score')}
                    disabled={!scoreVal.trim()}
                  >Add this trigger</Button>
                </div>
              )}

              {/* ─ Specific event ─ */}
              {cat.id === 'event' && (
                <div className="trig-acc-body">
                  <div className="trig-field-label">Select all that apply:</div>
                  <div className="trig-event-list">
                    {EVENT_OPTS.map(ev => (
                      <label key={ev.id} className="trig-event-row">
                        <div
                          className={`trig-ev-box${selEvents.includes(ev.id) ? ' trig-ev-box--on' : ''}`}
                          style={selEvents.includes(ev.id)
                            ? { borderColor: cat.accent, background: cat.dim }
                            : {}}
                          onClick={() => toggleEvent(ev.id)}
                        >
                          {selEvents.includes(ev.id) &&
                            <Check size={10} style={{ color: cat.accent }} strokeWidth={3} />}
                        </div>
                        <span className="trig-ev-label">{ev.label}</span>
                        {ev.id === 'status' && selEvents.includes('status') && (
                          <select
                            className="trig-sel trig-sel--sm"
                            value={evStatus}
                            onChange={e => setEvStatus(e.target.value)}
                            onClick={e => e.stopPropagation()}
                          >
                            {['Escalated','Resolved','On Hold','Closed','Pending'].map(s =>
                              <option key={s}>{s}</option>)}
                          </select>
                        )}
                        {ev.id === 'tag' && selEvents.includes('tag') && (
                          <input className="trig-text-input trig-text-input--sm"
                            placeholder="tag name" value={evTag}
                            onChange={e => setEvTag(e.target.value)} />
                        )}
                        {ev.id === 'custom' && selEvents.includes('custom') && (
                          <input className="trig-text-input trig-text-input--sm"
                            placeholder="Describe the event…" value={evCustom}
                            onChange={e => setEvCustom(e.target.value)} />
                        )}
                      </label>
                    ))}
                  </div>
                  {selEvents.length > 0 && (
                    <div className="trig-preview">
                      This Pack fires when: {eventLabel(selEvents, evStatus, evTag, evCustom)}.
                    </div>
                  )}
                  <Button
                    variant="secondary" size="sm" icon={Plus}
                    onClick={() => addTrigger('event')}
                    disabled={selEvents.length === 0}
                  >Add this trigger</Button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* ── Active triggers — structured logic list ───────────────────── */}
      <div className="trig-summary">
        {draft.triggers.length > 0 ? (
          <>
            <div className="trig-summary-lbl">
              {draft.triggers.slice(0,-1).every(t => (t.connector||'OR')==='AND')
                ? 'This Pack fires only when ALL of these are true:'
                : 'This Pack fires when any of these match:'}
            </div>
            <div className="trig-logic-list">
              {draft.triggers.map((t, i) => {
                const isLast = i === draft.triggers.length - 1
                const conn   = (t.connector || 'OR')
                return (
                  <div key={t.id}>
                    <div className="trig-logic-row">
                      <span className="trig-logic-icon">{TRIG_ICONS[t.type] || '⚡'}</span>
                      <span className="trig-logic-lbl">{t.label || t.value}</span>
                      <button className="trig-pill-x" onClick={() => removeTrigger(t.id)}>
                        <X size={11} />
                      </button>
                    </div>
                    {!isLast && (
                      <div className="trig-connector-wrap">
                        <button
                          className={`trig-connector trig-connector--${conn.toLowerCase()}`}
                          onClick={() => toggleConnector(t.id)}
                          title="Click to toggle AND / OR"
                        >
                          {conn}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Plain-language summary */}
            <div className="rt-summary" style={{ marginTop: 10, padding: '10px 13px' }}>
              <Info size={12} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 2 }} />
              <span className="rt-summary-txt" style={{ fontSize: 12 }}>
                {buildLogicSummary(draft.triggers)}
              </span>
            </div>
          </>
        ) : (
          <div className="trig-empty">Add at least one trigger above to continue.</div>
        )}
      </div>

      {/* ── Add trigger group (shown when 2+ triggers) ────────────────── */}
      {draft.triggers.length >= 2 && (
        <div className="trig-adv-row" style={{ marginBottom: 0 }}>
          <button className="trig-adv-link" onClick={() => setShowGroupNote(g => !g)}>
            {showGroupNote ? '↑ Hide grouping' : '+ Add trigger group'}
          </button>
        </div>
      )}
      {showGroupNote && (
        <div className="trig-adv-panel" style={{ marginBottom: 8 }}>
          <div className="trig-field-label" style={{ marginBottom: 6 }}>Grouping (advanced)</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Groups let you apply higher-level logic — e.g.{' '}
            <em>(customer asks to cancel <strong>AND</strong> CSAT &lt; 3) <strong>OR</strong> AI confidence &lt; 60%</em>.
            Use the AND / OR connectors above for most cases. Grouped logic is available in a future update.
          </div>
        </div>
      )}

      {/* ── Advanced mode ─────────────────────────────────────────────── */}
      <div className="trig-adv-row">
        <button className="trig-adv-link" onClick={() => setAdvMode(a => !a)}>
          {advMode ? '↑ Hide advanced mode' : 'Advanced mode'}
        </button>
      </div>
      {advMode && (
        <div className="trig-adv-panel">
          <div className="trig-field-label" style={{ marginBottom: 8 }}>Enter trigger expressions directly</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="trig-text-input"
              style={{ flex: 1 }}
              placeholder="e.g. CSAT signal < 3 or 'cancel account'"
              value={advText}
              onChange={e => setAdvText(e.target.value)}
            />
            <Button
              variant="secondary" size="sm" icon={Plus}
              onClick={() => {
                if (!advText.trim()) return
                update('triggers', [...draft.triggers,
                  { id: Date.now(), type: 'advanced', label: advText.trim(), value: advText.trim() }])
                setAdvText('')
              }}
            >Add</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Merged: Routing & Response Rules ──────────────────────────────────────────
function StepRoutingResponse({ draft, update }) {
  const primary       = draft.routingPrimary        || "tier1"
  const primaryCustom = draft.routingPrimaryCustom  || ""
  const condition     = draft.routingCondition      || "always"
  const condValue     = draft.routingConditionValue || ""
  const fallbacks     = draft.routingFallbacks      || [{ id: 1, recipient: "tier2", customRecipient: "", afterMin: 15 }]
  const finalAction   = Array.isArray(draft.routingFinalAction) ? draft.routingFinalAction : [draft.routingFinalAction || "requeue"]
  const stages        = draft.slaStages || [{ id:1,delayMinutes:0,delayUnit:"minutes",action:"escalate_next",customTeam:"" },{ id:2,delayMinutes:30,delayUnit:"minutes",action:"notify_manager",customTeam:"" }]
  const hours         = Math.floor(draft.slaMinutes / 60)
  const mins          = draft.slaMinutes % 60
  const [hasResTarget,setHasResTarget] = useState(false)
  const [resHours,setResHours]         = useState(4)
  const [resMins,setResMins]           = useState(0)

  const setStages   = s => update("slaStages", s)
  const addStage    = () => setStages([...stages,{ id: stages.reduce((m,s)=>Math.max(m,s.id),0)+1, delayMinutes:60, delayUnit:"minutes", action:"notify_senior", customTeam:"" }])
  const removeStage = id => setStages(stages.filter(s=>s.id!==id))
  const updateStage = (id,k,v) => setStages(stages.map(s=>s.id===id?{...s,[k]:v}:s))
  const rName = (id,custom) => ROUTING_RECIPIENT_NAMES[id]||custom||RT_RECIPIENTS.find(r=>r.id===id)?.label||id
  const toMin = s => s.delayUnit==="hours"?s.delayMinutes*60:s.delayMinutes
  const fmtMin= m => m>=1440?(m/1440).toFixed(1)+"d":m>=60?(m/60).toFixed(1)+"h":m+"m"
  const setPrimary       = v => update("routingPrimary",v)
  const setPrimaryCustom = v => update("routingPrimaryCustom",v)
  const setCondition     = v => update("routingCondition",v)
  const setCondValue     = v => update("routingConditionValue",v)
  const setFallbacks     = fb => { update("routingFallbacks",fb); update("fallbackChain",fb.map(f=>rName(f.recipient,f.customRecipient))) }
  const toggleFinalAction = v => { const next=finalAction.includes(v)?finalAction.filter(x=>x!==v):[...finalAction,v]; if(next.length>0)update("routingFinalAction",next) }
  const setHoursF = h => update("slaMinutes",Math.max(0,parseInt(h)||0)*60+mins)
  const setMinsF  = m => update("slaMinutes",hours*60+Math.min(59,Math.max(0,parseInt(m)||0)))
  const moveFallback   = (i,dir) => { const a=[...fallbacks];const j=i+dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];setFallbacks(a) }
  const addFallback    = () => setFallbacks([...fallbacks,{ id:fallbacks.reduce((m,f)=>Math.max(m,f.id),0)+1, recipient:"tier2", customRecipient:"", afterMin:30 }])
  const removeFallback = id => setFallbacks(fallbacks.filter(f=>f.id!==id))
  const updateFallback = (id,k,v) => setFallbacks(fallbacks.map(f=>f.id===id?{...f,[k]:v}:f))
  const primaryOpt = RT_RECIPIENTS.find(r=>r.id===primary)
  const condOpt    = RT_CONDITIONS.find(c=>c.id===condition)
  const humanWindow = m => { const h=Math.floor(m/60),mn=m%60; return [h>0&&(h+" hour"+(h!==1?"s":"")),mn>0&&(mn+" minute"+(mn!==1?"s":""))].filter(Boolean).join(" and ")||"immediately" }
  const buildSummary = () => { let s="This item goes to "+rName(primary,primaryCustom)+" first."; for(const fb of fallbacks)s+=" If no one responds in "+fmtMin(fb.afterMin)+"m, it moves to "+rName(fb.recipient,fb.customRecipient)+"."; const m={requeue:"the next available agent handles it",notify:"the team manager is notified",slack:"a lightweight alert is sent",wait:"the item stays open"}; s+=" If still unhandled: "+finalAction.map(a=>m[a]).filter(Boolean).join(", and ")+"."; return s }
  const stageTimes = stages.reduce((acc,s,i)=>{ const cum=i===0?draft.slaMinutes:acc[i-1].cumMin+toMin(s); return [...acc,{...s,cumMin:cum}] },[])
  const TL_COLORS = SLA_STAGE_COLORS
  const inputSty = {width:64,padding:"6px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:14,fontFamily:"DM Mono",textAlign:"center"}

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Routing &amp; Response Rules</div>
        <div className="pb-step-desc">Define who receives this item, how long they have to act, and what happens automatically if they don't.</div>
      </div>

      <div className="rr-section-label">WHO GETS THIS ITEM?</div>
      <div className="rt-block">
        <div className="rt-block-label">Send this item to</div>
        <div className="rt-primary-row">
          <select className="rt-sel rt-sel--lg" value={primary} onChange={e=>setPrimary(e.target.value)}>
            {RT_RECIPIENTS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {primaryOpt?.needsInput&&<SearchableSelect value={primaryCustom} onChange={setPrimaryCustom} options={primary==="team"?RT_TEAMS:RT_PERSONS} placeholder={primary==="team"?"Search team…":"Search person…"}/>}
        </div>
        <div className="rt-condition-row">
          <span className="rt-cond-prefix">Only if</span>
          <select className="rt-sel" value={condition} onChange={e=>setCondition(e.target.value)}>{RT_CONDITIONS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
          {condOpt?.needsInput&&<input className="rt-text-input rt-text-input--sm" placeholder="value…" value={condValue} onChange={e=>setCondValue(e.target.value)}/>}
          {condOpt?.needsSelect&&<select className="rt-sel" value={condValue||condOpt.needsSelect[0]} onChange={e=>setCondValue(e.target.value)}>{condOpt.needsSelect.map(v=><option key={v}>{v}</option>)}</select>}
        </div>
      </div>

      <div className="rr-sub-label">If they're unavailable or don't respond in time, try:</div>
      <div className="rt-fallbacks">
        {fallbacks.map((fb,i)=>{ const fbOpt=RT_RECIPIENTS.find(r=>r.id===fb.recipient); return (
          <div key={fb.id} className="rt-fb-card">
            <div className="rt-fb-num">{i+1}</div>
            <div className="rt-fb-reorder"><button className="rt-reorder-btn" onClick={()=>moveFallback(i,-1)} disabled={i===0}><ArrowUp size={11}/></button><button className="rt-reorder-btn" onClick={()=>moveFallback(i,1)} disabled={i===fallbacks.length-1}><ArrowDown size={11}/></button></div>
            <div className="rt-fb-body">
              <select className="rt-sel" value={fb.recipient} onChange={e=>updateFallback(fb.id,"recipient",e.target.value)}>{RT_RECIPIENTS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select>
              {fbOpt?.needsInput&&<SearchableSelect key={fb.recipient} value={fb.customRecipient} onChange={val=>updateFallback(fb.id,"customRecipient",val)} options={fb.recipient==="team"?RT_TEAMS:RT_PERSONS} placeholder={fb.recipient==="team"?"Search team…":"Search person…"} className="rt-text-input--sm"/>}
              <span className="rt-after-lbl">then try next after</span>
              <select className="rt-sel" value={fb.afterMin} onChange={e=>updateFallback(fb.id,"afterMin",Number(e.target.value))}>{RT_TIMEOUTS.map(t=><option key={t} value={t}>{t} min</option>)}</select>
            </div>
            <button className="rt-remove-btn" onClick={()=>removeFallback(fb.id)} title="Remove"><X size={13}/></button>
          </div>
        )})}
        <button className="rt-add-fb" onClick={addFallback}><Plus size={13}/> Add another fallback</button>
      </div>

      <div className="rr-sub-label">If nobody responds after all fallbacks:</div>
      <div className="rt-final-opts">
        {RT_FINAL_ACTIONS.map(a=>{ const on=finalAction.includes(a.id); return (
          <label key={a.id} className="rt-final-row" onClick={()=>toggleFinalAction(a.id)}>
            <div className={"rt-check"+(on?" rt-check--on":"")}>{on&&<Check size={9} color="#fff" strokeWidth={3}/>}</div>
            <span className="rt-final-lbl">{a.label}</span>
          </label>
        )})}
      </div>
      <div className="rt-summary"><Info size={13} className="rt-summary-icon"/><span className="rt-summary-txt">{buildSummary()}</span></div>

      <div className="rr-divider"><span>RESPONSE WINDOW</span></div>
      <div className="rr-section-label">HOW LONG DOES EACH PERSON HAVE?</div>
      <div className="rr-section-sub">This is the total time window for this item to be resolved — not the time per fallback. Fallback timeouts are defined above.</div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><input type="number" value={hours} min={0} max={168} onChange={e=>setHoursF(e.target.value)} style={inputSty}/><span style={{fontSize:13,color:"var(--text-secondary)"}}>h</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><input type="number" value={mins}  min={0} max={59}  onChange={e=>setMinsF(e.target.value)}  style={inputSty}/><span style={{fontSize:13,color:"var(--text-secondary)"}}>min</span></div>
        <span style={{fontSize:12,color:"var(--accent-blue)",fontFamily:"DM Mono",background:"var(--accent-blue-dim)",border:"1px solid var(--accent-blue-border)",borderRadius:4,padding:"3px 8px"}}>= {fmtMin(draft.slaMinutes)}</span>
      </div>
      <div className="sla-echo">Agents have <strong>{humanWindow(draft.slaMinutes)}</strong> total to resolve items from this Pack.</div>
      <label className="sla-res-toggle"><input type="checkbox" checked={hasResTarget} onChange={e=>setHasResTarget(e.target.checked)} style={{accentColor:"var(--accent-blue)",marginRight:6}}/>Set a resolution target (optional)</label>
      {hasResTarget&&(<div className="sla-res-target"><div style={{fontSize:12,color:"var(--text-tertiary)",marginBottom:10}}>How long can the full interaction take before it's overdue?</div><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><input type="number" value={resHours} min={0} max={168} onChange={e=>setResHours(Math.max(0,parseInt(e.target.value)||0))} style={inputSty}/><span style={{fontSize:13,color:"var(--text-secondary)"}}>h</span></div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="number" value={resMins} min={0} max={59} onChange={e=>setResMins(Math.min(59,Math.max(0,parseInt(e.target.value)||0)))} style={inputSty}/><span style={{fontSize:13,color:"var(--text-secondary)"}}>min</span></div><span style={{fontSize:12,color:"var(--accent-purple)",fontFamily:"DM Mono",background:"var(--accent-purple-dim)",border:"1px solid var(--accent-purple-border)",borderRadius:4,padding:"3px 8px"}}>= {fmtMin(resHours*60+resMins)}</span></div></div>)}

      <div className="rr-divider"><span>IF TIME RUNS OUT</span></div>
      <div className="rr-section-label">WHAT HAPPENS AUTOMATICALLY IF TIME RUNS OUT?</div>
      <div className="rr-section-sub">These actions fire on their own — no one needs to do anything. They run in order, one stage at a time.</div>
      <div className="sla-stages">
        {stages.map((stage,i)=>{ const isFirst=i===0;const isLast=i===stages.length-1;const color=TL_COLORS[Math.min(i,TL_COLORS.length-1)];const actionOpt=SLA_ACTIONS.find(a=>a.id===stage.action); return (
          <div key={stage.id} className="sla-stage">
            {!isLast&&<div className="sla-stage-line"/>}
            <div className="sla-stage-card">
              <div className="sla-stage-hdr">
                <div className="sla-stage-badge" style={{background:color}}>{i+1}</div>
                <div className="sla-stage-hdr-txt">{isFirst?(<span style={{fontSize:13}}><strong style={{color:"var(--text-primary)"}}>At the response window deadline</strong><span style={{color:"var(--text-tertiary)"}}> — when the total window expires</span></span>):(<span style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",fontSize:13,color:"var(--text-secondary)"}}>If still unresolved after<input type="number" value={stage.delayMinutes} min={1} max={10080} onChange={e=>updateStage(stage.id,"delayMinutes",Math.max(1,parseInt(e.target.value)||1))} style={{...inputSty,width:52,fontSize:13,padding:"4px 8px"}}/><select className="rt-sel rt-sel--sm" value={stage.delayUnit} onChange={e=>updateStage(stage.id,"delayUnit",e.target.value)}><option value="minutes">minutes</option><option value="hours">hours</option></select>from Stage {i}:</span>)}</div>
                {!isFirst&&<button className="sla-stage-rm" onClick={()=>removeStage(stage.id)}><X size={12}/></button>}
              </div>
              <div className="sla-stage-action"><span style={{fontSize:12,color:"var(--text-tertiary)",flexShrink:0}}>Action:</span><select className="rt-sel" value={stage.action} onChange={e=>updateStage(stage.id,"action",e.target.value)} style={{flex:1}}>{SLA_ACTIONS.filter(a=>i>0||a.id!=="notify_senior").map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select>{actionOpt?.needsInput&&<input className="trig-text-input trig-text-input--sm" placeholder="Team name…" value={stage.customTeam} onChange={e=>updateStage(stage.id,"customTeam",e.target.value)}/>}</div>
              {isLast&&stages.length>1&&<div className="sla-stage-final">⚠ Final action — if this fires, the item is critically overdue</div>}
            </div>
          </div>
        )})}
        <button className="sla-add-stage" onClick={addStage}><Plus size={13}/> Add another stage</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
        {[{key:"requireAck",label:"Start the response clock only after the agent accepts the item",hint:"Useful when agents need time to review before the clock starts."},{key:"allowReassign",label:"Let agents pass this item to a colleague themselves",hint:"Agents can transfer without waiting for a manager."}].map(opt=>(
          <div key={opt.key} className="ep-toggle-row"><div><div className="ep-toggle-label">{opt.label}</div><div className="ep-toggle-hint">{opt.hint}</div></div><Toggle on={!!draft[opt.key]} onChange={val=>update(opt.key,val)}/></div>
        ))}
      </div>
      <div className="sla-tl-preview">
        <div className="sla-tl-item"><div className="sla-tl-dot" style={{borderColor:"var(--border-strong)",color:"var(--text-tertiary)"}}>0:00</div><div className="sla-tl-lbl">Item arrives</div></div>
        {stageTimes.map((s,i)=>{ const color=TL_COLORS[Math.min(i,TL_COLORS.length-1)]; return (<span key={s.id} style={{display:"contents"}}><div className="sla-tl-track" style={{background:color+"44"}}/><div className="sla-tl-item"><div className="sla-tl-dot" style={{borderColor:color,background:color+"22",color}}>{i===0?fmtMin(s.cumMin):"+"+fmtMin(toMin(s))}</div><div className="sla-tl-lbl" style={{color}}>{i===0?"Response window":"Stage "+(i+1)}</div></div></span>) })}
      </div>
    </div>
  )
}

// ─── Step 3: Routing Logic ────────────────────────────────────────────────────

const RT_TEAMS = [
  'Sales', 'Sales Managers', 'Customer Success', 'Operations', 'Finance',
  'Engineering', 'Legal', 'HR', 'Product', 'Marketing',
  'Support Tier 1', 'Support Tier 2', 'Support Tier 3',
  'Procurement', 'Compliance', 'Accounting', 'Data & Analytics',
]

const RT_PERSONS = [
  'Alexa M.', 'Carlos Vega', 'David Osei', 'Fatima Al-Rashid',
  'Hannah Moore', 'Jordan Park', 'Jordan S.', 'Lena Brandt',
  'Maya R.', 'Rachel Ng', 'Sandra Voss', 'Yuki Tanaka',
  'Ben Cooper', 'Priya Kapoor', 'Marcus Webb', 'Nina Torres',
  'Sofia Chen', 'Alex Torres', 'James Rodriguez', 'Priya Patel',
]

function SearchableSelect({ value, onChange, options, placeholder, className }) {
  const [query, setQuery] = useState(value || '')
  const [open,  setOpen]  = useState(false)

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  const select = opt => { setQuery(opt); onChange(opt); setOpen(false) }

  return (
    <div className="rt-search-wrap">
      <input
        className={`rt-text-input${className ? ' ' + className : ''}`}
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      />
      {open && filtered.length > 0 && (
        <div className="rt-search-drop">
          {filtered.map(opt => (
            <div
              key={opt}
              className={`rt-search-opt${opt === value ? ' rt-search-opt--sel' : ''}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => select(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Recipients pulled from teamsAndQueues + special options
const RT_RECIPIENTS = [
  ...teamsAndQueues.filter(t => t.status === 'active').map(t => ({ id: t.id, label: t.name })),
  { id: 'person',   label: 'A specific person', needsInput: true },
  { id: 'assigned', label: 'The person who triggered this' },
]

const RT_CONDITIONS = [
  { id: 'always',    label: 'Always (no condition)' },
  { id: 'available', label: 'They are available right now' },
  { id: 'plan',      label: "The customer's plan is", needsInput: true },
  { id: 'priority',  label: 'The item priority is',   needsSelect: ['High', 'Medium', 'Low'] },
]

const RT_TIMEOUTS     = [5, 10, 15, 30, 60]

const RT_FINAL_ACTIONS = [
  { id: 'requeue', label: 'Re-queue for the next available agent' },
  { id: 'notify',  label: 'Notify the team manager' },
  { id: 'slack',   label: 'Send a lightweight notification via Slack / email' },
  { id: 'wait',    label: 'Keep waiting (item stays open)' },
]

function Step3Routing({ draft, update }) {
  const [advMode, setAdvMode] = useState(false)

  const primary       = draft.routingPrimary        || 'tier1'
  const primaryCustom = draft.routingPrimaryCustom  || ''
  const condition     = draft.routingCondition      || 'always'
  const condValue     = draft.routingConditionValue || ''
  const fallbacks     = draft.routingFallbacks      || [{ id: 1, recipient: 'tier2', customRecipient: '', afterMin: 15 }]
  const finalAction   = Array.isArray(draft.routingFinalAction)
    ? draft.routingFinalAction
    : [draft.routingFinalAction || 'requeue']

  const rName = (id, custom) =>
    ROUTING_RECIPIENT_NAMES[id] || custom || RT_RECIPIENTS.find(r => r.id === id)?.label || id

  // Sync draft.routing (string) so review step stays accurate
  const sync = (pri, priC, cond, condV) => {
    const name    = rName(pri, priC)
    const condOpt = RT_CONDITIONS.find(c => c.id === cond)
    const condStr = cond === 'always' ? '' : `, when ${condOpt?.label || cond}${condV ? ` ${condV}` : ''}`
    update('routing', `Send to ${name}${condStr}`)
  }

  const setPrimary       = v => { update('routingPrimary',       v); sync(v, primaryCustom, condition, condValue) }
  const setPrimaryCustom = v => { update('routingPrimaryCustom', v); sync(primary, v, condition, condValue) }
  const setCondition     = v => { update('routingCondition',     v); sync(primary, primaryCustom, v, condValue) }
  const setCondValue     = v => { update('routingConditionValue',v); sync(primary, primaryCustom, condition, v) }
  const toggleFinalAction = v => {
    const next = finalAction.includes(v)
      ? finalAction.filter(x => x !== v)
      : [...finalAction, v]
    if (next.length > 0) update('routingFinalAction', next)
  }

  const setFallbacks = fbs => {
    update('routingFallbacks', fbs)
    update('fallbackChain', fbs.map(f => rName(f.recipient, f.customRecipient)))
  }

  const moveFallback    = (i, dir) => {
    const arr = [...fallbacks]; const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]; setFallbacks(arr)
  }
  const addFallback     = () => setFallbacks([...fallbacks, { id: Date.now(), recipient: 'tier2', customRecipient: '', afterMin: 30 }])
  const removeFallback  = id => setFallbacks(fallbacks.filter(f => f.id !== id))
  const updateFallback  = (id, key, val) => setFallbacks(fallbacks.map(f => f.id === id ? { ...f, [key]: val } : f))

  const buildSummary = () => {
    let s = `This item will go to ${rName(primary, primaryCustom)} first.`
    for (const fb of fallbacks)
      s += ` If no one responds in ${fb.afterMin} minutes, it moves to ${rName(fb.recipient, fb.customRecipient)}.`
    const endingMap = {
      requeue: 'the next available agent handles it',
      notify:  'the team manager is notified',
      slack:   'a notification is sent via Slack or email',
      wait:    'the item stays open indefinitely',
    }
    const endingParts = finalAction.map(a => endingMap[a]).filter(Boolean)
    s += ` If still unhandled: ${endingParts.join(', and ') || 'the item remains open'}.`
    return s
  }

  const primaryOpt  = RT_RECIPIENTS.find(r => r.id === primary)
  const condOpt     = RT_CONDITIONS.find(c => c.id === condition)

  // Machine-readable IF/THEN for advanced view
  const advRules = [
    { cond: `queue.${primary}.available == true`,   action: `Route to ${rName(primary, primaryCustom)}` },
    ...fallbacks.map(fb => ({
      cond: `queue.${fb.recipient}.available == true`,
      action: `Route to ${rName(fb.recipient, fb.customRecipient)} after ${fb.afterMin}m`,
    })),
    { cond: `fallback.all_exhausted == true`, action: `${finalAction}` },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-note">Routing Logic controls how the item is delivered</div>
        <div className="pb-step-title">Who should receive this item?</div>
        <div className="pb-step-desc">
          Define who gets this item first, and who takes over if they're unavailable.
        </div>
      </div>

      {/* ── Primary recipient ─────────────────────────────────────────── */}
      <div className="rt-block">
        <div className="rt-block-label">Send this item to</div>
        <div className="rt-primary-row">
          <select className="rt-sel rt-sel--lg" value={primary} onChange={e => setPrimary(e.target.value)}>
            {RT_RECIPIENTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {primaryOpt?.needsInput && (
            <SearchableSelect
              value={primaryCustom}
              onChange={setPrimaryCustom}
              options={primary === 'team' ? RT_TEAMS : RT_PERSONS}
              placeholder={primary === 'team' ? 'Search team…' : 'Search person…'}
            />
          )}
        </div>
        <div className="rt-condition-row">
          <span className="rt-cond-prefix">Only if</span>
          <select className="rt-sel" value={condition} onChange={e => setCondition(e.target.value)}>
            {RT_CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {condOpt?.needsInput && (
            <input
              className="rt-text-input rt-text-input--sm"
              placeholder="value…"
              value={condValue}
              onChange={e => setCondValue(e.target.value)}
            />
          )}
          {condOpt?.needsSelect && (
            <select className="rt-sel" value={condValue || condOpt.needsSelect[0]} onChange={e => setCondValue(e.target.value)}>
              {condOpt.needsSelect.map(v => <option key={v}>{v}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Fallback chain ────────────────────────────────────────────── */}
      <div className="rt-section-hd">If they're unavailable, try next:</div>
      <div className="rt-fallbacks">
        {fallbacks.map((fb, i) => {
          const fbOpt = RT_RECIPIENTS.find(r => r.id === fb.recipient)
          return (
            <div key={fb.id} className="rt-fb-card">
              <div className="rt-fb-num">{i + 1}</div>
              <div className="rt-fb-reorder">
                <button className="rt-reorder-btn" onClick={() => moveFallback(i, -1)} disabled={i === 0}><ArrowUp size={11} /></button>
                <button className="rt-reorder-btn" onClick={() => moveFallback(i, 1)}  disabled={i === fallbacks.length - 1}><ArrowDown size={11} /></button>
              </div>
              <div className="rt-fb-body">
                <select className="rt-sel" value={fb.recipient} onChange={e => updateFallback(fb.id, 'recipient', e.target.value)}>
                  {RT_RECIPIENTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {fbOpt?.needsInput && (
                  <SearchableSelect
                    key={fb.recipient}
                    value={fb.customRecipient}
                    onChange={val => updateFallback(fb.id, 'customRecipient', val)}
                    options={fb.recipient === 'team' ? RT_TEAMS : RT_PERSONS}
                    placeholder={fb.recipient === 'team' ? 'Search team…' : 'Search person…'}
                    className="rt-text-input--sm"
                  />
                )}
                <span className="rt-after-lbl">then try next after</span>
                <select className="rt-sel" value={fb.afterMin} onChange={e => updateFallback(fb.id, 'afterMin', Number(e.target.value))}>
                  {RT_TIMEOUTS.map(t => <option key={t} value={t}>{t} min</option>)}
                </select>
              </div>
              <button className="rt-remove-btn" onClick={() => removeFallback(fb.id)} title="Remove">
                <X size={13} />
              </button>
            </div>
          )
        })}
        <button className="rt-add-fb" onClick={addFallback}>
          <Plus size={13} /> Add another fallback
        </button>
      </div>

      {/* ── Final action ──────────────────────────────────────────────── */}
      <div className="rt-section-hd">If nobody responds after all fallbacks:</div>
      <div className="rt-final-opts">
        {RT_FINAL_ACTIONS.map(a => {
          const checked = finalAction.includes(a.id)
          return (
            <label key={a.id} className="rt-final-row" onClick={() => toggleFinalAction(a.id)}>
              <div className={`rt-check${checked ? ' rt-check--on' : ''}`}>
                {checked && <Check size={9} color="#fff" strokeWidth={3} />}
              </div>
              <span className="rt-final-lbl">{a.label}</span>
            </label>
          )
        })}
      </div>

      {/* ── Live summary ──────────────────────────────────────────────── */}
      <div className="rt-summary">
        <Info size={13} className="rt-summary-icon" />
        <span className="rt-summary-txt">{buildSummary()}</span>
      </div>

      {/* ── Advanced mode ─────────────────────────────────────────────── */}
      <div className="trig-adv-row">
        <button className="trig-adv-link" onClick={() => setAdvMode(a => !a)}>
          {advMode ? '↑ Hide advanced mode' : 'Advanced mode (IF/THEN)'}
        </button>
      </div>
      {advMode && (
        <div className="trig-adv-panel">
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Machine-readable conditions generated from your routing configuration:
          </div>
          {advRules.map((rule, i) => (
            <div key={i} className="routing-rule">
              <span className="routing-label">IF</span>
              <div style={{ flex: 1, fontFamily: 'DM Mono', fontSize: 11, padding: '5px 9px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-secondary)' }}>
                {rule.cond}
              </div>
              <span className="routing-then-arrow">→</span>
              <span className="routing-label">THEN</span>
              <div style={{ flex: 1, fontSize: 12, padding: '5px 9px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-secondary)' }}>
                {rule.action}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Destination ──────────────────────────────────────────────────────
const DEST_ADDONS = [
  {
    id:   'lightweight',
    emoji: '🪶',
    name: 'Lightweight',
    desc: 'Also send a minimal approval card alongside the inbox item — approve or reject only, no full context view.',
  },
  {
    id:   'external',
    emoji: '🔗',
    name: 'External',
    desc: 'Also route to an external webhook — for CRM write-back, ticketing systems, or Slack notifications.',
  },
]

function Step4Destination({ draft, update }) {
  // Integration toggles
  const [intToggles,  setIntToggles]  = useState({})
  // Lightweight channel toggles
  const [chanToggles, setChanToggles] = useState({})
  // Notification event toggles (absorbed from Step 10)
  const [notifOn,     setNotifOn]     = useState({ notifyOnAssign: true, notifyOnSlaBreach: true, notifyOnResolve: false })
  // Notification channel toggles
  const [notifCh,     setNotifCh]     = useState({ email: true, slack: false, inApp: true, sms: false })

  const toggleInt  = id => setIntToggles(p  => ({ ...p,  [id]: !p[id]  }))
  const toggleChan = id => setChanToggles(p => ({ ...p,  [id]: !p[id]  }))
  const toggleNotifEv = k => setNotifOn(p   => ({ ...p,  [k]:  !p[k]   }))
  const toggleNotifCh = k => setNotifCh(p   => ({ ...p,  [k]:  !p[k]   }))

  const activeCh = Object.entries(notifCh).filter(([,v]) => v).map(([k]) =>
    ({ email: 'Email', slack: 'Slack', inApp: 'In-app', sms: 'SMS' }[k])
  )

  const fmtSync = iso => {
    const diff = (+new Date(iso) ? (new Date()).getTime() - (new Date(iso)).getTime() : 0)
    const m = Math.floor(diff / 60000)
    if (m < 60) return m + 'm ago'
    const h = Math.floor(m / 60)
    if (h < 24) return h + 'h ago'
    return Math.floor(h / 24) + 'd ago'
  }

  const NOTIF_EVENTS = [
    { key: 'notifyOnAssign',    label: 'On assignment',  hint: 'Notify the agent when this item lands in their queue', Icon: Bell       },
    { key: 'notifyOnSlaBreach', label: 'On SLA breach',  hint: 'Alert agent and supervisor when time runs out',        Icon: Clock      },
    { key: 'notifyOnResolve',   label: 'On resolution',  hint: 'Confirm to the originating agent when closed',         Icon: CheckCircle},
  ]

  const NOTIF_CHANNELS = [
    { key: 'email',  label: 'Email'   },
    { key: 'slack',  label: 'Slack'   },
    { key: 'inApp',  label: 'In-app'  },
    { key: 'sms',    label: 'SMS'     },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Where should this item be delivered?</div>
        <div className="pb-step-desc">
          Inbox is always on. Add any active integration or channel on top of it.
        </div>
      </div>

      {/* ── Inbox — always on ──────────────────────────────── */}
      <div className="dst-locked-row">
        <Lock size={13} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
        <div className="dst-locked-body">
          <span className="dst-locked-name">Inbox — AIMS</span>
          <span className="dst-locked-sub">Every item lands in the agent's Inbox. Cannot be disabled.</span>
        </div>
        <span className="dst-locked-badge">Always on</span>
      </div>

      {/* ── Active integrations ────────────────────────────── */}
      <div className="pb-section-label" style={{ marginTop: 20 }}>Active Integrations</div>
      <div className="dst-toggle-list">
        {integrations.map(int => {
          const on  = !!intToggles[int.id]
          const err = int.status === 'error'
          return (
            <div key={int.id} className={`dst-toggle-row${on ? ' dst-toggle-row--on' : ''}${err ? ' dst-toggle-row--err' : ''}`}>
              <Toggle on={on && !err} onChange={() => !err && toggleInt(int.id)} />
              <div className="dst-toggle-body">
                <span className="dst-toggle-name">{int.name}</span>
                <span className="dst-toggle-meta">{int.type} · Last sync {fmtSync(int.lastSync)}</span>
              </div>
              {err ? (
                <div className="dst-badge-err">
                  <span>Error</span>
                  <a href="/aims-htl/settings/integrations" target="_blank" rel="noopener" className="av-link" style={{ marginLeft: 6, fontSize: 11 }}>Fix →</a>
                </div>
              ) : (
                <span className="dst-badge-ok">Connected ✓</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="dst-manage-link">
        Don't see an integration?{' '}
        <a href="/aims-htl/settings/integrations" target="_blank" rel="noopener" className="av-link">Manage integrations →</a>
      </div>

      {/* ── Lightweight channels ──────────────────────────── */}
      <div className="pb-section-label" style={{ marginTop: 20 }}>Lightweight Channels</div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
        Deliver a message directly via these channels. Recipients don't need to log into AIMS.
      </div>
      <div className="dst-toggle-list">
        {lightweightChannels.map(ch => {
          const on = !!chanToggles[ch.id]
          return (
            <div key={ch.id} className={`dst-toggle-row${on ? ' dst-toggle-row--on' : ''}`}>
              <Toggle on={on} onChange={() => toggleChan(ch.id)} />
              <div className="dst-toggle-body">
                <span className="dst-toggle-name">{ch.name}</span>
                <span className="dst-toggle-meta">{ch.activePacks > 0 ? `${ch.activePacks} packs active` : '—'}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="dst-manage-link">
        Don't see a channel?{' '}
        <a href="/aims-htl/settings/channels" target="_blank" rel="noopener" className="av-link">Manage channels →</a>
      </div>

      {/* ── Notifications (absorbed) ──────────────────────── */}
      <div className="rr-divider"><span>NOTIFICATIONS</span></div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
        Choose which events alert the assigned agent, and through which channels.
      </div>

      {/* Event toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {NOTIF_EVENTS.map(({ key, label, hint, Icon }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--bg-row)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Icon size={14} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>
              </div>
            </div>
            <Toggle on={notifOn[key]} onChange={() => toggleNotifEv(key)} />
          </div>
        ))}
      </div>

      {/* Channel toggles */}
      <div className="pb-section-label">Deliver via</div>
      <div className="pb-2col" style={{ marginBottom: 12 }}>
        {NOTIF_CHANNELS.map(ch => {
          const on = notifCh[ch.key]
          return (
            <div key={ch.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: on ? 'var(--accent-teal-dim)' : 'var(--bg-row)',
              border: `1px solid ${on ? 'var(--accent-teal-border)' : 'var(--border)'}`,
              borderRadius: 8, transition: 'background 0.15s, border-color 0.15s',
            }}>
              <span style={{ fontSize: 13, fontWeight: on ? 500 : 400, color: on ? 'var(--text-primary)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                {ch.label}
                {on && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-teal)', background: 'var(--accent-teal-dim)', border: '1px solid var(--accent-teal-border)', borderRadius: 10, padding: '1px 6px' }}>✓ ON</span>}
              </span>
              <Toggle on={on} onChange={() => toggleNotifCh(ch.key)} />
            </div>
          )
        })}
      </div>

      {/* Live echo */}
      {activeCh.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span>Notifications will be sent via:</span>
          {activeCh.map(c => (
            <span key={c} style={{ padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)', border: '1px solid var(--accent-teal-border)' }}>{c}</span>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-amber)' }}>
          <AlertTriangle size={12} />
          No channels selected — agents won't be notified.
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

// ── Composer live preview mock ─────────────────────────────────────────────
function ComposerPreview({ scope }) {
  const MOCK_REPLY = {
    Standard: "Hi Maria,\n\nI've reviewed your account and I can see the payment has been failing at the 3DS step. I'm going to resolve this manually right now and ensure your service continues without interruption.",
    Full:     "Hi Maria,\n\nI've reviewed your account and I can see the recurring error (422 — 3DS timeout). I'll manually update your payment method via the admin panel and apply a 1-month service credit as a goodwill gesture for the inconvenience.\n\nYou should be all set within 5 minutes.",
  }

  return (
    <div className="cs-preview" key={scope}>
      {/* Header */}
      <div className="cs-preview-hdr">
        <span className="cs-preview-title">AI Composer</span>
        <span className="cs-preview-badge">Live Preview</span>
      </div>

      {/* Disabled */}
      {scope === 'None' && (
        <div className="cs-disabled">
          <div className="cs-disabled-icon">🚫</div>
          <div className="cs-disabled-title">Composer disabled</div>
          <div className="cs-disabled-sub">
            Agents handle items from this Pack without any AI suggestions or reply drafts.
          </div>
        </div>
      )}

      {/* Context strip (all scopes except None) */}
      {scope !== 'None' && (
        <>
          <div className="cs-ctx">
            <div className="cs-ctx-name">Maria Chen</div>
            <div className="cs-ctx-issue">Payment processing error — 4 failed attempts</div>
          </div>

          {/* Minimal — approve/reject only */}
          {scope === 'Minimal' && (
            <div className="cs-section">
              <div className="cs-label">Action required</div>
              <div className="cs-approve-row">
                <span className="cs-approve-btn cs-approve-btn--yes">✓ Approve</span>
                <span className="cs-approve-btn cs-approve-btn--no">✗ Reject</span>
              </div>
              <div className="cs-muted-note">No reply drafts at this scope level.</div>
            </div>
          )}

          {/* Suggested reply — Standard + Full */}
          {(scope === 'Standard' || scope === 'Full') && (
            <div className="cs-section">
              <div className="cs-label">Suggested reply</div>
              <div className="cs-reply-block">
                <div className="cs-reply-text">{MOCK_REPLY[scope]}</div>
              </div>
              <div className="cs-reply-btns">
                <span className="cs-btn cs-btn--primary">Use reply</span>
                <span className="cs-btn cs-btn--ghost">Edit</span>
              </div>
            </div>
          )}

          {/* Next step — Full only */}
          {scope === 'Full' && (
            <div className="cs-section">
              <div className="cs-label">Next step</div>
              <div className="cs-nextstep">
                {[
                  { color: 'var(--accent-blue)',  text: 'Update payment method via admin panel' },
                  { color: 'var(--accent-teal)',  text: 'Apply 1-month service credit ($350)' },
                  { color: 'var(--accent-amber)', text: 'Log error 422 to engineering backlog' },
                ].map(({ color, text }) => (
                  <div key={text} className="cs-ns-row">
                    <span className="cs-ns-dot" style={{ background: color }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRM notes — Full only */}
          {scope === 'Full' && (
            <div className="cs-section">
              <div className="cs-label">CRM notes (auto-filled)</div>
              <div className="cs-crm">
                <div className="cs-crm-row">Escalation: Payment error 422 — 3DS timeout</div>
                <div className="cs-crm-row">Action: Manual payment update via admin</div>
                <div className="cs-crm-row">Credit applied: 1 month ($350 goodwill)</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="cs-section">
            <div className="cs-label">Actions</div>
            <div className="cs-actions">
              <span className="cs-action-chip">Close conversation</span>
              {scope === 'Full' && <>
                <span className="cs-action-chip">Escalate</span>
                <span className="cs-action-chip">Reassign</span>
              </>}
            </div>
          </div>

          {/* Macros — Full only */}
          {scope === 'Full' && (
            <div className="cs-section">
              <div className="cs-label">Macros</div>
              <div className="cs-macros">
                {['Apologize & Escalate', 'Express Empathy', 'Close & CSAT'].map(m => (
                  <span key={m} className="cs-macro-chip">{m}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Step6ComposerScope({ draft, update }) {
  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Composer Scope</div>
        <div className="pb-step-desc">
          Controls what the AI Composer suggests to the human agent while they work this item.
        </div>
      </div>

      <div className="cs-layout">
        {/* Left: option cards + banners */}
        <div className="cs-left">
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

        {/* Right: live preview panel */}
        <ComposerPreview key={draft.composerScope} scope={draft.composerScope} />
      </div>
    </div>
  )
}

// ─── Step 7: Macros ───────────────────────────────────────────────────────────
function Step7Macros() {
  const [tab,        setTab]        = useState('attached')
  const [macros,     setMacros]     = useState(MOCK_MACROS)
  const [selectedId, setSelectedId] = useState(null)
  const [bannerDone, setBannerDone] = useState(false)

  const toggleMacro   = id => setMacros(ms => ms.map(m => m.id === id ? { ...m, attached: !m.attached } : m))
  const attachedCount = macros.filter(m => m.attached).length
  const visible       = tab === 'attached' ? macros.filter(m => m.attached) : macros
  const selected      = macros.find(m => m.id === selectedId) ?? null

  const tabs = [
    { id: 'attached', label: 'Active for this Pack',   count: attachedCount },
    { id: 'all',      label: 'All available macros',   count: macros.length },
  ]

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="pb-step-header">
        <div className="pb-step-title">Shortcuts for your team</div>
        <div className="pb-step-desc">
          Macros are pre-written replies and actions your team can use with one click when working
          items from this Pack. Attach the relevant ones — they appear in the AI Composer
          suggestions panel when an agent opens an item.
        </div>

        {/* Inline flow diagram */}
        <div className="macro-flow">
          {[
            'Agent opens item',
            'Composer suggests "Apologize & Escalate"',
            'Agent clicks → reply inserted',
          ].map((node, i, arr) => (
            <span key={i} className="macro-flow-step">
              <span className="macro-flow-node">{node}</span>
              {i < arr.length - 1 && <span className="macro-flow-arrow">›</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Info banner ──────────────────────────────────────── */}
      {!bannerDone && (
        <div className="macro-banner">
          <span className="macro-banner-icon">💡</span>
          <div className="macro-banner-txt">
            Attached macros appear as suggestions in the AI Composer when agents handle items from
            this Pack. Agents insert them with one click — they don't fire automatically. Attach as
            many as you want.
          </div>
          <button className="macro-banner-dismiss" onClick={() => setBannerDone(true)}>
            Got it — hide this
          </button>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="macro-tabs">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`macro-tab${tab === t.id ? ' macro-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="macro-tab-count">{t.count}</span>
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="macro-table">
        {tab === 'attached' && visible.length === 0 ? (
          <div className="macro-empty">
            <div className="macro-empty-icon"><MessageSquare size={28} /></div>
            <div className="macro-empty-title">No macros attached yet</div>
            <div className="macro-empty-sub">
              Switch to "All available macros" to attach the ones your team will find useful.
            </div>
            <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => setTab('all')}>
              Browse macros
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="macro-row macro-row--hdr">
              <span>Name</span>
              <span>Trigger phrase</span>
              <span>Category</span>
              <span>Scope</span>
              <span>Active for this Pack</span>
              <span />
            </div>
            {/* Rows + inline expand */}
            {visible.map(m => (
              <div key={m.id}>
                <div
                  className={`macro-row${m.attached ? ' macro-row--on' : ''}${selectedId === m.id ? ' macro-row--sel' : ''}`}
                  onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                >
                  <span className="macro-name">{m.name}</span>
                  <span className="macro-trigger">{m.trigger}</span>
                  <Badge label={m.category} variant={m.category === 'replies' ? 'blue' : 'purple'} size="sm" />
                  <span className="macro-scope">{m.scope}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <Toggle on={m.attached} onChange={() => toggleMacro(m.id)} />
                  </div>
                  <button
                    className={`macro-eye-btn${selectedId === m.id ? ' macro-eye-btn--on' : ''}`}
                    title="Preview"
                    onClick={e => { e.stopPropagation(); setSelectedId(selectedId === m.id ? null : m.id) }}
                  >
                    <Eye size={13} />
                  </button>
                </div>

                {/* Inline expand panel */}
                <div className={`macro-expand${selectedId === m.id ? ' macro-expand--open' : ''}`}>
                  <div className="macro-expand-inner">
                    <div className="macro-expand-body">
                      <div className="macro-expand-badges">
                        <span className="macro-pv-badge">{m.trigger}</span>
                        <Badge label={m.category} variant={m.category === 'replies' ? 'blue' : 'purple'} size="sm" />
                        <Badge label={`Scope: ${m.scope}`} variant={m.scope === 'Full' ? 'teal' : 'amber'} size="sm" />
                      </div>
                      <div className="macro-expand-label">Template</div>
                      <pre className="macro-pv-template">{m.template}</pre>
                      <div className="macro-expand-footer">
                        <Toggle on={m.attached} onChange={() => toggleMacro(m.id)} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: m.attached ? 'var(--accent-teal)' : 'var(--text-tertiary)' }}>
                          {m.attached ? '✓ Active for this Pack' : 'Not attached'}
                        </span>
                        <button className="macro-expand-close" onClick={() => setSelectedId(null)}>
                          <X size={12} /> Collapse
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Step 8: Escalation Policy ────────────────────────────────────────────────
const ESCALATION_POLICIES = [
  {
    id: 'reassign',
    emoji: '🔄',
    title: 'Move it to the next agent automatically',
    desc: 'When time runs out, the item is reassigned to the next available person in the queue. The original agent no longer sees it.',
    consequence: 'the item will be automatically moved to the next available agent.',
  },
  {
    id: 'escalate-mgr',
    emoji: '👆',
    title: 'Flag it to the team manager',
    desc: 'After the SLA window expires, the item is flagged to the team lead. It stays with the original agent but the manager now sees it.',
    consequence: 'the team manager will be flagged and can see the overdue item.',
  },
  {
    id: 'hold-notify',
    emoji: '🔔',
    title: 'Keep it assigned, but alert everyone',
    desc: 'The item stays where it is. Both the agent and their supervisor get an alert. No reassignment — someone just gets nudged.',
    consequence: 'an alert will be sent to both the agent and their supervisor — no reassignment.',
  },
  {
    id: 'manual',
    emoji: '📋',
    title: 'Do nothing automatically — queue it for review',
    desc: 'No automatic action. The item is marked as breached and waits in the queue until someone manually picks it up. Choose this only if your team monitors the queue actively.',
    consequence: 'the item will be marked as breached and wait in the queue for manual pickup.',
  },
]

function Step8EscalationPolicy({ draft, update }) {
  const fmtSLA = m => m >= 1440 ? `${(m/1440).toFixed(1)}d` : m >= 60 ? `${(m/60).toFixed(1)}h` : `${m}m`
  const selected = ESCALATION_POLICIES.find(p => p.id === draft.escalationPolicy)

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">What happens automatically if nobody responds in time?</div>
        <div className="pb-step-desc">
          These rules fire on their own — no one needs to do anything. They protect your team from
          items going unanswered when the SLA clock runs out.
        </div>
      </div>

      {/* ── Timeline visualization ────────────────────────────── */}
      <div className="ep-timeline">
        <div className="ep-node ep-node--start">
          <div className="ep-node-icon">📥</div>
          <div className="ep-node-label">Item arrives</div>
        </div>
        <div className="ep-track">
          <div className="ep-track-label">SLA window · {fmtSLA(draft.slaMinutes)}</div>
          <div className="ep-track-bar">
            <div className="ep-track-fill" />
          </div>
        </div>
        <div className="ep-node ep-node--breach">
          <div className="ep-node-icon">⏰</div>
          <div className="ep-node-label">SLA breaches</div>
        </div>
        <div className="ep-track-arrow">›</div>
        <div className="ep-node ep-node--fires">
          <div className="ep-node-icon">⚡</div>
          <div className="ep-node-label">This fires automatically</div>
        </div>
      </div>

      {/* ── Policy cards ─────────────────────────────────────── */}
      <div className="ep-cards">
        {ESCALATION_POLICIES.map(p => {
          const sel = draft.escalationPolicy === p.id
          return (
            <div
              key={p.id}
              className={`ep-card${sel ? ' ep-card--selected' : ''}`}
              onClick={() => update('escalationPolicy', p.id)}
            >
              <div className="ep-card-top">
                <span className="ep-card-emoji">{p.emoji}</span>
                <div className={`ep-card-radio${sel ? ' ep-card-radio--on' : ''}`}>
                  {sel && <Check size={9} color="#fff" strokeWidth={3} />}
                </div>
              </div>
              <div className="ep-card-title">{p.title}</div>
              <div className="ep-card-desc">{p.desc}</div>
            </div>
          )
        })}
      </div>

      {/* ── Consequence preview ───────────────────────────────── */}
      {selected && (
        <div className="ep-consequence">
          <Info size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 1 }} />
          <span className="ep-consequence-txt">
            With this policy: if no agent acts on an item from this Pack within the configured
            SLA window, <strong>{selected.consequence}</strong>
          </span>
        </div>
      )}

      {/* ── Additional options ────────────────────────────────── */}
      <div className="pb-section-label" style={{ marginTop: 24 }}>Additional behaviour</div>
      {[
        {
          key:   'requireAck',
          label: 'Start the SLA clock only after the agent accepts the item',
          hint:  'Useful when agents need time to review before the clock starts.',
        },
        {
          key:   'allowReassign',
          label: 'Let agents pass this item to a colleague themselves',
          hint:  'Agents can transfer without waiting for a manager.',
        },
      ].map(opt => (
        <div key={opt.key} className="ep-toggle-row">
          <div>
            <div className="ep-toggle-label">{opt.label}</div>
            <div className="ep-toggle-hint">{opt.hint}</div>
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
  const [channels, setChannels] = useState({ email: true, slack: false, inApp: true, sms: false })

  const toggleChannel = key =>
    setChannels(prev => ({ ...prev, [key]: !prev[key] }))

  const NOTIFS = [
    { key: 'notifyOnAssign',    label: 'On assignment',  hint: 'Notify the agent when an item is assigned to them',         Icon: Bell        },
    { key: 'notifyOnSlaBreach', label: 'On SLA breach',  hint: 'Alert agent and supervisor when the SLA window expires',    Icon: Clock       },
    { key: 'notifyOnResolve',   label: 'On resolution',  hint: 'Confirm to the originating agent when the item is closed',  Icon: CheckCircle },
  ]

  const CHANNEL_DEFS = [
    { key: 'email',  label: 'Email'   },
    { key: 'slack',  label: 'Slack'   },
    { key: 'inApp',  label: 'In-app'  },
    { key: 'sms',    label: 'SMS'     },
  ]

  const activeChannels = CHANNEL_DEFS.filter(c => channels[c.key])

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">Notifications</div>
        <div className="pb-step-desc">
          Configure which events trigger notifications, and which channels they're sent through.
        </div>
      </div>

      {/* ── Event toggles ─────────────────────────────────────── */}
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

      {/* ── Channel toggles ───────────────────────────────────── */}
      <div className="pb-section-label">Notification Channels</div>
      <div className="pb-2col" style={{ marginBottom: 12 }}>
        {CHANNEL_DEFS.map(ch => (
          <div
            key={ch.key}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: channels[ch.key] ? 'var(--accent-teal-dim)' : 'var(--bg-row)',
              border: `1px solid ${channels[ch.key] ? 'var(--accent-teal-border)' : 'var(--border)'}`,
              borderRadius: 8,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span style={{
              fontSize: 13,
              fontWeight: channels[ch.key] ? 500 : 400,
              color: channels[ch.key] ? 'var(--text-primary)' : 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              {ch.label}
              {channels[ch.key] && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--accent-teal)',
                  background: 'var(--accent-teal-dim)',
                  border: '1px solid var(--accent-teal-border)',
                  borderRadius: 10, padding: '1px 6px',
                }}>✓ ON</span>
              )}
            </span>
            <Toggle on={channels[ch.key]} onChange={() => toggleChannel(ch.key)} />
          </div>
        ))}
      </div>

      {/* ── Active channel summary ────────────────────────────── */}
      {activeChannels.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          <span>Notifications will be sent via:</span>
          {activeChannels.map(c => (
            <span key={c.key} style={{
              padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500,
              background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)',
              border: '1px solid var(--accent-teal-border)',
            }}>{c.label}</span>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-amber)', marginBottom: 8 }}>
          <AlertTriangle size={12} />
          No channels selected — agents won't receive notifications for this Pack.
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 24 }}>
        These channels apply to all notification types above.
      </div>
    </div>
  )
}

// ─── Step 11: SLA ─────────────────────────────────────────────────────────────
const SLA_ACTIONS = [
  { id: 'escalate_next',  label: 'Move to the next available agent' },
  { id: 'escalate_tier2', label: 'Move to Tier 2 Support' },
  { id: 'escalate_team',  label: 'Move to a specific team', needsInput: true },
  { id: 'notify_manager', label: 'Notify the team manager (item stays assigned)' },
  { id: 'mark_breached',  label: 'Do nothing — just mark as breached' },
  { id: 'notify_senior',  label: 'Notify senior management' },
]

const SLA_STAGE_COLORS = [
  'var(--accent-teal)',
  'var(--accent-amber)',
  'var(--accent-coral)',
  'var(--accent-purple)',
]

function Step11SLA({ draft, update }) {
  const hours = Math.floor(draft.slaMinutes / 60)
  const mins  = draft.slaMinutes % 60
  const setHours = h => update('slaMinutes', Math.max(0, parseInt(h) || 0) * 60 + mins)
  const setMins  = m => update('slaMinutes', hours * 60 + Math.min(59, Math.max(0, parseInt(m) || 0)))

  const [hasResTarget, setHasResTarget] = useState(false)
  const [resHours,     setResHours]     = useState(4)
  const [resMins_,     setResMins_]     = useState(0)

  const [stages, setStages] = useState([
    { id: 1, delayAmt: 0,  delayUnit: 'minutes', action: 'escalate_tier2', customTeam: '' },
    { id: 2, delayAmt: 30, delayUnit: 'minutes', action: 'notify_manager', customTeam: '' },
  ])

  const addStage    = () => setStages(p => [...p, { id: Date.now(), delayAmt: 60, delayUnit: 'minutes', action: 'notify_senior', customTeam: '' }])
  const removeStage = id => setStages(p => p.filter(s => s.id !== id))
  const updateStage = (id, key, val) => setStages(p => p.map(s => s.id === id ? { ...s, [key]: val } : s))

  const toMin  = s => s.delayUnit === 'hours' ? s.delayAmt * 60 : s.delayAmt
  const fmtMin = m => m >= 1440 ? `${(m/1440).toFixed(1)}d` : m >= 60 ? `${(m/60).toFixed(1)}h` : `${m}m`

  const humanWindow = totalMins => {
    if (totalMins === 0) return 'no time (immediate)'
    const h = Math.floor(totalMins / 60), m = totalMins % 60
    return [h > 0 && `${h} hour${h !== 1 ? 's' : ''}`, m > 0 && `${m} minute${m !== 1 ? 's' : ''}`]
      .filter(Boolean).join(' and ')
  }

  // Cumulative times for timeline
  const stageTimes = stages.reduce((acc, s, i) => {
    const cumMin = i === 0 ? draft.slaMinutes : acc[i - 1].cumMin + toMin(s)
    return [...acc, { ...s, cumMin }]
  }, [])

  const inputSty = { width: 64, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'DM Mono', textAlign: 'center' }

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-note">This step controls what happens automatically if the assigned agent doesn't respond in time.</div>
        <div className="pb-step-title">SLA Configuration</div>
        <div className="pb-step-desc">
          Set the time window and what happens automatically at each stage if the item isn't resolved.
        </div>
      </div>

      {/* ── Response Window ─────────────────────────────────────── */}
      <div className="pb-section-label">Response Window</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" value={hours} min={0} max={168} onChange={e => setHours(e.target.value)} style={inputSty} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>h</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" value={mins} min={0} max={59} onChange={e => setMins(e.target.value)} style={inputSty} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>min</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'DM Mono', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', borderRadius: 4, padding: '3px 8px' }}>
          = {fmtMin(draft.slaMinutes)}
        </span>
      </div>

      {/* Plain-language echo */}
      <div className="sla-echo">
        Agents have <strong>{humanWindow(draft.slaMinutes)}</strong> to respond to items from this Pack.
      </div>

      {/* Optional resolution target */}
      <label className="sla-res-toggle">
        <input type="checkbox" checked={hasResTarget} onChange={e => setHasResTarget(e.target.checked)} style={{ accentColor: 'var(--accent-blue)', marginRight: 6 }} />
        Set a resolution target (optional)
      </label>
      {hasResTarget && (
        <div className="sla-res-target">
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            How long can the full interaction take before it's considered overdue?
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={resHours} min={0} max={168} onChange={e => setResHours(Math.max(0, parseInt(e.target.value) || 0))} style={inputSty} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={resMins_} min={0} max={59} onChange={e => setResMins_(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))} style={inputSty} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>min</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--accent-purple)', fontFamily: 'DM Mono', background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple-border)', borderRadius: 4, padding: '3px 8px' }}>
              = {fmtMin(resHours * 60 + resMins_)}
            </span>
          </div>
        </div>
      )}

      {/* ── Escalation cadence ─────────────────────────────────── */}
      <div className="pb-section-label" style={{ marginTop: 28 }}>Escalation stages — what happens automatically over time</div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16, lineHeight: 1.5 }}>
        Build a chain of automatic actions. Each stage fires after the previous one hasn't resolved the item.
      </div>

      <div className="sla-stages">
        {stages.map((stage, i) => {
          const isFirst  = i === 0
          const isLast   = i === stages.length - 1
          const color    = SLA_STAGE_COLORS[Math.min(i, SLA_STAGE_COLORS.length - 1)]
          const actionOpt = SLA_ACTIONS.find(a => a.id === stage.action)
          return (
            <div key={stage.id} className="sla-stage">
              {!isLast && <div className="sla-stage-line" />}
              <div className="sla-stage-card">
                {/* Header */}
                <div className="sla-stage-hdr">
                  <div className="sla-stage-badge" style={{ background: color }}>
                    {i + 1}
                  </div>
                  <div className="sla-stage-hdr-txt">
                    {isFirst ? (
                      <span style={{ fontSize: 13 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>At SLA breach</strong>
                        <span style={{ color: 'var(--text-tertiary)' }}> — when the response window expires</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                        If still unresolved after
                        <input
                          type="number" value={stage.delayAmt} min={1} max={10080}
                          onChange={e => updateStage(stage.id, 'delayAmt', Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ ...inputSty, width: 52, fontSize: 13, padding: '4px 8px' }}
                        />
                        <select className="rt-sel rt-sel--sm" value={stage.delayUnit} onChange={e => updateStage(stage.id, 'delayUnit', e.target.value)}>
                          <option value="minutes">minutes</option>
                          <option value="hours">hours</option>
                        </select>
                        from Stage {i}:
                      </span>
                    )}
                  </div>
                  {!isFirst && (
                    <button className="sla-stage-rm" onClick={() => removeStage(stage.id)} title="Remove stage">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Action */}
                <div className="sla-stage-action">
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>Action:</span>
                  <select className="rt-sel" value={stage.action} onChange={e => updateStage(stage.id, 'action', e.target.value)} style={{ flex: 1 }}>
                    {SLA_ACTIONS
                      .filter(a => i > 0 || a.id !== 'notify_senior')
                      .map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  {actionOpt?.needsInput && (
                    <input className="trig-text-input trig-text-input--sm" placeholder="Team name…"
                      value={stage.customTeam} onChange={e => updateStage(stage.id, 'customTeam', e.target.value)} />
                  )}
                </div>

                {/* Final badge */}
                {isLast && stages.length > 1 && (
                  <div className="sla-stage-final">
                    ⚠ Final action — if this fires, the item is critically overdue
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <button className="sla-add-stage" onClick={addStage}>
          <Plus size={13} /> Add another stage
        </button>
      </div>

      {/* ── Live timeline preview ──────────────────────────────── */}
      <div className="sla-tl-preview">
        {/* Item arrives */}
        <div className="sla-tl-item">
          <div className="sla-tl-dot" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-tertiary)' }}>0:00</div>
          <div className="sla-tl-lbl">Item arrives</div>
        </div>
        {/* Stage nodes */}
        {stageTimes.map((s, i) => {
          const color = SLA_STAGE_COLORS[Math.min(i, SLA_STAGE_COLORS.length - 1)]
          return (
            <span key={s.id} style={{ display: 'contents' }}>
              <div className="sla-tl-track" style={{ background: color + '44' }} />
              <div className="sla-tl-item">
                <div className="sla-tl-dot" style={{ borderColor: color, background: color + '22', color }}>
                  {i === 0 ? fmtMin(s.cumMin) : `+${fmtMin(toMin(s))}`}
                </div>
                <div className="sla-tl-lbl" style={{ color }}>{i === 0 ? 'SLA window' : `Stage ${i + 1}`}</div>
              </div>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 12: Availability ────────────────────────────────────────────────────
const AV_OOO_OPTIONS = [
  {
    id:       'queue',
    label:    'Queue for the next available agent',
    sub:      'SLA clock pauses outside your coverage hours',
    srcNote:  'Uses default queue behavior',
  },
  {
    id:       'reroute',
    label:    'Re-route to your on-call team',
    sub:      'Uses the on-call rotation configured in OOO & Coverage',
    srcNote:  'Uses the on-call rotation configured in OOO & Coverage',
    warning:  'No on-call rotation set up yet.',
    warnPath: '/settings/ooo',
    warnCta:  'Set one up →',
  },
  {
    id:       'auto-ack',
    label:    'Send an automatic acknowledgment to the customer',
    sub:      'Uses the acknowledgment template from Settings → Templates',
    srcNote:  'Uses the acknowledgment template from Settings → Templates',
    warning:  'No acknowledgment template found.',
    warnPath: '/settings/templates',
    warnCta:  'Create one →',
  },
]

function Step12Availability({ draft, update, onSkip }) {
  return (
    <div>
      {/* ── Optional banner ──────────────────────────────────── */}
      <div className="av-skip-banner">
        <div className="av-skip-text">
          <strong>This step is optional.</strong> If you skip it, items from this Pack will route
          based on your default availability settings. Come back anytime to customise for this Pack.
        </div>
        <button className="av-skip-btn" onClick={onSkip}>
          Skip this step →
        </button>
      </div>

      <div className="pb-step-header">
        <div className="pb-step-title">Availability & Coverage</div>
        <div className="pb-step-desc">
          Define when human agents are available to handle items from this Pack. Out-of-hours items
          are queued or rerouted per your policy.
        </div>
      </div>

      {/* ── Coverage zone + hours ────────────────────────────── */}
      <div className="pb-2col" style={{ marginBottom: 24 }}>
        <div>
          <div className="pb-section-label">Where is your team based?</div>
          <Select
            value={draft.coverageZone}
            onChange={e => update('coverageZone', e.target.value)}
            options={['US-East', 'US-West', 'EU-Central', 'AP-Southeast', 'Global 24/7'].map(z => ({ value: z, label: z }))}
          />
        </div>
        <div>
          <div className="pb-section-label">When are they available?</div>
          <Select
            value={draft.coverageHours}
            onChange={e => update('coverageHours', e.target.value)}
            options={['06:00–18:00', '08:00–20:00', '09:00–18:00', '09:00–17:00', '24/7'].map(h => ({ value: h, label: h }))}
          />
        </div>
      </div>

      {/* ── OOO handling ─────────────────────────────────────── */}
      <div className="pb-section-label">Out-of-Hours Handling</div>
      <div className="av-ooo-source">
        These options use the OOO rules your admin team has already set up in{' '}
        <strong>Settings → OOO & Coverage</strong>. If you need to create new coverage rules first,{' '}
        <a
          href="/aims-htl/settings/ooo"
          target="_blank"
          rel="noopener noreferrer"
          className="av-link"
        >
          open OOO settings ↗
        </a>
      </div>

      {AV_OOO_OPTIONS.map(opt => (
        <div
          key={opt.id}
          className={`policy-option${draft.oooHandling === opt.id ? ' policy-option--selected' : ''}`}
          onClick={() => update('oooHandling', opt.id)}
        >
          <div style={{ flex: 1 }}>
            <div className="policy-option-name">{opt.label}</div>
            <div className="policy-option-meta">{opt.srcNote}</div>
            {opt.warning && draft.oooHandling === opt.id && (
              <div className="av-ooo-warning">
                <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                {opt.warning}{' '}
                <a
                  href={`/aims-htl${opt.warnPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="av-link"
                  onClick={e => e.stopPropagation()}
                >
                  {opt.warnCta}
                </a>
              </div>
            )}
          </div>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${draft.oooHandling === opt.id ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
            background: draft.oooHandling === opt.id ? 'var(--accent-blue)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
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
  const [selected, setSelected] = useState(draft.triggers[0]?.label ?? draft.triggers[0]?.value ?? '')
  const [simulated, setSimulated] = useState(false)
  const [techOpen, setTechOpen]   = useState(false)

  const fmtSLA = m => m >= 1440 ? `${(m / 1440).toFixed(1)}d` : m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`

  const STORY_STEPS = [
    { icon: '✅', text: `Pack fires — ${draft.name}` },
    { icon: '📦', text: 'Handoff packet assembled — Summary, AI Reasoning, Suggested Action' },
    { icon: '📬', text: `Routed to: ${draft.fallbackChain?.[0] ?? 'Tier 1 Support'}` },
    { icon: '⏱',  text: `SLA timer starts: ${fmtSLA(draft.slaMinutes)}` },
    { icon: '👤', text: 'Agent opens item in Inbox' },
    { icon: '🤖', text: `Composer Assistant available — ${draft.composerScope} scope` },
  ]

  return (
    <div>
      <div className="pb-step-header">
        <div className="pb-step-title">See it in action</div>
        <div className="pb-step-desc">
          Run a simulation to preview exactly what your team will see when this Pack fires.
        </div>
      </div>

      <div className="pb-section-label">Simulate a Trigger</div>

      {draft.triggers.length === 0 ? (
        <div style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card-elevated)', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
            You haven't configured any triggers yet.
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', cursor: 'default', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Go back to Step 2 to add triggers
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <Select
              value={selected}
              onChange={e => { setSelected(e.target.value); setSimulated(false) }}
              options={draft.triggers.map(t => ({ value: t.label || t.value, label: t.label || t.value }))}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Zap}
            onClick={() => setSimulated(true)}
          >
            ▶ Preview what happens
          </Button>
        </div>
      )}

      {simulated ? (
        <div>
          <div className="pb-banner pb-banner--success">
            <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Pack fired successfully. The preview below shows what the agent will see in their inbox.</span>
          </div>

          <div
            className="sim-story-card"
            style={{
              border: '1px solid var(--accent-teal-border)',
              borderLeft: '3px solid var(--accent-teal)',
              background: 'var(--bg-card)',
            }}
          >
            {/* Header row */}
            <div className="sim-story-hdr">
              <div className="sim-story-hdr-left">
                <span className="sim-story-hdr-name">{draft.name}</span>
                <Badge label={draft.pattern} variant={draft.pattern === 'Handoff' ? 'purple' : 'teal'} size="sm" />
              </div>
              <Badge label="Simulated" variant="amber" size="sm" />
            </div>

            {/* Story paragraph */}
            <div className="sim-story-para" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              A customer reached out and triggered this Pack. The AI reviewed the conversation and decided to hand off because confidence fell below the threshold. Your team will see this item in their Inbox, labeled as <strong>{draft.name}</strong>, with a <strong>{fmtSLA(draft.slaMinutes)}</strong> SLA timer running.
            </div>

            {/* Three preview tiles */}
            <div className="sim-tiles">
              <div className="sim-tile">
                <div className="sim-tile-emoji">💬</div>
                <div className="sim-tile-label">The situation</div>
                <div className="sim-tile-value">Customer escalated after payment method failed during 3DS verification. Conversation paused — awaiting agent.</div>
              </div>
              <div className="sim-tile">
                <div className="sim-tile-emoji">🤖</div>
                <div className="sim-tile-label">Why it was handed off</div>
                <div className="sim-tile-value">AI confidence dropped below threshold after 3 unresolved turns. Escalation keywords detected.</div>
              </div>
              <div className="sim-tile">
                <div className="sim-tile-emoji">✅</div>
                <div className="sim-tile-label">Suggested first step</div>
                <div className="sim-tile-value">Review account and offer to manually update payment details via admin panel.</div>
              </div>
            </div>

            {/* What happens next */}
            <div className="sim-timeline-label">What happens next</div>
            <div className="sim-timeline">
              {STORY_STEPS.map((s, i) => (
                <div key={i} className="sim-step">
                  <div className="sim-step-num">{i + 1}</div>
                  <span className="sim-step-icon">{s.icon}</span>
                  <span className="sim-step-text">{s.text}</span>
                </div>
              ))}
            </div>

            {/* Technical details accordion */}
            <button className="sim-tech-toggle" onClick={() => setTechOpen(o => !o)}>
              Technical details
              {techOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {techOpen && (
              <div className="sim-tech-body">
                <div>Trigger matched: {selected}</div>
                <div>{"Context payload: { channel: 'web-chat', session: 's-8f2a', customer: 'pro' }"}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '40px 24px', border: '1px dashed var(--border)', borderRadius: 10, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          Select a trigger above and click 'Preview what happens' to see a realistic simulation.
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
        ? draft.triggers.map((t, i) => [`Trigger ${i + 1}`, t.label || t.value])
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
function generatePackSummary(pack) {
  const trigger = pack.triggerSummary || 'a condition is met'
  const recipient = pack.primaryRecipient || 'the assigned team'
  const destination = pack.destinationLabel || pack.destination || 'Inbox'
  const fmtSLA = m => {
    if (!m) return null
    if (m >= 1440) return `${Math.floor(m / 1440)}d`
    if (m >= 60)   return `${Math.floor(m / 60)}h`
    return `${m}m`
  }
  const slaLabel = pack.slaLabel || (pack.slaMinutes ? fmtSLA(pack.slaMinutes) : null) || 'the configured time'
  const continuationNote = pack.pattern === 'Continuation'
    ? 'The AI pauses and waits for approval.'
    : 'The AI steps back and the agent owns it from here.'
  return `When ${trigger}, this Pack routes items to ${recipient} via ${destination}. Agents have ${slaLabel} to respond. ${continuationNote}`
}

function getAttentionBanners(pack) {
  const candidates = []

  if (pack.slaBreachRate > 15) {
    candidates.push({
      level: 'coral',
      icon: '🔴',
      text: `SLA breach rate is ${pack.slaBreachRate}% this week — items timing out.`,
      cta: 'Review routing rules →',
      priority: 1,
    })
  }

  if (pack.connectorStatus === 'error') {
    const name = pack.connectorName || 'A connector'
    candidates.push({
      level: 'coral',
      icon: '🔴',
      text: `${name} has an error. Items may not be arriving.`,
      cta: 'Fix connector →',
      priority: 2,
    })
  }

  if (pack.hasOOOWithNoCoverage) {
    candidates.push({
      level: 'amber',
      icon: '🟡',
      text: 'A team member is OOO with no coverage. Items have no fallback.',
      cta: 'Assign coverage →',
      priority: 3,
    })
  }

  if (pack.trainMePendingReview > 5) {
    candidates.push({
      level: 'amber',
      icon: '🟡',
      text: `${pack.trainMePendingReview} Train Me submissions waiting for review.`,
      cta: 'Review corrections →',
      priority: 4,
    })
  }

  if (pack.attachedWorkflows === 0 && pack.status === 'Active') {
    candidates.push({
      level: 'amber',
      icon: '🟡',
      text: 'Pack is Active but no workflows are using it.',
      cta: 'Go to Node Connection →',
      priority: 5,
    })
  }

  candidates.sort((a, b) => a.priority - b.priority)
  return candidates.slice(0, 2)
}

function OverviewTab({ draft, sourcePack, navigate, id }) {
  const pack = sourcePack ?? {}
  const attachedCount = networks.filter(n => n.htlPackId === sourcePack?.id).length

  const fmtSLA = m => {
    if (!m) return '—'
    if (m >= 1440) return `${Math.floor(m / 1440)}d`
    if (m >= 60)   return `${Math.floor(m / 60)}h`
    return `${m}m`
  }

  const relT = iso => {
    const diff = (new Date()).getTime() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const summary = generatePackSummary({ ...pack, ...draft })
  const banners = getAttentionBanners({ ...pack, attachedWorkflows: pack.attachedWorkflows ?? attachedCount })

  const slaDisplay = fmtSLA(draft.slaMinutes)

  const perfCards = [
    {
      label: 'Open items',
      value: String(pack.openItems ?? 0),
      delta: pack.openItemsDelta ?? '—',
      tint: (pack.openItems ?? 0) > 20 ? 'coral' : 'neutral',
    },
    {
      label: 'SLA compliance',
      value: pack.slaComplianceRate != null ? `${pack.slaComplianceRate}%` : '—',
      delta: pack.slaComplianceDelta ?? '—',
      tint: (pack.slaComplianceRate ?? 100) >= 90 ? 'green' : (pack.slaComplianceRate ?? 100) >= 75 ? 'amber' : 'coral',
    },
    {
      label: 'Avg handle time',
      value: pack.avgHandleMinutes != null ? fmtSLA(pack.avgHandleMinutes) : '—',
      delta: pack.avgHandleDelta ?? '—',
      tint: 'neutral',
    },
    {
      label: 'Items this week',
      value: String(pack.itemsThisWeek ?? 0),
      delta: pack.itemsThisWeekDelta ?? '—',
      tint: 'neutral',
    },
    {
      label: 'Train Me rate',
      value: pack.trainMeRate != null ? `${pack.trainMeRate}%` : '—',
      delta: pack.trainMeRateDelta ?? '—',
      tint: (pack.trainMeRate ?? 0) > 10 ? 'amber' : 'green',
    },
  ]

  const TINT_STYLES = {
    green:   'var(--accent-teal-dim)',
    amber:   'var(--accent-amber-dim)',
    coral:   'var(--accent-coral-dim)',
    neutral: 'var(--bg-card)',
  }

  const TINT_VALUE_COLORS = {
    green:   'var(--accent-teal)',
    amber:   'var(--accent-amber)',
    coral:   'var(--accent-coral)',
    neutral: 'var(--text-primary)',
  }

  const configRows = [
    ['Pattern',           draft.pattern],
    ['Status',            draft.status],
    ['Version',           draft.version],
    ['Destination',       draft.destination],
    ['SLA',               slaDisplay],
    ['Sensitive Signals', draft.sensitiveSignalEnabled ? 'Enabled' : 'Disabled'],
    ['Composer Scope',    draft.composerScope || '—'],
    ['Escalation Policy', draft.escalationPolicy || '—'],
  ]

  const activity = pack.recentActivity ?? []
  const attachedNets = networks.filter(n => n.htlPackId === sourcePack?.id).slice(0, 3)

  return (
    <div className="pb-overview">

      {/* A. Identity card */}
      <div className="pb-ov-identity">
        <div className="pb-ov-identity-left">
          <div className={`pack-icon pack-icon--${(draft.pattern || 'handoff').toLowerCase()}`} style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0 }}>
            {draft.pattern === 'Handoff' ? <GitBranch size={18} /> : <RefreshCw size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne', color: 'var(--text-primary)', marginBottom: 4 }}>{draft.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {draft.description || 'No description provided.'}
            </div>
          </div>
        </div>
        <div className="pb-ov-identity-right">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            What this Pack does
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 12 }}>
            {summary}
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate(`/configure/packs/${id}/edit`)}>
            Edit Pack
          </Button>
        </div>
      </div>

      {/* B. Attention banners */}
      {banners.map((b, i) => (
        <div key={i} className={`pb-ov-banner pb-ov-banner--${b.level}`}>
          <span className="pb-ov-banner-icon">{b.icon}</span>
          <span className="pb-ov-banner-text">{b.text}</span>
          <button className="pb-ov-banner-cta">{b.cta}</button>
        </div>
      ))}

      {/* C. Performance strip */}
      <div className="pb-ov-perf">
        {perfCards.map(card => (
          <div
            key={card.label}
            className="pb-ov-perf-card"
            style={{ background: TINT_STYLES[card.tint] }}
          >
            <div className="pb-ov-perf-label">{card.label}</div>
            <div className="pb-ov-perf-value" style={{ color: TINT_VALUE_COLORS[card.tint] }}>{card.value}</div>
            <div className="pb-ov-perf-delta">{card.delta}</div>
          </div>
        ))}
      </div>

      {/* D. Activity feed */}
      <div className="pb-ov-section">
        <div className="pb-ov-section-hdr">
          <span className="pb-ov-section-title">Recent activity</span>
        </div>
        {activity.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '16px 0' }}>No recent activity.</div>
        ) : (
          activity.map((item, i) => (
            <div key={i} className={`pb-ov-feed-row${i % 2 === 1 ? ' pb-ov-feed-row--alt' : ''}`}>
              <span className="pb-ov-feed-icon">{item.icon ?? '•'}</span>
              <span className="pb-ov-feed-text">{item.text}</span>
              <span className="pb-ov-feed-time">{item.time ? relT(item.time) : item.timeLabel ?? ''}</span>
            </div>
          ))
        )}
        <div style={{ paddingTop: 10 }}>
          <button style={{ fontSize: 12, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            View full activity log →
          </button>
        </div>
      </div>

      {/* E. Config summary */}
      <div className="pb-ov-section">
        <div className="pb-ov-section-hdr">
          <span className="pb-ov-section-title">Configuration</span>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/configure/packs/${id}/edit`)}>Edit</Button>
        </div>
        <div className="pb-ov-config">
          {configRows.map(([k, v]) => (
            <div key={k} className="pb-ov-config-row">
              <span className="pb-ov-config-key">{k}</span>
              <span className="pb-ov-config-val">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* F. Attached workflows */}
      <div className="pb-ov-section">
        <div className="pb-ov-section-hdr">
          <span className="pb-ov-section-title">Attached workflows</span>
          <button
            style={{ fontSize: 12, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => navigate(`/configure/packs/${id}/workflows`)}
          >
            See all {attachedCount} →
          </button>
        </div>
        {attachedNets.length === 0 ? (
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No workflows are attached to this Pack yet.</div>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/configure/packs/${id}/workflows`)}>
              Go to Node Connection
            </Button>
          </div>
        ) : (
          <div className="pb-ov-wf-list">
            {attachedNets.map(net => (
              <div key={net.id} className="pb-ov-wf-row">
                <span className="pb-ov-wf-dot" />
                <span className="pb-ov-wf-name">{net.name}</span>
                <span className="pb-ov-wf-studio">{net.studio}</span>
                <span className="pb-ov-wf-stats">{net.activeNodes} nodes · {net.triggerCount30d?.toLocaleString() ?? 0} items 30d</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Workflows tab ────────────────────────────────────────────────────────────
function WorkflowsTab({ sourcePack }) {
  const canConnect = true

  const initialWfIds = packWorkflowBindings[sourcePack?.id ?? ""] ?? []
  const [connectedWorkflows, setConnectedWorkflows] = useState(new Set(initialWfIds))
  const [pinned,          setPinned]          = useState({})
  const [showWfPicker,    setShowWfPicker]    = useState(false)
  const [connectedAgents, setConnectedAgents] = useState(
    new Set(packAgentBindings[sourcePack?.id] ?? [])
  )
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [agentSearch,     setAgentSearch]     = useState('')

  function relT(iso) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const TABLE_COLS = '1fr 120px 56px 80px 68px 130px 70px'

  const visibleWorkflows = networks.filter(n => connectedWorkflows.has(n.id))

  const sections = [
    {
      key:     'workflows',
      title:   'Connected Workflows',
      sub:     'Agentic workflows that trigger this Pack at a HITL node',
      btnLabel:'Attach workflow',
      showPicker: showWfPicker,
      openPicker: () => setShowWfPicker(true),
      closePicker:() => setShowWfPicker(false),
      cols:    TABLE_COLS,
      hdrCells:['Workflow / Studio', 'Binding Node', 'Version', 'Last Triggered', 'Items 30d', 'Pin Version', ''],
      rows:    visibleWorkflows,
      emptyText: 'No workflows attached.',
      renderRow: (net) => (
        <div key={net.id} className="wt-row" style={{ gridTemplateColumns: TABLE_COLS }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{net.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{net.studio}</div>
          </div>
          <div>
            <code style={{ fontSize: 11, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--accent-purple)', fontFamily: 'DM Mono' }}>
              {net.bindingNode}
            </code>
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {sourcePack?.version ?? '—'}
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {relT(net.lastTriggered)}
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            {net.triggerCount30d?.toLocaleString() ?? 0}
          </div>
          <div>
            <Toggle on={!!pinned[net.id]} onChange={v => setPinned(p => ({ ...p, [net.id]: v }))} />
          </div>
          <div>
            <button className="wt-detach-btn" onClick={() => setConnectedWorkflows(s => { const n = new Set(s); n.delete(net.id); return n })}>
              Detach
            </button>
          </div>
        </div>
      ),
      pickerContent: (
        <div className="wt-picker">
          <div className="wt-picker-label">Attach a workflow</div>
          {networks
            .filter(n => !connectedWorkflows.has(n.id))
            .map(n => (
              <div
                key={n.id}
                className="wt-picker-row"
                onClick={() => {
                  setConnectedWorkflows(s => new Set([...s, n.id]))
                  setShowWfPicker(false)
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{n.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{n.studio}</span>
              </div>
            ))}
        </div>
      ),
    },
    {
      key:     'agents',
      title:   'Connected AI Agents',
      sub:     'Agents that run alongside this Pack — enriching data, drafting content, or writing back to systems',
      btnLabel:'Connect agent',
      showPicker: showAgentPicker,
      openPicker: () => setShowAgentPicker(true),
      closePicker:() => { setShowAgentPicker(false); setAgentSearch('') },
      cols:    TABLE_COLS,
      hdrCells:['Agent / Studio', 'Model', 'Owner', 'Last Run', 'Runs 30d', 'Capabilities', ''],
      rows:    agents.filter(a => connectedAgents.has(a.id)),
      emptyText: 'No agents connected.',
      renderRow: (agent) => (
        <div key={agent.id} className="wt-row" style={{ gridTemplateColumns: TABLE_COLS }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{agent.studio}</div>
          </div>
          <div>
            <code style={{ fontSize: 11, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--accent-blue)', fontFamily: 'DM Mono' }}>
              {agent.model}
            </code>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{agent.owner}</div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {relT(agent.lastRun)}
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            {agent.runs30d?.toLocaleString() ?? 0}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(agent.capabilities ?? []).map(cap => (
              <span key={cap} style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-purple)', background: 'var(--accent-purple-dim)', border: '1px solid var(--accent-purple-border)', borderRadius: 10, padding: '1px 7px' }}>
                {cap}
              </span>
            ))}
          </div>
          <div>
            <button className="wt-detach-btn" onClick={() => setConnectedAgents(s => { const next = new Set(s); next.delete(agent.id); return next })}>
              Disconnect
            </button>
          </div>
        </div>
      ),
      pickerContent: (
        <div className="wt-picker">
          <div className="wt-picker-label">Connect an agent</div>
          <input
            className="wt-picker-search"
            placeholder="Search agents…"
            value={agentSearch}
            onChange={e => setAgentSearch(e.target.value)}
          />
          {agents
            .filter(a => !connectedAgents.has(a.id))
            .filter(a => !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()))
            .map(a => (
              <div
                key={a.id}
                className="wt-picker-row"
                onClick={() => {
                  setConnectedAgents(s => new Set([...s, a.id]))
                  setShowAgentPicker(false)
                  setAgentSearch('')
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{a.studio}</span>
              </div>
            ))}
        </div>
      ),
    },
  ]

  return (
    <div>
      {visibleWorkflows.length > 0 && (
        <div className="pb-banner pb-banner--warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Blast radius:</strong> {visibleWorkflows.length} active workflow{visibleWorkflows.length !== 1 ? 's' : ''} use this pack.
            Publishing a new version will immediately apply to all unversioned attachments.
          </span>
        </div>
      )}

      {sections.map(sec => (
        <div key={sec.key} className="wt-section">
          <div className="wt-section-hdr">
            <div>
              <div className="wt-section-title">{sec.title}</div>
              <div className="wt-section-sub">{sec.sub}</div>
            </div>
            {canConnect && (
              <button className="wt-attach-btn" onClick={sec.openPicker}>
                <Plus size={13} />
                {sec.btnLabel}
              </button>
            )}
          </div>

          {sec.showPicker && sec.pickerContent}

          {sec.rows.length === 0 ? (
            <div className="wt-empty">
              {sec.emptyText}{' '}
              {canConnect && (
                <button className="wt-empty-link" onClick={sec.openPicker}>
                  {sec.btnLabel}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="wt-table-hdr" style={{ gridTemplateColumns: sec.cols }}>
                {sec.hdrCells.map((cell, i) => (
                  <span key={i}>{cell}</span>
                ))}
              </div>
              {sec.rows.map(row => sec.renderRow(row))}
            </>
          )}
        </div>
      ))}
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
const VISIBLE_STEPS = STEPS.filter(s => !s.hidden)

function StepNav({ current, visited, onGoto, steps, showOptional, optionalCount, onToggleOptional }) {
  const navSteps = steps ?? VISIBLE_STEPS
  return (
    <div className="pb-nav">
      {/* Optional toggle */}
      <button className="pb-nav-opt-toggle" onClick={onToggleOptional}>
        <span className={`pb-nav-opt-track${showOptional ? ' pb-nav-opt-track--on' : ''}`}>
          <span className="pb-nav-opt-knob" />
        </span>
        <span className="pb-nav-opt-label">
          {showOptional ? 'All steps' : 'Core steps only'}
        </span>
        <span className={`pb-nav-opt-count${!showOptional ? ' pb-nav-opt-count--off' : ''}`}>
          {showOptional ? `${optionalCount} optional` : `+${optionalCount} hidden`}
        </span>
      </button>

      {navSteps.map((s, idx) => {
        const isActive   = current === s.id
        const isComplete = visited.has(s.id) && !isActive
        let cls = 'pb-nav-item'
        if (isActive)   cls += ' pb-nav-item--active'
        if (isComplete) cls += ' pb-nav-item--complete'
        return (
          <div key={s.id} className={cls} onClick={() => onGoto(s.id)}>
            <div className="pb-nav-node">
              {isComplete ? <Check size={10} strokeWidth={3} /> : idx + 1}
            </div>
            <div className="pb-nav-label-wrap">
              <span className="pb-nav-label">{s.label}</span>
              {s.note && <span className="pb-nav-note">{s.note}</span>}
            </div>
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

  const [draft,        setDraft]        = useState(() => initDraft(sourcePack))
  const [step,         setStep]         = useState(1)
  const [visited,      setVisited]      = useState(new Set([1]))
  const [toast,        setToast]        = useState(null)
  const [showOptional, setShowOptional] = useState(true)

  // Steps visible in nav + respected by Back/Next
  const activeSteps = VISIBLE_STEPS.filter(s => showOptional || !s.note)
  const optionalCount = VISIBLE_STEPS.filter(s => !!s.note).length
  const isStepActive  = s => !s.hidden && (showOptional || !s.note)

  const update       = (key, val) => setDraft(d => ({ ...d, [key]: val }))
  const updatePacket = (key, val) => setDraft(d => ({ ...d, packetFields: { ...d.packetFields, [key]: val } }))

  const goTo = (n) => {
    setStep(n)
    setVisited(v => new Set([...v, n]))
  }

  const next = () => {
    const nxt = STEPS.find(s => s.id > step && isStepActive(s))
    if (nxt) goTo(nxt.id)
  }
  const prev = () => {
    const prv = [...STEPS].reverse().find(s => s.id < step && isStepActive(s))
    if (prv) goTo(prv.id)
  }

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
      case 1:  return <Step1Pattern          {...p} />
      case 2:  return <Step2Triggers         {...p} />
      case 3:  return <StepRoutingResponse   {...p} />
      case 4:  return <Step4Destination      {...p} />
      case 5:  return <Step5HandoffPacket    draft={draft} updatePacket={updatePacket} />
      case 6:  return <Step6ComposerScope    {...p} />
      case 7:  return <Step7Macros           />
      case 8:  return <Step9SensitiveSignals {...p} />
      case 9:  return <Step10Notifications   {...p} />
      case 10: return <Step12Availability    {...p} onSkip={() => goTo(11)} />
      case 11: return <Step13Jurisdiction    />
      case 12: return <Step14TestPreview     draft={draft} />
      case 13: return <Step15Review          draft={draft} />
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
          <StepNav
            current={step}
            visited={visited}
            onGoto={goTo}
            steps={activeSteps}
            showOptional={showOptional}
            optionalCount={optionalCount}
            onToggleOptional={() => setShowOptional(s => !s)}
          />

          <div className="pb-content">
            {renderStep()}

            <div className="pb-footer">
              <Button variant="secondary" size="sm" onClick={() => navigate('/configure/packs')}>
                Cancel
              </Button>
              <div className="pb-footer-spacer" />
              <span className="pb-step-count">{activeSteps.findIndex(s => s.id === step) + 1 || '—'} / {activeSteps.length}</span>
              {step > 1 && (
                <Button variant="secondary" size="sm" onClick={prev}>Back</Button>
              )}
              {activeSteps[activeSteps.length - 1]?.id !== step ? (
                <Button
                  variant="primary" size="sm" onClick={next}
                  disabled={step === 2 && draft.triggers.length === 0}
                >Next</Button>
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
