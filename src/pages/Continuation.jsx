import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import { Package, Clock, RefreshCw } from 'lucide-react'

const CONTINUATIONS = [
  { id: 'cont-001', customer: 'Isabella Turner', topic: 'Follow-up on refund status (ref: conv-9711)', pack: 'Billing & Refunds', daysOpen: 3, stage: 'Awaiting Customer', nextAction: 'Send reminder email' },
  { id: 'cont-002', customer: 'Carlos Mendes', topic: 'Awaiting IT team approval for enterprise license', pack: 'Sales Assist', daysOpen: 7, stage: 'Awaiting Internal', nextAction: 'Check with AE team' },
  { id: 'cont-003', customer: 'Amy Zhang', topic: 'Pending data migration — ETA Friday', pack: 'Tech Support L2', daysOpen: 2, stage: 'In Progress', nextAction: 'Schedule check-in' },
  { id: 'cont-004', customer: 'Patrick Osei', topic: 'GDPR data export request being processed', pack: 'GDPR Data Requests', daysOpen: 5, stage: 'Processing', nextAction: 'Export ready notification' },
  { id: 'cont-005', customer: 'Hana Kato', topic: 'API key rotation — testing in staging', pack: 'Tech Support L1', daysOpen: 1, stage: 'Customer Testing', nextAction: 'Follow up if no response by EOD' },
]

const stageVariant = {
  'Awaiting Customer': 'amber',
  'Awaiting Internal': 'amber',
  'In Progress': 'blue',
  'Processing': 'purple',
  'Customer Testing': 'teal',
}

export default function Continuation() {
  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Continuation</h1>
          <p className="page-subtitle">Multi-day conversations in progress — requiring periodic human follow-up</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm">Send Reminders</Button>
        </div>
      </div>

      <SectionCard noPad>
        {CONTINUATIONS.map(c => (
          <DataRow
            key={c.id}
            title={c.customer}
            description={c.topic}
            meta={[
              { icon: Package, label: c.pack },
              { icon: Clock, label: `${c.daysOpen}d open` },
              { icon: RefreshCw, label: c.nextAction },
            ]}
            status={<Badge label={c.stage} variant={stageVariant[c.stage]} size="sm" />}
            actions={[
              <Button key="resume" variant="primary" size="sm">Resume</Button>,
              <Button key="close" variant="ghost" size="sm">Close</Button>,
            ]}
          />
        ))}
      </SectionCard>
    </div>
  )
}
