import { useState } from 'react'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import { Drawer } from '../components/Modal.jsx'
import { Plus, CheckCircle, AlertTriangle, ExternalLink, Send, FileText, Zap, Settings } from 'lucide-react'
import './Destinations.css'

const EXTERNAL_SYSTEMS = [
  { id: 'sf', name: 'Salesforce CRM', type: 'CRM',       status: 'Connected', lastHandoff: '8m ago',  logo: 'SF', color: '#00A1E0', usedInPacks: 4 },
  { id: 'zd', name: 'Zendesk',        type: 'Ticketing', status: 'Connected', lastHandoff: '34m ago', logo: 'ZD', color: '#03363D', usedInPacks: 3 },
  { id: 'jp', name: 'Jira Projects',  type: 'Ticketing', status: 'Connected', lastHandoff: '2h ago',  logo: 'JP', color: '#0052CC', usedInPacks: 2 },
  { id: 'ns', name: 'NetSuite',       type: 'ERP',       status: 'Error',     lastHandoff: '2d ago',  logo: 'NS', color: '#B5451B', usedInPacks: 1 },
]

// Per-system action definitions
const SYSTEM_ACTIONS = {
  sf: [
    { id: 'create_opportunity', label: 'Create opportunity' },
    { id: 'update_contact',     label: 'Update contact'     },
    { id: 'log_activity',       label: 'Log activity'       },
    { id: 'custom',             label: 'Custom'             },
  ],
  zd: [
    { id: 'create_ticket', label: 'Create ticket' },
    { id: 'update_ticket', label: 'Update ticket' },
  ],
  jp: [
    { id: 'create_issue', label: 'Create issue' },
    { id: 'update_issue', label: 'Update issue' },
  ],
  ns: [
    { id: 'create_record', label: 'Create record' },
  ],
}

// Default mappings — action-scoped
const DEFAULT_MAPPINGS = {
  sf: {
    create_opportunity: [
      { htlField: 'item_subject',  destField: 'Opportunity.Name'        },
      { htlField: 'customer_name', destField: 'Opportunity.AccountId'   },
      { htlField: 'priority',      destField: 'Opportunity.Priority__c' },
      { htlField: 'ai_summary',    destField: 'Opportunity.Description' },
      { htlField: 'agent_name',    destField: 'Opportunity.OwnerId'     },
    ],
    update_contact: [
      { htlField: 'customer_name',   destField: 'Contact.Name'             },
      { htlField: 'customer_email',  destField: 'Contact.Email'            },
      { htlField: 'item_status',     destField: 'Contact.HTL_Status__c'    },
      { htlField: 'ai_summary',      destField: 'Contact.Description'      },
      { htlField: 'sentiment_score', destField: 'Contact.HTL_Sentiment__c' },
    ],
    log_activity: [
      { htlField: 'item_subject', destField: 'Task.Subject'            },
      { htlField: 'ai_summary',   destField: 'Task.Description'        },
      { htlField: 'ai_reasoning', destField: 'Task.HTL_AI_Reasoning__c'},
      { htlField: 'agent_name',   destField: 'Task.OwnerId'            },
      { htlField: 'item_status',  destField: 'Task.Status'             },
    ],
    custom: [],
  },
  zd: {
    create_ticket: [
      { htlField: 'item_subject',   destField: 'Ticket.subject'          },
      { htlField: 'customer_name',  destField: 'Ticket.requester.name'   },
      { htlField: 'customer_email', destField: 'Ticket.requester.email'  },
      { htlField: 'priority',       destField: 'Ticket.priority'         },
      { htlField: 'ai_summary',     destField: 'Ticket.description'      },
      { htlField: 'agent_name',     destField: 'Ticket.assignee_id'      },
    ],
    update_ticket: [
      { htlField: 'item_status',  destField: 'Ticket.status'      },
      { htlField: 'agent_name',   destField: 'Ticket.assignee_id' },
      { htlField: 'item_subject', destField: 'Ticket.subject'     },
    ],
  },
  jp: {
    create_issue: [
      { htlField: 'item_subject', destField: 'Issue.summary'            },
      { htlField: 'ai_summary',   destField: 'Issue.description'        },
      { htlField: 'priority',     destField: 'Issue.priority.name'      },
      { htlField: 'agent_name',   destField: 'Issue.assignee.accountId' },
    ],
    update_issue: [
      { htlField: 'item_status',  destField: 'Issue.status.name'        },
      { htlField: 'item_subject', destField: 'Issue.summary'            },
      { htlField: 'agent_name',   destField: 'Issue.assignee.accountId' },
    ],
  },
  ns: {
    create_record: [
      { htlField: 'item_subject',   destField: 'transaction.memo'           },
      { htlField: 'customer_name',  destField: 'entity.companyName'         },
      { htlField: 'agent_name',     destField: 'transaction.approvedBy'     },
      { htlField: 'ai_summary',     destField: 'transaction.notes'          },
      { htlField: 'item_status',    destField: 'transaction.approvalStatus' },
    ],
  },
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

// HTL source fields available for mapping
const HTL_FIELDS = [
  { id: 'item_subject',    label: 'Item subject',          desc: 'The title / subject of the inbox item' },
  { id: 'pack_name',       label: 'Pack name',             desc: 'The HTL pack that fired this handoff' },
  { id: 'pack_id',         label: 'Pack ID',               desc: 'Internal pack identifier' },
  { id: 'priority',        label: 'Item priority',         desc: 'High / Medium / Low' },
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

// Return total mapped count + per-action counts for a system, using live state or defaults
function getMappedSummary(systemId, liveMappings) {
  const actions  = SYSTEM_ACTIONS[systemId] || []
  const sysMaps  = liveMappings[systemId] || {}
  const perAction = {}
  let total = 0
  for (const action of actions) {
    const rows = sysMaps[action.id] ?? DEFAULT_MAPPINGS[systemId]?.[action.id] ?? []
    perAction[action.id] = rows.length
    total += rows.length
  }
  return { total, perAction, actions }
}

export default function Destinations() {
  const [tab, setTab] = useState('external')
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [selectedConnector, setSelectedConnector] = useState(null)
  const [fieldMappingOpen, setFieldMappingOpen] = useState(false)
  const [mappingSystem, setMappingSystem] = useState(null)
  // { systemId: { actionId: [ { htlField, destField } ] } }
  const [mappings, setMappings] = useState({})
  // { systemId: activeActionId }
  const [activeAction, setActiveAction] = useState({})

  function openFieldMapping(system) {
    setMappingSystem(system)
    // Initialise this system's mappings if not yet touched
    setMappings(prev => {
      if (prev[system.id]) return prev
      const actions = SYSTEM_ACTIONS[system.id] || []
      const init = {}
      for (const action of actions) {
        init[action.id] = (DEFAULT_MAPPINGS[system.id]?.[action.id] || []).map(m => ({ ...m }))
      }
      return { ...prev, [system.id]: init }
    })
    setActiveAction(prev => ({
      ...prev,
      [system.id]: prev[system.id] || SYSTEM_ACTIONS[system.id]?.[0]?.id,
    }))
    setFieldMappingOpen(true)
  }

  function addMapping(systemId, actionId) {
    setMappings(prev => ({
      ...prev,
      [systemId]: {
        ...prev[systemId],
        [actionId]: [...(prev[systemId]?.[actionId] || []), { htlField: 'item_subject', destField: '' }],
      },
    }))
  }

  function removeMapping(systemId, actionId, idx) {
    setMappings(prev => ({
      ...prev,
      [systemId]: {
        ...prev[systemId],
        [actionId]: prev[systemId][actionId].filter((_, i) => i !== idx),
      },
    }))
  }

  function updateMappingField(systemId, actionId, idx, key, value) {
    setMappings(prev => ({
      ...prev,
      [systemId]: {
        ...prev[systemId],
        [actionId]: prev[systemId][actionId].map((m, i) => i === idx ? { ...m, [key]: value } : m),
      },
    }))
  }

  function openTemplateDrawer(channel) {
    setSelectedChannel(channel)
    setTemplateDrawerOpen(true)
  }

  const previewChannel = selectedChannel ?? CHANNELS[0]
  const previewVars    = extractVars(previewChannel.template)
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
            {EXTERNAL_SYSTEMS.map(system => {
              const { total, perAction, actions } = getMappedSummary(system.id, mappings)
              return (
                <div
                  key={system.id}
                  className={`ext-card${system.status === 'Error' ? ' ext-card--error' : ''}`}
                >
                  <div className="ext-card-top">
                    <div
                      className="ext-logo"
                      style={{ background: system.color + '33', color: system.color }}
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

                    {/* Mapped fields with hover popover */}
                    <div className="ext-fields-wrap">
                      <span className="ext-fields-label">
                        {total} mapped fields across {actions.length} action{actions.length !== 1 ? 's' : ''}
                      </span>
                      <div className="ext-fields-pop">
                        <div className="ext-fields-pop-title">Field mappings by action</div>
                        {actions.map(a => (
                          <div key={a.id} className="ext-fields-pop-row">
                            <span>{a.label}</span>
                            <span className="ext-fields-pop-count">
                              {perAction[a.id] > 0 ? `${perAction[a.id]} fields` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Used in packs chip */}
                  <div className="ext-used-chip">
                    Used in {system.usedInPacks} pack{system.usedInPacks !== 1 ? 's' : ''}
                  </div>

                  <div className="ext-actions">
                    <Button variant="secondary" size="sm" icon={Settings} onClick={() => openFieldMapping(system)}>
                      Field Mapping
                    </Button>
                  </div>
                </div>
              )
            })}
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

      {/* ── Add Connector Drawer ──────────────────────────────────────────────── */}
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
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                {groupType}
              </div>
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

      {/* ── Field Mapping Drawer ──────────────────────────────────────────────── */}
      <Drawer
        open={fieldMappingOpen}
        onClose={() => setFieldMappingOpen(false)}
        title={`Field Mapping — ${mappingSystem?.name ?? ''}`}
        subtitle="Map HTL fields to destination fields per action type. Connection credentials are managed in Settings → Integrations."
        footer={
          <>
            <Button variant="secondary" onClick={() => setFieldMappingOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setFieldMappingOpen(false)}>Save Mappings</Button>
          </>
        }
      >
        {mappingSystem && (() => {
          const actions       = SYSTEM_ACTIONS[mappingSystem.id] || []
          const currentAction = activeAction[mappingSystem.id] || actions[0]?.id
          const sysMaps       = mappings[mappingSystem.id] || {}
          const currentRows   = sysMaps[currentAction] ?? DEFAULT_MAPPINGS[mappingSystem.id]?.[currentAction] ?? []

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action tabs */}
              <div className="fm-tabs">
                {actions.map(action => (
                  <button
                    key={action.id}
                    className={`fm-tab${currentAction === action.id ? ' fm-tab--active' : ''}`}
                    onClick={() => setActiveAction(prev => ({ ...prev, [mappingSystem.id]: action.id }))}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Column headers */}
              <div className="fm-col-hdrs">
                <div className="fm-col-hdr">HTL field</div>
                <div />
                <div className="fm-col-hdr">{mappingSystem.name} field</div>
                <div />
              </div>

              {/* Empty state */}
              {currentRows.length === 0 && (
                <div className="fm-empty">No mappings yet for this action. Add one below.</div>
              )}

              {/* Mapping rows */}
              {currentRows.map((m, idx) => {
                const htlField = HTL_FIELDS.find(f => f.id === m.htlField)
                return (
                  <div key={idx} className="fm-row">
                    <select
                      value={m.htlField}
                      onChange={e => updateMappingField(mappingSystem.id, currentAction, idx, 'htlField', e.target.value)}
                      className="fm-select"
                      title={htlField?.desc}
                    >
                      {HTL_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>

                    <div className="fm-arrow">→</div>

                    <input
                      value={m.destField}
                      onChange={e => updateMappingField(mappingSystem.id, currentAction, idx, 'destField', e.target.value)}
                      placeholder="destination.field.path"
                      className="fm-dest-input"
                    />

                    <button
                      className="fm-remove-btn"
                      onClick={() => removeMapping(mappingSystem.id, currentAction, idx)}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-coral)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}

              {/* Add row */}
              <button
                className="fm-add-btn"
                onClick={() => addMapping(mappingSystem.id, currentAction)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue-border)'; e.currentTarget.style.color = 'var(--accent-blue)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                + Add field mapping
              </button>

              {/* Count footer */}
              <div className="fm-count">
                {currentRows.length} field{currentRows.length !== 1 ? 's' : ''} mapped
                {' '}for <strong>{actions.find(a => a.id === currentAction)?.label}</strong>
              </div>
            </div>
          )
        })()}
      </Drawer>

      {/* ── Edit Template Drawer ──────────────────────────────────────────────── */}
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
