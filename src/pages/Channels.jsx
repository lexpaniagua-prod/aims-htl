import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import { Zap, Hash } from 'lucide-react'

const CHANNELS = [
  { id: 'ch-001', name: 'Live Chat (Web)', icon: '💬', type: 'chat', status: 'active', volume24h: 618, packs: 5, latency: '0.3s' },
  { id: 'ch-002', name: 'Email Support', icon: '📧', type: 'email', status: 'active', volume24h: 342, packs: 4, latency: '~2m' },
  { id: 'ch-003', name: 'In-App Messenger', icon: '📱', type: 'in_app', status: 'active', volume24h: 289, packs: 4, latency: '0.4s' },
  { id: 'ch-004', name: 'WhatsApp Business', icon: '🟩', type: 'whatsapp', status: 'active', volume24h: 124, packs: 2, latency: '0.8s' },
  { id: 'ch-005', name: 'Slack Connect', icon: '🔷', type: 'slack', status: 'active', volume24h: 88, packs: 2, latency: '1.1s' },
  { id: 'ch-006', name: 'Twitter/X DMs', icon: '🐦', type: 'social', status: 'paused', volume24h: 0, packs: 1, latency: '—' },
  { id: 'ch-007', name: 'API (Headless)', icon: '⚙️', type: 'api', status: 'active', volume24h: 381, packs: 8, latency: '0.1s' },
  { id: 'ch-008', name: 'Zendesk Widget', icon: '🎫', type: 'integration', status: 'active', volume24h: 156, packs: 3, latency: '0.6s' },
]

export default function Channels() {
  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Channels</h1>
          <p className="page-subtitle">Manage all inbound conversation channels connected to your HTL</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Hash}>Connect Channel</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Channels', value: CHANNELS.length },
          { label: 'Active', value: CHANNELS.filter(c => c.status === 'active').length },
          { label: 'Messages Today', value: CHANNELS.reduce((s, c) => s + c.volume24h, 0).toLocaleString() },
          { label: 'Avg Latency', value: '0.5s' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
            <span style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      <SectionCard noPad>
        {CHANNELS.map(ch => (
          <DataRow
            key={ch.id}
            title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{ch.icon}</span>{ch.name}</span>}
            description={`${ch.type} · ${ch.packs} packs active`}
            meta={[
              { icon: Zap, label: `Latency: ${ch.latency}` },
              { icon: Hash, label: `${ch.volume24h} msgs today` },
            ]}
            status={<Badge label={ch.status} variant={ch.status === 'active' ? 'teal' : 'amber'} size="sm" />}
            actions={[
              <Button key="config" variant="ghost" size="sm">Configure</Button>,
              <Button key={ch.status} variant="ghost" size="sm">{ch.status === 'active' ? 'Pause' : 'Resume'}</Button>,
            ]}
          />
        ))}
      </SectionCard>
    </div>
  )
}
