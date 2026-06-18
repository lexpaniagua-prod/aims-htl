import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { PEOPLE } from '../data/workQueueData'
import './WorkQueue.css'

const TABS = [
  { label: 'Overview',     path: '/work-queue/overview'     },
  { label: 'Messages',     path: '/work-queue/messages'     },
  { label: 'Queue',        path: '/work-queue/queue'        },
  { label: 'Activity',     path: '/work-queue/activity'     },
  { label: 'Attestations', path: '/work-queue/attestations' },
]

const WQ_PERSONA_KEY = 'htl-wq-persona'

export default function WorkQueueLayout() {
  const [personaId, setPersonaId] = useState(
    () => localStorage.getItem(WQ_PERSONA_KEY) || 'p1'
  )
  const location = useLocation()

  const currentUser = PEOPLE.find(p => p.id === personaId) || PEOPLE[0]

  const handlePersonaChange = (id) => {
    setPersonaId(id)
    localStorage.setItem(WQ_PERSONA_KEY, id)
  }

  return (
    <div className="wq-root">
      <div className="wq-subnav">
        <nav className="wq-tabs">
          {TABS.map(t => {
            const active = location.pathname.startsWith(t.path)
            return (
              <NavLink
                key={t.path}
                to={t.path}
                className={`wq-tab${active ? ' wq-tab--active' : ''}`}
              >
                {t.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="wq-persona-row">
          <span className="wq-persona-label">Persona:</span>
          <select
            className="wq-persona-select"
            value={personaId}
            onChange={e => handlePersonaChange(e.target.value)}
          >
            {PEOPLE.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.scope})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="wq-page">
        <Outlet context={{ currentUser, personaId }} />
      </div>
    </div>
  )
}
