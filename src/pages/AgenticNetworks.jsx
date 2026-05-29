import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Network, Cpu, Wrench, SlidersHorizontal,
  Users, Zap, GitBranch, Settings, Activity, AlertTriangle, Package2,
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { Select } from '../components/FormFields.jsx'
import { Drawer } from '../components/Modal.jsx'
import KPICard from '../components/KPICard.jsx'
import { networks, packs } from '../data/mockData.js'
import './AgenticNetworks.css'

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const NODE_TYPE = {
  inference: { label: 'Inference', variant: 'blue',   Icon: Cpu },
  tool:      { label: 'Tool',      variant: 'teal',   Icon: Wrench },
  evaluator: { label: 'Evaluator', variant: 'purple', Icon: SlidersHorizontal },
  hitl:      { label: 'HITL',      variant: 'amber',  Icon: Users },
  trigger:   { label: 'Trigger',   variant: 'green',  Icon: Zap },
  router:    { label: 'Router',    variant: 'gray',   Icon: GitBranch },
}

function Toggle({ on, onChange }) {
  return (
    <div className={`an-toggle${on ? ' an-toggle--on' : ''}`} onClick={() => onChange(!on)}>
      <div className="an-toggle-knob" />
    </div>
  )
}

// ── Network card ──────────────────────────────────────────────────────────────
function NetworkCard({ network, onEditHTL }) {
  const [expanded, setExpanded] = useState(false)
  const pack = packs.find(p => p.id === network.htlPackId)
  const hasOverrides = network.nodeOverrides?.length > 0

  return (
    <div className="an-card">
      {/* Header row */}
      <div className="an-card-header">
        <div className="an-card-icon">
          <Network size={16} />
        </div>
        <div className="an-card-info">
          <div className="an-card-name">{network.name}</div>
          <div className="an-card-meta">
            <span>{network.studio}</span>
            <span className="an-sep">·</span>
            <span>{network.activeNodes} nodes</span>
          </div>
        </div>
        <div className="an-card-right">
          <div className="an-card-stats">
            <span className="an-last-triggered">{relativeTime(network.lastTriggered)}</span>
            <span className="an-trigger-chip">
              <Activity size={10} />
              {network.triggerCount30d.toLocaleString()} / 30d
            </span>
          </div>
          <Button variant="secondary" size="sm" icon={Settings} onClick={() => onEditHTL(network)}>
            Edit HTL config
          </Button>
          <button className="an-expand-btn" onClick={() => setExpanded(e => !e)} title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* HTL pack strip */}
      <div className="an-htl-strip">
        <span className="an-htl-label">HTL Pack</span>
        <div className="an-htl-pack">
          <Package2 size={11} />
          <span>{network.htlPackName}</span>
          {pack && (
            <Badge
              label={pack.pattern}
              variant={pack.pattern === 'Handoff' ? 'purple' : 'teal'}
              size="sm"
            />
          )}
          {pack && <span className="an-htl-version">{pack.version}</span>}
        </div>
        <span className="an-htl-node">
          Binding node: <code>{network.bindingNode}</code>
        </span>
        {hasOverrides && (
          <span className="an-override-badge">
            <AlertTriangle size={9} />
            {network.nodeOverrides.length} override{network.nodeOverrides.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="an-card-desc">{network.description}</div>

      {/* Expanded: nodes table */}
      {expanded && (
        <div className="an-nodes-table">
          <div className="an-nodes-header">
            <span className="an-nodes-col an-nodes-col--name">Node</span>
            <span className="an-nodes-col an-nodes-col--type">Type</span>
            <span className="an-nodes-col an-nodes-col--detail">Model / Tool / Config</span>
            <span className="an-nodes-col an-nodes-col--htl">HTL</span>
          </div>
          {network.nodes.map(node => {
            const cfg = NODE_TYPE[node.type] || { label: node.type, variant: 'gray', Icon: Cpu }
            const isHitl = node.type === 'hitl'
            const detail = node.model ?? node.tool
              ?? (node.threshold !== undefined ? `threshold: ${node.threshold}` : null)
              ?? (node.condition ?? null)
              ?? (node.event ?? null)
              ?? (node.stages ? node.stages.join(' › ') : null)
            return (
              <div key={node.id} className={`an-nodes-row${isHitl ? ' an-nodes-row--hitl' : ''}`}>
                <div className="an-nodes-col an-nodes-col--name">
                  <div className={`an-node-dot an-node-dot--${node.type}`} />
                  <span>{node.name}</span>
                </div>
                <div className="an-nodes-col an-nodes-col--type">
                  <Badge label={cfg.label} variant={cfg.variant} size="sm" />
                </div>
                <div className="an-nodes-col an-nodes-col--detail">
                  {detail
                    ? <code className="an-node-code">{detail}</code>
                    : <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>—</span>}
                </div>
                <div className="an-nodes-col an-nodes-col--htl">
                  {isHitl
                    ? <Badge label="Bound" variant="amber" size="sm" />
                    : <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>—</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── HTL config drawer ─────────────────────────────────────────────────────────
function HTLConfigDrawer({ network, open, onClose }) {
  const [packId,       setPackId]       = useState(network?.htlPackId ?? '')
  const [pinVersion,   setPinVersion]   = useState(false)
  const [sensitiveMode,setSensitiveMode]= useState(
    network?.nodeOverrides?.includes('sensitiveMode=true') ?? false
  )

  if (!network) return null
  const selectedPack = packs.find(p => p.id === packId)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`HTL Config — ${network.name}`}
      subtitle="Manage pack binding and node-level overrides for this network"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>Save changes</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Pack picker */}
        <Select
          label="HTL Pack"
          value={packId}
          onChange={e => setPackId(e.target.value)}
          options={packs.map(p => ({ value: p.id, label: `${p.name} (${p.version})` }))}
        />

        {selectedPack && (
          <div className="an-drawer-pack">
            {[
              ['Pattern',     <Badge key="p" label={selectedPack.pattern} variant={selectedPack.pattern === 'Handoff' ? 'purple' : 'teal'} size="sm" />],
              ['Status',      <Badge key="s" label={selectedPack.status}  variant={selectedPack.status === 'Active' ? 'teal' : 'amber'} size="sm" />],
              ['Destination', selectedPack.destination],
              ['SLA',         selectedPack.slaMinutes >= 60 ? `${selectedPack.slaMinutes / 60}h` : `${selectedPack.slaMinutes}m`],
            ].map(([k, v]) => (
              <div key={k} className="an-drawer-pack-row">
                <span className="an-drawer-pack-k">{k}</span>
                {typeof v === 'string' ? <span className="an-drawer-pack-v">{v}</span> : v}
              </div>
            ))}
          </div>
        )}

        {/* Binding node (read-only) */}
        <div>
          <div className="an-drawer-label">Binding Node</div>
          <div className="an-drawer-node-chip">
            <Users size={12} style={{ color: 'var(--accent-amber)' }} />
            <code>{network.bindingNode}</code>
          </div>
        </div>

        {/* Version pinning */}
        <div>
          <div className="an-drawer-label">Pack Version</div>
          <div className="an-drawer-toggle-row">
            <div>
              <div className="an-drawer-toggle-lbl">Pin to specific version</div>
              <div className="an-drawer-toggle-hint">Lock to current version — skip future updates</div>
            </div>
            <Toggle on={pinVersion} onChange={setPinVersion} />
          </div>
          {pinVersion && selectedPack && (
            <div style={{ marginTop: 8 }}>
              <Select
                value={selectedPack.version}
                onChange={() => {}}
                options={[selectedPack.version, 'v2.2', 'v2.1', 'v2.0'].map(v => ({ value: v, label: v }))}
              />
            </div>
          )}
        </div>

        {/* Overrides */}
        <div>
          <div className="an-drawer-label">Node Overrides</div>
          <div className="an-drawer-toggle-row">
            <div>
              <div className="an-drawer-toggle-lbl">Sensitive mode</div>
              <div className="an-drawer-toggle-hint">Force sensitive signal handling on the HITL node</div>
            </div>
            <Toggle on={sensitiveMode} onChange={setSensitiveMode} />
          </div>
        </div>

        {/* Active overrides banner */}
        {network.nodeOverrides?.length > 0 && (
          <div className="an-drawer-overrides">
            <div className="an-drawer-overrides-label">
              <AlertTriangle size={11} /> Active overrides
            </div>
            {network.nodeOverrides.map(ov => (
              <div key={ov} className="an-drawer-override-item">{ov}</div>
            ))}
          </div>
        )}

      </div>
    </Drawer>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AgenticNetworks() {
  const [drawerNet, setDrawerNet] = useState(null)

  const totalTriggers = networks.reduce((s, n) => s + n.triggerCount30d, 0)
  const totalNodes    = networks.reduce((s, n) => s + n.activeNodes, 0)
  const sensitiveCount = networks.filter(n => {
    const p = packs.find(pk => pk.id === n.htlPackId)
    return p?.sensitiveSignalEnabled
  }).length

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Agentic Networks</h1>
          <p className="page-subtitle">Configure HTL pack bindings across your multi-agent workflows</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm">New Network</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KPICard label="Networks"           value={networks.length}           tint="blue"   icon={Network} />
        <KPICard label="Total Nodes"        value={totalNodes}                tint="purple" icon={Cpu} />
        <KPICard label="HTL Triggers (30d)" value={totalTriggers.toLocaleString()} tint="teal"   icon={Activity} />
        <KPICard label="Sensitive Packs"    value={sensitiveCount}            tint="coral"  icon={Users} />
      </div>

      {/* Cards */}
      <div className="an-cards">
        {networks.map(net => (
          <NetworkCard
            key={net.id}
            network={net}
            onEditHTL={setDrawerNet}
          />
        ))}
      </div>

      <HTLConfigDrawer
        network={drawerNet}
        open={!!drawerNet}
        onClose={() => setDrawerNet(null)}
      />
    </div>
  )
}
