import { useState } from 'react'
import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import { Drawer } from '../components/Modal.jsx'
import { AlertTriangle, Package, User, Clock, Radio, ArrowUpRight } from 'lucide-react'

const ESCALATIONS = [
  { id: 'esc-001', customer: 'Ana Sousa', topic: 'Payment failed — card ending 4821', reason: 'Churn Risk signal triggered', pack: 'Billing & Refunds', assignedTo: null, waitTime: '2:58', severity: 'coral' },
  { id: 'esc-002', customer: 'Marcus Lee', topic: 'API rate limit errors in prod — urgent', reason: 'Customer repeated contact (4x today)', pack: 'Tech Support L2', assignedTo: 'Jordan S.', waitTime: '0:18', severity: 'amber' },
  { id: 'esc-003', customer: 'Layla Mansour', topic: 'Threatened legal action over data retention', reason: 'Legal mention signal triggered', pack: 'Compliance Review', assignedTo: null, waitTime: '0:44', severity: 'coral' },
  { id: 'esc-004', customer: 'Dan Cho', topic: 'Security audit documentation urgently needed', reason: 'VIP + Urgency signal detected', pack: 'Sales Assist', assignedTo: null, waitTime: '2:25', severity: 'amber' },
  { id: 'esc-005', customer: 'Olga Weber', topic: 'AI gave wrong refund amount — customer upset', reason: 'Frustration detected (score: -0.89)', pack: 'Billing & Refunds', assignedTo: 'Maya R.', waitTime: '0:07', severity: 'coral' },
]

export default function Escalations() {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Escalations</h1>
          <p className="page-subtitle">{ESCALATIONS.filter(e => !e.assignedTo).length} unassigned · {ESCALATIONS.length} total</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm">Assign All</Button>
        </div>
      </div>

      {/* Alert banner */}
      <div style={{ padding: '12px 16px', background: 'var(--accent-coral-dim)', border: '1px solid var(--accent-coral-border)', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertTriangle size={16} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-coral)' }}>3 unassigned escalations</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>— 2 have been waiting over 2 minutes</span>
        </div>
        <Button variant="destructive" size="sm">Review Now</Button>
      </div>

      <SectionCard noPad>
        {ESCALATIONS.map(esc => (
          <DataRow
            key={esc.id}
            title={esc.customer}
            description={esc.topic}
            meta={[
              { icon: Radio, label: esc.reason },
              { icon: Package, label: esc.pack },
              { icon: User, label: esc.assignedTo || 'Unassigned' },
            ]}
            status={
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge label={esc.assignedTo ? 'Assigned' : 'Unassigned'} variant={esc.assignedTo ? 'blue' : 'coral'} size="sm" />
                <Badge label={`Wait: ${esc.waitTime}`} variant={esc.severity} size="sm" />
              </div>
            }
            actions={[
              <Button key="take" variant="destructive" size="sm" icon={ArrowUpRight} onClick={() => setSelected(esc)}>Take</Button>,
            ]}
            onClick={() => setSelected(esc)}
          />
        ))}
      </SectionCard>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.customer}
        subtitle={`Escalation ${selected?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="secondary">Assign to Agent</Button>
            <Button variant="destructive" icon={ArrowUpRight}>Take Escalation</Button>
          </>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 14, background: 'var(--accent-coral-dim)', border: '1px solid var(--accent-coral-border)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--accent-coral)', fontWeight: 500, marginBottom: 4 }}>Escalation Reason</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{selected.reason}</div>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-row)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Customer Topic</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{selected.topic}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Pack', value: selected.pack },
                { label: 'Wait Time', value: selected.waitTime },
                { label: 'Assigned To', value: selected.assignedTo || 'Unassigned' },
                { label: 'Severity', value: selected.severity === 'coral' ? 'Critical' : 'Warning' },
              ].map(f => (
                <div key={f.label} style={{ padding: 12, background: 'var(--bg-row)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
