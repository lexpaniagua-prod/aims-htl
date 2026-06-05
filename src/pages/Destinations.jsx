import { useState } from 'react'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import { Drawer } from '../components/Modal.jsx'
import { Plus, CheckCircle, AlertTriangle, ExternalLink, Send, FileText, Zap, Settings } from 'lucide-react'
import './Destinations.css'

const EXTERNAL_SYSTEMS = [
  { id: 'sf',  name: 'Salesforce CRM',  type: 'CRM',       status: 'Connected', lastHandoff: '8m ago',  logo: 'SF', color: '#00A1E0', mappedFields: 12 },
  { id: 'zd',  name: 'Zendesk',         type: 'Ticketing', status: 'Connected', lastHandoff: '34m ago', logo: 'ZD', color: '#03363D', mappedFields: 8  },
  { id: 'jp',  name: 'Jira Projects',   type: 'Ticketing', status: 'Connected', lastHandoff: '2h ago',  logo: 'JP', color: '#0052CC', mappedFields: 6  },
  { id: 'ns',  name: 'NetSuite',        type: 'ERP',       status: 'Error',     lastHandoff: '2d ago',  logo: 'NS', color: '#B5451B', mappedFields: 15 },
]

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

const typeVariant = { CRM: 'blue', Ticketing: 'purple', ERP: 'amber', Messaging: 'teal', Custom: 'gray' }
const statusVariant = { Connected: 'teal', Active: 'blue', Error: 'coral' }

// HTL source fields available for mapping
const HTL_FIELDS = [
  { id: 'item_subject',    label: 'Item subject',          desc: 'The title / subject of the inbox item' },
  { id: 'pack_name',       label: 'Pack name',             desc: 'The HTL pack that fired this handoff' },
  { id: 'pack_id',         label: 'Pack ID',               desc: 'Internal pack identifier' },
  { id: 'priority',        label: 'Priority',              desc: 'High / Medium / Low' },
  { id: 'customer_name',   label: 'Customer name',         desc: 'Name of the end customer' },
  { id: 'customer_email',  label: 'Customer email',        desc: 'Customer email address' },
  { id: 'agent_name',      label: 'Assigned agent',        desc: 'Agent who received the handoff' },
  { id: 'ai_summary',      label: 'AI summary',            desc: 'AI-generated conversation summary' },
  { id: 'ai_reasoning',    label: 'AI reasoning',          desc: 'Why the AI decided to hand off' },
  { id: 'sentiment_score', label: 'Sentiment score',       desc: 'Numeric sentiment at time of handoff (-1 to 1)' },
  { id: 'sla_minutes',     label: 'SLA window (minutes)',  desc: 'Configured SLA for this pack' },
  { id: 'sla_remaining',   label: 'SLA remaining (min)',   desc: 'Minutes remaining when item was routed' },
  { id: 'item_status',     label: 'Item status',           desc: 'Open / Resolved / Escalated etc.' },
  { id: 'handoff_ts',      label: 'Handoff timestamp',     desc: 'ISO timestamp when the handoff occurred' },
  { id: 'resolution_notes',label: 'Resolution notes',      desc: 'Agent notes on resolution' },
  { id: 'sensitive_signal',label: 'Sensitive signal class',desc: 'If a sensitive class was detected' },
]

// Realistic default mappings per connector
const DEFAULT_MAPPINGS = {
  sf: [
    { htlField: 'item_subject',    destField: 'Case.Subject',                writable: true  },
    { htlField: 'priority',        destField: 'Case.Priority',               writable: true  },
    { htlField: 'customer_name',   destField: 'Contact.Name',                writable: false },
    { htlField: 'customer_email',  destField: 'Contact.Email',               writable: false },
    { htlField: 'agent_name',      destField: 'Case.OwnerId',                writable: true  },
    { htlField: 'ai_summary',      destField: 'Case.Description',            writable: true  },
    { htlField: 'ai_reasoning',    destField: 'Case.HTL_AI_Reasoning__c',    writable: true  },
    { htlField: 'sentiment_score', destField: 'Case.HTL_Sentiment__c',       writable: true  },
    { htlField: 'item_status',     destField: 'Case.Status',                 writable: true  },
    { htlField: 'pack_name',       destField: 'Case.Type',                   writable: true  },
    { htlField: 'pack_id',         destField: 'Case.HTL_Pack_ID__c',         writable: true  },
    { htlField: 'handoff_ts',      destField: 'Case.CreatedDate',            writable: false },
  ],
  zd: [
    { htlField: 'item_subject',    destField: 'ticket.subject',              writable: true  },
    { htlField: 'priority',        destField: 'ticket.priority',             writable: true  },
    { htlField: 'customer_name',   destField: 'ticket.requester.name',       writable: false },
    { htlField: 'customer_email',  destField: 'ticket.requester.email',      writable: false },
    { htlField: 'agent_name',      destField: 'ticket.assignee.name',        writable: true  },
    { htlField: 'ai_summary',      destField: 'ticket.comment.body',         writable: true  },
    { htlField: 'pack_name',       destField: 'ticket.custom_fields.htl_pack', writable: true },
    { htlField: 'item_status',     destField: 'ticket.status',               writable: true  },
  ],
  jp: [
    { htlField: 'item_subject',    destField: 'issue.fields.summary',        writable: true  },
    { htlField: 'priority',        destField: 'issue.fields.priority.name',  writable: true  },
    { htlField: 'customer_name',   destField: 'issue.fields.reporter.displayName', writable: false },
    { htlField: 'ai_summary',      destField: 'issue.fields.description',    writable: true  },
    { htlField: 'pack_name',       destField: 'issue.fields.labels',         writable: true  },
    { htlField: 'agent_name',      destField: 'issue.fields.assignee.name',  writable: true  },
  ],
  ns: [
    { htlField: 'item_subject',    destField: 'transaction.memo',            writable: true  },
    { htlField: 'customer_name',   destField: 'entity.companyName',          writable: false },
    { htlField: 'customer_email',  destField: 'entity.email',                writable: false },
    { htlField: 'agent_name',      destField: 'transaction.approvedBy',      writable: true  },
    { htlField: 'priority',        destField: 'transaction.htlPriority',     writable: true  },
    { htlField: 'ai_summary',      destField: 'transaction.notes',           writable: true  },
    { htlField: 'item_status',     destField: 'transaction.approvalStatus',  writable: true  },
    { htlField: 'handoff_ts',      destField: 'transaction.tranDate',        writable: false },
    { htlField: 'sla_minutes',     destField: 'transaction.expectedSLAMins', writable: true  },
    { htlField: 'pack_id',         destField: 'transaction.externalId',      writable: true  },
    { htlField: 'resolution_notes',destField: 'transaction.resolutionNote',  writable: true  },
    { htlField: 'sensitive_signal',destField: 'transaction.complianceFlag',  writable: true  },
  ],
}

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
  const [fieldMappingOpen, setFieldMappingOpen] = useState(false)
  const [mappingSystem, setMappingSystem] = useState(null)
  const [mappings, setMappings] = useState({})

  function openFieldMapping(system) {
    setMappingSystem(system)
    setMappings(prev => ({
      ...prev,
      [system.id]: (prev[system.id] || DEFAULT_MAPPINGS[system.id] || []).map(m => ({ ...m })),
    }))
    setFieldMappingOpen(true)
  }

  function updateMappingDest(systemId, idx, value) {
    setMappings(prev => ({
      ...prev,
      [systemId]: prev[systemId].map((m, i) => i === idx ? { ...m, destField: value } : m),
    }))
  }

  function addMapping(systemId) {
    setMappings(prev => ({
      ...prev,
      [systemId]: [...(prev[systemId] || []), { htlField: 'item_subject', destField: '', writable: true }],
    }))
  }

  function removeMapping(systemId, idx) {
    setMappings(prev => ({
      ...prev,
      [systemId]: prev[systemId].filter((_, i) => i !== idx),
    }))
  }

  function openTemplateDrawer(channel) {
    setSelectedChannel(channel)
    setTemplateDrawerOpen(true)
  }

  const previewChannel = selectedChannel ?? CHANNELS[0]
  const previewVars = extractVars(previewChannel.template)

  const connectorGroups = groupBy(CONNECTOR_TYPES, 'type')

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
        <button
          className={`dest-tab${tab === 'external' ? ' dest-tab--active' : ''}`}
          onClick={() => setTab('external')}
        >
          External Systems
        </button>
        <button
          className={`dest-tab${tab === 'channels' ? ' dest-tab--active' : ''}`}
          onClick={() => setTab('channels')}
        >
          Lightweight Channels
        </button>
      </div>

      {tab === 'external' && (
        <div>
          <div className="ext-cards-grid">
            {EXTERNAL_SYSTEMS.map(system => (
              <div
                key={system.id}
                className={`ext-card${system.status === 'Error' ? ' ext-card--error' : ''}`}
              >
                <div className="ext-card-top">
                  <div
                    className="ext-logo"
                    style={{
                      background: system.color + '33',
                      color: system.color,
                    }}
                  >
                    {system.logo}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ext-card-name">{system.name}</div>
                    <Badge label={system.type} variant={typeVariant[system.type] ?? 'gray'} size="sm" />
                  </div>
                </div>

                <div className={`ext-status ext-status--${system.status === 'Error' ? 'error' : 'connected'}`}>
                  {system.status === 'Error'
                    ? <AlertTriangle size={13} />
                    : <CheckCircle size={13} />
                  }
                  <span>{system.status}</span>
                </div>

                {system.status === 'Error' && (
                  <div className="ext-error-banner">
                    Connection error — last sync failed 2d ago. Check API credentials.
                  </div>
                )}

                <div className="ext-meta">
                  <span>Last handoff: {system.lastHandoff}</span>
                  <span>{system.mappedFields} mapped fields</span>
                </div>

                <div className="ext-actions">
                  <Button variant="secondary" size="sm" icon={Settings} onClick={() => openFieldMapping(system)}>
                    Field Mapping
                  </Button>
                </div>
              </div>
            ))}
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
                <Badge
                  label={channel.status}
                  variant={statusVariant[channel.status] ?? 'gray'}
                  size="sm"
                />
                <div className="channel-actions">
                  <Button variant="secondary" size="sm" icon={Send}>
                    Test Send
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FileText}
                    onClick={() => openTemplateDrawer(channel)}
                  >
                    Edit Template
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="template-preview-panel">
            <div className="template-preview-header">Message Template Preview</div>
            <div className="template-preview-channel">
              <div className="channel-icon" style={{ width: 32, height: 32, fontSize: 16 }}>
                {previewChannel.icon}
              </div>
              <div>
                <div className="channel-name">{previewChannel.name}</div>
                <div className="channel-detail">{previewChannel.detail}</div>
              </div>
            </div>
            <pre className="template-code">{previewChannel.template}</pre>
            <div className="template-vars">
              {previewVars.map(v => (
                <span key={v} className="template-var-chip">{v}</span>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={FileText}
              onClick={() => openTemplateDrawer(previewChannel)}
            >
              Edit Template
            </Button>
          </div>
        </div>
      )}

      {/* Add Connector Drawer */}
      <Drawer
        open={addDrawerOpen}
        onClose={() => { setAddDrawerOpen(false); setSelectedConnector(null) }}
        title="Integrations Available"
        subtitle="Connect an external system"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddDrawerOpen(false); setSelectedConnector(null) }}>
              Cancel
            </Button>
            <Button variant="primary" icon={Zap}>
              Connect
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Info note */}
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
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-tertiary)',
                marginBottom: 8,
              }}>
                {groupType}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(connector => (
                  <div
                    key={connector.id}
                    onClick={() => setSelectedConnector(connector.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${selectedConnector === connector.id ? 'var(--accent-blue-border)' : 'var(--border)'}`,
                      background: selectedConnector === connector.id ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{connector.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {connector.name}
                    </span>
                    <Badge label={connector.type} variant={typeVariant[connector.type] ?? 'gray'} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Field Mapping Drawer */}
      <Drawer
        open={fieldMappingOpen}
        onClose={() => setFieldMappingOpen(false)}
        title={`Field Mapping — ${mappingSystem?.name ?? ''}`}
        subtitle="Map HTL item fields to destination fields. The integration connection is managed in Settings → Integrations."
        footer={
          <>
            <Button variant="secondary" onClick={() => setFieldMappingOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setFieldMappingOpen(false)}>Save Mappings</Button>
          </>
        }
      >
        {mappingSystem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Context note */}
            <div style={{ padding: '10px 13px', background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              These mappings define which HTL fields are written to <strong style={{ color: 'var(--text-secondary)' }}>{mappingSystem.name}</strong> when an item is handed off.
              The integration credentials and connection are configured in{' '}
              <a href="/aims-htl/settings/integrations" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>Settings → Integrations ↗</a>.
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 16px 1fr 28px', gap: 8, padding: '0 2px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>HTL field</div>
              <div />
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{mappingSystem.name} field</div>
              <div />
            </div>

            {/* Mapping rows */}
            {(mappings[mappingSystem.id] || []).map((m, idx) => {
              const htlField = HTL_FIELDS.find(f => f.id === m.htlField)
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 16px 1fr 28px', gap: 8, alignItems: 'center' }}>
                  {/* HTL field picker */}
                  <select
                    value={m.htlField}
                    onChange={e => setMappings(prev => ({ ...prev, [mappingSystem.id]: prev[mappingSystem.id].map((r, i) => i === idx ? { ...r, htlField: e.target.value } : r) }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                    title={htlField?.desc}
                  >
                    {HTL_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>

                  {/* Arrow */}
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>→</div>

                  {/* Destination field */}
                  <input
                    value={m.destField}
                    onChange={e => updateMappingDest(mappingSystem.id, idx, e.target.value)}
                    placeholder="destination.field.path"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'DM Mono, monospace', outline: 'none' }}
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removeMapping(mappingSystem.id, idx)}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, color: 'var(--text-tertiary)', transition: 'color 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-coral)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                  >
                    <ExternalLink size={12} style={{ display: 'none' }} />
                    ✕
                  </button>
                </div>
              )
            })}

            {/* Add row */}
            <button
              onClick={() => addMapping(mappingSystem.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 14px', border: '1.5px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color 0.12s, color 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue-border)'; e.currentTarget.style.color = 'var(--accent-blue)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              + Add field mapping
            </button>

            {/* Mapped count */}
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'right', paddingTop: 4 }}>
              {(mappings[mappingSystem.id] || []).length} field{(mappings[mappingSystem.id] || []).length !== 1 ? 's' : ''} mapped
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Template Drawer */}
      <Drawer
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        title="Edit Template"
        subtitle={selectedChannel ? selectedChannel.name : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTemplateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Template
            </Button>
          </>
        }
      >
        {selectedChannel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Template
              </label>
              <textarea
                defaultValue={selectedChannel.template}
                rows={6}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontFamily: 'DM Mono',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: 10,
              }}>
                Available Variables
              </div>
              <div className="template-vars">
                {extractVars(selectedChannel.template).map(v => (
                  <span key={v} className="template-var-chip">{v}</span>
                ))}
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
