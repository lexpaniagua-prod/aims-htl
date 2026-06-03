import { useState } from 'react'
import { rosters, customSignalClasses } from '../data/mockData.js'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import {
  Shield, AlertTriangle, Check, ChevronDown, ChevronUp,
  Plus, X, Lock, Users, FileText, ArrowRight, CheckCircle, MoreHorizontal
} from 'lucide-react'
import './SensitiveSignals.css'

const COLOR_MAP = {
  safety:       'coral',
  legal:        'amber',
  hr:           'purple',
  security:     'blue',
  whistleblower:'teal',
}

function initMembers(roster) {
  return roster.members.map((m, i) => {
    const month = String(Math.max(1, 5 - Math.floor(i / 2))).padStart(2, '0')
    const day   = String(10 + i * 7 > 28 ? (10 + i * 7) - 20 : 10 + i * 7).padStart(2, '0')
    return { ...m, addedDate: `2026-${month}-${day}` }
  })
}

function buildInitialState() {
  const state = {}
  rosters.forEach(r => {
    state[r.signalClass] = {
      members: initMembers(r),
      policy: r.policy,
      escalationPath: r.escalationPath,
    }
  })
  return state
}

const PRIORITY_CFG = {
  Standard: { variant: 'gray',  hint: 'Joins the normal queue with a sensitive flag.' },
  High:     { variant: 'amber', hint: 'Surfaced at the top of the Inbox, amber indicator.' },
  Critical: { variant: 'coral', hint: 'Immediately bypasses queue, coral indicator, mandatory ack.' },
}

const CUSTOM_COLOR = { Standard: 'blue', High: 'amber', Critical: 'coral' }

// ─── New Signal Class Drawer ──────────────────────────────────────────────────
function NewSignalDrawer({ initial, onSave, onClose }) {
  const [name,       setName]       = useState(initial?.name        || '')
  const [desc,       setDesc]       = useState(initial?.description || '')
  const [keywords,   setKeywords]   = useState(initial?.keywords    || [])
  const [kwInput,    setKwInput]    = useState('')
  const [minReq,     setMinReq]     = useState(initial?.minRequired || 1)
  const [priority,   setPriority]   = useState(initial?.priority    || 'Standard')

  const addKw = () => {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw)) { setKeywords(ks => [...ks, kw]); setKwInput('') }
  }

  const handleSave = () => {
    if (!name.trim() || !desc.trim()) return
    onSave({ name, description: desc, keywords, minRequired: Number(minReq), priority,
             mandatoryAck: true, members: [], policyAttached: false,
             status: 'incomplete', isCustom: true })
  }

  return (
    <>
      <div className="sc-overlay" onClick={onClose} />
      <div className="sc-drawer">
        <div className="sc-drawer-hdr">
          <span className="sc-drawer-title">{initial ? 'Edit Signal Class' : 'New Signal Class'}</span>
          <button className="sc-drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="sc-drawer-body">
          {/* Name */}
          <div className="sc-field">
            <label className="sc-label">Name <span className="sc-req">*</span></label>
            <input className="sc-input" placeholder="e.g. Financial Fraud, Data Privacy, Reputational Risk" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Description */}
          <div className="sc-field">
            <label className="sc-label">Description <span className="sc-req">*</span></label>
            <textarea className="sc-textarea" placeholder="When is this signal activated? What type of situation does it cover?" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
          </div>

          {/* Keywords */}
          <div className="sc-field">
            <label className="sc-label">Keywords or phrases that trigger this class</label>
            {keywords.length > 0 && (
              <div className="sc-kw-pills">
                {keywords.map(kw => (
                  <span key={kw} className="sc-kw-pill">
                    {kw}
                    <button onClick={() => setKeywords(ks => ks.filter(k => k !== kw))}><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="sc-kw-row">
              <input className="sc-input" placeholder="Add keyword and press Enter…" value={kwInput}
                onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()} />
              <Button variant="secondary" size="sm" onClick={addKw}>Add</Button>
            </div>
            <div className="sc-hint">Add terms the AI should watch for. Plain language — no regex needed.</div>
          </div>

          {/* Min required */}
          <div className="sc-field">
            <label className="sc-label">Minimum designated responders required</label>
            <input className="sc-input sc-input--sm" type="number" min={1} value={minReq} onChange={e => setMinReq(e.target.value)} style={{ width: 80 }} />
            <div className="sc-hint">The class shows as Incomplete until this many members are assigned.</div>
          </div>

          {/* Mandatory ack — locked */}
          <div className="sc-field">
            <div className="sc-ack-locked">
              <div>
                <div className="sc-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={12} /> Mandatory acknowledgment before action
                </div>
                <div className="sc-hint" style={{ marginTop: 3 }}>Required for all signal classes — cannot be disabled.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75, cursor: 'not-allowed' }}>
                <div style={{ width: 34, height: 19, borderRadius: 10, background: 'var(--accent-teal)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 2.5, left: 18, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
                </div>
                <span style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)' }}>ON</span>
                <Lock size={11} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="sc-field">
            <label className="sc-label">Priority level</label>
            <div className="sc-priority-row">
              {Object.entries(PRIORITY_CFG).map(([p, cfg]) => (
                <button key={p} className={`sc-priority-btn${priority === p ? ' sc-priority-btn--sel' : ''}`} onClick={() => setPriority(p)}>
                  {p}
                </button>
              ))}
            </div>
            <div className="sc-hint">{PRIORITY_CFG[priority].hint}</div>
          </div>
        </div>

        <div className="sc-drawer-foot">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim() || !desc.trim()}>
            Save Signal Class
          </Button>
        </div>
      </div>
    </>
  )
}

export default function SensitiveSignals() {
  const [expanded,    setExpanded]    = useState({})
  const [rosterState, setRosterState] = useState(buildInitialState)
  const [addingTo,    setAddingTo]    = useState(null)
  const [newMember,   setNewMember]   = useState({ name: '', role: '', email: '' })
  const [customClasses, setCustomClasses] = useState(customSignalClasses)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [editingCustom, setEditingCustom] = useState(null) // id being edited
  const [customExpanded, setCustomExpanded] = useState({})
  const [customAddingTo, setCustomAddingTo] = useState(null)
  const [customNewMember, setCustomNewMember] = useState({ name: '', role: '', email: '' })

  function toggle(cls) {
    setExpanded(prev => ({ ...prev, [cls]: !prev[cls] }))
  }

  function removeMember(cls, idx) {
    setRosterState(prev => ({
      ...prev,
      [cls]: {
        ...prev[cls],
        members: prev[cls].members.filter((_, i) => i !== idx),
      },
    }))
  }

  function addMember(cls) {
    if (!newMember.name || !newMember.email) return
    setRosterState(prev => ({
      ...prev,
      [cls]: {
        ...prev[cls],
        members: [
          ...prev[cls].members,
          { ...newMember, addedDate: '2026-05-28' },
        ],
      },
    }))
    setNewMember({ name: '', role: '', email: '' })
    setAddingTo(null)
  }

  function isComplete(cls) {
    const roster = rosters.find(r => r.signalClass === cls)
    return rosterState[cls].members.length >= roster.minRequired
  }

  const saveCustom = (data) => {
    const id = 'sig-custom-' + String(customClasses.length + 1).padStart(3, '0')
    if (editingCustom) {
      setCustomClasses(cs => cs.map(c => c.id === editingCustom ? { ...c, ...data } : c))
    } else {
      setCustomClasses(cs => [...cs, { id, ...data }])
    }
    setDrawerOpen(false); setEditingCustom(null)
  }

  const addCustomMember = (id) => {
    if (!customNewMember.name || !customNewMember.email) return
    setCustomClasses(cs => cs.map(c => c.id === id
      ? { ...c, members: [...c.members, { ...customNewMember, addedDate: '2026-05-28' }],
               status: c.members.length + 1 >= c.minRequired ? 'complete' : 'incomplete' }
      : c))
    setCustomNewMember({ name: '', role: '', email: '' })
    setCustomAddingTo(null)
  }

  const removeCustomMember = (id, idx) => {
    setCustomClasses(cs => cs.map(c => c.id === id
      ? { ...c, members: c.members.filter((_, i) => i !== idx) }
      : c))
  }

  return (
    <div>
      {/* Mandatory warning banner */}
      <div className="ss-mandatory-banner">
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Sensitive Signal Routing is mandatory</strong> — you configure who responds, not whether routing fires.
          When a signal is detected, HTL always routes. These rosters determine who receives the item.
        </div>
      </div>

      {/* Page header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Sensitive Signal Roster Management</h1>
          <p className="page-subtitle">Configure designated reviewers for each sensitive signal class</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingCustom(null); setDrawerOpen(true) }}>
            New Signal Class
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="ss-summary-row">
        {rosters.map(r => (
          <div
            key={r.signalClass}
            className={`ss-summary-chip ss-summary-chip--${isComplete(r.signalClass) ? 'complete' : 'incomplete'}`}
            onClick={() => toggle(r.signalClass)}
          >
            {isComplete(r.signalClass) ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
            {r.label}
          </div>
        ))}
      </div>

      {/* Signal class cards */}
      {rosters.map(roster => {
        const cls     = roster.signalClass
        const color   = COLOR_MAP[cls]
        const state   = rosterState[cls]
        const complete = isComplete(cls)
        const isOpen  = !!expanded[cls]

        return (
          <div key={cls} className={`ss-card ss-card--${complete ? 'complete' : 'incomplete'}`}>
            {/* Card header — click to expand */}
            <div className="ss-card-header" onClick={() => toggle(cls)}>
              <div className="ss-card-header-left">
                <div className={`ss-signal-icon ss-signal-icon--${color}`}>
                  <Shield size={14} />
                </div>
                <div>
                  <div className="ss-card-title">{roster.label}</div>
                  <div className="ss-card-desc">{roster.description}</div>
                </div>
              </div>
              <div className="ss-card-header-right">
                <span className="ss-member-count">
                  <Users size={11} /> {state.members.length} member{state.members.length !== 1 ? 's' : ''}
                </span>
                <Badge label={`min ${roster.minRequired}`} variant="gray" size="sm" />
                <Badge label="Policy attached" variant="blue" size="sm" />
                <Badge label="Ack required" variant="amber" size="sm" />
                <div className={`ss-status-pill ss-status-pill--${complete ? 'complete' : 'incomplete'}`}>
                  {complete ? <><Check size={10} /> Complete</> : <><AlertTriangle size={10} /> Incomplete</>}
                </div>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {/* Expanded editor */}
            {isOpen && (
              <div className="ss-card-body">
                {/* Incomplete warning */}
                {!complete && (
                  <div className="ss-incomplete-banner">
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                    This roster has fewer than the required minimum ({roster.minRequired}) members. Items may fail to route.
                  </div>
                )}

                {/* Member table */}
                <div className="ss-section-label">Roster Members</div>
                <div className="ss-member-table">
                  <div className="ss-member-row ss-member-row--header">
                    <span>Name</span>
                    <span>Role</span>
                    <span>Email</span>
                    <span>Added</span>
                    <span></span>
                  </div>
                  {state.members.map((m, i) => (
                    <div key={i} className="ss-member-row">
                      <span className="ss-member-name">{m.name}</span>
                      <span className="ss-member-role">{m.role}</span>
                      <span className="ss-member-email">{m.email}</span>
                      <span className="ss-member-date">{m.addedDate}</span>
                      <button
                        className="ss-remove-btn"
                        onClick={e => { e.stopPropagation(); removeMember(cls, i) }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add member form — inline expand */}
                {addingTo === cls ? (
                  <div className="ss-add-form">
                    <input
                      className="ss-input"
                      placeholder="Name"
                      value={newMember.name}
                      onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))}
                    />
                    <input
                      className="ss-input"
                      placeholder="Role"
                      value={newMember.role}
                      onChange={e => setNewMember(m => ({ ...m, role: e.target.value }))}
                    />
                    <input
                      className="ss-input"
                      placeholder="email@company.com"
                      value={newMember.email}
                      onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))}
                    />
                    <Button variant="primary" size="sm" onClick={() => addMember(cls)}>Add</Button>
                    <Button variant="secondary" size="sm" onClick={() => setAddingTo(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => { setAddingTo(cls); setNewMember({ name: '', role: '', email: '' }) }}
                    style={{ marginTop: 8 }}
                  >
                    Add member
                  </Button>
                )}

                {/* Policy */}
                <div className="ss-section-label" style={{ marginTop: 20 }}>Policy</div>
                <div className="ss-policy-block">{state.policy}</div>

                {/* Escalation path */}
                <div className="ss-section-label" style={{ marginTop: 16 }}>
                  Escalation Path (when roster unavailable)
                </div>
                <div className="ss-escalation-path">
                  {roster.escalationPath.split('→').map((step, i, arr) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="ss-escalation-step">{step.trim()}</span>
                      {i < arr.length - 1 && (
                        <ArrowRight size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      )}
                    </span>
                  ))}
                </div>

                {/* Mandatory ack toggle — locked */}
                <div className="ss-ack-row">
                  <div>
                    <div className="ss-ack-label">
                      <Lock size={12} /> Mandatory acknowledgment
                    </div>
                    <div className="ss-ack-hint">
                      Required by HTL policy — cannot be disabled for sensitive signal classes
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7, cursor: 'not-allowed' }}>
                    <div style={{ width: 34, height: 19, borderRadius: 10, background: 'var(--accent-teal)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 2.5, left: 18, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
                    </div>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)' }}>ON</span>
                    <Lock size={11} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Custom signal classes ─────────────────────────────────────────── */}
      {customClasses.map(cc => {
        const complete  = cc.members.length >= cc.minRequired
        const isOpen    = !!customExpanded[cc.id]
        const color     = CUSTOM_COLOR[cc.priority] || 'blue'
        const [menuOpen, setMenuOpen] = [false, () => {}] // simple inline menu

        return (
          <div key={cc.id} className={`ss-card ss-card--${complete ? 'complete' : 'incomplete'}`} style={{ position: 'relative' }}>
            <div className="ss-card-header" onClick={() => setCustomExpanded(p => ({ ...p, [cc.id]: !p[cc.id] }))}>
              <div className="ss-card-header-left">
                <div className={`ss-signal-icon ss-signal-icon--${color}`}>
                  <Shield size={14} />
                </div>
                <div>
                  <div className="ss-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cc.name}
                    <span style={{ fontFamily: 'DM Mono', fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>Custom</span>
                  </div>
                  <div className="ss-card-desc">{cc.description}</div>
                </div>
              </div>
              <div className="ss-card-header-right">
                <span className="ss-member-count"><Users size={11} /> {cc.members.length} member{cc.members.length !== 1 ? 's' : ''}</span>
                <Badge label={`min ${cc.minRequired}`} variant="gray" size="sm" />
                <Badge label={cc.priority} variant={PRIORITY_CFG[cc.priority]?.variant || 'gray'} size="sm" />
                <Badge label="Ack required" variant="amber" size="sm" />
                <div className={`ss-status-pill ss-status-pill--${complete ? 'complete' : 'incomplete'}`}>
                  {complete ? <><Check size={10} /> Complete</> : <><AlertTriangle size={10} /> Incomplete</>}
                </div>
                {/* Three-dot menu */}
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button className="sc-menu-btn" onClick={e => {
                    e.stopPropagation()
                    setCustomExpanded(p => ({ ...p, [cc.id + '_menu']: !p[cc.id + '_menu'] }))
                  }}>
                    <MoreHorizontal size={14} />
                  </button>
                  {customExpanded[cc.id + '_menu'] && (
                    <div className="sc-menu-drop">
                      <button className="sc-menu-item" onClick={() => {
                        setEditingCustom(cc.id); setDrawerOpen(true)
                        setCustomExpanded(p => ({ ...p, [cc.id + '_menu']: false }))
                      }}>Edit</button>
                      <button className="sc-menu-item sc-menu-item--danger" onClick={() => {
                        setCustomClasses(cs => cs.filter(c => c.id !== cc.id))
                      }}>Archive</button>
                    </div>
                  )}
                </div>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {isOpen && (
              <div className="ss-card-body">
                {!complete && (
                  <div className="ss-incomplete-banner">
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                    This roster has fewer than the required minimum ({cc.minRequired}) members.
                  </div>
                )}
                <div className="ss-section-label">Roster Members</div>
                <div className="ss-member-table">
                  <div className="ss-member-row ss-member-row--header">
                    <span>Name</span><span>Role</span><span>Email</span><span>Added</span><span></span>
                  </div>
                  {cc.members.length === 0 && (
                    <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>No members yet.</div>
                  )}
                  {cc.members.map((m, i) => (
                    <div key={i} className="ss-member-row">
                      <span className="ss-member-name">{m.name}</span>
                      <span className="ss-member-role">{m.role}</span>
                      <span className="ss-member-email">{m.email}</span>
                      <span className="ss-member-date">{m.addedDate}</span>
                      <button className="ss-remove-btn" onClick={e => { e.stopPropagation(); removeCustomMember(cc.id, i) }}><X size={12} /></button>
                    </div>
                  ))}
                </div>
                {customAddingTo === cc.id ? (
                  <div className="ss-add-form">
                    <input className="ss-input" placeholder="Name" value={customNewMember.name} onChange={e => setCustomNewMember(m => ({ ...m, name: e.target.value }))} />
                    <input className="ss-input" placeholder="Role" value={customNewMember.role} onChange={e => setCustomNewMember(m => ({ ...m, role: e.target.value }))} />
                    <input className="ss-input" placeholder="email@company.com" value={customNewMember.email} onChange={e => setCustomNewMember(m => ({ ...m, email: e.target.value }))} />
                    <Button variant="primary" size="sm" onClick={() => addCustomMember(cc.id)}>Add</Button>
                    <Button variant="secondary" size="sm" onClick={() => setCustomAddingTo(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" icon={Plus}
                    onClick={() => { setCustomAddingTo(cc.id); setCustomNewMember({ name: '', role: '', email: '' }) }}
                    style={{ marginTop: 8 }}>
                    Add member
                  </Button>
                )}
                {cc.keywords?.length > 0 && (
                  <>
                    <div className="ss-section-label" style={{ marginTop: 20 }}>Detection Keywords</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {cc.keywords.map(kw => (
                        <span key={kw} style={{ fontFamily: 'DM Mono', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{kw}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <NewSignalDrawer
          initial={editingCustom ? customClasses.find(c => c.id === editingCustom) : null}
          onSave={saveCustom}
          onClose={() => { setDrawerOpen(false); setEditingCustom(null) }}
        />
      )}
    </div>
  )
}
