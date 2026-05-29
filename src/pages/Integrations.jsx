import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import { Zap, CheckCircle, AlertTriangle } from 'lucide-react'

const INTEGRATIONS = [
  { id: 'int-001', name: 'Zendesk', category: 'Ticketing', status: 'connected', icon: '🎫', lastSync: '2m ago', features: ['Ticket creation', 'Status sync', 'Customer lookup'] },
  { id: 'int-002', name: 'Slack', category: 'Notifications', status: 'connected', icon: '🔷', lastSync: '30s ago', features: ['Escalation alerts', 'OOO notifications', 'Daily digest'] },
  { id: 'int-003', name: 'Salesforce', category: 'CRM', status: 'connected', icon: '☁️', lastSync: '5m ago', features: ['Contact lookup', 'Opportunity update', 'Account enrichment'] },
  { id: 'int-004', name: 'Stripe', category: 'Payments', status: 'connected', icon: '💳', lastSync: '1m ago', features: ['Payment status', 'Refund processing', 'Subscription data'] },
  { id: 'int-005', name: 'HubSpot', category: 'CRM', status: 'error', icon: '🟠', lastSync: '2h ago', features: ['Contact sync', 'Deal tracking'] },
  { id: 'int-006', name: 'Intercom', category: 'Messaging', status: 'disconnected', icon: '💬', lastSync: 'Never', features: ['Conversation import', 'Contact sync'] },
  { id: 'int-007', name: 'PagerDuty', category: 'Alerting', status: 'connected', icon: '🚨', lastSync: '10m ago', features: ['Incident creation', 'On-call escalation'] },
  { id: 'int-008', name: 'Jira', category: 'Project Management', status: 'disconnected', icon: '🔵', lastSync: 'Never', features: ['Bug ticket creation', 'Sprint tracking'] },
]

const statusConfig = {
  connected: { variant: 'teal', label: 'Connected', icon: CheckCircle },
  error: { variant: 'coral', label: 'Error', icon: AlertTriangle },
  disconnected: { variant: 'gray', label: 'Disconnected', icon: null },
}

export default function Integrations() {
  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Integrations</h1>
          <p className="page-subtitle">Connect your HTL to external platforms and data sources</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Zap}>Browse Catalog</Button>
        </div>
      </div>

      {/* Error banner */}
      <div style={{ padding: '12px 16px', background: 'var(--accent-coral-dim)', border: '1px solid var(--accent-coral-border)', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <AlertTriangle size={15} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
          <strong>HubSpot</strong> sync has been failing for 2 hours. <span style={{ color: 'var(--text-secondary)' }}>API credentials may have expired.</span>
        </div>
        <Button variant="destructive" size="sm">Fix Now</Button>
      </div>

      <SectionCard noPad>
        {INTEGRATIONS.map(intg => {
          const cfg = statusConfig[intg.status]
          return (
            <DataRow
              key={intg.id}
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>{intg.icon}</span>{intg.name}</span>}
              description={`${intg.category} · Last sync: ${intg.lastSync}`}
              meta={intg.features.map(f => ({ icon: Zap, label: f }))}
              status={<Badge label={cfg.label} variant={cfg.variant} size="sm" />}
              actions={[
                intg.status === 'connected'
                  ? <Button key="manage" variant="ghost" size="sm">Manage</Button>
                  : intg.status === 'error'
                    ? <Button key="fix" variant="destructive" size="sm">Fix</Button>
                    : <Button key="connect" variant="secondary" size="sm">Connect</Button>
              ]}
            />
          )
        })}
      </SectionCard>
    </div>
  )
}
