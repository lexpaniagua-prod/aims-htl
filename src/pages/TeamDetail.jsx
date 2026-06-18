import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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

const ROLES_CATALOG = {
  'Finance Manager':          [{ name: 'Priya Kapoor',     role: 'Finance Manager',          status: 'online'  }],
  'Finance Director':         [{ name: 'David Osei',       role: 'Finance Director',          status: 'busy'    }],
  'Legal Counsel':            [{ name: 'Sandra Voss',      role: 'Legal Counsel',             status: 'online'  }],
  'Legal Analyst':            [{ name: 'Marcus Williams',  role: 'Legal Analyst',             status: 'offline' }],
  'Chief Compliance Officer': [{ name: 'Rachel Ng',        role: 'Chief Compliance Officer',  status: 'online'  }],
  'Head of Procurement':      [{ name: 'Fatima Al-Rashid', role: 'Head of Procurement',       status: 'online'  }],
  'Senior Support Agent':     [{ name: 'Alex Thompson',    role: 'Senior Agent',              status: 'online'  },
                                { name: 'Jordan Martinez',  role: 'Senior Agent',              status: 'busy'    }],
  'Support Agent':            [{ name: 'Maya R.',          role: 'Support Agent',             status: 'online'  },
                                { name: 'James Rodriguez',  role: 'Support Agent',             status: 'online'  },
                                { name: 'Sarah Kim',        role: 'Support Agent',             status: 'offline' },
                                { name: 'Jordan S.',        role: 'Support Agent',             status: 'online'  }],
  'Account Executive':        [{ name: 'Carlos Vega',      role: 'Account Executive',         status: 'online'  }],
  'Solutions Engineer':       [{ name: 'Yuki Tanaka',      role: 'Solutions Engineer',        status: 'online'  }],
  'Finance Manager (Backup)': [{ name: 'Lena Brandt',      role: 'Finance Manager Backup',    status: 'online'  }],
  'On-Call Support':          [{ name: 'Sam V.',            role: 'Support Specialist',        status: 'offline' },
                                { name: 'Jordan Martinez',  role: 'Senior Agent',              status: 'offline' }],
}

const DEFAULT_ROTATION_SLOTS = [
  { id: 'office',  label: 'Office Hours', hours: 'Mon–Fri · 09:00–18:00', emoji: '🏢', enabled: true,  members: [], search: '' },
  { id: 'after',   label: 'After Hours',  hours: 'Mon–Fri · 18:00–09:00', emoji: '🌙', enabled: false, members: [], search: '' },
  { id: 'weekend', label: 'Weekends',     hours: 'Sat–Sun · All day',      emoji: '📅', enabled: false, members: [], search: '' },
  { id: 'custom',  label: 'Custom',       hours: 'Define your own schedule', emoji: '⚙️', enabled: false, members: [], search: '' },
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
function SettingsTab({ team, isNew }) {
  const [name,          setName]          = useState(team.name || '')
  const [desc,          setDesc]          = useState(team.description || '')
  const [type,          setType]          = useState(team.type || 'queue')
  const [selectedRole,  setSelectedRole]  = useState(team.roleTitle || '')
  const [roleMembers,   setRoleMembers]   = useState(team.members || [])
  const [rotationSlots, setRotationSlots] = useState(team.rotationSlots || DEFAULT_ROTATION_SLOTS)
  const [assignment,    setAssignment]    = useState(team.assignmentMethod || 'round-robin')
  const [hasCoverage,   setHasCoverage]   = useState(!!(team.coverageHours))
  const [tzZone,        setTzZone]        = useState(team.timezone || 'US-East')
  const [hoursFrom,     setHoursFrom]     = useState(
    team.coverageHours ? team.coverageHours.split('–')[0] : '09:00'
  )
  const [hoursTo,       setHoursTo]       = useState(
    team.coverageHours ? team.coverageHours.split('–')[1] : '18:00'
  )
  const [coveragePool,   setCoveragePool]   = useState('')
  const [requeueTimeout, setRequeueTimeout] = useState(15)
  const [notifyManager,  setNotifyManager]  = useState(true)

  const TYPE_TABS  = ['queue', 'roster', 'role', 'rotation']
  const ASSIGN_OPT = ['round-robin', 'expertise-based', 'least-busy']
  const ASSIGN_LBL = { 'round-robin': 'Round-robin', 'expertise-based': 'Expertise-based', 'least-busy': 'Least busy' }
  const cfg = TYPE_CFG[type] || TYPE_CFG.queue

  const addRoleMember    = p => { if (!roleMembers.find(m => m.name === p)) setRoleMembers(ms => [...ms, p]) }
  const removeRoleMember = p => setRoleMembers(ms => ms.filter(m => m !== p && m.name !== p))
  const isRoleMemberAdded = p => !!(roleMembers.find(m => m === p || m.name === p))

  return (
    <div className="td-settings">
      {/* Team configuration */}
      <div>
        <div className="td-settings-section-title">Team configuration</div>

        {!isNew && (
          <div className="tq-field" style={{ marginBottom: 16 }}>
            <label className="tq-label">Name</label>
            <input className="tq-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}

        {/* Type */}
        <div className="tq-field" style={{ marginBottom: 16 }}>
          <label className="tq-label">Type {isNew && <span className="tq-req">*</span>}</label>
          {isNew ? (
            <>
              <div className="tq-type-grid">
                {TYPE_TABS.map(t => {
                  const c = TYPE_CFG[t]
                  return (
                    <button key={t} className={`tq-type-btn${type === t ? ' tq-type-btn--sel' : ''}`} onClick={() => setType(t)}>
                      <span>{c.emoji}</span><span>{c.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="tq-type-hint">
                {type === 'queue'    && 'Round-robin or expertise-based — any available member picks it up.'}
                {type === 'roster'   && 'Specific named people — any roster member can receive items.'}
                {type === 'role'     && 'A single role — the designated person receives all items.'}
                {type === 'rotation' && 'Auto-rotates on a schedule — different person each cycle.'}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
              <Badge label={cfg.label} variant={cfg.variant} size="sm" />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                Type cannot be changed after creation.
              </span>
            </div>
          )}
        </div>

        {/* Description */}
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

        {/* ── Role type: role picker ─────────────────────────────── */}
        {type === 'role' && (
          <div className="tq-field" style={{ marginBottom: 16 }}>
            <label className="tq-label">Select role <span className="tq-req">*</span></label>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Choose the role this team represents. People who hold that role will appear for selection.
            </div>
            <div className="tq-role-grid">
              {Object.keys(ROLES_CATALOG).map(role => (
                <button
                  key={role}
                  className={`tq-role-btn${selectedRole === role ? ' tq-role-btn--sel' : ''}`}
                  onClick={() => {
                    setSelectedRole(role)
                    setRoleMembers([])
                    if (isNew && !name.trim()) {}
                  }}
                >
                  {role}
                  <span className="tq-role-count">{ROLES_CATALOG[role].length}</span>
                </button>
              ))}
            </div>
            {selectedRole && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  People with this role — select who should receive items
                </div>
                <div className="tq-role-people">
                  {ROLES_CATALOG[selectedRole].map(person => {
                    const isAdded = isRoleMemberAdded(person.name)
                    return (
                      <div
                        key={person.name}
                        className={`tq-role-person${isAdded ? ' tq-role-person--sel' : ''}`}
                        onClick={() => isAdded ? removeRoleMember(person.name) : setRoleMembers(ms => [...ms, person])}
                      >
                        <div className={`tq-avatar-sm${person.status === 'busy' ? ' tq-avatar--busy' : person.status === 'offline' ? ' tq-avatar--offline' : ''}`}>
                          {initials(person.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{person.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span className={`tq-status-dot ${STATUS_DOT[person.status] || 'tq-dot--gray'}`} style={{ width: 6, height: 6 }} />
                            {person.status}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isAdded ? 'var(--accent-teal)' : 'var(--text-tertiary)' }}>
                          {isAdded ? '✓ Selected' : '+ Select'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Rotation type: schedule slots ─────────────────────── */}
        {type === 'rotation' && (
          <div className="tq-field" style={{ marginBottom: 16 }}>
            <label className="tq-label">Rotation schedule</label>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
              Toggle the time windows this rotation covers, then assign members to each slot.
            </div>
            {rotationSlots.map((slot, si) => {
              const updateSlot = patch => setRotationSlots(ss => ss.map((s, i) => i === si ? { ...s, ...patch } : s))
              const addSlotMember = name => {
                if (!slot.members.find(m => m.name === name))
                  updateSlot({ members: [...slot.members, { name, role: 'Agent', status: 'online' }], search: '' })
              }
              const removeSlotMember = name => updateSlot({ members: slot.members.filter(m => m.name !== name) })
              const slotPool = PEOPLE_POOL.filter(p =>
                !slot.members.find(m => m.name === p) &&
                p.toLowerCase().includes((slot.search || '').toLowerCase())
              )
              return (
                <div key={slot.id} className={`tq-slot-card${slot.enabled ? ' tq-slot-card--on' : ''}`}>
                  <div className="tq-slot-hdr" onClick={() => updateSlot({ enabled: !slot.enabled })}>
                    <div className="tq-slot-toggle-wrap">
                      <div className={`tq-slot-toggle${slot.enabled ? ' tq-slot-toggle--on' : ''}`}>
                        <div className="tq-slot-knob" />
                      </div>
                    </div>
                    <span className="tq-slot-emoji">{slot.emoji}</span>
                    <div className="tq-slot-info">
                      <div className="tq-slot-label">{slot.label}</div>
                      <div className="tq-slot-hours">{slot.hours}</div>
                    </div>
                    {slot.enabled && slot.members.length > 0 && (
                      <span className="tq-slot-count">{slot.members.length} member{slot.members.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {slot.enabled && (
                    <div className="tq-slot-body">
                      {slot.id === 'custom' && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <input className="tq-input" placeholder="e.g. Mon–Wed · 06:00–09:00"
                            value={slot.hours === 'Define your own schedule' ? '' : slot.hours}
                            onChange={e => updateSlot({ hours: e.target.value })}
                            style={{ flex: 1, fontSize: 12 }}
                          />
                        </div>
                      )}
                      {slot.members.length > 0 && (
                        <div className="tq-member-list" style={{ marginBottom: 8 }}>
                          {slot.members.map(m => (
                            <div key={m.name} className="tq-member-row">
                              <div className="tq-avatar-sm">{initials(m.name)}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.role}</div>
                              </div>
                              <button className="tq-remove-btn" onClick={() => removeSlotMember(m.name)}><X size={11} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        className="tq-input"
                        placeholder={`Add member for ${slot.label}…`}
                        value={slot.search || ''}
                        onChange={e => updateSlot({ search: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 12 }}
                      />
                      {slot.search && slotPool.length > 0 && (
                        <div className="tq-people-drop">
                          {slotPool.slice(0, 5).map(p => (
                            <div key={p} className="tq-people-item" onClick={() => addSlotMember(p)}>
                              <div className="tq-avatar-sm">{initials(p)}</div>
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {slot.members.length === 0 && !slot.search && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 4 }}>
                          No members yet — type a name above to assign someone to this slot.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Queue type: assignment method ──────────────────────── */}
        {type === 'queue' && (
          <div className="tq-field" style={{ marginBottom: 16 }}>
            <label className="tq-label">Assignment method</label>
            <div className="tq-assign-row">
              {ASSIGN_OPT.map(a => (
                <button key={a} className={`tq-assign-btn${assignment === a ? ' tq-assign-btn--sel' : ''}`} onClick={() => setAssignment(a)}>
                  {ASSIGN_LBL[a]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coverage hours */}
        <div className="tq-field">
          <label className="tq-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={hasCoverage}
              onChange={e => setHasCoverage(e.target.checked)}
              style={{ accentColor: 'var(--accent-blue)' }}
            />
            Coverage hours (optional)
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

const EMPTY_TEAM = {
  name: '', description: '', members: [], type: 'queue',
  assignmentMethod: 'round-robin', activeItems: 0, usedInPacks: 0,
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isNew    = id === 'new'
  const team     = isNew ? EMPTY_TEAM : (teamsAndQueues.find(t => t.id === id) || teamsAndQueues[0])
  const packs    = isNew ? [] : (MOCK_PACKS[team.id] || [])

  const [name,        setName]        = useState(isNew ? '' : team.name)
  const [nameEditing, setNameEditing] = useState(false)
  const [activeTab,   setActiveTab]   = useState(isNew ? 'settings' : 'overview')
  const [saved,       setSaved]       = useState(false)
  const [paused,      setPaused]      = useState(false)

  const cfg    = TYPE_CFG[team.type] || TYPE_CFG.queue
  const online = team.members.filter(m => m.status === 'online').length
  const dotCls = online > 0 ? 'tq-dot--green' : team.members.some(m => m.status === 'busy') ? 'tq-dot--amber' : 'tq-dot--gray'

  const handleSave = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const handleCreate = () => navigate('/settings/teams')

  const TABS      = ['overview', 'members', 'settings']
  const TAB_LABEL = { overview: 'Overview', members: 'Members', settings: 'Settings' }

  return (
    <div>
      <Link to="/settings/teams" className="td-back">← Teams & Queues</Link>

      {/* Header */}
      <div className="td-header">
        <div className="td-name-area">
          {isNew ? (
            <input
              className="td-name-input td-name-input--new"
              value={name}
              autoFocus
              placeholder="Name this team…"
              onChange={e => setName(e.target.value)}
            />
          ) : nameEditing ? (
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

          {!isNew && (
            <div className="td-badges">
              <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
              <Badge label={cfg.label} variant={cfg.variant} size="sm" />
              <div className={`tq-status-dot ${dotCls}`} style={{ width: 8, height: 8 }} />
              <span className="td-active-chip">{team.activeItems} active</span>
              {paused && <span className="td-pause-chip">Paused</span>}
            </div>
          )}
        </div>

        <div className="td-header-actions">
          {isNew ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate('/settings/teams')}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreate} disabled={!name.trim()}>Create team</Button>
            </>
          ) : (
            <>
              {saved && <span className="td-saved-note">Changes saved</span>}
              <Button variant="secondary" size="sm" onClick={() => setPaused(p => !p)}>
                {paused ? 'Resume team' : 'Pause team'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>Save changes</Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="td-tabs">
        {TABS.map(t => {
          const disabled = isNew && t === 'overview'
          return (
            <button
              key={t}
              className={`td-tab${activeTab === t ? ' td-tab--active' : ''}${disabled ? ' td-tab--disabled' : ''}`}
              onClick={() => !disabled && setActiveTab(t)}
            >
              {TAB_LABEL[t]}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab  team={team} packs={packs} />}
      {activeTab === 'members'  && <MembersTab   team={team} />}
      {activeTab === 'settings' && <SettingsTab  team={team} isNew={isNew} />}
    </div>
  )
}
