import Badge from '../components/Badge.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DataRow from '../components/DataRow.jsx'
import Button from '../components/Button.jsx'
import { Package, Hash, Paperclip } from 'lucide-react'

const ATTACHMENTS = [
  { pack: 'Billing & Refunds', channel: 'Live Chat', node: 'claude-sonnet-prod', status: 'active', since: '14 days ago' },
  { pack: 'Billing & Refunds', channel: 'Email Support', node: 'claude-sonnet-prod', status: 'active', since: '14 days ago' },
  { pack: 'Tech Support L1', channel: 'Live Chat', node: 'gpt4o-primary', status: 'active', since: '21 days ago' },
  { pack: 'Tech Support L1', channel: 'In-App Messenger', node: 'gpt4o-primary', status: 'active', since: '21 days ago' },
  { pack: 'Tech Support L2', channel: 'API (Headless)', node: 'gpt4o-primary', status: 'active', since: '7 days ago' },
  { pack: 'Onboarding v3', channel: 'Live Chat', node: 'claude-sonnet-prod', status: 'active', since: '30 days ago' },
  { pack: 'Sales Assist', channel: 'Slack Connect', node: 'claude-haiku-fast', status: 'active', since: '5 days ago' },
  { pack: 'Compliance Review', channel: 'API (Headless)', node: 'claude-sonnet-prod', status: 'paused', since: '2 days ago' },
]

export default function PackAttachment() {
  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Pack Attachment</h1>
          <p className="page-subtitle">Map packs to channels and AI nodes</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Paperclip}>New Attachment</Button>
        </div>
      </div>

      <SectionCard noPad>
        {ATTACHMENTS.map((a, i) => (
          <DataRow
            key={i}
            title={`${a.pack} → ${a.channel}`}
            description={`via ${a.node}`}
            meta={[
              { icon: Package, label: a.pack },
              { icon: Hash, label: a.channel },
            ]}
            status={<Badge label={a.status} variant={a.status === 'active' ? 'teal' : 'amber'} size="sm" />}
            timestamp={a.since}
            actions={[
              <Button key="detach" variant="destructive" size="sm">Detach</Button>,
            ]}
          />
        ))}
      </SectionCard>
    </div>
  )
}
