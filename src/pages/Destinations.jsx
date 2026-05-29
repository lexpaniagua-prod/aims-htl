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
                  <Button variant="secondary" size="sm" icon={Settings}>
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
        title="Add Connector"
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
