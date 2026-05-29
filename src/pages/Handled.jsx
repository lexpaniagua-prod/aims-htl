import { useState } from 'react'
import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import TableHeader from '../components/TableHeader.jsx'
import { Input } from '../components/FormFields.jsx'
import { Drawer } from '../components/Modal.jsx'
import { Search, CheckCircle, Package, User, Clock, Star } from 'lucide-react'

const HANDLED = [
  { id: 'conv-9801', customer: 'Sarah Chen', topic: 'Refund approved for order #48291', pack: 'Billing & Refunds', agent: 'Maya R.', csat: 5, duration: '4m 12s', resolvedAt: '14 min ago', outcome: 'Resolved' },
  { id: 'conv-9800', customer: 'Tom Nakamura', topic: 'Password reset completed successfully', pack: 'Tech Support L1', agent: 'Auto (AI)', csat: 4, duration: '1m 58s', resolvedAt: '22 min ago', outcome: 'Resolved' },
  { id: 'conv-9799', customer: 'Cleo Davis', topic: 'Slack integration connected and tested', pack: 'Onboarding v3', agent: 'Auto (AI)', csat: 5, duration: '3m 04s', resolvedAt: '38 min ago', outcome: 'Resolved' },
  { id: 'conv-9798', customer: 'Ravi Singh', topic: 'Enterprise demo scheduled for Thursday', pack: 'Sales Assist', agent: 'Alex T.', csat: 4, duration: '12m 22s', resolvedAt: '55 min ago', outcome: 'Demo Booked' },
  { id: 'conv-9797', customer: 'Mei Lin', topic: 'Invoice credit issued for double charge', pack: 'Billing & Refunds', agent: 'Maya R.', csat: 5, duration: '6m 18s', resolvedAt: '1h ago', outcome: 'Credit Issued' },
  { id: 'conv-9796', customer: 'Aaron Fields', topic: 'API docs link sent + walkthrough completed', pack: 'Tech Support L1', agent: 'Auto (AI)', csat: 3, duration: '2m 42s', resolvedAt: '1h 20m ago', outcome: 'Resolved' },
  { id: 'conv-9795', customer: 'Felix Hofer', topic: 'Team invitation resent, account activated', pack: 'Onboarding v3', agent: 'Auto (AI)', csat: 5, duration: '1m 35s', resolvedAt: '2h ago', outcome: 'Resolved' },
  { id: 'conv-9794', customer: 'Greg Walton', topic: 'Reseller agreement terms explained', pack: 'Sales Assist', agent: 'Lena K.', csat: 4, duration: '18m 07s', resolvedAt: '2h 30m ago', outcome: 'Follow-up Scheduled' },
]

const csatColor = (score) => score >= 4 ? 'var(--accent-teal)' : score === 3 ? 'var(--accent-amber)' : 'var(--accent-coral)'

function CSATStars({ score }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} fill={i <= score ? csatColor(score) : 'transparent'} color={i <= score ? csatColor(score) : 'var(--text-tertiary)'} />
      ))}
    </div>
  )
}

export default function Handled() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = HANDLED.filter(c =>
    !search || c.customer.toLowerCase().includes(search.toLowerCase()) ||
    c.topic.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Handled</h1>
          <p className="page-subtitle">{HANDLED.length} conversations resolved today</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm">Export</Button>
        </div>
      </div>

      <SectionCard noPad>
        <TableHeader
          columns={[
            { key: 'customer', label: 'Customer', sortable: true, flex: 1 },
            { key: 'pack', label: 'Pack', sortable: true, width: 160 },
            { key: 'agent', label: 'Handled By', sortable: false, width: 120 },
            { key: 'csat', label: 'CSAT', sortable: true, width: 100 },
            { key: 'duration', label: 'Duration', sortable: true, width: 90 },
            { key: 'resolvedAt', label: 'Resolved', sortable: true, width: 110 },
          ]}
          filterSlot={<Input placeholder="Search resolved…" icon={Search} value={search} onChange={e => setSearch(e.target.value)} />}
        />
        {filtered.map(conv => (
          <DataRow
            key={conv.id}
            title={conv.customer}
            description={conv.topic}
            meta={[
              { icon: Package, label: conv.pack },
              { icon: User, label: conv.agent },
              { icon: Clock, label: conv.duration },
            ]}
            status={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <CSATStars score={conv.csat} />
                <Badge label={conv.outcome} variant="teal" size="sm" />
              </div>
            }
            timestamp={conv.resolvedAt}
            onClick={() => setSelected(conv)}
          />
        ))}
      </SectionCard>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.customer}
        subtitle={`${selected?.id} · Resolved ${selected?.resolvedAt}`}
        footer={<Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 14, background: 'var(--bg-row)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Resolution Summary</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{selected.topic}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Pack', value: selected.pack },
                { label: 'Agent', value: selected.agent },
                { label: 'Duration', value: selected.duration },
                { label: 'Outcome', value: selected.outcome },
              ].map(f => (
                <div key={f.label} style={{ padding: 12, background: 'var(--bg-row)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CSAT Score</div>
              <CSATStars score={selected.csat} />
              <span style={{ fontSize: 14, fontWeight: 700, color: csatColor(selected.csat) }}>{selected.csat}/5</span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
