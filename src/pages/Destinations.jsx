import { useState } from 'react'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import { Drawer } from '../components/Modal.jsx'
import { Plus, CheckCircle, AlertTriangle, Send, FileText, Zap, Sliders, MoreHorizontal, Search } from 'lucide-react'
import './Destinations.css'

const EXTERNAL_SYSTEMS = [
  {
    id: 'sf', name: 'Salesforce CRM', type: 'CRM', status: 'Connected', lastHandoff: '8m ago',
    logo: 'SF', color: '#00A1E0', usedInPacks: 4,
    description: 'Routes high-value items into Salesforce — creating opportunities, updating contacts, and logging activities based on Pack rules.',
  },
  {
    id: 'zd', name: 'Zendesk', type: 'Ticketing', status: 'Connected', lastHandoff: '34m ago',
    logo: 'ZD', color: '#03363D', usedInPacks: 3,
    description: 'Turns HTL items into Zendesk tickets and keeps them in sync across status changes, escalations, and agent responses.',
  },
  {
    id: 'jp', name: 'Jira Projects', type: 'Ticketing', status: 'Connected', lastHandoff: '2h ago',
    logo: 'JP', color: '#0052CC', usedInPacks: 2,
    description: 'Creates and updates Jira issues when HTL items require engineering follow-up or cross-team tracking.',
  },
  {
    id: 'ns', name: 'NetSuite', type: 'ERP', status: 'Error', lastHandoff: '2d ago',
    logo: 'NS', color: '#B5451B', usedInPacks: 1,
    description: 'Logs financial transactions and creates vendor or PO records in NetSuite when items trigger back-office actions.',
  },
]

// All available destination actions per system.
// `on` = enabled by default (available to pack builders).
const SYSTEM_ACTIONS = {
  sf: [
    { id: 'create_opportunity', label: 'Create opportunity',  on: true,  desc: 'Opens a new sales opportunity from this item',                    lastUsed: '8m ago',  usedInPacks: 3 },
    { id: 'update_contact',     label: 'Update contact',      on: true,  desc: 'Updates name, email, and status on an existing contact record',    lastUsed: '34m ago', usedInPacks: 2 },
    { id: 'log_activity',       label: 'Log activity',        on: true,  desc: 'Logs a task or call activity on a related record',                 lastUsed: '1h ago',  usedInPacks: 1 },
    { id: 'create_case',        label: 'Create case',         on: false, desc: 'Opens a new support case linked to the customer account',          lastUsed: null,      usedInPacks: 0 },
    { id: 'close_opportunity',  label: 'Close opportunity',   on: false, desc: 'Marks an existing opportunity as won or lost',                     lastUsed: null,      usedInPacks: 0 },
    { id: 'custom',             label: 'Custom (webhook)',     on: true,  desc: 'Execute a custom Apex action via an outbound webhook',             lastUsed: '3h ago',  usedInPacks: 1 },
  ],
  zd: [
    { id: 'create_ticket', label: 'Create ticket',    on: true,  desc: 'Opens a new support ticket for this item',                              lastUsed: '12m ago', usedInPacks: 3 },
    { id: 'update_ticket', label: 'Update ticket',    on: true,  desc: 'Updates status, priority, or assignee on an existing ticket',           lastUsed: '45m ago', usedInPacks: 2 },
    { id: 'close_ticket',  label: 'Close ticket',     on: true,  desc: 'Resolves and closes the associated ticket',                             lastUsed: '2h ago',  usedInPacks: 1 },
    { id: 'add_comment',   label: 'Add comment',      on: false, desc: 'Posts an internal or public note on an existing ticket',                lastUsed: null,      usedInPacks: 0 },
    { id: 'escalate',      label: 'Escalate ticket',  on: false, desc: 'Triggers an escalation workflow inside Zendesk',                        lastUsed: null,      usedInPacks: 0 },
    { id: 'custom',        label: 'Custom (webhook)', on: false, desc: 'Trigger a custom Zendesk action via webhook',                           lastUsed: null,      usedInPacks: 0 },
  ],
  jp: [
    { id: 'create_issue',  label: 'Create issue',     on: true,  desc: 'Opens a new Jira issue in the configured project',                      lastUsed: '2h ago',  usedInPacks: 2 },
    { id: 'update_issue',  label: 'Update issue',     on: true,  desc: 'Updates summary, status, or assignee on an existing issue',             lastUsed: '4h ago',  usedInPacks: 1 },
    { id: 'log_comment',   label: 'Log comment',      on: true,  desc: 'Adds a comment with AI summary to an existing issue',                   lastUsed: '6h ago',  usedInPacks: 1 },
    { id: 'close_issue',   label: 'Close issue',      on: false, desc: 'Transitions the issue to Done or Closed state',                         lastUsed: null,      usedInPacks: 0 },
    { id: 'assign_issue',  label: 'Assign issue',     on: false, desc: 'Reassigns an open issue to the routed agent',                           lastUsed: null,      usedInPacks: 0 },
    { id: 'custom',        label: 'Custom (webhook)', on: false, desc: 'Call a custom Jira automation via webhook',                             lastUsed: null,      usedInPacks: 0 },
  ],
  ns: [
    { id: 'create_record',   label: 'Create record',    on: true,  desc: 'Creates a new transaction or entity record',                          lastUsed: '2d ago',  usedInPacks: 1 },
    { id: 'update_vendor',   label: 'Update vendor',    on: true,  desc: 'Updates vendor details linked to this item',                           lastUsed: '2d ago',  usedInPacks: 1 },
    { id: 'log_transaction', label: 'Log transaction',  on: true,  desc: 'Appends a note or memo to a transaction record',                       lastUsed: null,      usedInPacks: 0 },
    { id: 'create_po',       label: 'Create PO',        on: false, desc: 'Generates a new purchase order from this item',                        lastUsed: null,      usedInPacks: 0 },
    { id: 'custom',          label: 'Custom (webhook)', on: false, desc: 'Execute a custom SuiteScript via webhook',                             lastUsed: null,      usedInPacks: 0 },
  ],
}

const INITIAL_ACTION_DEFAULTS = {
  sf: {
    create_opportunity: { configured: true,  stage: 'Prospecting', owner: 'htl_assigned_agent', recordType: 'Standard Opportunity' },
    update_contact:     { configured: false },
    log_activity:       { configured: true,  activityType: 'Task', linkTo: 'Contact' },
  },
  jp: {
    create_issue: { configured: true, project: 'Support (HSK)', issueType: 'Task', mapPriority: true },
  },
  zd: {},
  ns: {},
}

function defaultEnabled(systemId) {
  const result = {}
  for (const a of (SYSTEM_ACTIONS[systemId] || [])) result[a.id] = a.on
  return result
}

const CHANNELS = [
  { id: 'slack', name: 'Slack',  detail: 'AIMS Team workspace · #htl-escalations', status: 'Connected', icon: '💬', template: 'New item: {{pack_name}} · SLA {{sla_minutes}}m · Assigned to {{agent_name}}' },
  { id: 'teams', name: 'Teams',  detail: 'Acme Corp tenant',                        status: 'Connected', icon: '📋', template: '🔔 HTL Alert: {{item_subject}} — {{pack_name}} ({{priority}})' },
  { id: 'sms',   name: 'SMS',    detail: '3 numbers configured',                    status: 'Active',    icon: '📱', template: 'HTL: New {{priority}} item. Login to review: {{item_url}}' },
  { id: 'email', name: 'Email',  detail: 'escalations@company.com',                 status: 'Active',    icon: '✉️', template: 'Subject: [HTL] {{item_subject}}\n\nPack: {{pack_name}}\nSLA: {{sla_minutes}} min\nAssigned: {{agent_name}}\n\n{{ai_summary}}' },
]

const CONNECTOR_TYPES = [
  { id: 'salesforce', name: 'Salesforce', type: 'CRM',       icon: '☁️' },
  { id: 'hubspot',    name: 'HubSpot',    type: 'CRM',       icon: '🟠' },
  { id: 'zendesk',    name: 'Zendesk',    type: 'Ticketing', icon: '🎫' },
  { id: 'jira',       name: 'Jira',       type: 'Ticketing', icon: '🔵' },
  { id: 'linear',     name: 'Linear',     type: 'Ticketing', icon: '🟣' },
  { id: 'netsuite',   name: 'NetSuite',   type: 'ERP',       icon: '🟤' },
  { id: 'sap',        name: 'SAP',        type: 'ERP',       icon: '🔷' },
  { id: 'slack',      name: 'Slack',      type: 'Messaging', icon: '💬' },
  { id: 'teams',      name: 'Teams',      type: 'Messaging', icon: '📋' },
  { id: 'webhook',    name: 'Webhook',    type: 'Custom',    icon: '🔗' },
]

const typeVariant   = { CRM: 'blue', Ticketing: 'purple', ERP: 'amber', Messaging: 'teal', Custom: 'gray' }
const statusVariant = { Connected: 'teal', Active: 'blue', Error: 'coral' }

function extractVars(template) {
  const matches = template.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches)]
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

export default function Destinations() {
  const [tab, setTab] = useState('external')
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [selectedConnector, setSelectedConnector] = useState(null)
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false)
  const [actionsSystem, setActionsSystem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  // { systemId: { actionId: boolean } }
  const [enabledActions, setEnabledActions] = useState({})
  const [expandedAction, setExpandedAction] = useState(null)  // 'systemId__actionId'
  const [actionDefaults, setActionDefaults] = useState(INITIAL_ACTION_DEFAULTS)
  const [panelDraft, setPanelDraft] = useState(null)

  function openActionsDrawer(system) {
    setActionsSystem(system)
    setEnabledActions(prev => ({
      ...prev,
      [system.id]: prev[system.id] || defaultEnabled(system.id),
    }))
    setExpandedAction(null)
    setPanelDraft(null)
    setActionsDrawerOpen(true)
  }

  function openConfigPanel(systemId, actionId) {
    const key = `${systemId}__${actionId}`
    if (expandedAction === key) {
      setExpandedAction(null)
      setPanelDraft(null)
      return
    }
    const current = (actionDefaults[systemId] || {})[actionId] || { configured: false }
    setExpandedAction(key)
    setPanelDraft({ ...current })
  }

  function saveDefaults(systemId, actionId) {
    setActionDefaults(prev => ({
      ...prev,
      [systemId]: { ...(prev[systemId] || {}), [actionId]: { ...panelDraft, configured: true } },
    }))
    setExpandedAction(null)
    setPanelDraft(null)
  }

  function cancelConfig() {
    setExpandedAction(null)
    setPanelDraft(null)
  }

  function renderConfigFields(systemId, actionId) {
    const upd = (field, val) => setPanelDraft(prev => ({ ...prev, [field]: val }))
    if (systemId === 'sf' && actionId === 'create_opportunity') return (
      <>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default pipeline / stage</label>
          <select className="act-cfg-select" value={panelDraft?.stage ?? 'Prospecting'} onChange={e => upd('stage', e.target.value)}>
            {['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default owner</label>
          <select className="act-cfg-select" value={panelDraft?.owner ?? 'htl_assigned_agent'} onChange={e => upd('owner', e.target.value)}>
            <option value="htl_assigned_agent">HTL assigned agent</option>
            <option value="account_owner">Account owner</option>
            <option value="queue_default">Queue default</option>
          </select>
        </div>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default record type</label>
          <select className="act-cfg-select" value={panelDraft?.recordType ?? 'Standard Opportunity'} onChange={e => upd('recordType', e.target.value)}>
            {['Standard Opportunity', 'Enterprise Deal', 'Renewal'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </>
    )
    if (systemId === 'sf' && actionId === 'log_activity') return (
      <>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default activity type</label>
          <select className="act-cfg-select" value={panelDraft?.activityType ?? 'Task'} onChange={e => upd('activityType', e.target.value)}>
            {['Task', 'Call', 'Email', 'Note'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Link to record</label>
          <select className="act-cfg-select" value={panelDraft?.linkTo ?? 'Contact'} onChange={e => upd('linkTo', e.target.value)}>
            {['Contact', 'Account', 'Opportunity'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </>
    )
    if (systemId === 'jp' && actionId === 'create_issue') return (
      <>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default project</label>
          <select className="act-cfg-select" value={panelDraft?.project ?? 'Support (HSK)'} onChange={e => upd('project', e.target.value)}>
            {['Product (PROD)', 'Support (HSK)', 'Engineering (ENG)'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default issue type</label>
          <select className="act-cfg-select" value={panelDraft?.issueType ?? 'Task'} onChange={e => upd('issueType', e.target.value)}>
            {['Bug', 'Task', 'Story', 'Epic'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label className="act-cfg-check-row">
          <input type="checkbox" checked={panelDraft?.mapPriority ?? false} onChange={e => upd('mapPriority', e.target.checked)} />
          Map HTL priority to Jira priority
        </label>
      </>
    )
    if (systemId === 'zd' && actionId === 'create_ticket') return (
      <>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default ticket form</label>
          <select className="act-cfg-select" value={panelDraft?.form ?? 'Standard Support'} onChange={e => upd('form', e.target.value)}>
            {['Standard Support', 'Enterprise Support', 'Billing Issue'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="act-cfg-field">
          <label className="act-cfg-label">Default group assignment</label>
          <select className="act-cfg-select" value={panelDraft?.groupAssignment ?? 'Support Tier 1'} onChange={e => upd('groupAssignment', e.target.value)}>
            {['Support Tier 1', 'Support Tier 2', 'Billing Team'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </>
    )
    return <div className="act-cfg-empty">No configurable defaults for this action.</div>
  }

  function toggleAction(systemId, actionId) {
    setEnabledActions(prev => ({
      ...prev,
      [systemId]: {
        ...prev[systemId],
        [actionId]: !prev[systemId][actionId],
      },
    }))
  }

  function getEnabledCount(systemId) {
    const state = enabledActions[systemId]
    const actions = SYSTEM_ACTIONS[systemId] || []
    if (!state) return actions.filter(a => a.on).length
    return actions.filter(a => state[a.id]).length
  }

  function openTemplateDrawer(channel) {
    setSelectedChannel(channel)
    setTemplateDrawerOpen(true)
  }

  const previewChannel  = selectedChannel ?? CHANNELS[0]
  const previewVars     = extractVars(previewChannel.template)
  const connectorGroups = groupBy(CONNECTOR_TYPES, 'type')

  const filteredSystems = EXTERNAL_SYSTEMS.filter(s => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)
    const matchesType   = !typeFilter || s.type === typeFilter
    return matchesSearch && matchesType
  })

  const allTypes = [...new Set(EXTERNAL_SYSTEMS.map(s => s.type))]

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Destinations</h1>
          <p className="page-subtitle">Connected external systems and lightweight notification channels</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddDrawerOpen(true)}>
            Add Connector
          </Button>
        </div>
      </div>

      <div className="dest-tabs">
        <button className={`dest-tab${tab === 'external' ? ' dest-tab--active' : ''}`} onClick={() => setTab('external')}>
          External Systems
        </button>
        <button className={`dest-tab${tab === 'channels' ? ' dest-tab--active' : ''}`} onClick={() => setTab('channels')}>
          Lightweight Channels
        </button>
      </div>

      {tab === 'external' && (
        <div>
          {/* Search + filter bar */}
          <div className="ext-toolbar">
            <div className="ext-search-wrap">
              <Search size={13} className="ext-search-icon" />
              <input
                className="ext-search-input"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="ext-type-filter"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Integration rows */}
          <div className="ext-list">
            {filteredSystems.map(system => {
              const actions = SYSTEM_ACTIONS[system.id] || []
              const enabled = getEnabledCount(system.id)
              const isError = system.status === 'Error'
              return (
                <div key={system.id} className={`ext-row${isError ? ' ext-row--error' : ''}`}>
                  <div className="ext-row-inner">
                    <div className="ext-logo" style={{ background: system.color + '33', color: system.color }}>
                      {system.logo}
                    </div>
                    <div className="ext-row-body">
                      <div className="ext-row-name-line">
                        <span className="ext-row-name">{system.name}</span>
                        <Badge label={system.type} variant={typeVariant[system.type] ?? 'gray'} size="sm" />
                      </div>
                      <div className="ext-row-desc">{system.description}</div>
                      <div className="ext-row-status-line">
                        <span className={`ext-status ext-status--${isError ? 'error' : 'connected'}`}>
                          {isError ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                          <span>{isError ? 'Error' : 'Connected'}</span>
                        </span>
                        <span className="ext-dot">·</span>
                        <span className="ext-row-handoff">Last handoff: {system.lastHandoff}</span>
                      </div>
                      <div className="ext-row-meta-line">
                        <span>{enabled} of {actions.length} actions enabled</span>
                        <span className="ext-dot">·</span>
                        <span>Used in {system.usedInPacks} pack{system.usedInPacks !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="ext-row-actions">
                      <Button variant="secondary" size="sm" icon={Sliders} onClick={() => openActionsDrawer(system)}>
                        Actions
                      </Button>
                      <button className="ext-kebab" title="More options">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </div>
                  {isError && (
                    <div className="ext-error-sub">
                      <AlertTriangle size={12} />
                      <span>Connection error — last sync failed 2d ago. Check API credentials in Settings → Integrations.</span>
                    </div>
                  )}
                </div>
              )
            })}
            {filteredSystems.length === 0 && (
              <div className="ext-empty">No integrations match your search.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'channels' && (
        <div className="channels-layout">
          <div className="channels-list">
            {CHANNELS.map(channel => (
              <div key={channel.id} className="channel-row">
                <div className="channel-icon">{channel.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="channel-name">{channel.name}</div>
                  <div className="channel-detail">{channel.detail}</div>
                </div>
                <Badge label={channel.status} variant={statusVariant[channel.status] ?? 'gray'} size="sm" />
                <div className="channel-actions">
                  <Button variant="secondary" size="sm" icon={Send}>Test Send</Button>
                  <Button variant="secondary" size="sm" icon={FileText} onClick={() => openTemplateDrawer(channel)}>
                    Edit Template
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="template-preview-panel">
            <div className="template-preview-header">Message Template Preview</div>
            <div className="template-preview-channel">
              <div className="channel-icon" style={{ width: 32, height: 32, fontSize: 16 }}>{previewChannel.icon}</div>
              <div>
                <div className="channel-name">{previewChannel.name}</div>
                <div className="channel-detail">{previewChannel.detail}</div>
              </div>
            </div>
            <pre className="template-code">{previewChannel.template}</pre>
            <div className="template-vars">
              {previewVars.map(v => <span key={v} className="template-var-chip">{v}</span>)}
            </div>
            <Button variant="secondary" size="sm" icon={FileText} onClick={() => openTemplateDrawer(previewChannel)}>
              Edit Template
            </Button>
          </div>
        </div>
      )}

      {/* ── Add Connector Drawer ──────────────────────────────────────────────── */}
      <Drawer
        open={addDrawerOpen}
        onClose={() => { setAddDrawerOpen(false); setSelectedConnector(null) }}
        title="Integrations Available"
        subtitle="Connect an external system"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddDrawerOpen(false); setSelectedConnector(null) }}>Cancel</Button>
            <Button variant="primary" icon={Zap}>Connect</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', borderRadius: 9, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
            <span>
              Only integrations already configured in your workspace are listed here.
              If you don't see the connector you need,{' '}
              <a href="/aims-htl/settings/integrations" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                go to Settings → Integrations ↗
              </a>{' '}
              to set it up first — then it will appear here.
            </span>
          </div>
          {Object.entries(connectorGroups).map(([groupType, items]) => (
            <div key={groupType}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>{groupType}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(connector => (
                  <div
                    key={connector.id}
                    onClick={() => setSelectedConnector(connector.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${selectedConnector === connector.id ? 'var(--accent-blue-border)' : 'var(--border)'}`,
                      background: selectedConnector === connector.id ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                      cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{connector.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{connector.name}</span>
                    <Badge label={connector.type} variant={typeVariant[connector.type] ?? 'gray'} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* ── Actions Drawer ────────────────────────────────────────────────────── */}
      <Drawer
        open={actionsDrawerOpen}
        onClose={() => setActionsDrawerOpen(false)}
        title={`Available actions — ${actionsSystem?.name ?? ''}`}
        subtitle="These are the actions a Pack builder can choose from when adding this integration as a destination. Enable the ones your tenant uses. Configuration happens inside each Pack."
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setActionsDrawerOpen(false)}>Save</Button>
          </>
        }
      >
        {actionsSystem && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="act-list">
              {(SYSTEM_ACTIONS[actionsSystem.id] || []).map(action => {
                const isOn         = (enabledActions[actionsSystem.id] || {})[action.id] ?? action.on
                const defaults     = (actionDefaults[actionsSystem.id] || {})[action.id]
                const isConfigured = isOn && defaults?.configured
                const isExpanded   = expandedAction === `${actionsSystem.id}__${action.id}`
                return (
                  <div key={action.id} className="act-row-wrap">
                    <div className="act-row">
                      <div
                        className={`act-toggle${isOn ? ' act-toggle--on' : ''}`}
                        onClick={() => toggleAction(actionsSystem.id, action.id)}
                        role="switch"
                        aria-checked={isOn}
                      >
                        <div className="act-toggle-thumb" />
                      </div>
                      <div className="act-body">
                        <div className={`act-name${isOn ? '' : ' act-name--off'}`}>{action.label}</div>
                        <div className="act-desc">{action.desc}</div>
                        <div className="act-last-used">
                          {action.lastUsed
                            ? `${action.usedInPacks} active instance${action.usedInPacks !== 1 ? 's' : ''} · Last used ${action.lastUsed}`
                            : 'Not yet used in any Pack'
                          }
                        </div>
                        {isOn && !isConfigured && (
                          <div className="act-no-defaults">No defaults set — Pack builders start from scratch</div>
                        )}
                      </div>
                      {isOn && (
                        <button
                          className={`act-cfg-btn${isConfigured ? ' act-cfg-btn--configured' : ''}`}
                          onClick={() => openConfigPanel(actionsSystem.id, action.id)}
                        >
                          {isConfigured ? '✓ Defaults configured' : 'Configure defaults'}
                        </button>
                      )}
                    </div>
                    {isExpanded && panelDraft && (
                      <div className="act-cfg-panel">
                        {renderConfigFields(actionsSystem.id, action.id)}
                        <div className="act-cfg-info">
                          These are the starting values when a Pack builder picks this action. They can change them per Pack — this won't be affected.
                        </div>
                        <div className="act-cfg-foot">
                          <button className="act-cfg-save" onClick={() => saveDefaults(actionsSystem.id, action.id)}>Save defaults</button>
                          <button className="act-cfg-cancel" onClick={cancelConfig}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="act-footer-note">
              {getEnabledCount(actionsSystem.id)} of {(SYSTEM_ACTIONS[actionsSystem.id] || []).length} actions available to Pack builders
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Edit Template Drawer ──────────────────────────────────────────────── */}
      <Drawer
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        title="Edit Template"
        subtitle={selectedChannel?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTemplateDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary">Save Template</Button>
          </>
        }
      >
        {selectedChannel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Template
              </label>
              <textarea
                defaultValue={selectedChannel.template}
                rows={6}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                Available Variables
              </div>
              <div className="template-vars">
                {extractVars(selectedChannel.template).map(v => <span key={v} className="template-var-chip">{v}</span>)}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.6 }}>
                Use <code style={{ fontFamily: 'DM Mono', color: 'var(--accent-blue)' }}>{'{{variable}}'}</code> syntax to insert dynamic values at send time.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
