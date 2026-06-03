import { useState } from 'react'
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

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function TeamDrawer({ team, onSave, onClose }) {
  const [name,       setName]       = useState(team?.name       || '')
  const [type,       setType]       = useState(team?.type       || 'queue')
  const [desc,       setDesc]       = useState(team?.description || '')
  const [members,    setMembers]    = useState(team?.members    || [])
  const [hasCoverage,setHasCoverage]= useState(!!(team?.coverageHours))
  const [tzZone,     setTzZone]     = useState(team?.timezone   || 'US-East')
  const [hoursFrom,  setHoursFrom]  = useState('09:00')
  const [hoursTo,    setHoursTo]    = useState('18:00')
  const [assignment, setAssignment] = useState(team?.assignmentMethod || 'round-robin')
  const [memberSearch, setMemberSearch] = useState('')

  const TYPE_TABS  = ['queue', 'roster', 'role', 'rotation']
  const ASSIGN_OPT = ['round-robin', 'skill-based', 'least-busy']

  const addMember = (name) => {
    if (!members.find(m => m.name === name)) {
      setMembers(ms => [...ms, { name, role: 'Agent', status: 'online' }])
    }
    setMemberSearch('')
  }
  const removeMember = (name) => setMembers(ms => ms.filter(m => m.name !== name))

  const filteredPool = PEOPLE_POOL.filter(p =>
    !members.find(m => m.name === p) &&
    p.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name, type, description: desc, members, status: 'active',
      assignmentMethod: assignment,
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
              {type === 'queue'    && 'Round-robin or skill-based — any available member picks it up.'}
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

          {/* Members */}
          <div className="tq-field">
            <label className="tq-label">Members</label>
            {members.length > 0 && (
              <div className="tq-member-list">
                {members.map(m => (
                  <div key={m.name} className="tq-member-row">
                    <div className="tq-avatar-sm">{initials(m.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.role}</div>
                    </div>
                    <button className="tq-remove-btn" onClick={() => removeMember(m.name)}><X size={11} /></button>
                  </div>
                ))}
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

          {/* Assignment method (Queue only) */}
          {type === 'queue' && (
            <div className="tq-field">
              <label className="tq-label">Assignment method</label>
              <div className="tq-assign-row">
                {ASSIGN_OPT.map(a => (
                  <button key={a} className={`tq-assign-btn${assignment === a ? ' tq-assign-btn--sel' : ''}`} onClick={() => setAssignment(a)}>
                    {a === 'round-robin' ? 'Round-robin' : a === 'skill-based' ? 'Skill-based' : 'Least busy'}
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

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, onEdit }) {
  const cfg    = TYPE_CFG[team.type] || TYPE_CFG.queue
  const online = team.members.filter(m => m.status === 'online').length
  const busy   = team.members.filter(m => m.status === 'busy').length
  const dotCls = online > 0 ? 'tq-dot--green' : busy > 0 ? 'tq-dot--amber' : 'tq-dot--gray'
  const visible = team.members.slice(0, 4)
  const extra  = team.members.length - 4

  return (
    <div className="tq-card">
      <div className="tq-card-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tq-type-emoji">{cfg.emoji}</span>
          <Badge label={cfg.label} variant={cfg.variant} size="sm" />
        </div>
        <div className={`tq-status-dot ${dotCls}`} />
      </div>

      <div className="tq-card-name">{team.name}</div>
      {team.description && <div className="tq-card-desc">{team.description}</div>}

      {/* Avatars */}
      <div className="tq-avatars">
        {visible.map(m => (
          <div key={m.name} className={`tq-avatar tq-avatar--${m.status}`} title={`${m.name} — ${m.status}`}>
            {initials(m.name)}
          </div>
        ))}
        {extra > 0 && <div className="tq-avatar tq-avatar--more">+{extra}</div>}
      </div>

      {/* Stats */}
      <div className="tq-card-stats">
        <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
        <span className="tq-stat-sep">·</span>
        <span>{team.activeItems} active</span>
        <span className="tq-stat-sep">·</span>
        <span>Used in {team.usedInPacks} pack{team.usedInPacks !== 1 ? 's' : ''}</span>
      </div>

      {team.coverageHours && (
        <div className="tq-card-coverage">
          🕐 {team.coverageHours} · {team.timezone}
        </div>
      )}

      <div className="tq-card-foot">
        <button className="tq-card-btn" onClick={() => onEdit(team.id)}>
          <Pencil size={12} /> Edit
        </button>
        <button className="tq-card-btn">
          <Users size={12} /> View members
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeamsAndQueues() {
  const [teams,      setTeams]      = useState(teamsAndQueues)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId,     setEditId]     = useState(null)

  const filtered = teams.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'All' && t.type !== typeFilter) return false
    return true
  })

  const openNew  = () => { setEditId(null); setDrawerOpen(true) }
  const openEdit = id => { setEditId(id);   setDrawerOpen(true) }
  const close    = () => { setDrawerOpen(false); setEditId(null) }

  const save = (data) => {
    if (editId) {
      setTeams(ts => ts.map(t => t.id === editId ? { ...t, ...data } : t))
    } else {
      const newId = 'team-' + String(teams.length + 1).padStart(3, '0')
      setTeams(ts => [...ts, { id: newId, activeItems: 0, usedInPacks: 0, ...data }])
    }
    close()
  }

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

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="tq-empty">No teams match the current filters.</div>
      ) : (
        <div className="tq-grid">
          {filtered.map(t => (
            <TeamCard key={t.id} team={t} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <TeamDrawer
          team={editId ? teams.find(t => t.id === editId) : null}
          onSave={save}
          onClose={close}
        />
      )}
    </div>
  )
}
