import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, X, Users } from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { teamsAndQueues } from '../data/mockData.js'
import './TeamsAndQueues.css'

// ─── Config ──────────────────────────────────────────────────────────────────
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

// Role → people who hold that role
const ROLES_CATALOG = {
  'Finance Manager':            [{ name: 'Priya Kapoor',     role: 'Finance Manager',           status: 'online'  }],
  'Finance Director':           [{ name: 'David Osei',       role: 'Finance Director',           status: 'busy'    }],
  'Legal Counsel':              [{ name: 'Sandra Voss',      role: 'Legal Counsel',              status: 'online'  }],
  'Legal Analyst':              [{ name: 'Marcus Williams',  role: 'Legal Analyst',              status: 'offline' }],
  'Chief Compliance Officer':   [{ name: 'Rachel Ng',        role: 'Chief Compliance Officer',   status: 'online'  }],
  'Head of Procurement':        [{ name: 'Fatima Al-Rashid', role: 'Head of Procurement',        status: 'online'  }],
  'Senior Support Agent':       [{ name: 'Alex Thompson',    role: 'Senior Agent',               status: 'online'  },
                                  { name: 'Jordan Martinez',  role: 'Senior Agent',               status: 'busy'    }],
  'Support Agent':              [{ name: 'Maya R.',           role: 'Support Agent',              status: 'online'  },
                                  { name: 'James Rodriguez',  role: 'Support Agent',              status: 'online'  },
                                  { name: 'Sarah Kim',         role: 'Support Agent',              status: 'offline' },
                                  { name: 'Jordan S.',         role: 'Support Agent',              status: 'online'  }],
  'Account Executive':          [{ name: 'Carlos Vega',      role: 'Account Executive',          status: 'online'  }],
  'Solutions Engineer':         [{ name: 'Yuki Tanaka',      role: 'Solutions Engineer',         status: 'online'  }],
  'Finance Manager (Backup)':   [{ name: 'Lena Brandt',      role: 'Finance Manager Backup',     status: 'online'  }],
  'On-Call Support':            [{ name: 'Sam V.',            role: 'Support Specialist',         status: 'offline' },
                                  { name: 'Jordan Martinez',  role: 'Senior Agent',               status: 'offline' }],
}

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function TeamDrawer({ team, onSave, onClose }) {
  const [name,       setName]       = useState(team?.name       || '')
  const [type,       setType]       = useState(team?.type       || 'queue')
  const [desc,       setDesc]       = useState(team?.description || '')
  const [members,      setMembers]      = useState(team?.members      || [])
  const [selectedRole, setSelectedRole] = useState(team?.roleTitle    || '')
  // Rotation slots
  const [rotationSlots, setRotationSlots] = useState(team?.rotationSlots || [
    { id: 'office',  label: 'Office Hours', hours: 'Mon–Fri · 09:00–18:00', emoji: '🏢', enabled: true,  members: [], search: '' },
    { id: 'after',   label: 'After Hours',  hours: 'Mon–Fri · 18:00–09:00', emoji: '🌙', enabled: false, members: [], search: '' },
    { id: 'weekend', label: 'Weekends',     hours: 'Sat–Sun · All day',      emoji: '📅', enabled: false, members: [], search: '' },
    { id: 'custom',  label: 'Custom',       hours: 'Define your own schedule',emoji: '⚙️', enabled: false, members: [], search: '' },
  ])
  const [hasCoverage,  setHasCoverage]  = useState(!!(team?.coverageHours))
  const [tzZone,     setTzZone]     = useState(team?.timezone   || 'US-East')
  const [hoursFrom,  setHoursFrom]  = useState('09:00')
  const [hoursTo,    setHoursTo]    = useState('18:00')
  const [assignment, setAssignment] = useState(team?.assignmentMethod || 'round-robin')
  const [memberSearch, setMemberSearch] = useState('')

  const TYPE_TABS  = ['queue', 'roster', 'role', 'rotation']
  const ASSIGN_OPT = ['round-robin', 'expertise-based', 'least-busy']

  const addMember = (name) => {
    if (!members.find(m => m.name === name)) {
      setMembers(ms => [...ms, { name, role: 'Agent', status: 'online', expertiseLevel: 'Mid-level' }])
    }
    setMemberSearch('')
  }
  const removeMember = (name) => setMembers(ms => ms.filter(m => m.name !== name))
  const updateMemberExpertise = (name, level) =>
    setMembers(ms => ms.map(m => m.name === name ? { ...m, expertiseLevel: level } : m))

  const filteredPool = PEOPLE_POOL.filter(p =>
    !members.find(m => m.name === p) &&
    p.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name, type, description: desc, members, status: 'active',
      assignmentMethod: assignment,
      ...(type === 'role'     ? { roleTitle: selectedRole } : {}),
      ...(type === 'rotation' ? { rotationSlots: rotationSlots.filter(s => s.enabled) } : {}),
      ...(hasCoverage ? { coverageHours: `${hoursFrom}–${hoursTo}`, timezone: tzZone } : {}),
    })
  }

  return (
    <>
      <div className="tq-overlay" onClick={onClose} />
      <div className="tq-drawer">
        <div className="tq-drawer-hdr">
          <span className="tq-drawer-title">{team ? 'Edit Team' : 'New Team'}</span>
          <button className="tq-drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="tq-drawer-body">
          {/* Name */}
          <div className="tq-field">
            <label className="tq-label">Name <span className="tq-req">*</span></label>
            <input className="tq-input" placeholder="e.g. Tier 1 Support Queue" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Type */}
          <div className="tq-field">
            <label className="tq-label">Type <span className="tq-req">*</span></label>
            <div className="tq-type-grid">
              {TYPE_TABS.map(t => {
                const cfg = TYPE_CFG[t]
                const sel = type === t
                return (
                  <button key={t} className={`tq-type-btn${sel ? ' tq-type-btn--sel' : ''}`} onClick={() => setType(t)}>
                    <span>{cfg.emoji}</span><span>{cfg.label}</span>
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
          </div>

          {/* Description */}
          <div className="tq-field">
            <label className="tq-label">Description</label>
            <textarea className="tq-textarea" placeholder="Brief description of this team's purpose…" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
          </div>

          {/* ── ROLE type: role picker then people ───────────────── */}
          {type === 'role' && (
            <div className="tq-field">
              <label className="tq-label">Select role <span className="tq-req">*</span></label>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
                Choose the role this team represents. People who hold that role will appear for selection.
              </div>
              {/* Role grid */}
              <div className="tq-role-grid">
                {Object.keys(ROLES_CATALOG).map(role => (
                  <button
                    key={role}
                    className={`tq-role-btn${selectedRole === role ? ' tq-role-btn--sel' : ''}`}
                    onClick={() => {
                      setSelectedRole(role)
                      setMembers([])             // reset when role changes
                      if (!name.trim()) setName(role) // auto-fill name
                    }}
                  >
                    {role}
                    <span className="tq-role-count">{ROLES_CATALOG[role].length}</span>
                  </button>
                ))}
              </div>

              {/* People with selected role */}
              {selectedRole && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                    People with this role — select who should receive items
                  </div>
                  <div className="tq-role-people">
                    {ROLES_CATALOG[selectedRole].map(person => {
                      const isAdded = !!members.find(m => m.name === person.name)
                      return (
                        <div
                          key={person.name}
                          className={`tq-role-person${isAdded ? ' tq-role-person--sel' : ''}`}
                          onClick={() => isAdded ? removeMember(person.name) : setMembers(ms => [...ms, person])}
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

          {/* ── ROTATION type: time slots with per-slot members ────── */}
          {type === 'rotation' && (
            <div className="tq-field">
              <label className="tq-label">Rotation schedule</label>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                Toggle the time windows this rotation covers, then assign members to each slot.
              </div>

              {rotationSlots.map((slot, si) => {
                const updateSlot = (patch) =>
                  setRotationSlots(ss => ss.map((s, i) => i === si ? { ...s, ...patch } : s))

                const addSlotMember = (name) => {
                  if (!slot.members.find(m => m.name === name)) {
                    updateSlot({ members: [...slot.members, { name, role: 'Agent', status: 'online' }], search: '' })
                  }
                }
                const removeSlotMember = (name) =>
                  updateSlot({ members: slot.members.filter(m => m.name !== name) })

                const slotPool = PEOPLE_POOL.filter(p =>
                  !slot.members.find(m => m.name === p) &&
                  p.toLowerCase().includes((slot.search || '').toLowerCase())
                )

                return (
                  <div key={slot.id} className={`tq-slot-card${slot.enabled ? ' tq-slot-card--on' : ''}`}>
                    {/* Slot header — toggle + label */}
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

                    {/* Slot body — only when enabled */}
                    {slot.enabled && (
                      <div className="tq-slot-body">
                        {/* Custom hours input */}
                        {slot.id === 'custom' && (
                          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <input className="tq-input" placeholder="e.g. Mon–Wed · 06:00–09:00"
                              value={slot.hours === 'Define your own schedule' ? '' : slot.hours}
                              onChange={e => updateSlot({ hours: e.target.value })}
                              style={{ flex: 1, fontSize: 12 }}
                            />
                          </div>
                        )}

                        {/* Current members */}
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

                        {/* Add member */}
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

          {/* ── Non-role/rotation types: generic people search ───────── */}
          {type !== 'role' && type !== 'rotation' && (
            <div className="tq-field">
              <label className="tq-label">Members</label>
              {members.length > 0 && (
                <div className="tq-member-list">
                  {members.map(m => (
                    <div key={m.name} className="tq-member-row">
                      <div className="tq-avatar-sm">{initials(m.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.role}</span>
                          {/* Expertise selector — visible only for expertise-based teams.
                              Routing priority: Expert → Lead → Senior → Mid-level → Junior */}
                          {assignment === 'expertise-based' && (
                            <>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>·</span>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Expertise:</span>
                              <select
                                className="tq-sel"
                                style={{ fontSize: 11, padding: '1px 4px', height: 20 }}
                                value={m.expertiseLevel || 'Mid-level'}
                                onChange={e => updateMemberExpertise(m.name, e.target.value)}
                              >
                                {['Junior', 'Mid-level', 'Senior', 'Lead', 'Expert'].map(l => (
                                  <option key={l}>{l}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="tq-remove-btn" onClick={() => removeMember(m.name)}><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
              {assignment === 'expertise-based' && members.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  Members will be assigned items in order of expertise level — Expert first, then Lead, Senior, and so on. If the top tier is unavailable, the next level takes over.
                </div>
              )}
              <input
                className="tq-input"
                placeholder="Search people to add…"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
              {memberSearch && filteredPool.length > 0 && (
                <div className="tq-people-drop">
                  {filteredPool.slice(0, 6).map(p => (
                    <div key={p} className="tq-people-item" onClick={() => addMember(p)}>
                      <div className="tq-avatar-sm">{initials(p)}</div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assignment method (Queue only) */}
          {type === 'queue' && (
            <div className="tq-field">
              <label className="tq-label">Assignment method</label>
              <div className="tq-assign-row">
                {ASSIGN_OPT.map(a => (
                  <button key={a} className={`tq-assign-btn${assignment === a ? ' tq-assign-btn--sel' : ''}`} onClick={() => setAssignment(a)}>
                    {a === 'round-robin' ? 'Round-robin' : a === 'expertise-based' ? 'Expertise-based' : 'Least busy'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coverage hours */}
          <div className="tq-field">
            <label className="tq-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={hasCoverage} onChange={e => setHasCoverage(e.target.checked)} style={{ accentColor: 'var(--accent-blue)' }} />
              Set coverage hours (optional)
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

        <div className="tq-drawer-foot">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim()}>Save Team</Button>
        </div>
      </div>
    </>
  )
}

// ─── Preview slideout ────────────────────────────────────────────────────────
function TeamPreview({ team, onClose }) {
  const navigate = useNavigate()
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [addedMembers, setAddedMembers] = useState([])
  const [oooToast,     setOooToast]     = useState(false)
  const [pauseConfirm, setPauseConfirm] = useState(false)
  const [paused,       setPaused]       = useState(false)

  const cfg     = TYPE_CFG[team.type] || TYPE_CFG.queue
  const online  = team.members.filter(m => m.status === 'online').length
  const dotCls  = online > 0 ? 'tq-dot--green' : team.members.some(m => m.status === 'busy') ? 'tq-dot--amber' : 'tq-dot--gray'
  const visible = team.members.slice(0, 8)
  const hidden  = Math.max(0, team.members.length - 8)

  const pickerPool = PEOPLE_POOL.filter(p =>
    !team.members.find(m => m.name === p) &&
    !addedMembers.includes(p) &&
    p.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const handleMarkOOO = () => {
    setOooToast(true)
    setTimeout(() => setOooToast(false), 3000)
  }

  const goDetail = () => {
    onClose()
    navigate(`/settings/teams/${team.id}`)
  }

  return (
    <>
      <div className="tq-overlay" onClick={onClose} />
      <div className="tq-drawer">
        <div className="tq-drawer-hdr">
          <span className="tq-drawer-title">{cfg.emoji} {team.name}</span>
          <button className="tq-drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="tq-drawer-body">
          {/* Hero */}
          <div className="tqp-hero">
            <div className="tqp-meta">
              <Badge label={cfg.label} variant={cfg.variant} size="sm" />
              <div className={`tq-status-dot ${dotCls}`} style={{ width: 8, height: 8 }} />
              {team.coverageHours && (
                <span className="tqp-coverage">{team.coverageHours} · {team.timezone}</span>
              )}
            </div>
            {team.description && <div className="tqp-desc">{team.description}</div>}
          </div>

          {/* Blast radius */}
          {team.usedInPacks > 0 && (
            <div className="tqp-blast">
              ⚠️ Changes to this team affect routing in <strong>{team.usedInPacks}</strong> pack{team.usedInPacks !== 1 ? 's' : ''}.
            </div>
          )}

          {/* Members */}
          <div className="tqp-section">
            <div className="tqp-section-hdr">Members ({team.members.length})</div>
            <div className="tqp-members">
              {visible.map(m => (
                <div key={m.name} className="tqp-member-row">
                  <div className="tq-avatar-sm">{initials(m.name)}</div>
                  <div className="tqp-member-body">
                    <div className="tqp-member-name">{m.name}</div>
                    <div className="tqp-member-sub">
                      <span>{m.role}</span>
                      {m.expertiseLevel && <span className="tqp-exp">{m.expertiseLevel}</span>}
                    </div>
                  </div>
                  <div className={`tq-status-dot ${STATUS_DOT[m.status] || 'tq-dot--gray'}`} style={{ width: 7, height: 7 }} />
                </div>
              ))}
              {hidden > 0 && (
                <div className="tqp-more">and {hidden} more member{hidden !== 1 ? 's' : ''}</div>
              )}
              {addedMembers.length > 0 && (
                <div className="tqp-added-note">+ {addedMembers.length} staged — save on the detail page</div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="tqp-section">
            <div className="tqp-section-hdr">Activity</div>
            <div className="tqp-stats">
              <div className="tqp-stat">
                <div className="tqp-stat-val">{team.activeItems}</div>
                <div className="tqp-stat-lbl">active items</div>
              </div>
              <div className="tqp-stat-sep" />
              <div className="tqp-stat">
                <div className="tqp-stat-val">{team.usedInPacks}</div>
                <div className="tqp-stat-lbl">packs</div>
              </div>
              <div className="tqp-stat-sep" />
              <div className="tqp-stat">
                <div className="tqp-stat-val">{online}</div>
                <div className="tqp-stat-lbl">online now</div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="tqp-section">
            <div className="tqp-section-hdr">Quick actions</div>
            <div className="tqp-actions">
              {/* Add member */}
              <button className="tqp-action-btn" onClick={() => setPickerOpen(o => !o)}>
                <Plus size={13} /> Add member
              </button>
              {pickerOpen && (
                <div className="tqp-picker">
                  <input
                    className="tq-input"
                    placeholder="Search people…"
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    autoFocus
                  />
                  {pickerSearch && pickerPool.length > 0 && (
                    <div className="tq-people-drop">
                      {pickerPool.slice(0, 5).map(p => (
                        <div key={p} className="tq-people-item" onClick={() => {
                          setAddedMembers(ms => [...ms, p])
                          setPickerSearch('')
                          setPickerOpen(false)
                        }}>
                          <div className="tq-avatar-sm">{initials(p)}</div>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mark all OOO */}
              <button className="tqp-action-btn" onClick={handleMarkOOO}>Mark all OOO</button>
              {oooToast && <div className="tqp-toast">OOO set for all members</div>}

              {/* Pause team */}
              {!paused && !pauseConfirm && (
                <button className="tqp-action-btn" onClick={() => setPauseConfirm(true)}>Pause team</button>
              )}
              {pauseConfirm && !paused && (
                <div className="tqp-confirm">
                  <div className="tqp-confirm-text">Pause this team? Active items will re-queue.</div>
                  <div className="tqp-confirm-btns">
                    <button className="tqp-confirm-yes" onClick={() => { setPaused(true); setPauseConfirm(false) }}>Pause</button>
                    <button className="tqp-confirm-no" onClick={() => setPauseConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              {paused && (
                <div className="tqp-paused">
                  Team is paused. <button onClick={() => setPaused(false)}>Resume</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tq-drawer-foot tqp-foot">
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="secondary" size="sm">Duplicate</Button>
            <Button variant="secondary" size="sm">Archive</Button>
          </div>
          <Button variant="primary" size="sm" onClick={goDetail}>Go to full detail →</Button>
        </div>
      </div>
    </>
  )
}

// ─── Team Row ─────────────────────────────────────────────────────────────────
function TeamCard({ team, onEdit, onNavigate }) {
  const cfg     = TYPE_CFG[team.type] || TYPE_CFG.queue
  const online  = team.members.filter(m => m.status === 'online').length
  const busy    = team.members.filter(m => m.status === 'busy').length
  const dotCls  = online > 0 ? 'tq-dot--green' : busy > 0 ? 'tq-dot--amber' : 'tq-dot--gray'
  const visible = team.members.slice(0, 3)
  const extra   = team.members.length - 3

  return (
    <div className="tq-row" onClick={() => onEdit(team.id)}>
      {/* Left icon */}
      <div className={`tq-row-icon tq-row-icon--${team.type}`}>
        <span>{cfg.emoji}</span>
      </div>

      {/* Body */}
      <div className="tq-row-body">
        <div className="tq-row-name">
          {team.name}
          <div className={`tq-status-dot ${dotCls}`} style={{ width: 7, height: 7, display: 'inline-block', marginLeft: 8, verticalAlign: 'middle' }} />
        </div>
        {team.description && (
          <div className="tq-row-desc">{team.description}</div>
        )}
        <div className="tq-row-meta">
          <Badge label={cfg.label} variant={cfg.variant} size="sm" />
          <span className="tq-meta-chip">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
          <span className="tq-meta-sep">·</span>
          <span className="tq-meta-chip">{team.activeItems} active</span>
          <span className="tq-meta-sep">·</span>
          <span className="tq-meta-chip">{team.usedInPacks} pack{team.usedInPacks !== 1 ? 's' : ''}</span>
          {team.coverageHours && (
            <>
              <span className="tq-meta-sep">·</span>
              <span className="tq-meta-chip">🕐 {team.coverageHours}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: avatars + hover actions */}
      <div className="tq-row-right">
        <div className="tq-avatars-sm">
          {visible.map(m => (
            <div key={m.name} className={`tq-avatar tq-avatar--${m.status}`} title={`${m.name} — ${m.status}`} style={{ width: 24, height: 24, fontSize: 9 }}>
              {initials(m.name)}
            </div>
          ))}
          {extra > 0 && <div className="tq-avatar tq-avatar--more" style={{ width: 24, height: 24, fontSize: 9 }}>+{extra}</div>}
        </div>

        <div className="tq-row-actions">
          <button
            className="tq-row-action-btn"
            title="Preview"
            onClick={e => { e.stopPropagation(); onEdit(team.id) }}
          >
            <Pencil size={13} />
          </button>
          <button
            className="tq-row-action-btn"
            title="Open detail"
            onClick={e => { e.stopPropagation(); onNavigate(team.id) }}
          >
            <Users size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeamsAndQueues() {
  const navigate = useNavigate()
  const [teams,       setTeams]       = useState(teamsAndQueues)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('All')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewId,   setPreviewId]   = useState(null)

  const filtered = teams.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'All' && t.type !== typeFilter) return false
    return true
  })

  const openNew      = () => navigate('/settings/teams/new')
  const openEdit     = id => { setPreviewId(id); setPreviewOpen(true) }
  const closePreview = () => { setPreviewOpen(false); setPreviewId(null) }

  const TYPE_OPTIONS = [
    { value: 'All',      label: 'All Types'   },
    { value: 'queue',    label: 'Queue'        },
    { value: 'roster',   label: 'Roster'       },
    { value: 'role',     label: 'Role'         },
    { value: 'rotation', label: 'Rotation'     },
  ]

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Teams & Queues</h1>
          <p className="page-subtitle">
            Define the groups of people that HTL can route items to.
            These appear as options in every Pack's routing configuration.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={openNew}>New Team</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="tq-filter-bar">
        <input
          className="tq-search"
          placeholder="Search teams…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="tq-sel" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="tq-count">{filtered.length} team{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Team list */}
      <div className="tq-list">
        {filtered.length === 0 ? (
          <div className="tq-empty">No teams match the current filters.</div>
        ) : (
          filtered.map(t => (
            <TeamCard
              key={t.id}
              team={t}
              onEdit={openEdit}
              onNavigate={id => { closePreview(); navigate(`/settings/teams/${id}`) }}
            />
          ))
        )}
      </div>

      {/* Preview slideout */}
      {previewOpen && previewId && (
        <TeamPreview
          team={teams.find(t => t.id === previewId)}
          onClose={closePreview}
        />
      )}
    </div>
  )
}
