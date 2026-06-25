import { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search, X, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { EVENTS, SEVERITY, EVENT_TYPES, STUDIOS, PEOPLE } from '../data/workQueueData'

// ── Constants ─────────────────────────────────────────────────────────────────

const SEV_COLOR = { now: '#f43f5e', red: '#ef4444', yellow: '#f59e0b', green: '#10b981' }

const TASK_STATUS = {
  new:           { label: 'New',         dot: '#3b82f6', color: '#3b82f6'  },
  'in-progress': { label: 'In Progress', dot: '#f59e0b', color: '#f59e0b'  },
  pending:       { label: 'Pending',     dot: '#8b5cf6', color: '#8b5cf6'  },
  resolved:      { label: 'Resolved',    dot: '#10b981', color: '#10b981'  },
}

const STATUS_ORDER = ['new', 'in-progress', 'pending', 'resolved']

const COLUMNS = [
  { id: 'new',          label: 'New',         color: '#3b82f6' },
  { id: 'in-progress',  label: 'In Progress',  color: '#f59e0b' },
  { id: 'pending',      label: 'Pending',      color: '#8b5cf6' },
  { id: 'resolved',     label: 'Resolved',     color: '#10b981' },
]

const PRIMARY_ACTION = {
  approve: 'Review', review: 'Open Review', respond: 'View Details',
  resolve: 'Review Conflict', acknowledge: 'View', train: 'Review & Edit',
}
const SECONDARY_ACTIONS = {
  approve:     ['Approve', 'Reject'],
  review:      ['Request Changes', 'Approve'],
  respond:     ['Respond'],
  resolve:     ['Resolve'],
  acknowledge: ['Acknowledge'],
  train:       ['Promote', 'Reject'],
}

function initStatuses() {
  const map = {}
  for (const e of EVENTS) {
    if (e.severity === 'now' || e.severity === 'red') map[e.id] = 'new'
    else if (e.severity === 'yellow') map[e.id] = 'in-progress'
    else map[e.id] = 'pending'
  }
  // Populate Resolved column with a few green events for demo
  const greenIds = EVENTS.filter(e => e.severity === 'green').slice(0, 3).map(e => e.id)
  greenIds.forEach(id => { map[id] = 'resolved' })
  return map
}

// ── Shared: status dropdown ───────────────────────────────────────────────────

function StatusMenu({ current, onChange, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="tvw-status-menu">
      {STATUS_ORDER.map(s => (
        <button
          key={s}
          className={`tvw-status-opt${s === current ? ' tvw-status-opt--active' : ''}`}
          onClick={() => onChange(s)}
        >
          <span className="tvw-status-opt-dot" style={{ background: TASK_STATUS[s].dot }} />
          {TASK_STATUS[s].label}
        </button>
      ))}
    </div>
  )
}

// ── Board: task card ──────────────────────────────────────────────────────────

function TaskCard({ event, onOpen, onDragStart }) {
  const studio   = STUDIOS[event.studio] ?? { short: '?', accentColor: '#6b7280' }
  const etype    = EVENT_TYPES[event.type]
  const owner    = PEOPLE.find(p => p.id === event.ownerId)
  const sevColor = SEV_COLOR[event.severity]
  const isUrgent = ['Due now', 'Paused', 'Blocking'].includes(event.dueLabel)

  return (
    <div
      className="tvw-task-card"
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      style={{ borderLeftColor: sevColor }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
    >
      <div className="tvw-card-top">
        <div className="tvw-card-badges">
          <span
            className="tvw-badge tvw-badge--studio"
            style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}
          >
            {studio.short}
          </span>
          <span className="tvw-badge tvw-badge--type" style={{ color: etype.color }}>
            {etype.label}
          </span>
          {event.missionCritical && <span className="tvw-crit-dot" title="Mission Critical" />}
        </div>
        <span className={`tvw-card-due${isUrgent ? ' tvw-card-due--urgent' : ''}`}>
          {event.dueLabel}
        </span>
      </div>
      <div className="tvw-card-title">{event.title}</div>
      <div className="tvw-card-bottom">
        <div className="tvw-card-owner">
          <span className="tvw-avatar">{owner?.initials ?? '?'}</span>
          <span className="tvw-owner-name">{owner?.name ?? '—'}</span>
        </div>
        <span className="tvw-card-id">{event.id}</span>
      </div>
    </div>
  )
}

// ── Board view ────────────────────────────────────────────────────────────────

function BoardView({ events, statuses, onStatusChange, onOpen, showToast }) {
  const [dragId, setDragId]   = useState(null)
  const [overCol, setOverCol] = useState(null)

  const cols = COLUMNS.map(col => ({
    ...col,
    events: events.filter(e => statuses[e.id] === col.id),
  }))

  function handleDrop(colId) {
    if (dragId && dragId !== colId) {
      onStatusChange(dragId, colId)
      showToast(`Moved to ${COLUMNS.find(c => c.id === colId)?.label}`)
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="tvw-board">
      {cols.map(col => (
        <div
          key={col.id}
          className={`tvw-col${overCol === col.id ? ' tvw-col--over' : ''}`}
          onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null) }}
          onDrop={() => handleDrop(col.id)}
        >
          <div className="tvw-col-hd">
            <span className="tvw-col-dot" style={{ background: col.color }} />
            <span className="tvw-col-label">{col.label}</span>
            <span className="tvw-col-count">{col.events.length}</span>
          </div>
          <div className="tvw-col-body">
            {col.events.length === 0
              ? <div className="tvw-col-empty">No tasks</div>
              : col.events.map(e => (
                  <TaskCard
                    key={e.id}
                    event={e}
                    onOpen={() => onOpen(e)}
                    onDragStart={() => setDragId(e.id)}
                  />
                ))
            }
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Table view ────────────────────────────────────────────────────────────────

function TableView({ events, statuses, onStatusChange, onOpen, showToast }) {
  const [sortCol,      setSortCol]      = useState('severity')
  const [sortDir,      setSortDir]      = useState('desc')
  const [openStatusId, setOpenStatusId] = useState(null)

  const SEV_RANK = { now: 4, red: 3, yellow: 2, green: 1 }

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      let va, vb
      switch (sortCol) {
        case 'severity': va = SEV_RANK[a.severity];  vb = SEV_RANK[b.severity];  break
        case 'title':    va = a.title;                vb = b.title;                break
        case 'type':     va = a.type;                 vb = b.type;                 break
        case 'studio':   va = a.studio;               vb = b.studio;               break
        case 'owner':
          va = PEOPLE.find(p => p.id === a.ownerId)?.name ?? ''
          vb = PEOPLE.find(p => p.id === b.ownerId)?.name ?? ''
          break
        case 'due':      va = a.dueLabel ?? '';        vb = b.dueLabel ?? '';        break
        case 'status':   va = statuses[a.id] ?? '';    vb = statuses[b.id] ?? '';    break
        default:         va = 0; vb = 0
      }
      const cmp = typeof va === 'number' ? va - vb : (va ?? '').localeCompare(vb ?? '')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [events, sortCol, sortDir, statuses])

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const TABLE_COLS = [
    { id: 'severity', label: 'Sev' },
    { id: 'title',    label: 'Title' },
    { id: 'type',     label: 'Type' },
    { id: 'studio',   label: 'Studio' },
    { id: 'owner',    label: 'Owner' },
    { id: 'due',      label: 'Due' },
    { id: 'status',   label: 'Status' },
  ]

  if (!sorted.length) return <div className="tvw-empty">No tasks match your filters.</div>

  return (
    <div className="tvw-table-wrap">
      <table className="tvw-table">
        <thead>
          <tr>
            {TABLE_COLS.map(c => (
              <th key={c.id} className="tvw-th" onClick={() => toggleSort(c.id)}>
                {c.label}
                <span className="tvw-sort-arrow">
                  {sortCol === c.id ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(e => {
            const studio   = STUDIOS[e.studio] ?? { short: '?', accentColor: '#6b7280' }
            const etype    = EVENT_TYPES[e.type]
            const owner    = PEOPLE.find(p => p.id === e.ownerId)
            const sevColor = SEV_COLOR[e.severity]
            const status   = statuses[e.id]
            const st       = TASK_STATUS[status]
            const isUrgent = ['Due now', 'Paused', 'Blocking'].includes(e.dueLabel)

            return (
              <tr key={e.id} className="tvw-tr">
                <td className="tvw-td">
                  <span className="tvw-sev-dot" style={{ background: sevColor }} title={SEVERITY[e.severity]?.label} />
                </td>
                <td className="tvw-td tvw-td--title">
                  <button className="tvw-title-btn" onClick={() => onOpen(e)}>{e.title}</button>
                </td>
                <td className="tvw-td">
                  <span className="tvw-badge tvw-badge--type" style={{ color: etype.color }}>{etype.label}</span>
                </td>
                <td className="tvw-td">
                  <span
                    className="tvw-badge tvw-badge--studio"
                    style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}
                  >
                    {studio.short}
                  </span>
                </td>
                <td className="tvw-td tvw-td--owner">
                  <span className="tvw-avatar tvw-avatar--sm">{owner?.initials ?? '?'}</span>
                  <span>{owner?.name ?? '—'}</span>
                </td>
                <td className={`tvw-td${isUrgent ? ' tvw-td--urgent' : ''}`}>{e.dueLabel}</td>
                <td className="tvw-td" style={{ position: 'relative' }}>
                  <button
                    className="tvw-status-pill"
                    style={{ color: st.color, borderColor: st.color + '44', background: st.color + '14' }}
                    onClick={() => setOpenStatusId(openStatusId === e.id ? null : e.id)}
                  >
                    {st.label} <ChevronDown size={10} />
                  </button>
                  {openStatusId === e.id && (
                    <StatusMenu
                      current={status}
                      onChange={s => {
                        onStatusChange(e.id, s)
                        showToast(`Status → ${TASK_STATUS[s].label}`)
                        setOpenStatusId(null)
                      }}
                      onClose={() => setOpenStatusId(null)}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Task detail slideout ──────────────────────────────────────────────────────

function TaskDetail({ event, status, onClose, onStatusChange, showToast }) {
  const studio   = STUDIOS[event.studio] ?? { short: '?', accentColor: '#6b7280' }
  const etype    = EVENT_TYPES[event.type]
  const owner    = PEOPLE.find(p => p.id === event.ownerId)
  const sevColor = SEV_COLOR[event.severity]
  const st       = TASK_STATUS[status]
  const isUrgent = ['Due now', 'Paused', 'Blocking'].includes(event.dueLabel)
  const [statusOpen, setStatusOpen] = useState(false)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="tvw-detail-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tvw-detail-panel">

        {/* Header */}
        <div className="tvw-detail-hd">
          <div style={{ position: 'relative' }}>
            <button
              className="tvw-detail-status-btn"
              style={{ color: st.color, borderColor: st.color + '55', background: st.color + '15' }}
              onClick={() => setStatusOpen(o => !o)}
            >
              <span className="tvw-status-opt-dot" style={{ background: st.dot }} />
              {st.label}
              <ChevronDown size={12} />
            </button>
            {statusOpen && (
              <StatusMenu
                current={status}
                onChange={s => {
                  onStatusChange(event.id, s)
                  showToast(`Status → ${TASK_STATUS[s].label}`)
                  setStatusOpen(false)
                }}
                onClose={() => setStatusOpen(false)}
              />
            )}
          </div>
          <button className="tvw-detail-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        {/* Title */}
        <div className="tvw-detail-title">{event.title}</div>

        {/* Badges */}
        <div className="tvw-detail-badges">
          <span
            className="tvw-badge tvw-badge--studio"
            style={{ color: studio.accentColor, borderColor: studio.accentColor + '44' }}
          >
            {studio.short}
          </span>
          <span className="tvw-badge tvw-badge--type" style={{ color: etype.color }}>{etype.label}</span>
          <span
            className="tvw-badge"
            style={{ color: sevColor, borderColor: sevColor + '44', background: sevColor + '15' }}
          >
            {SEVERITY[event.severity]?.label}
          </span>
          {event.missionCritical && <span className="tvw-badge tvw-badge--crit">Mission Critical</span>}
        </div>

        {/* Metadata */}
        <div className="tvw-detail-meta">
          <div className="tvw-meta-row">
            <span className="tvw-meta-label">Assignee</span>
            <div className="tvw-meta-owner">
              <span className="tvw-avatar tvw-avatar--sm">{owner?.initials ?? '?'}</span>
              <span>{owner?.name ?? '—'}</span>
            </div>
          </div>
          <div className="tvw-meta-row">
            <span className="tvw-meta-label">Due</span>
            <span className={isUrgent ? 'tvw-urgent' : ''}>{event.dueLabel ?? '—'}</span>
          </div>
          <div className="tvw-meta-row">
            <span className="tvw-meta-label">Event ID</span>
            <span className="tvw-meta-id">{event.id}</span>
          </div>
          {event.spec && (
            <div className="tvw-meta-row">
              <span className="tvw-meta-label">Spec</span>
              <span className="tvw-meta-id">{event.spec}</span>
            </div>
          )}
        </div>

        <div className="tvw-detail-divider" />

        {/* Description */}
        <div className="tvw-detail-section">
          <div className="tvw-section-label">Description</div>
          <p className="tvw-section-text">{event.detail}</p>
        </div>

        {/* Actions */}
        <div className="tvw-detail-section">
          <div className="tvw-section-label">Actions</div>
          <div className="tvw-detail-actions">
            <button className="wq-btn wq-btn--primary">{PRIMARY_ACTION[event.type] ?? 'View'}</button>
            {(SECONDARY_ACTIONS[event.type] ?? []).map(a => (
              <button key={a} className="wq-btn wq-btn--ghost">{a}</button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="tvw-detail-footer">
          <button
            className="tvw-footer-link"
            onClick={() => { showToast('Ask dialog coming soon'); onClose() }}
          >
            Ask
          </button>
          <button
            className="tvw-footer-link tvw-footer-link--esc"
            onClick={() => { showToast('Escalate dialog coming soon'); onClose() }}
          >
            Escalate
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function WQTaskView() {
  useOutletContext() // provides currentUser; keep for Outlet compatibility

  const [statuses,        setStatuses]        = useState(initStatuses)
  const [view,            setView]            = useState('board')
  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('')
  const [typeFilter,      setTypeFilter]      = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [selectedEvent,   setSelectedEvent]   = useState(null)
  const [toast,           setToast]           = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleStatusChange(eventId, newStatus) {
    setStatuses(prev => ({ ...prev, [eventId]: newStatus }))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return EVENTS.filter(e => {
      if (statusFilter && statuses[e.id] !== statusFilter) return false
      if (typeFilter   && e.type !== typeFilter)           return false
      if (q && !e.title.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, statusFilter, typeFilter, statuses])

  const hasFilter = !!(search || statusFilter || typeFilter)

  return (
    <div className="tvw-root">

      {/* Proposal comparison banner */}
      {!bannerDismissed && (
        <div className="tvw-banner">
          <span className="tvw-banner-icon">⚡</span>
          <span className="tvw-banner-text">
            <strong>Proposal view —</strong> Industry-standard task management layout for comparison with the current Work Queue experience. Same data, different interaction model. Not part of the production spec.
          </span>
          <button className="tvw-banner-close" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="tvw-header">
        <div className="tvw-header-left">
          <h2 className="tvw-page-title">
            Task View <span className="tvw-proposal-badge">Proposal</span>
          </h2>
          <div className="tvw-filters">
            <div className="tvw-search-wrap">
              <Search size={12} className="tvw-search-icon" />
              <input
                className="tvw-search-input"
                placeholder="Search tasks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="tvw-search-clear" onClick={() => setSearch('')} aria-label="Clear">
                  <X size={11} />
                </button>
              )}
            </div>
            <select className="tvw-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{TASK_STATUS[s].label}</option>
              ))}
            </select>
            <select className="tvw-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {Object.values(EVENT_TYPES).map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="tvw-view-toggle">
          <button
            className={`tvw-view-btn${view === 'board' ? ' tvw-view-btn--active' : ''}`}
            onClick={() => setView('board')}
          >
            <LayoutGrid size={14} /> Board
          </button>
          <button
            className={`tvw-view-btn${view === 'table' ? ' tvw-view-btn--active' : ''}`}
            onClick={() => setView('table')}
          >
            <List size={14} /> Table
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilter && (
        <div className="tvw-chips">
          {search && (
            <span className="tvw-chip">
              "{search}"
              <button onClick={() => setSearch('')} aria-label="Remove"><X size={10} /></button>
            </span>
          )}
          {statusFilter && (
            <span className="tvw-chip">
              {TASK_STATUS[statusFilter].label}
              <button onClick={() => setStatusFilter('')} aria-label="Remove"><X size={10} /></button>
            </span>
          )}
          {typeFilter && (
            <span className="tvw-chip">
              {EVENT_TYPES[typeFilter]?.label}
              <button onClick={() => setTypeFilter('')} aria-label="Remove"><X size={10} /></button>
            </span>
          )}
          <button
            className="tvw-chip-clear"
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="tvw-content">
        {view === 'board'
          ? <BoardView
              events={filtered}
              statuses={statuses}
              onStatusChange={handleStatusChange}
              onOpen={setSelectedEvent}
              showToast={showToast}
            />
          : <TableView
              events={filtered}
              statuses={statuses}
              onStatusChange={handleStatusChange}
              onOpen={setSelectedEvent}
              showToast={showToast}
            />
        }
      </div>

      {/* Task detail slideout */}
      {selectedEvent && (
        <TaskDetail
          event={selectedEvent}
          status={statuses[selectedEvent.id]}
          onClose={() => setSelectedEvent(null)}
          onStatusChange={handleStatusChange}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && <div className="wq-toast">{toast}</div>}
    </div>
  )
}
