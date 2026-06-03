import { useState } from 'react'
import {
  Cpu, Wrench, SlidersHorizontal, Users, Zap, GitBranch,
  Lock, Info, Settings, Check
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { Select } from '../components/FormFields.jsx'
import { packs } from '../data/mockData.js'
import './NodeBinding.css'

// Demo DAG — Customer Success Escalation Pipeline
const DAG_NODES = [
  {
    id: 'n1', name: 'Intent Classifier', type: 'inference', model: 'Claude 3.5 Sonnet',
    desc: 'Classifies customer intent, sentiment, and urgency from the conversation. Assigns topic category and routes accordingly.',
  },
  {
    id: 'n2', name: 'KB Retrieval', type: 'tool', tool: 'vector-search',
    desc: 'Fetches the top-5 most relevant knowledge base articles using semantic similarity search against the conversation context.',
  },
  {
    id: 'n3', name: 'Response Drafter', type: 'inference', model: 'Claude 3.5 Sonnet',
    desc: 'Generates a candidate response using the retrieved KB context and full conversation history.',
  },
  {
    id: 'n4', name: 'Confidence Scorer', type: 'evaluator', threshold: 0.65,
    desc: 'Evaluates response quality and confidence. Continues autonomously if score ≥ 0.65; routes to HITL Handoff if below threshold.',
  },
  {
    id: 'n5', name: 'HITL Handoff', type: 'hitl', htlPackId: 'pk-esc-t1',
    desc: 'Packages the full conversation context and transfers control to a human agent via the configured HTL pack. The AI steps back, the SLA clock starts immediately, and the item appears in the agent\'s Inbox.',
  },
]

const TYPE_CFG = {
  inference: { label: 'Inference', variant: 'blue',   Icon: Cpu },
  tool:      { label: 'Tool',      variant: 'teal',   Icon: Wrench },
  evaluator: { label: 'Evaluator', variant: 'purple', Icon: SlidersHorizontal },
  hitl:      { label: 'HITL',      variant: 'amber',  Icon: Users },
  trigger:   { label: 'Trigger',   variant: 'green',  Icon: Zap },
  router:    { label: 'Router',    variant: 'gray',   Icon: GitBranch },
}

function Toggle({ on, onChange }) {
  return (
    <div className={`nb-toggle${on ? ' nb-toggle--on' : ''}`} onClick={() => onChange(!on)}>
      <div className="nb-toggle-knob" />
    </div>
  )
}

// ── Left panel: DAG visualization ────────────────────────────────────────────
function DAGPanel({ selected, onSelect }) {
  return (
    <div className="nb-dag-panel">
      <div className="nb-dag-header">
        <div className="nb-dag-title">Customer Success Pipeline</div>
        <div className="nb-dag-subtitle">Agentic Studio · 5 active nodes</div>
      </div>

      <div className="nb-dag-nodes">
        {DAG_NODES.map((node, i) => {
          const { Icon } = TYPE_CFG[node.type] || TYPE_CFG.inference
          const isHitl = node.type === 'hitl'
          const isSel  = selected === node.id

          return (
            <div key={node.id} className="nb-dag-item">
              <div
                className={[
                  'nb-dag-node',
                  isHitl ? 'nb-dag-node--hitl' : '',
                  isSel  ? 'nb-dag-node--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onSelect(node.id)}
              >
                <div className={`nb-dag-node-icon nb-dag-node-icon--${node.type}`}>
                  <Icon size={14} />
                </div>
                <div className="nb-dag-node-body">
                  <div className="nb-dag-node-name">{node.name}</div>
                  <div className="nb-dag-node-meta">
                    <Badge label={TYPE_CFG[node.type]?.label ?? node.type} variant={TYPE_CFG[node.type]?.variant ?? 'gray'} size="sm" />
                    {node.model && <span className="nb-dag-detail">{node.model}</span>}
                    {node.tool  && <span className="nb-dag-detail">{node.tool}</span>}
                    {node.threshold !== undefined && <span className="nb-dag-detail">threshold {node.threshold}</span>}
                  </div>
                </div>
                {isSel && <div className="nb-dag-sel-dot" />}
              </div>

              {i < DAG_NODES.length - 1 && (
                <div className="nb-dag-connector">
                  <div className="nb-dag-line" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Right panel: config ───────────────────────────────────────────────────────
function ConfigPanel({ nodeId }) {
  const node = DAG_NODES.find(n => n.id === nodeId)
  const [packId,         setPackId]         = useState('pk-esc-t1')
  const [overrideOn,     setOverrideOn]     = useState(false)
  const [sensitiveMode,  setSensitiveMode]  = useState(false)
  const [pinVersion,     setPinVersion]     = useState(false)

  if (!node) {
    return (
      <div className="nb-config-empty">
        <div className="nb-config-empty-icon"><Settings size={22} /></div>
        <div className="nb-config-empty-title">Select a node</div>
        <div className="nb-config-empty-sub">Click any node in the workflow to view and edit its settings.</div>
      </div>
    )
  }

  const { Icon, label } = TYPE_CFG[node.type] || TYPE_CFG.inference
  const isHitl = node.type === 'hitl'
  const selectedPack = packs.find(p => p.id === packId) ?? packs[0]

  // Non-HITL node — read-only info
  if (!isHitl) {
    return (
      <div className="nb-config-panel">
        <div className="nb-config-header">
          <div className={`nb-config-hd-icon nb-config-hd-icon--${node.type}`}><Icon size={16} /></div>
          <div>
            <div className="nb-config-title">{node.name}</div>
            <div className="nb-config-subtitle">{label} node</div>
          </div>
        </div>

        <div className="nb-config-desc">{node.desc}</div>

        <div className="nb-config-section">
          <div className="nb-config-sec-label">Node Properties</div>
          {[
            node.model     && ['Model',     node.model],
            node.tool      && ['Tool',      node.tool],
            node.threshold !== undefined && ['Threshold', String(node.threshold)],
            ['Status', 'Active'],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} className="nb-config-kv">
              <span className="nb-config-k">{k}</span>
              {k === 'Status'
                ? <Badge label={v} variant="teal" size="sm" />
                : <code className="nb-config-mono">{v}</code>}
            </div>
          ))}
        </div>

        <div className="nb-info-banner">
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            This node has no HTL configuration. Select the <strong>HITL Handoff</strong> node to configure pack binding.
          </span>
        </div>
      </div>
    )
  }

  // HITL node — full config
  return (
    <div className="nb-config-panel">
      <div className="nb-config-header">
        <div className="nb-config-hd-icon nb-config-hd-icon--hitl"><Users size={16} /></div>
        <div>
          <div className="nb-config-title">HITL Approval Node</div>
          <div className="nb-config-subtitle">Human-in-the-loop handoff configuration</div>
        </div>
      </div>

      <div className="nb-config-desc">{node.desc}</div>

      {/* Pack binding */}
      <div className="nb-config-section">
        <div className="nb-config-sec-label">HTL Pack Binding</div>
        <Select
          label="Attached Pack"
          value={packId}
          onChange={e => setPackId(e.target.value)}
          options={packs.map(p => ({ value: p.id, label: `${p.name} (${p.version})` }))}
        />

        {selectedPack && (
          <div className="nb-pack-info">
            {/* Pattern + Status row */}
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">Pattern</span>
              <Badge label={selectedPack.pattern} variant={selectedPack.pattern === 'Handoff' ? 'purple' : 'teal'} size="sm" />
            </div>
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">Status</span>
              <Badge label={selectedPack.status} variant={selectedPack.status === 'Active' ? 'teal' : 'amber'} size="sm" />
            </div>
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">Destination</span>
              <span className="nb-pack-info-v">{selectedPack.destinationLabel || selectedPack.destination}</span>
            </div>
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">Primary recipient</span>
              <span className="nb-pack-info-v">{selectedPack.primaryRecipient || 'Tier 1 Support Queue'}</span>
            </div>
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">SLA window</span>
              <span className="nb-pack-info-v">{selectedPack.slaLabel || (selectedPack.slaMinutes >= 60 ? `${selectedPack.slaMinutes / 60}h` : `${selectedPack.slaMinutes}m`)}</span>
            </div>
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">Composer scope</span>
              <span className="nb-pack-info-v">{(selectedPack.composerScope || 'Full').split('—')[0].trim()}</span>
            </div>
            <div className="nb-pack-info-row">
              <span className="nb-pack-info-k">Sensitive signals</span>
              <Badge label={selectedPack.sensitiveSignalEnabled ? 'Enabled' : 'Disabled'} variant={selectedPack.sensitiveSignalEnabled ? 'coral' : 'gray'} size="sm" />
            </div>
            {selectedPack.studio && (
              <div className="nb-pack-info-row">
                <span className="nb-pack-info-k">Studio</span>
                <span className="nb-pack-info-v" style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{selectedPack.studio}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Routing preview — derived from pack data */}
      <div className="nb-config-section">
        <div className="nb-config-sec-label">Routing Preview</div>
        <div className="nb-routing">
          {(() => {
            const fmtSla = m => m >= 60 ? `${m / 60}h` : `${m}m`
            const recipient = selectedPack?.primaryRecipient || 'Tier 1 Support Queue'
            const dest      = selectedPack?.destinationLabel || selectedPack?.destination || 'Inbox'
            const sla       = selectedPack ? fmtSla(selectedPack.slaMinutes) : '15m'
            const scope     = (selectedPack?.composerScope || 'Full').split('—')[0].trim()
            const isCont    = selectedPack?.pattern === 'Continuation'
            const trigger   = selectedPack?.triggerSummary
              ? `Trigger fires — ${selectedPack.triggerSummary}`
              : 'Confidence drops below threshold — HITL node fires'

            const steps = [
              { dot: 'blue',   label: trigger },
              { dot: '',       label: `Pack evaluates — routes to ${recipient}` },
              { dot: '',       label: `Handoff packet assembled → delivered via ${dest}` },
              { dot: '',       label: `SLA timer starts: ${sla}` },
              { dot: 'purple', label: `Agent opens item — ${scope} Composer scope`, em: true },
              ...(isCont ? [{ dot: 'teal', label: 'AI pauses · awaits agent approval to continue', em: true }] : []),
            ]

            return steps.map((step, i, arr) => (
              <span key={i}>
                <div className="nb-routing-step">
                  <div className={`nb-routing-dot${step.dot ? ` nb-routing-dot--${step.dot}` : ''}`} />
                  <span className={`nb-routing-lbl${step.em ? ' nb-routing-lbl--em' : ''}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && <div className="nb-routing-line" />}
              </span>
            ))
          })()}
        </div>
      </div>

      {/* Continuation note */}
      {selectedPack?.pattern === 'Continuation' && (
        <div className="nb-locked-notice" style={{ margin: '0 0 20px' }}>
          <Lock size={13} style={{ flexShrink: 0 }} />
          <span>Continuation loop behavior is configured in the Pack Builder. Edit the pack to change the approval chain.</span>
        </div>
      )}

      <div className="nb-config-actions">
        <Button variant="secondary" size="sm">Reset defaults</Button>
        <Button variant="primary" size="sm" icon={Check}>Save binding</Button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NodeBinding() {
  const [selected, setSelected] = useState('n5')

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Node Binding</h1>
          <p className="page-subtitle">Configure HITL approval nodes and bind HTL packs to your agent workflows</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm">Change Workflow</Button>
        </div>
      </div>

      <div className="nb-split">
        <DAGPanel selected={selected} onSelect={setSelected} />
        <ConfigPanel nodeId={selected} />
      </div>
    </div>
  )
}
