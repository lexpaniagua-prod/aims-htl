import { useState } from 'react'
import {
  AlertTriangle, CalendarOff, User, Users, ArrowRight,
  Clock, Plus, Info, Check
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { Drawer } from '../components/Modal.jsx'
import { Input, Select } from '../components/FormFields.jsx'
import { oooEntries } from '../data/mockData.js'
import './OOOCoverage.css'

// ─── Static data ─────────────────────────────────────────────────────────────

const OOO_STATUS = {
  'EMP-0142': { label: 'Active',      variant: 'teal'  },
  'EMP-0331': { label: 'No Coverage', variant: 'coral' },
  'EMP-0087': { label: 'Scheduled',   variant: 'amber' },
}

const COVERAGE_RULES = [
  {
    id: 'cr-1',
    employee: 'Jordan S.',
    pool: 'Tier 1 Support Pool',
    timeoutMin: 15,
    fallback: 'Lightweight → Sam V.',
    status: 'active',
  },
  {
    id: 'cr-2',
    employee: 'David Osei',
    pool: 'Finance — Lena Brandt',
    timeoutMin: 240,
    fallback: 'Queue until return',
    status: 'active',
  },
  {
    id: 'cr-3',
    employee: 'Nadia B.',
    pool: 'Compliance Pool (3 members)',
    timeoutMin: 480,
    fallback: 'Escalate to Rachel Ng',
    status: 'warning',
  },
]

const DRAWER_AGENTS = [
  { value: 'jordan', label: 'Jordan S. — Senior Support Specialist' },
  { value: 'nadia',  label: 'Nadia B. — Chief Compliance Officer'  },
  { value: 'david',  label: 'David Osei — Finance Director'         },
  { value: 'maya',   label: 'Maya R. — Billing Specialist'          },
  { value: 'carlos', label: 'Carlos Vega — AE Mid-Market'           },
]

const COVERAGE_AGENTS = [
  { value: '',       label: 'None (AI auto-coverage)'     },
  { value: 'sam-v',  label: 'Sam V. — Support Generalist' },
  { value: 'maya-r', label: 'Maya R. — Billing Specialist' },
  { value: 'lena-b', label: 'Lena Brandt — Finance Manager' },
  { value: 'rachel', label: 'Rachel Ng — Chief Compliance Officer' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function OOOCoverage() {
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [briefingOn, setBriefingOn]         = useState(true)
  const [briefingScope, setBriefingScope]   = useState('open')
  const [form, setForm] = useState({
    agent: 'jordan', startDate: '', endDate: '',
    coveringAgent: 'sam-v', redistribution: 'immediate', reentryBriefing: true,
  })

  const hasUncovered = oooEntries.some(e => !e.coveringEmployee)

  return (
    <div>
      {/* ── V1.5 banner ─────────────────────────────────────────────────── */}
      <div className="ooo-v15-banner">
        <AlertTriangle size={14} />
        <span>
          <strong>This feature ships in v1.5.</strong>
          {' '}Design shown for planning and stakeholder review purposes. Functionality is illustrative.
        </span>
        <span className="ooo-v15-chip">v1.5</span>
      </div>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">OOO & Coverage</h1>
          <p className="page-subtitle">Out-of-office windows, coverage assignments, and re-entry briefings</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm" icon={CalendarOff}>Coverage Rules</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setDrawerOpen(true)}>Set OOO</Button>
        </div>
      </div>

      {/* ── Uncovered alert ──────────────────────────────────────────────── */}
      {hasUncovered && (
        <div className="ooo-alert">
          <AlertTriangle size={14} />
          <div className="ooo-alert-body">
            <strong>Nadia B.</strong> is OOO with no coverage assigned.
            <span> Whistleblower &amp; Compliance and Legal Sensitive packs are queuing without a human fallback.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(true)}>Assign Coverage</Button>
        </div>
      )}

      {/* ── OOO Entries table ───────────────────────────────────────────── */}
      <div className="rpt-card" style={{ marginBottom: 16 }}>
        <div className="rpt-card-title">Current &amp; Upcoming OOO</div>
        <div className="rpt-card-sub">Active and scheduled windows with item redistribution status</div>
        <table className="ooo-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>OOO Window</th>
              <th>Covering Employee</th>
              <th>Affected Packs</th>
              <th style={{ textAlign: 'center' }}>Items Redistributed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {oooEntries.map(entry => {
              const status = OOO_STATUS[entry.employeeId] ?? { label: 'Active', variant: 'teal' }
              return (
                <tr key={entry.employeeId}>
                  <td>
                    <div className="ooo-emp-name">{entry.name}</div>
                    <div className="ooo-emp-role">{entry.role}</div>
                  </td>
                  <td className="ooo-date-cell">
                    {entry.startDate}
                    <span className="ooo-date-arrow">→</span>
                    {entry.endDate}
                  </td>
                  <td>
                    {entry.coveringEmployee ? (
                      <div className="ooo-covering">
                        <div className="ooo-covering-avatar">
                          {entry.coveringEmployee.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="ooo-covering-name">{entry.coveringEmployee}</div>
                          <div className="ooo-covering-role">{entry.coveringEmployeeRole}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="ooo-uncovered">⚠ None assigned</span>
                    )}
                  </td>
                  <td>
                    <div className="ooo-packs">
                      {entry.affectedPacks.map(p => (
                        <span key={p} className="ooo-pack-chip">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="ooo-items-count">{entry.redistributedItems}</td>
                  <td><Badge label={status.label} variant={status.variant} size="sm" /></td>
                  <td>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Coverage Rules editor ────────────────────────────────────────── */}
      <div className="rpt-card" style={{ marginBottom: 16 }}>
        <div className="rpt-card-title">Coverage Rules</div>
        <div className="rpt-card-sub">Visual routing logic applied automatically when an employee is OOO</div>
        <div className="ooo-rules">
          {COVERAGE_RULES.map(rule => (
            <div
              key={rule.id}
              className={`ooo-rule-card${rule.status === 'warning' ? ' ooo-rule-card--warning' : ''}`}
            >
              <div className="ooo-rule-header">
                <span className="ooo-rule-if">If</span>
                <span className="ooo-rule-label">{rule.employee} is OOO</span>
                <Badge
                  label={rule.status === 'warning' ? 'Incomplete' : 'Active'}
                  variant={rule.status === 'warning' ? 'coral' : 'teal'}
                  size="sm"
                />
                <Button variant="ghost" size="sm">Edit Rule</Button>
              </div>
              <div className="ooo-chain">
                <div className="ooo-chain-pill ooo-chain-pill--employee">
                  <User size={11} />
                  {rule.employee} OOO
                </div>
                <ArrowRight size={12} className="ooo-chain-arrow" />
                <div className="ooo-chain-pill ooo-chain-pill--route">
                  <Users size={11} />
                  Route to {rule.pool}
                </div>
                <ArrowRight size={12} className="ooo-chain-arrow" />
                <div className="ooo-chain-pill ooo-chain-pill--timeout">
                  <Clock size={11} />
                  Timeout {rule.timeoutMin}m
                </div>
                <ArrowRight size={12} className="ooo-chain-arrow" />
                <div className={`ooo-chain-pill ooo-chain-pill--fallback${rule.status === 'warning' ? ' ooo-chain-pill--fallback-warn' : ''}`}>
                  {rule.fallback}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Re-entry Briefing config ─────────────────────────────────────── */}
      <div className="rpt-card">
        <div className="rpt-card-title">Re-entry Briefing</div>
        <div className="rpt-card-sub">AI-generated context briefing delivered to returning employees on first login</div>
        <div className="ooo-reentry">
          {/* Master toggle */}
          <div className="ooo-toggle-row">
            <div>
              <div className="ooo-toggle-label">Enable Re-entry Briefing</div>
              <div className="ooo-toggle-hint">
                AI summarises all activity during the OOO window and delivers it as an in-app briefing
              </div>
            </div>
            <button
              className={`ooo-toggle-btn${briefingOn ? ' ooo-toggle-btn--on' : ''}`}
              onClick={() => setBriefingOn(o => !o)}
              type="button"
            >
              <span className="ooo-toggle-thumb" />
            </button>
          </div>

          {briefingOn && (
            <>
              <div className="ooo-reentry-section">
                <div className="ooo-reentry-label">Briefing Scope</div>
                <div className="ooo-scope-options">
                  {[
                    { value: 'all',      label: 'All items handled',
                      desc: 'Every item processed during the OOO window, regardless of current state' },
                    { value: 'open',     label: 'Open items only',
                      desc: 'Items still requiring action on the employee\'s return' },
                    { value: 'assignee', label: 'Items I was assignee',
                      desc: 'Only items where the returning employee was the original assignee' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`ooo-scope-option${briefingScope === opt.value ? ' ooo-scope-option--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="briefingScope"
                        value={opt.value}
                        checked={briefingScope === opt.value}
                        onChange={() => setBriefingScope(opt.value)}
                      />
                      <div>
                        <div className="ooo-scope-opt-label">{opt.label}</div>
                        <div className="ooo-scope-opt-desc">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="ooo-reentry-section">
                <div className="ooo-reentry-label">Delivery</div>
                <div className="ooo-delivery-row">
                  <Check size={12} className="ooo-delivery-check" />
                  <span>On first login after OOO end date</span>
                </div>
                <div className="ooo-delivery-row">
                  <Info size={12} className="ooo-delivery-info" />
                  <span>
                    Briefing appears as an in-app notification in the Inbox banner. The employee can
                    dismiss it or expand to see full item-by-item detail. Briefing is generated within
                    30 seconds of first login.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Set OOO Drawer ──────────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Set Out of Office"
        subtitle="Configure OOO window and coverage assignment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary">Save OOO Settings</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="Employee"
            options={DRAWER_AGENTS}
            value={form.agent}
            onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input
              label="OOO Start Date" type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="OOO End Date" type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Select
            label="Coverage Agent"
            options={COVERAGE_AGENTS}
            value={form.coveringAgent}
            onChange={e => setForm(f => ({ ...f, coveringAgent: e.target.value }))}
            hint="This agent receives new items during the OOO window"
          />
          <Select
            label="Redistribution Behavior"
            options={[
              { value: 'immediate', label: 'Immediate — route all new items to coverage agent' },
              { value: 'breach',    label: 'On SLA breach — route only if SLA is at risk' },
              { value: 'queue',     label: 'Queue — hold all items until employee returns' },
            ]}
            value={form.redistribution}
            onChange={e => setForm(f => ({ ...f, redistribution: e.target.value }))}
          />
          <div className="ooo-drawer-toggle-row">
            <div>
              <div className="ooo-drawer-toggle-label">Re-entry Briefing</div>
              <div className="ooo-drawer-toggle-hint">
                AI summary delivered on first login after OOO end date
              </div>
            </div>
            <button
              className={`ooo-toggle-btn${form.reentryBriefing ? ' ooo-toggle-btn--on' : ''}`}
              onClick={() => setForm(f => ({ ...f, reentryBriefing: !f.reentryBriefing }))}
              type="button"
            >
              <span className="ooo-toggle-thumb" />
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
