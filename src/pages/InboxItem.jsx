import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock, AlertTriangle, CheckCircle, XCircle, ArrowUpRight,
  ChevronDown, ChevronRight, ChevronLeft, Shield,
  MessageSquare, Send, Zap, GraduationCap, ThumbsUp, User
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { inboxItems } from '../data/mockData.js'
import './InboxItem.css'

// ─── Static thread data ───────────────────────────────────────────────────────

const THREADS = {
  'htl-9901': [
    { id: 1, from: 'customer', name: 'Maria Chen', initials: 'MC', time: '14:02',
      text: "Hi, I've been trying to update my payment method for 4 days now and keep getting an error. This is really frustrating — I need this fixed urgently." },
    { id: 2, from: 'ai', name: 'AI Agent', time: '14:03',
      text: "Hi Maria, I'm sorry to hear you're experiencing this. I can see there's an error code 422 occurring during the 3DS verification step. Let me review your account and find the best path forward." },
    { id: 3, from: 'customer', name: 'Maria Chen', initials: 'MC', time: '14:05',
      text: "We have payroll going through next week and I'm worried about the account being suspended. We pay $4,200 a month for this and I'm seriously considering cancelling." },
    { id: 4, from: 'ai', name: 'AI Agent', time: '14:06',
      text: "I completely understand the urgency, Maria. Given your account tier and the multi-day friction you've experienced, I'm escalating this to a senior billing specialist who can bypass the 3DS step and fix this directly in our system. You'll hear from them within minutes." },
    { id: 5, from: 'handoff', time: '14:07',
      text: 'AI confidence fell below threshold (0.31) · Escalating to human · Pack: Customer Escalation — Tier 1' },
  ],
  'htl-9905': [
    { id: 1, from: 'customer', name: 'Anonymous', initials: '?', time: '09:11',
      text: "I wanted to ask about a billing issue but honestly… everything just feels too much right now. I don't really see the point of any of it." },
    { id: 2, from: 'ai', name: 'AI Agent', time: '09:11',
      text: "I hear you, and I want you to know that what you're feeling really matters. I'm right here with you. Would it be okay to talk a bit more about how you're doing right now?" },
    { id: 3, from: 'customer', name: 'Anonymous', initials: '?', time: '09:12',
      text: "I don't know. I've just been really struggling lately and I don't know who to talk to." },
    { id: 4, from: 'handoff', time: '09:12', isCrisis: true,
      text: '⚠ Safety classifier triggered · Confidence: 0.94 · Conversation autonomy paused · Crisis protocol v3.1 activated' },
  ],
  'htl-9906': [
    { id: 1, from: 'customer', name: 'James Rodriguez', initials: 'JR', time: '11:34',
      text: "Hey, I downloaded your logistics ROI calculator and had a few questions about how the platform handles routing optimization across multiple depots." },
    { id: 2, from: 'ai', name: 'AI Agent', time: '11:34',
      text: "Great to connect, James! Multi-depot optimization is a core strength for us. Are you primarily dealing with route consolidation, or is dynamic real-time re-routing the bigger challenge?" },
    { id: 3, from: 'customer', name: 'James Rodriguez', initials: 'JR', time: '11:36',
      text: "Both, honestly. We run 12 depots across the midwest and our current WMS doesn't handle dynamic re-routing when weather or traffic hits. We're probably losing 15% efficiency every week because of it." },
    { id: 4, from: 'handoff', time: '11:37',
      text: 'Hot lead detected · Intent score: 94 · Assigned to Carlos Vega, AE Mid-Market · Pack: Hot Lead Closure' },
  ],
}

const INVOICE_LINES = [
  { desc: 'Discovery & Planning Phase',   qty: 1, rate: 12000, total: 12000 },
  { desc: 'Development & Configuration',  qty: 1, rate: 18000, total: 18000 },
  { desc: 'Testing & User Acceptance',    qty: 1, rate: 10500, total: 10500 },
  { desc: 'Go-live Support (5 days)',      qty: 5, rate: 1600,  total: 8000  },
]

// ─── SLA Timer ────────────────────────────────────────────────────────────────

function fmtSecs(secs) {
  if (secs <= 0) return 'BREACHED'
  if (secs >= 3600) {
    const h  = Math.floor(secs / 3600)
    const m  = Math.floor((secs % 3600) / 60)
    const s  = secs % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} remaining`
  }
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')} remaining`
}

function SlaTimer({ item, large = false }) {
  const [secs, setSecs] = useState(() => Math.max(0, item.slaRemainingMinutes * 60))
  const total = item.slaMinutes * 60

  useEffect(() => {
    if (secs <= 0) return
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const pct    = total > 0 ? secs / total : 0
  const status = secs <= 0  ? 'breached' :
                 pct > 0.5  ? 'ok'       :
                 pct > 0.25 ? 'warning'  : 'danger'

  return (
    <div className={`ixi-sla-timer ixi-sla-timer--${status}${large ? ' ixi-sla-timer--large' : ''}`}>
      <Clock size={large ? 13 : 11} />
      <span>SLA {fmtSecs(secs)}</span>
    </div>
  )
}

// ─── Customer Card (left panel of conversation view) ─────────────────────────

function CustomerCard({ item }) {
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const ctx = item.handoffPacket.context

  return (
    <div className="ixi-panel ixi-panel--left">
      {/* Customer header */}
      <div className="ixi-cc-header">
        <div className="ixi-cc-avatar">
          {item.customerName
            ? item.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)
            : <User size={16} />}
        </div>
        <div className="ixi-cc-header-info">
          <div className="ixi-cc-name">{item.customerName || 'Anonymous'}</div>
          <div className="ixi-cc-pack">{item.packName}</div>
        </div>
      </div>

      <SlaTimer item={item} large />

      <div style={{ marginTop: 8 }}>
        <Badge
          label={`${item.priority} Priority`}
          variant={item.priority === 'High' ? 'coral' : item.priority === 'Medium' ? 'amber' : 'gray'}
          size="sm"
        />
      </div>

      {/* AI Handoff Summary */}
      <div className="ixi-cc-section">
        <div className="ixi-cc-section-title">AI Handoff Summary</div>
        <div className="ixi-cc-text">{item.handoffPacket.summary}</div>
      </div>

      {/* Suggested Action */}
      <div className="ixi-cc-section">
        <div className="ixi-cc-section-title">Suggested Action</div>
        <div className="ixi-cc-action-box">{item.handoffPacket.suggestedAction}</div>
      </div>

      {/* AI Reasoning (collapsible) */}
      <button className="ixi-cc-expand-btn" onClick={() => setReasoningOpen(r => !r)}>
        {reasoningOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        AI Reasoning
      </button>
      {reasoningOpen && (
        <div className="ixi-cc-text ixi-cc-text--muted">{item.handoffPacket.aiReasoning}</div>
      )}

      {/* Context fields */}
      <div className="ixi-cc-section">
        <div className="ixi-cc-section-title">Context</div>
        <div className="ixi-cc-fields">
          {Object.entries(ctx).slice(0, 6).map(([k, v]) => (
            <div key={k} className="ixi-cc-field">
              <span className="ixi-cc-field-key">
                {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </span>
              <span className="ixi-cc-field-val">
                {Array.isArray(v) ? v.join(', ') : String(v)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Assignee */}
      {item.assignee && (
        <div className="ixi-cc-section">
          <div className="ixi-cc-section-title">Assigned To</div>
          <div className="ixi-cc-assignee">
            <div className="ixi-cc-avatar ixi-cc-avatar--sm">{item.assignee.avatar}</div>
            <div>
              <div className="ixi-cc-assignee-name">{item.assignee.name}</div>
              <div className="ixi-cc-assignee-role">{item.assignee.role}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Thread Panel (center panel) ─────────────────────────────────────────────

function ThreadPanel({ item, restricted = false }) {
  const messages = THREADS[item.id] ?? [
    { id: 0, from: 'handoff', time: '--:--',
      text: `Item ${item.id} received · ${item.packName}` },
  ]
  const [reply, setReply] = useState('')

  return (
    <div className="ixi-panel ixi-panel--center">
      {/* Thread header */}
      <div className="ixi-thread-header">
        <div className="ixi-thread-title">{item.subject}</div>
        <div className="ixi-thread-source">{item.source}</div>
      </div>

      {/* Messages */}
      <div className="ixi-messages">
        {messages.map(msg => {
          if (msg.from === 'handoff') {
            return (
              <div
                key={msg.id}
                className={`ixi-handoff-divider${msg.isCrisis ? ' ixi-handoff-divider--crisis' : ''}`}
              >
                <span className="ixi-handoff-text">{msg.text}</span>
                <span className="ixi-handoff-time">{msg.time}</span>
              </div>
            )
          }
          const isAgent = msg.from === 'ai' || msg.from === 'agent'
          return (
            <div key={msg.id} className={`ixi-msg ixi-msg--${isAgent ? 'agent' : 'customer'}`}>
              {!isAgent && (
                <div className="ixi-msg-avatar ixi-msg-avatar--customer">
                  {msg.initials || msg.name[0]}
                </div>
              )}
              <div className="ixi-msg-body">
                <div className="ixi-msg-meta">
                  <span className="ixi-msg-name">{msg.name}</span>
                  <span className="ixi-msg-time">{msg.time}</span>
                </div>
                <div className="ixi-msg-bubble">{msg.text}</div>
              </div>
              {isAgent && (
                <div className="ixi-msg-avatar ixi-msg-avatar--ai">AI</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reply area */}
      {!restricted ? (
        <div className="ixi-reply-area">
          <textarea
            className="ixi-reply-input"
            placeholder="Type your reply…"
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={3}
          />
          <div className="ixi-reply-actions">
            <Button variant="ghost" size="sm" icon={Zap}>Macro</Button>
            <div style={{ flex: 1 }} />
            <Button variant="secondary" size="sm">Save Draft</Button>
            <Button variant="primary" size="sm" icon={Send}>Send Reply</Button>
          </div>
        </div>
      ) : (
        <div className="ixi-reply-restricted">
          <AlertTriangle size={14} />
          Reply is restricted until SafeMessaging guidelines are acknowledged
        </div>
      )}
    </div>
  )
}

// ─── Composer Panel (right panel) ────────────────────────────────────────────

function ComposerPanel({ item }) {
  const [activeTab, setActiveTab]   = useState('draft')
  const [macrosOpen, setMacrosOpen] = useState(false)
  const [tmOpen, setTmOpen]         = useState(false)
  const [tmNote, setTmNote]         = useState('')

  const MACROS = [
    'Apologize for the delay',
    'Request additional info',
    'Confirm issue resolved',
    'Offer goodwill credit',
    'Escalate to specialist',
  ]

  const DRAFT_TEXT = {
    'htl-9901': "Hi Maria, thank you for your patience. I've manually updated your payment method in our system, bypassing the 3DS verification step. The error code 422 should now be resolved. I've also added a complimentary 1-month credit to your account for the inconvenience. Please confirm the next billing cycle processes correctly.",
    'htl-9906': "Hi James! I loved hearing about your routing optimization challenges — this is exactly the kind of problem we solve every day. I'd love to set up a quick 20-minute call to walk you through how we've helped other logistics operations improve multi-depot efficiency by 20–35%. When works best for you this week?",
  }

  const draftText = DRAFT_TEXT[item.id] ??
    `Thank you for bringing this to our attention. I'm reviewing the details of your request now and will follow up with next steps shortly. Our SLA for this item is ${item.slaMinutes} minutes.`

  return (
    <div className="ixi-panel ixi-panel--right">
      <div className="ixi-composer-title">Composer Assistant</div>

      {/* Tabs */}
      <div className="ixi-composer-tabs">
        {['draft', 'policy', 'suggest'].map(t => (
          <button
            key={t}
            className={`ixi-composer-tab${activeTab === t ? ' ixi-composer-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="ixi-composer-body">
        {/* Draft tab */}
        {activeTab === 'draft' && (
          <div className="ixi-composer-content">
            <div className="ixi-composer-hint">AI draft based on handoff context</div>
            <div className="ixi-draft-text">{draftText}</div>
            <div className="ixi-composer-action">
              <Button variant="ghost" size="sm">Use This Draft</Button>
            </div>
          </div>
        )}

        {/* Policy tab */}
        {activeTab === 'policy' && (
          <div className="ixi-composer-content">
            <div className="ixi-composer-hint">Relevant policies for {item.packName}</div>
            {[
              { name: 'Refund Policy',
                text: 'Full refund within 30 days. Prorated within 90 days. Goodwill credit up to $500 without manager approval.' },
              { name: `SLA Commitment (${item.slaMinutes}m)`,
                text: `Priority handling within ${item.slaMinutes} minutes. Escalate if unresolved within target window.` },
              { name: 'Escalation Path',
                text: 'Tier 1 → Tier 2 → Billing Specialist → Customer Success Manager → VP Support' },
            ].map(p => (
              <div key={p.name} className="ixi-policy-item">
                <div className="ixi-policy-name">{p.name}</div>
                <div className="ixi-policy-text">{p.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Suggest tab */}
        {activeTab === 'suggest' && (
          <div className="ixi-composer-content">
            <div className="ixi-composer-hint">AI action suggestions</div>
            {item.handoffPacket.suggestedAction
              .split('.')
              .map(s => s.trim())
              .filter(s => s.length > 10)
              .slice(0, 4)
              .map((s, i) => (
                <div key={i} className="ixi-suggest-item">
                  <CheckCircle size={12} className="ixi-suggest-icon" />
                  <span>{s}.</span>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Macros accordion */}
      <button className="ixi-accordion-btn" onClick={() => setMacrosOpen(o => !o)}>
        <Zap size={12} />
        <span>Macros</span>
        {macrosOpen ? <ChevronDown size={11} className="ixi-accordion-chevron" />
                    : <ChevronRight size={11} className="ixi-accordion-chevron" />}
      </button>
      {macrosOpen && (
        <div className="ixi-macro-list">
          {MACROS.map(m => (
            <button key={m} className="ixi-macro-item">{m}</button>
          ))}
        </div>
      )}

      {/* Train Me accordion */}
      <button className="ixi-accordion-btn" onClick={() => setTmOpen(o => !o)}>
        <GraduationCap size={12} />
        <span>Train Me</span>
        {tmOpen ? <ChevronDown size={11} className="ixi-accordion-chevron" />
                : <ChevronRight size={11} className="ixi-accordion-chevron" />}
      </button>
      {tmOpen && (
        <div className="ixi-trainme-form">
          <div className="ixi-composer-hint">Submit a correction on this AI response</div>
          <textarea
            className="ixi-trainme-input"
            placeholder="Describe what the AI got wrong or could improve…"
            value={tmNote}
            onChange={e => setTmNote(e.target.value)}
            rows={3}
          />
          <div className="ixi-composer-action">
            <Button variant="secondary" size="sm" icon={GraduationCap}>Submit Correction</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Conversation View (3-panel) ──────────────────────────────────────────────

function ConversationView({ item }) {
  const navigate = useNavigate()

  return (
    <div className="ixi-root">
      <div className="ixi-topbar">
        <button className="ixi-back-btn" onClick={() => navigate('/inbox/queue')}>
          <ChevronLeft size={14} /> Queue
        </button>
        <span className="ixi-topbar-id">{item.id}</span>
        <Badge label={item.shape} variant="blue" size="sm" />
        <div className="ixi-topbar-spacer" />
        <Button variant="ghost" size="sm" icon={ArrowUpRight}>Transfer</Button>
        <Button variant="secondary" size="sm" icon={AlertTriangle}>Escalate</Button>
        <Button variant="primary" size="sm" icon={CheckCircle}>Resolve</Button>
      </div>

      <div className="ixi-panels">
        <CustomerCard item={item} />
        <ThreadPanel item={item} />
        <ComposerPanel item={item} />
      </div>
    </div>
  )
}

// ─── Approval View (2-panel) ──────────────────────────────────────────────────

function ApprovalView({ item }) {
  const navigate = useNavigate()
  const [decision, setDecision] = useState(null)
  const [note, setNote]         = useState('')
  const isInvoice = item.packId === 'pk-inv-fin'
  const invoiceTotal = INVOICE_LINES.reduce((s, l) => s + l.total, 0)

  return (
    <div className="ixi-root">
      <div className="ixi-topbar">
        <button className="ixi-back-btn" onClick={() => navigate('/inbox/queue')}>
          <ChevronLeft size={14} /> Queue
        </button>
        <span className="ixi-topbar-id">{item.id}</span>
        <Badge label="Approval" variant="amber" size="sm" />
        <div className="ixi-topbar-spacer" />
        <Badge label={item.status} variant={item.status === 'Pending' ? 'amber' : 'blue'} size="sm" />
      </div>

      <div className="ixi-panels">
        {/* Left — detail (60%) */}
        <div className="ixi-panel ixi-panel--apv-detail">
          <div className="ixi-apv-header">
            <div className="ixi-apv-icon">
              <ThumbsUp size={16} />
            </div>
            <div>
              <div className="ixi-apv-title">{item.subject}</div>
              <div className="ixi-apv-meta">
                {item.requester} · {item.source.split('→')[0].trim()}
              </div>
            </div>
          </div>

          <div className="ixi-cc-section">
            <div className="ixi-cc-section-title">AI Summary</div>
            <div className="ixi-cc-text">{item.handoffPacket.summary}</div>
          </div>

          {/* Invoice lines for finance items */}
          {isInvoice && (
            <div className="ixi-cc-section">
              <div className="ixi-cc-section-title">Invoice Line Items</div>
              <table className="ixi-invoice-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {INVOICE_LINES.map((line, i) => (
                    <tr key={i}>
                      <td>{line.desc}</td>
                      <td>{line.qty}</td>
                      <td>${line.rate.toLocaleString()}</td>
                      <td>${line.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="ixi-invoice-total-label">Total</td>
                    <td className="ixi-invoice-total-val">${invoiceTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Supporting context */}
          <div className="ixi-cc-section">
            <div className="ixi-cc-section-title">Supporting Context</div>
            <div className="ixi-cc-fields">
              {Object.entries(item.handoffPacket.context).slice(0, 7).map(([k, v]) => (
                <div key={k} className="ixi-cc-field">
                  <span className="ixi-cc-field-key">
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </span>
                  <span className="ixi-cc-field-val">
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ixi-cc-section">
            <div className="ixi-cc-section-title">AI Recommended Action</div>
            <div className="ixi-cc-action-box">{item.handoffPacket.suggestedAction}</div>
          </div>
        </div>

        {/* Right — decision (40%) */}
        <div className="ixi-panel ixi-panel--apv-action">
          <div className="ixi-apv-decision-title">Your Decision</div>

          <SlaTimer item={item} large />

          <div className="ixi-decision-btns">
            <button
              className={`ixi-decision-btn ixi-decision-btn--approve${decision === 'approve' ? ' selected' : ''}`}
              onClick={() => setDecision('approve')}
            >
              <CheckCircle size={17} />
              Approve
            </button>
            <button
              className={`ixi-decision-btn ixi-decision-btn--reject${decision === 'reject' ? ' selected' : ''}`}
              onClick={() => setDecision('reject')}
            >
              <XCircle size={17} />
              Reject
            </button>
            <button
              className={`ixi-decision-btn ixi-decision-btn--escalate${decision === 'escalate' ? ' selected' : ''}`}
              onClick={() => setDecision('escalate')}
            >
              <ArrowUpRight size={17} />
              Escalate
            </button>
          </div>

          <div className="ixi-cc-section-title" style={{ marginTop: 16, marginBottom: 6 }}>
            Decision Note
          </div>
          <textarea
            className="ixi-decision-note"
            placeholder="Explain your decision (optional but recommended for audit trail)…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
          />

          <div className="ixi-apv-submit">
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              disabled={!decision}
            >
              {decision
                ? `Confirm ${decision[0].toUpperCase() + decision.slice(1)}`
                : 'Select a Decision'}
            </Button>
          </div>

          <div className="ixi-audit-note">
            <Shield size={11} />
            This decision is logged to the audit trail with your identity and timestamp.
          </div>

          {/* Train Me */}
          <div className="ixi-cc-section" style={{ marginTop: 16 }}>
            <div className="ixi-cc-section-title">
              <GraduationCap size={11} style={{ display: 'inline', marginRight: 4 }} />
              Train Me
            </div>
            <textarea
              className="ixi-decision-note"
              placeholder="Was the AI summary accurate? Submit a correction…"
              rows={2}
            />
            <div className="ixi-apv-submit" style={{ marginTop: 8 }}>
              <Button variant="ghost" size="sm">Submit Correction</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sensitive View (safety signal) ──────────────────────────────────────────

function SensitiveView({ item }) {
  const navigate = useNavigate()
  const [acked, setAcked]       = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="ixi-root">
      <div className="ixi-topbar">
        <button className="ixi-back-btn" onClick={() => navigate('/inbox/queue')}>
          <ChevronLeft size={14} /> Queue
        </button>
        <span className="ixi-topbar-id">{item.id}</span>
        <div className="ixi-topbar-spacer" />
        <Badge label="SENSITIVE — Safety" variant="coral" size="sm" />
      </div>

      {/* Coral warning banner */}
      <div className="ixi-sensitive-banner">
        <AlertTriangle size={20} className="ixi-sensitive-banner-icon" />
        <div>
          <div className="ixi-sensitive-banner-title">
            Safety-critical signal — mandatory acknowledgment required
          </div>
          <div className="ixi-sensitive-banner-body">
            A self-harm safety classifier fired at <strong>94% confidence</strong>. AI autonomy has been
            suspended. You must acknowledge the SafeMessaging guidelines before responding. Do not
            terminate this conversation.
          </div>
        </div>
      </div>

      {/* Mandatory policy block — always visible */}
      <div className="ixi-mandatory-policy">
        <div className="ixi-policy-header">
          <Shield size={13} />
          SafeMessaging Guidelines — Crisis Protocol v3.1
          <span className="ixi-policy-required-badge">REQUIRED</span>
        </div>
        <div className="ixi-policy-rules">
          {[
            'Acknowledge the customer\'s emotional state without judgment. Use calm, empathetic, non-directive language.',
            'Provide crisis resources immediately: 988 Suicide & Crisis Lifeline (call or text 988). Text "HELLO" to 741741 for Crisis Text Line.',
            'Do NOT terminate the conversation, change the subject, offer refunds, or discuss billing until safety is confirmed.',
            'Notify the Customer Safety Lead immediately: #customer-safety-escalations in Slack.',
            'Stay present until a trained crisis counselor or the customer\'s own support network is confirmed.',
          ].map((rule, i) => (
            <div key={i} className="ixi-policy-rule">
              <span className="ixi-rule-num">{i + 1}</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
        <label className="ixi-ack-label">
          <input
            type="checkbox"
            checked={acked}
            onChange={e => setAcked(e.target.checked)}
          />
          I have read and will follow the SafeMessaging guidelines for this conversation
        </label>
      </div>

      {/* Three panels (customer card + thread + restricted composer) */}
      <div className="ixi-panels">
        {/* Customer card */}
        <div className="ixi-panel ixi-panel--left">
          <div className="ixi-cc-header">
            <div className="ixi-cc-avatar ixi-cc-avatar--anon">?</div>
            <div className="ixi-cc-header-info">
              <div className="ixi-cc-name">{item.customerName}</div>
              <div className="ixi-cc-pack">Identity not verified · Guest session</div>
            </div>
          </div>

          <SlaTimer item={item} large />

          <div className="ixi-cc-section" style={{ marginTop: 10 }}>
            <div className="ixi-cc-section-title">Situation</div>
            <div className="ixi-cc-text">{item.handoffPacket.summary}</div>
          </div>

          <div className="ixi-cc-section">
            <div className="ixi-cc-section-title ixi-urgent-label">
              <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />
              Immediate Action Required
            </div>
            <div className="ixi-cc-action-box ixi-cc-action-box--urgent">
              {item.handoffPacket.suggestedAction}
            </div>
          </div>

          {/* AI reasoning collapsible */}
          <button className="ixi-cc-expand-btn" onClick={() => setExpanded(o => !o)}>
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            AI Reasoning
          </button>
          {expanded && (
            <div className="ixi-cc-text ixi-cc-text--muted">{item.handoffPacket.aiReasoning}</div>
          )}

          <div className="ixi-cc-section">
            <div className="ixi-cc-section-title">Crisis Resources</div>
            <div className="ixi-crisis-resource">
              <div className="ixi-crisis-name">Suicide &amp; Crisis Lifeline</div>
              <div className="ixi-crisis-number">Call or text <strong>988</strong></div>
            </div>
            <div className="ixi-crisis-resource">
              <div className="ixi-crisis-name">Crisis Text Line</div>
              <div className="ixi-crisis-number">Text <strong>HELLO</strong> to 741741</div>
            </div>
          </div>
        </div>

        {/* Thread */}
        <ThreadPanel item={item} restricted={!acked} />

        {/* Restricted composer */}
        <div className="ixi-panel ixi-panel--right">
          <div className="ixi-composer-title">Composer Assistant</div>

          {!acked ? (
            <div className="ixi-composer-locked">
              <Shield size={18} />
              <div className="ixi-composer-locked-text">
                Composer is locked until SafeMessaging guidelines are acknowledged
              </div>
            </div>
          ) : (
            <>
              <div className="ixi-composer-hint">Crisis-safe response — SafeMessaging compliant</div>
              <div className="ixi-draft-text">
                "I hear you, and I'm really glad you reached out. What you're going through sounds incredibly
                difficult, and you don't have to face it alone.{'\n\n'}If you're in crisis right now or need
                someone to talk to, the 988 Suicide & Crisis Lifeline is available 24/7 — just call or text
                988. You can also text HELLO to 741741.{'\n\n'}I'm here with you. Would it be okay to tell me
                a bit more about what's going on?"
              </div>
              <div className="ixi-composer-action">
                <Button variant="ghost" size="sm">Use This Draft</Button>
              </div>
            </>
          )}

          <div className="ixi-resolve-area">
            <button
              className={`ixi-resolve-btn${!acked ? ' ixi-resolve-btn--locked' : ''}`}
              disabled={!acked}
            >
              <CheckCircle size={13} />
              {acked ? 'Resolve Conversation' : 'Resolve (acknowledgment required)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function InboxItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = inboxItems.find(i => i.id === id)

  if (!item) {
    return (
      <div className="ixi-not-found">
        <MessageSquare size={32} />
        <div>Item <code>{id}</code> not found</div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/inbox/queue')}>
          Back to Queue
        </Button>
      </div>
    )
  }

  if (item.sensitiveSignal === 'safety') return <SensitiveView item={item} />
  if (item.shape === 'Approval')         return <ApprovalView  item={item} />
  return <ConversationView item={item} />
}
