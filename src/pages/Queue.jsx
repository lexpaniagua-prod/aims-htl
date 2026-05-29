import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, ThumbsUp, FileText, GitFork,
  AlertTriangle, Clock, User, GraduationCap
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { inboxItems } from '../data/mockData.js'
import './Queue.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTab(item) {
  if (item.shape === 'TrainMe') return 'Train Me'
  if (item.sensitiveSignal) return 'Sensitive'
  if (item.status === 'Escalated') return 'Escalated'
  if (item.shape === 'Approval' || item.shape === 'Coordination' || item.shape === 'Artifact') return 'Governance'
  if (item.pattern === 'Continuation') return 'HTL Continuation'
  return 'HTL Handoffs'
}

function slaStatus(remaining, total) {
  if (remaining <= 0) return 'breached'
  const pct = remaining / total
  if (pct > 0.5) return 'ok'
  if (pct > 0.25) return 'warning'
  return 'danger'
}

function fmtSla(mins) {
  if (mins <= 0) return 'Breached'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const SHAPE_ICONS = {
  Conversation: MessageSquare,
  Approval:     ThumbsUp,
  Artifact:     FileText,
  Coordination: GitFork,
  TrainMe:      GraduationCap,
}

const TABS = ['All', 'HTL Handoffs', 'HTL Continuation', 'Governance', 'Escalated', 'Sensitive', 'Train Me']

// ─── Component ───────────────────────────────────────────────────────────────

export default function Queue() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]     = useState('All')
  const [priorityFilter, setPriority] = useState('All')
  const [shapeFilter, setShape]       = useState('All')
  const [sortBy, setSort]             = useState('sla')

  // Exclude resolved items from the queue
  const items = inboxItems.filter(i => i.status !== 'Resolved')

  // Tab counts
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'All'
      ? items.length
      : items.filter(i => getTab(i) === tab).length
    return acc
  }, {})

  // Filter by tab
  let filtered = activeTab === 'All'
    ? items
    : items.filter(i => getTab(i) === activeTab)

  // Secondary filters
  if (priorityFilter !== 'All') filtered = filtered.filter(i => i.priority === priorityFilter)
  if (shapeFilter    !== 'All') filtered = filtered.filter(i => i.shape    === shapeFilter)

  // Sort
  const PRIO = { High: 0, Medium: 1, Low: 2 }
  if (sortBy === 'sla') {
    filtered = [...filtered].sort((a, b) => a.slaRemainingMinutes - b.slaRemainingMinutes)
  } else if (sortBy === 'newest') {
    filtered = [...filtered].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
  } else if (sortBy === 'priority') {
    filtered = [...filtered].sort((a, b) => (PRIO[a.priority] ?? 3) - (PRIO[b.priority] ?? 3))
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Inbox Queue</h1>
          <p className="page-subtitle">{filtered.length} items waiting for human action</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm">Assign Batch</Button>
        </div>
      </div>

      {/* ── Source tabs ─────────────────────────────────────────────────── */}
      <div className="iq-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`iq-tab${activeTab === tab ? ' iq-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tabCounts[tab] > 0 && (
              <span className={`iq-tab-badge${tab === 'Sensitive' ? ' iq-tab-badge--red' : ''}`}>
                {tabCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filters + sort bar ──────────────────────────────────────────── */}
      <div className="iq-filters">
        <div className="iq-filter-group">
          <label>Priority</label>
          <select value={priorityFilter} onChange={e => setPriority(e.target.value)}>
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div className="iq-filter-group">
          <label>Shape</label>
          <select value={shapeFilter} onChange={e => setShape(e.target.value)}>
            <option>All</option>
            <option>Conversation</option>
            <option>Approval</option>
            <option>Artifact</option>
            <option>Coordination</option>
            <option value="TrainMe">Train Me</option>
          </select>
        </div>
        <div className="iq-filter-spacer" />
        <div className="iq-filter-group">
          <label>Sort</label>
          <select value={sortBy} onChange={e => setSort(e.target.value)}>
            <option value="sla">SLA Urgency</option>
            <option value="newest">Newest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        <span className="iq-count">{filtered.length} items</span>
      </div>

      {/* ── Item list ───────────────────────────────────────────────────── */}
      <div className="iq-list">
        {filtered.length === 0 && (
          <div className="iq-empty">No items match the current filters</div>
        )}
        {filtered.map(item => {
          const ShapeIcon = SHAPE_ICONS[item.shape] || MessageSquare
          const sla       = slaStatus(item.slaRemainingMinutes, item.slaMinutes)
          const shapeKey  = item.shape.toLowerCase()

          return (
            <div
              key={item.id}
              className={`iq-row${item.sensitiveSignal ? ' iq-row--sensitive' : ''}`}
              onClick={() => navigate(`/inbox/items/${item.id}`)}
            >
              {/* Shape icon */}
              <div className={`iq-shape-icon iq-shape-icon--${shapeKey}`}>
                <ShapeIcon size={15} />
              </div>

              {/* Main content */}
              <div className="iq-row-body">
                <div className="iq-row-top">
                  <span className="iq-row-subject">{item.subject}</span>
                  {item.sensitiveSignal && (
                    <span className="iq-sensitive-flag" title={`Sensitive: ${item.sensitiveSignal}`}>
                      <AlertTriangle size={12} />
                    </span>
                  )}
                </div>
                <div className="iq-row-meta">
                  <span className="iq-pack-chip">{item.packName}</span>
                  <span className="iq-meta-sep">·</span>
                  <span className={`iq-pattern-badge iq-pattern-badge--${item.pattern === 'Handoff' ? 'handoff' : 'cont'}`}>
                    {item.pattern}
                  </span>
                  {(item.customerName || item.requester) && (
                    <>
                      <span className="iq-meta-sep">·</span>
                      <span className="iq-customer-name">
                        {item.customerName || item.requester}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="iq-row-right">
                {item.assignee ? (
                  <div className="iq-avatar" title={item.assignee.name}>
                    {item.assignee.avatar}
                  </div>
                ) : (
                  <div className="iq-avatar iq-avatar--unassigned" title="Unassigned">
                    <User size={11} />
                  </div>
                )}

                <div className={`iq-sla-badge iq-sla-badge--${sla}`}>
                  <Clock size={10} />
                  {fmtSla(item.slaRemainingMinutes)}
                </div>

                <Badge
                  label={item.priority}
                  variant={
                    item.priority === 'High'   ? 'coral'  :
                    item.priority === 'Medium' ? 'amber'  : 'gray'
                  }
                  size="sm"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
