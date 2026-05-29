import { useState } from 'react'
import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import { Drawer } from '../components/Modal.jsx'
import { Input, Select, Textarea } from '../components/FormFields.jsx'
import { Plus, FileText, Hash } from 'lucide-react'

const TEMPLATES = [
  { id: 'tpl-001', name: 'Refund Confirmation', category: 'Billing', channel: 'Email', usageCount: 312, lastUsed: '2h ago', status: 'active' },
  { id: 'tpl-002', name: 'Password Reset', category: 'Auth', channel: 'Email', usageCount: 288, lastUsed: '5m ago', status: 'active' },
  { id: 'tpl-003', name: 'Welcome Onboarding', category: 'Onboarding', channel: 'Email + Chat', usageCount: 276, lastUsed: '18m ago', status: 'active' },
  { id: 'tpl-004', name: 'Escalation Notification', category: 'Internal', channel: 'Slack', usageCount: 104, lastUsed: '1h ago', status: 'active' },
  { id: 'tpl-005', name: 'Demo Booking Confirmation', category: 'Sales', channel: 'Email', usageCount: 89, lastUsed: '2h ago', status: 'active' },
  { id: 'tpl-006', name: 'GDPR Data Request Received', category: 'Legal', channel: 'Email', usageCount: 31, lastUsed: '1d ago', status: 'active' },
  { id: 'tpl-007', name: 'SLA Breach Alert', category: 'Internal', channel: 'Slack + Email', usageCount: 22, lastUsed: '3d ago', status: 'draft' },
  { id: 'tpl-008', name: 'Churn Prevention Offer', category: 'Retention', channel: 'Email + Chat', usageCount: 18, lastUsed: '4d ago', status: 'active' },
]

const catVariant = { Billing: 'blue', Auth: 'teal', Onboarding: 'green', Internal: 'gray', Sales: 'amber', Legal: 'purple', Retention: 'coral' }

export default function Templates() {
  const [drawer, setDrawer] = useState(false)

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">Manage reusable message templates for automated and human agents</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setDrawer(true)}>New Template</Button>
        </div>
      </div>

      <SectionCard noPad>
        {TEMPLATES.map(tpl => (
          <DataRow
            key={tpl.id}
            title={tpl.name}
            description={`Used ${tpl.usageCount} times · ${tpl.channel}`}
            meta={[
              { icon: Hash, label: tpl.category },
              { icon: FileText, label: `Last used ${tpl.lastUsed}` },
            ]}
            status={
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge label={tpl.category} variant={catVariant[tpl.category] || 'gray'} size="sm" />
                <Badge label={tpl.status} variant={tpl.status === 'active' ? 'teal' : 'gray'} size="sm" />
              </div>
            }
            actions={[
              <Button key="edit" variant="ghost" size="sm">Edit</Button>,
              <Button key="preview" variant="secondary" size="sm">Preview</Button>,
            ]}
          />
        ))}
      </SectionCard>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="New Template"
        footer={<><Button variant="ghost" onClick={() => setDrawer(false)}>Cancel</Button><Button variant="primary">Save Template</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Template Name" placeholder="e.g. Refund Confirmation" value="" onChange={() => {}} />
          <Select label="Category"
            options={Object.keys(catVariant).map(c => ({ value: c, label: c }))}
            value="Billing" onChange={() => {}}
          />
          <Select label="Channel"
            options={['Email', 'Chat', 'Slack', 'WhatsApp', 'Email + Chat', 'Slack + Email'].map(c => ({ value: c, label: c }))}
            value="Email" onChange={() => {}}
          />
          <Textarea label="Message Body" rows={8}
            placeholder="Hi {{customer_name}},&#10;&#10;Your refund of {{amount}} has been processed and will appear within {{days}} business days.&#10;&#10;Order: {{order_id}}&#10;&#10;Best regards,&#10;{{agent_name}}"
            value="" onChange={() => {}}
            hint="Use {{variable}} for dynamic values"
          />
          <Input label="Available Variables" placeholder="customer_name, amount, order_id, agent_name…" value="" onChange={() => {}} hint="Comma-separated list of dynamic variables" />
        </div>
      </Drawer>
    </div>
  )
}
