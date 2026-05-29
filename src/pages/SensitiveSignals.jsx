import { useState } from 'react'
import { rosters } from '../data/mockData.js'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import {
  Shield, AlertTriangle, Check, ChevronDown, ChevronUp,
  Plus, X, Lock, Users, FileText, ArrowRight, CheckCircle
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

export default function SensitiveSignals() {
  const [expanded, setExpanded]     = useState({})
  const [rosterState, setRosterState] = useState(buildInitialState)
  const [addingTo, setAddingTo]     = useState(null)
  const [newMember, setNewMember]   = useState({ name: '', role: '', email: '' })

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
    </div>
  )
}
