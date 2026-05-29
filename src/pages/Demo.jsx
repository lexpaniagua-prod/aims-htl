import { useState } from 'react'
import Badge from '../components/Badge.jsx'
import KPICard from '../components/KPICard.jsx'
import DataRow from '../components/DataRow.jsx'
import SectionCard from '../components/SectionCard.jsx'
import TableHeader from '../components/TableHeader.jsx'
import Button from '../components/Button.jsx'
import { Input, Select, Textarea } from '../components/FormFields.jsx'
import { Modal, Drawer } from '../components/Modal.jsx'
import StepIndicator from '../components/StepIndicator.jsx'
import {
  Package, MessageSquare, Users, AlertTriangle,
  CheckCircle, Clock, Inbox, Zap, BarChart2, Search
} from 'lucide-react'

export default function Demo() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [step, setStep] = useState(1)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [inputVal, setInputVal] = useState('')
  const [selectVal, setSelectVal] = useState('gpt4')
  const [textareaVal, setTextareaVal] = useState('')

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Design System Demo</h1>
        <p className="page-subtitle">All AIMS OS component primitives — light & dark mode</p>
      </div>

      {/* ── Badges ───────────────────────────────────────────────────────── */}
      <SectionCard title="Badges / StatusPills" subtitle="All variants in sm and md sizes">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <Badge label="Active"      variant="teal" />
          <Badge label="Pending"     variant="amber" />
          <Badge label="Failed"      variant="coral" />
          <Badge label="Promoted"    variant="green" />
          <Badge label="Live"        variant="blue" />
          <Badge label="HTL Config"  variant="purple" />
          <Badge label="Archived"    variant="gray" />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Badge label="active"    variant="teal"   size="sm" />
          <Badge label="pending"   variant="amber"  size="sm" />
          <Badge label="failed"    variant="coral"  size="sm" />
          <Badge label="promoted"  variant="green"  size="sm" />
          <Badge label="live"      variant="blue"   size="sm" />
          <Badge label="htl-pack"  variant="purple" size="sm" />
          <Badge label="archived"  variant="gray"   size="sm" />
        </div>
      </SectionCard>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <SectionCard title="KPI Cards" subtitle="Tinted backgrounds + delta indicators" style={{ marginTop: 20 }}>
        <div className="kpi-grid">
          <KPICard label="Queue Depth"     value="248"   tint="blue"   icon={Inbox}         delta="+12%" />
          <KPICard label="Handled Today"   value="1,842" tint="green"  icon={CheckCircle}   delta="+8%" />
          <KPICard label="SLA Breaches"    value="14"    tint="coral"  icon={AlertTriangle}  delta="-3%" />
          <KPICard label="Active Packs"    value="37"    tint="purple" icon={Package}        />
          <KPICard label="Avg Handle Time" value="4.2m"  tint="amber"  icon={Clock}          delta="-0.5m" />
        </div>
      </SectionCard>

      {/* ── DataRows ─────────────────────────────────────────────────────── */}
      <SectionCard title="Data Rows" subtitle="Clickable list rows with meta chips, status, and actions" style={{ marginTop: 20 }} noPad>
        {[
          { title: 'Billing & Refunds Pack', desc: 'Handles billing queries, refund requests, invoice disputes', status: <Badge label="Active" variant="teal" />, ts: '2m ago' },
          { title: 'Technical Support L1',   desc: 'Password resets, login help, 2FA issues',               status: <Badge label="Pending" variant="amber" />, ts: '8m ago' },
          { title: 'Onboarding Flow v3',      desc: 'New customer welcome, setup guide, docs link',          status: <Badge label="Live" variant="blue" />,    ts: '1h ago' },
          { title: 'Escalation Handler',      desc: 'Routes to senior agents when confidence < 0.6',         status: <Badge label="Failed" variant="coral" />,  ts: '3h ago' },
        ].map((r, i) => (
          <DataRow
            key={i}
            title={r.title}
            description={r.desc}
            meta={[
              { icon: MessageSquare, label: '24 conversations' },
              { icon: Users, label: '3 agents' },
            ]}
            status={r.status}
            timestamp={r.ts}
            actions={[
              <Button key="edit" variant="ghost" size="sm">Edit</Button>,
              <Button key="del" variant="destructive" size="sm">Remove</Button>,
            ]}
            onClick={() => {}}
          />
        ))}
      </SectionCard>

      {/* ── Table Header ─────────────────────────────────────────────────── */}
      <SectionCard title="Table Header" subtitle="Sortable columns with filter slot" style={{ marginTop: 20 }} noPad>
        <TableHeader
          columns={[
            { key: 'name', label: 'Pack Name', sortable: true, flex: 1 },
            { key: 'status', label: 'Status', sortable: true, width: 100 },
            { key: 'volume', label: 'Volume', sortable: true, width: 80 },
            { key: 'sla', label: 'SLA', sortable: true, width: 80 },
            { key: 'updated', label: 'Updated', sortable: true, width: 110 },
          ]}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          filterSlot={
            <Input
              placeholder="Filter packs…"
              icon={Search}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              style={{ maxWidth: 240 }}
            />
          }
        />
        <div style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: 12 }}>
          Table rows would appear here — sorted by <strong style={{ color: 'var(--text-secondary)' }}>{sortKey}</strong> ({sortDir})
        </div>
      </SectionCard>

      {/* ── Buttons ──────────────────────────────────────────────────────── */}
      <SectionCard title="Buttons" subtitle="All variants and sizes" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="purple">Pack Config</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <Button variant="primary" size="sm" icon={Zap}>Small Primary</Button>
          <Button variant="secondary" size="sm">Small Secondary</Button>
          <Button variant="ghost" size="sm">Small Ghost</Button>
          <Button variant="destructive" size="sm">Small Destructive</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="primary" size="lg" icon={BarChart2}>Large Primary</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </SectionCard>

      {/* ── Form Fields ──────────────────────────────────────────────────── */}
      <SectionCard title="Form Fields" subtitle="Input, Select, Textarea with states" style={{ marginTop: 20 }}>
        <div className="three-col" style={{ gap: 16 }}>
          <Input label="Pack Name" placeholder="e.g. Billing Support v2" value={inputVal}
            onChange={e => setInputVal(e.target.value)} hint="Used as display name in the pack library" />
          <Input label="With Icon" placeholder="Search signals…" icon={Search} value=""
            onChange={() => {}} />
          <Input label="Error State" placeholder="Enter value" value="bad@input"
            onChange={() => {}} error="This field is required and must be valid" />
        </div>
        <div className="two-col" style={{ gap: 16, marginTop: 16 }}>
          <Select label="Base Model" value={selectVal} onChange={e => setSelectVal(e.target.value)}
            options={[
              { value: 'gpt4', label: 'GPT-4o' },
              { value: 'claude3', label: 'Claude 3.5 Sonnet' },
              { value: 'gemini', label: 'Gemini 1.5 Pro' },
            ]}
            hint="Model used for intent classification"
          />
          <Textarea label="System Prompt" placeholder="You are a helpful billing agent…"
            value={textareaVal} onChange={e => setTextareaVal(e.target.value)} rows={3}
            hint="Injected as system context for every conversation"
          />
        </div>
      </SectionCard>

      {/* ── Step Indicator ───────────────────────────────────────────────── */}
      <SectionCard title="Step Indicator" subtitle="Pack Builder wizard progress" style={{ marginTop: 20 }}>
        <StepIndicator
          steps={['Identity', 'Routing Rules', 'Signals', 'Channels', 'Review & Publish']}
          current={step}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.max(0, s - 1))}>← Back</Button>
          <Button variant="primary" size="sm" onClick={() => setStep(s => Math.min(4, s + 1))}>Next →</Button>
          <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Reset</Button>
        </div>
      </SectionCard>

      {/* ── Modal & Drawer ───────────────────────────────────────────────── */}
      <SectionCard title="Modal & Drawer" subtitle="Center modal + right-side config drawer" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" onClick={() => setModal(true)}>Open Modal</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>Open Drawer</Button>
        </div>
      </SectionCard>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Confirm Route Change"
        subtitle="This will affect 14 active conversations"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setModal(false)}>Confirm Change</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          Changing the routing target from <strong style={{ color: 'var(--text-primary)' }}>Tier 1 Support</strong> to <strong style={{ color: 'var(--text-primary)' }}>Billing Team</strong> will
          re-route all in-progress conversations that match this rule. Active agent sessions will receive
          a handoff notification and the conversation context will be transferred.
        </p>
        <div style={{ marginTop: 16, padding: 12, background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber-border)', borderRadius: 6 }}>
          <p style={{ fontSize: 12, color: 'var(--accent-amber)' }}>
            ⚠ 14 conversations currently in-flight will be affected immediately.
          </p>
        </div>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Pack Configuration"
        subtitle="Billing & Refunds Pack · v2.3"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(false)}>Discard</Button>
            <Button variant="primary" onClick={() => setDrawer(false)}>Save Changes</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Pack Name" value="Billing & Refunds Pack" onChange={() => {}} />
          <Select label="Base Model" value="claude3"
            options={[
              { value: 'gpt4', label: 'GPT-4o' },
              { value: 'claude3', label: 'Claude 3.5 Sonnet' },
              { value: 'gemini', label: 'Gemini 1.5 Pro' },
            ]}
          />
          <Textarea label="System Prompt" rows={5}
            value="You are a billing specialist for Acme Corp. Help customers with invoices, refund requests, and subscription changes. Always verify account ownership before discussing billing details."
            onChange={() => {}}
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Routing Priority</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Low', 'Normal', 'High', 'Critical'].map(p => (
                <button key={p} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: p === 'High' ? 'var(--accent-blue-dim)' : 'var(--bg-input)',
                  color: p === 'High' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: `1px solid ${p === 'High' ? 'var(--accent-blue-border)' : 'var(--border)'}`,
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
