import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus, X } from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { teamsAndQueues } from '../data/mockData.js'
import './TeamsAndQueues.css'
import './TeamDetail.css'

const TYPE_CFG = {
  queue:    { label: 'Queue',    variant: 'blue',   emoji: '🗂' },
  roster:   { label: 'Roster',   variant: 'purple', emoji: '👥' },
  role:     { label: 'Role',     variant: 'amber',  emoji: '👤' },
  rotation: { label: 'Rotation', variant: 'teal',   emoji: '🔄' },
}

const STATUS_DOT = {
  online:  'tq-dot--green',
  busy:    'tq-dot--amber',
  offline: 'tq-dot--gray',
}

const PEOPLE_POOL = [
  'Maya R.', 'James Rodriguez', 'Sarah Kim', 'Jordan S.',
  'Alex Thompson', 'Jordan Martinez', 'Priya Kapoor', 'Sandra Voss',
  'Marcus Williams', 'Rachel Ng', 'David Osei', 'Sam V.',
  'Carlos Vega', 'Yuki Tanaka', 'Fatima Al-Rashid', 'Lena Brandt',
]

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Mock supplemental data ───────────────────────────────────────────────────
const MOCK_STATS = {
  'team-001': { itemsThisWeek: 42, delta: +8, slaCompliance: 96,  avgHandleTime: 12 },
  'team-002': { itemsThisWeek: 18, delta: -3, slaCompliance: 89,  avgHandleTime: 18 },
  'team-003': { itemsThisWeek: 4,  delta: 0,  slaCompliance: 100, avgHandleTime: 3  },
  'team-004': { itemsThisWeek: 1,  delta: +1, slaCompliance: 100, avgHandleTime: 5  },
  'team-005': { itemsThisWeek: 0,  delta: 0,  slaCompliance: null, avgHandleTime: 0 },
  'team-006': { itemsThisWeek: 3,  delta: +1, slaCompliance: 100, avgHandleTime: 7  },
}

const MOCK_PACKS = {
  'team-001': ['Customer Escalation — Tier 1', 'Hot Lead Closure', 'Procurement Gate', 'Invoice Approval', 'SME Content Review'],
  'team-002': ['Customer Escalation — Tier 1', 'Hot Lead Closure', 'Procurement Gate — Mid-Market', 'Invoice Approval'],
  'team-003': ['Invoice Approval — Finance', 'Procurement Gate'],
  'team-004': ['Whistleblower & Compliance', 'Contract Review'],
  'team-005': ['Customer Escalation — Tier 1', 'After-Hours Protocol'],
  'team-006': ['Whistleblower & Compliance', 'Compliance Gate'],
}

const MOCK_JOINED = {
  'Maya R.':          '2024-03-15',
  'James Rodriguez':  '2024-01-08',
  'Sarah Kim':        '2024-06-22',
  'Jordan S.':        '2024-11-01',
  'Alex Thompson':    '2023-09-12',
  'Jordan Martinez':  '2023-11-30',
  'Priya Kapoor':     '2023-07-04',
  'Sandra Voss':      '2024-02-19',
  'Marcus Williams':  '2024-04-30',
  'Rachel Ng':        '2023-12-11',
  'David Osei':       '2024-08-05',
  'Sam V.':           '2024-09-17',
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ team, packs }) {
  const stats  = MOCK_STATS[team.id] || { itemsThisWeek: 0, delta: 0, slaCompliance: null, avgHandleTime: 0 }
  const online = team.members.filter(m => m.status === 'online')

  return (
    <div className="td-overview">
      {/* Left: stats + packs */}
      <div className="td-stat-card">
        <div className="td-stat-card-title">Activity</div>
        <div className="td-stat-grid">
          <div className="td-stat">
            <div className="td-stat-val">{team.activeItems}</div>
            <div className="td-stat-lbl">active items</div>
          </div>
          <div className="td-stat">
            <div className="td-stat-val">{stats.itemsThisWeek}</div>
            <div className="td-stat-lbl">
              this week
              {stats.delta !== 0 && (
                <span className={`td-stat-delta td-stat-delta--${stats.delta > 0 ? 'pos' : 'neg'}`}>
                  {stats.delta > 0 ? '+' : ''}{stats.delta} vs last week
                </span>
              )}
            </div>
          </div>
          {stats.slaCompliance !== null && (
            <div className="td-stat">
              <div className="td-stat-val">{stats.slaCompliance}%</div>
              <div className="td-stat-lbl">SLA compliance</div>
            </div>
          )}
          <div className="td-stat">
            <div className="td-stat-val">{stats.avgHandleTime}m</div>
            <div className="td-stat-lbl">avg handle time</div>
          </div>
        </div>

        {packs && packs.length > 0 && (
          <div>
            <div className="td-packs-title">Used in packs</div>
            <div className="td-pack-pills">
              {packs.map(p => <span key={p} className="td-pack-pill">{p}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* Right: online members */}
      <div className="td-online-card">
        <div className="td-online-title">Members online ({online.length})</div>
        {online.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No members online right now.
          </div>
        ) : (
          <div className="td-online-list">
            {online.map(m => (
              <div key={m.name} className="td-online-row">
                <div className="tq-avatar-sm">{initials(m.name)}</div>
                <div className="td-online-info">
                  <div className="td-online-name">{m.name}</div>
                  <div className="td-online-role">{m.role}</div>
                </div>
                {m.expertiseLevel && <span className="td-online-exp">{m.expertiseLevel}</span>}
                <div className={`tq-status-dot ${STATUS_DOT[m.status] || 'tq-dot--gray'}`} style={{ width: 7, height: 7 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coverage banner */}
      {team.coverageHours && (
        <div className="td-coverage-banner">
          <span style={{ fontSize: 16 }}>🕐</span>
          <span>Coverage hours: <strong>{team.coverageHours}</strong> · {team.timezone}</span>
        </div>
      )}
    </div>
  )
}

// ── Members Tab ───────────────────────────────────────────────────────────────
function MembersTab({ team }) {
  const [members,    setMembers]    = useState(team.members)
  const [search,     setSearch]     = useState('')
  const [statusFilt, setStatusFilt] = useState('All')
  const [assignment, setAssignment] = useState(team.assignmentMethod || 'round-robin')
  const [addSearch,  setAddSearch]  = useState('')
  const [addOpen,    setAddOpen]    = useState(false)

  const ASSIGN_OPT = ['round-robin', 'expertise-based', 'least-busy']
  const ASSIGN_LBL = { 'round-robin': 'Round-robin', 'expertise-based': 'Expertise-based', 'least-busy': 'Least busy' }

  const filtered = members.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilt !== 'All' && m.status !== statusFilt) return false
    return true
  })

  const addPool = PEOPLE_POOL.filter(p =>
    !members.find(m => m.name === p) &&
    p.toLowerCase().includes(addSearch.toLowerCase())
  )

  const addMember = (name) => {
    setMembers(ms => [...ms, { name, role: 'Agent', status: 'online', expertiseLevel: 'Mid-level' }])
    setAddSearch('')
    setAddOpen(false)
  }

  const removeMember = (name) => setMembers(ms => ms.filter(m => m.name !== name))

  const updateExpertise = (name, level) =>
    setMembers(ms => ms.map(m => m.name === name ? { ...m, expertiseLevel: level } : m))

  return (
    <div>
      {/* Toolbar */}
      <div className="td-members-toolbar">
        <input
          className="td-mem-search"
          placeholder="Search members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="td-mem-sel" value={statusFilt} onChange={e => setStatusFilt(e.target.value)}>
          <option value="All">All status</option>
          <option value="online">Online</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'DM Mono, monospace' }}>
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Assignment method */}
      <div className="td-assign-section">
        <span className="td-assign-label">Assignment:</span>
        {ASSIGN_OPT.map(a => (
          <button
            key={a}
            className={`td-assign-btn${assignment === a ? ' td-assign-btn--sel' : ''}`}
            onClick={() => setAssignment(a)}
          >
            {ASSIGN_LBL[a]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="td-mem-table-wrap">
        <table className="td-mem-table">
          <thead>
            <tr>
              <th className="td-mem-th">Member</th>
              <th className="td-mem-th">Expertise</th>
              <th className="td-mem-th">Status</th>
              <th className="td-mem-th">Joined</th>
              <th className="td-mem-th"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.name} className="td-mem-tr">
                <td className="td-mem-td">
                  <div className="td-mem-name-cell">
                    <div className="tq-avatar-sm">{initials(m.name)}</div>
                    <div className="td-mem-info">
                      <div className="td-mem-name">{m.name}</div>
                      <div className="td-mem-role">{m.role}</div>
                    </div>
                  </div>
                </td>
                <td className="td-mem-td">
                  {m.expertiseLevel ? (
                    <select
                      className="td-exp-sel"
                      value={m.expertiseLevel}
                      onChange={e => updateExpertise(m.name, e.target.value)}
                    >
                      {['Junior', 'Mid-level', 'Senior', 'Lead', 'Expert'].map(l => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>}
                </td>
                <td className="td-mem-td">
                  <div className="td-status-cell">
                    <div className={`tq-status-dot ${STATUS_DOT[m.status] || 'tq-dot--gray'}`} style={{ width: 7, height: 7 }} />
                    {m.status}
                  </div>
                </td>
                <td className="td-mem-td td-mem-td--mono">
                  {MOCK_JOINED[m.name] || '—'}
                </td>
                <td className="td-mem-td">
                  <div className="td-action-btns">
                    <button className="td-action-btn">Set OOO</button>
                    <button className="td-action-btn td-action-btn--danger" onClick={() => removeMember(m.name)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add member */}
      <div className="td-add-member-wrap">
        {addOpen ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              className="td-add-search"
              placeholder="Search people to add…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              autoFocus
            />
            {addSearch && addPool.length > 0 && (
              <div className="tq-people-drop" style={{ width: 260 }}>
                {addPool.slice(0, 6).map(p => (
                  <div key={p} className="tq-people-item" onClick={() => addMember(p)}>
                    <div className="tq-avatar-sm">{initials(p)}</div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <Button variant="secondary" size="sm" onClick={() => { setAddOpen(false); setAddSearch('') }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add member</Button>
        )}
      </div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ team }) {
  const [name,        setName]        = useState(team.name)
  const [desc,        setDesc]        = useState(team.description || '')
  const [hasCoverage, setHasCoverage] = useState(!!(team.coverageHours))
  const [tzZone,      setTzZone]      = useState(team.timezone || 'US-East')
  const [hoursFrom,   setHoursFrom]   = useState(
    team.coverageHours ? team.coverageHours.split('–')[0] : '09:00'
  )
  const [hoursTo,     setHoursTo]     = useState(
    team.coverageHours ? team.coverageHours.split('–')[1] : '18:00'
  )
  const [coveragePool,   setCoveragePool]   = useState('')
  const [requeueTimeout, setRequeueTimeout] = useState(15)
  const [notifyManager,  setNotifyManager]  = useState(true)

  const cfg = TYPE_CFG[team.type] || TYPE_CFG.queue

  return (
    <div className="td-settings">
      {/* Basic config */}
      <div>
        <div className="td-settings-section-title">Team configuration</div>

        <div className="tq-field" style={{ marginBottom: 16 }}>
          <label className="tq-label">Name</label>
          <input className="tq-input" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="tq-field" style={{ marginBottom: 16 }}>
          <label className="tq-label">Description</label>
          <textarea
            className="tq-textarea"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            placeholder="Brief description of this team's purpose…"
          />
        </div>

        <div className="tq-field" style={{ marginBottom: 16 }}>
          <label className="tq-label">Type</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
            <Badge label={cfg.label} variant={cfg.variant} size="sm" />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Type cannot be changed after creation.
            </span>
          </div>
        </div>

        <div className="tq-field">
          <label className="tq-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={hasCoverage}
              onChange={e => setHasCoverage(e.target.checked)}
              style={{ accentColor: 'var(--accent-blue)' }}
            />
            Coverage hours
          </label>
          {hasCoverage && (
            <div className="tq-coverage-row">
              <select className="tq-sel" value={tzZone} onChange={e => setTzZone(e.target.value)}>
                {['US-East', 'US-West', 'EU-Central', 'Global'].map(z => <option key={z}>{z}</option>)}
              </select>
              <input type="time" className="tq-time" value={hoursFrom} onChange={e => setHoursFrom(e.target.value)} />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>to</span>
              <input type="time" className="tq-time" value={hoursTo} onChange={e => setHoursTo(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* OOO & Coverage */}
      <div>
        <div className="td-settings-section-title">OOO & Coverage</div>
        <div className="td-ooo-box">
          <div className="tq-field">
            <label className="tq-label">Coverage pool</label>
            <select
              className="tq-sel"
              style={{ width: '100%', height: 36 }}
              value={coveragePool}
              onChange={e => setCoveragePool(e.target.value)}
            >
              <option value="">None — re-queue if all OOO</option>
              <option value="team-001">Tier 1 Support Queue</option>
              <option value="team-002">Tier 2 Support Queue</option>
              <option value="team-004">Legal Roster</option>
              <option value="team-006">Compliance & CCO</option>
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              If all members are OOO, route items to this team instead.
            </div>
          </div>

          <div className="tq-field">
            <label className="tq-label">Re-queue timeout</label>
            <div className="td-timeout-row">
              <input
                type="number"
                className="td-timeout-input"
                min={0}
                max={120}
                value={requeueTimeout}
                onChange={e => setRequeueTimeout(Number(e.target.value))}
              />
              <span className="td-timeout-label">minutes before an unassigned item is re-queued</span>
            </div>
          </div>

          <div className="td-toggle-row">
            <div>
              <div className="td-toggle-label">Notify manager on OOO</div>
              <div className="td-toggle-sub">Send a notification when a member sets themselves OOO.</div>
            </div>
            <div
              className={`td-toggle${notifyManager ? ' td-toggle--on' : ''}`}
              onClick={() => setNotifyManager(n => !n)}
            >
              <div className="td-toggle-knob" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamDetail() {
  const { id }   = useParams()
  const team     = teamsAndQueues.find(t => t.id === id) || teamsAndQueues[0]
  const packs    = MOCK_PACKS[team.id] || []

  const [name,        setName]        = useState(team.name)
  const [nameEditing, setNameEditing] = useState(false)
  const [activeTab,   setActiveTab]   = useState('overview')
  const [saved,       setSaved]       = useState(false)
  const [paused,      setPaused]      = useState(false)

  const cfg    = TYPE_CFG[team.type] || TYPE_CFG.queue
  const online = team.members.filter(m => m.status === 'online').length
  const dotCls = online > 0 ? 'tq-dot--green' : team.members.some(m => m.status === 'busy') ? 'tq-dot--amber' : 'tq-dot--gray'

  const handleSave = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const TABS      = ['overview', 'members', 'settings']
  const TAB_LABEL = { overview: 'Overview', members: 'Members', settings: 'Settings' }

  return (
    <div>
      <Link to="/settings/teams" className="td-back">← Teams & Queues</Link>

      {/* Header */}
      <div className="td-header">
        <div className="td-name-area">
          {nameEditing ? (
            <input
              className="td-name-input"
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              onBlur={() => setNameEditing(false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setNameEditing(false) }}
            />
          ) : (
            <div className="td-name-wrap" onClick={() => setNameEditing(true)}>
              <h1 className="td-name">{name}</h1>
              <Pencil size={14} className="td-name-edit-icon" />
            </div>
          )}

          <div className="td-badges">
            <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
            <Badge label={cfg.label} variant={cfg.variant} size="sm" />
            <div className={`tq-status-dot ${dotCls}`} style={{ width: 8, height: 8 }} />
            <span className="td-active-chip">{team.activeItems} active</span>
            {paused && <span className="td-pause-chip">Paused</span>}
          </div>
        </div>

        <div className="td-header-actions">
          {saved && <span className="td-saved-note">Changes saved</span>}
          <Button variant="secondary" size="sm" onClick={() => setPaused(p => !p)}>
            {paused ? 'Resume team' : 'Pause team'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save changes</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="td-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`td-tab${activeTab === t ? ' td-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab  team={team} packs={packs} />}
      {activeTab === 'members'  && <MembersTab   team={team} />}
      {activeTab === 'settings' && <SettingsTab  team={team} />}
    </div>
  )
}
