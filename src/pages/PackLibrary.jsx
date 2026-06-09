import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, GitFork, Pencil, Archive, MoreHorizontal,
  ArrowUpDown, Copy, Trash2, Eye, Shield, Workflow,
  GitBranch, RefreshCw, Package2
} from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { Input, Select } from '../components/FormFields.jsx'
import { packs } from '../data/mockData.js'
import './PackLibrary.css'

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 14) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

// ─── Config maps ─────────────────────────────────────────────────────────────
const PATTERN_CONFIG = {
  Handoff:      { color: 'purple', variant: 'purple' },
  Continuation: { color: 'teal',   variant: 'teal'   },
}

const STATUS_CONFIG = {
  Active:     { variant: 'teal'  },
  Draft:      { variant: 'amber' },
  Deprecated: { variant: 'gray'  },
}

const DEST_CONFIG = {
  Inbox:      { variant: 'blue'   },
  Mixed:      { variant: 'purple' },
  Lightweight:{ variant: 'green'  },
  External:   { variant: 'amber'  },
}

const STUDIO_CONFIG = {
  'Agentic Studio':           { bg: 'var(--accent-purple-dim)', border: 'var(--accent-purple-border)', color: 'var(--accent-purple)' },
  'Helix Governance Studio':  { bg: 'var(--accent-teal-dim)',   border: 'var(--accent-teal-border)',   color: 'var(--accent-teal)'   },
  'Helix Data Studio':        { bg: 'var(--accent-blue-dim)',   border: 'var(--accent-blue-border)',   color: 'var(--accent-blue)'   },
  'All Studios':              { bg: 'var(--bg-card-elevated)',  border: 'var(--border)',               color: 'var(--text-tertiary)' },
}

// ─── Three-dot context menu — rendered at fixed position to escape stacking contexts ──
function PackMenu({ pack, pos, onClose, onEdit, onClone, onArchive }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') { onClose(); return }
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    // Slight delay so the opening click doesn't immediately re-close
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('keydown', handler)
    }, 80)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  const items = [
    { icon: Eye,      label: 'View details',   action: onEdit },
    { icon: Pencil,   label: 'Edit pack',       action: onEdit },
    { icon: Copy,     label: 'Duplicate',       action: onClone },
    null,
    { icon: Archive,  label: 'Archive pack',    action: onArchive },
    { icon: Trash2,   label: 'Delete pack',     action: onArchive, danger: true },
  ]

  return (
    <div
      ref={ref}
      className="pack-menu"
      style={{ position: 'fixed', top: pos.top, right: pos.right }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item === null
          ? <div key={i} className="pack-menu-sep" />
          : (
            <button
              key={item.label}
              className={`pack-menu-item${item.danger ? ' pack-menu-item--danger' : ''}`}
              onClick={e => { e.stopPropagation(); item.action?.(); onClose() }}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          )
      )}
    </div>
  )
}

// ─── Individual pack row ──────────────────────────────────────────────────────
function PackRow({ pack, index, onNavigate, onEdit, onOpenMenu, menuOpenId }) {
  const moreRef = useRef(null)
  const patCfg  = PATTERN_CONFIG[pack.pattern]
  const PatIcon = pack.pattern === 'Handoff' ? GitBranch : RefreshCw
  const rowClass = [
    'pack-row',
    pack.status === 'Draft'      ? 'pack-row--draft'      : '',
    pack.status === 'Deprecated' ? 'pack-row--deprecated' : '',
  ].filter(Boolean).join(' ')

  const handleAction = e => { e.stopPropagation() }

  return (
    <div
      className={rowClass}
      style={{ '--row-delay': `${index * 40}ms` }}
      onClick={() => onNavigate(pack.id)}
    >
      {/* Pattern icon */}
      <div className={`pack-icon pack-icon--${pack.pattern.toLowerCase()}`}>
        <PatIcon size={15} />
      </div>

      {/* Body */}
      <div className="pack-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span className="pack-row-name">{pack.name}</span>
          <span className="pack-version">{pack.version}</span>
          {pack.sensitiveSignalEnabled && (
            <span title="Sensitive signals enabled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Mono', fontSize: 10, color: 'var(--accent-coral)', background: 'var(--accent-coral-dim)', border: '1px solid var(--accent-coral-border)', borderRadius: 4, padding: '1px 6px' }}>
              <Shield size={9} /> sensitive
            </span>
          )}
        </div>

        <div className="pack-row-desc">{pack.description}</div>

        <div className="pack-row-meta">
          <Badge
            label={pack.pattern}
            variant={patCfg.variant}
            size="sm"
          />
          <Badge
            label={pack.status}
            variant={STATUS_CONFIG[pack.status]?.variant || 'gray'}
            size="sm"
          />
          <Badge
            label={pack.destination}
            variant={DEST_CONFIG[pack.destination]?.variant || 'gray'}
            size="sm"
          />
          {pack.studio && (() => {
            const sc = STUDIO_CONFIG[pack.studio] || STUDIO_CONFIG['All Studios']
            return (
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 4,
                background: sc.bg,
                border: `1px solid ${sc.border}`,
                color: sc.color,
                whiteSpace: 'nowrap',
              }}>
                {pack.studio}
              </span>
            )
          })()}
          <span className="pack-meta-sep">·</span>
          <span className="pack-meta-chip">
            <Workflow size={10} />
            {pack.attachedWorkflows} workflow{pack.attachedWorkflows !== 1 ? 's' : ''}
          </span>
          <span className="pack-meta-chip">
            <ArrowUpDown size={10} />
            SLA {pack.slaMinutes >= 1440
              ? `${pack.slaMinutes / 1440}d`
              : pack.slaMinutes >= 60
                ? `${pack.slaMinutes / 60}h`
                : `${pack.slaMinutes}m`}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="pack-row-right" onClick={handleAction}>
        <span className="pack-modified">{relativeTime(pack.lastModified)}</span>

        <div className="pack-row-actions">
          <button
            className="pack-action-btn"
            title="Edit"
            onClick={e => { e.stopPropagation(); onEdit(pack.id) }}
          >
            <Pencil size={13} />
          </button>
          <button
            className="pack-action-btn"
            title="Clone"
            onClick={e => e.stopPropagation()}
          >
            <Copy size={13} />
          </button>
          <button
            className="pack-action-btn pack-action-btn--danger"
            title="Archive"
            onClick={e => e.stopPropagation()}
          >
            <Archive size={13} />
          </button>

          <div className="pack-menu-wrap" ref={moreRef}>
            <button
              className="pack-action-btn"
              title="More"
              onClick={e => {
                e.stopPropagation()
                if (menuOpenId === pack.id) { onOpenMenu(null, null); return }
                const rect = moreRef.current.getBoundingClientRect()
                onOpenMenu(pack.id, {
                  top:   rect.bottom + 4,
                  right: window.innerWidth - rect.right,
                })
              }}
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PackLibrary() {
  const navigate = useNavigate()

  const [menuOpenId,    setMenuOpenId]    = useState(null)
  const [menuPos,       setMenuPos]       = useState(null)
  const [search,        setSearch]        = useState('')
  const [filterPat,     setFilterPat]     = useState('All')
  const [filterStatus,  setFilterStatus]  = useState('All')
  const [filterDest,    setFilterDest]    = useState('All')
  const [filterStudio,  setFilterStudio]  = useState('All')
  const [sortBy,        setSortBy]        = useState('modified')

  // Derived filter options from actual data
  const destinations = useMemo(
    () => ['All', ...Array.from(new Set(packs.map(p => p.destination))).sort()],
    []
  )

  const isFiltered = search || filterPat !== 'All' || filterStatus !== 'All' || filterDest !== 'All' || filterStudio !== 'All'

  const clearFilters = () => {
    setSearch(''); setFilterPat('All'); setFilterStatus('All'); setFilterDest('All'); setFilterStudio('All')
  }

  const filtered = useMemo(() => {
    let list = [...packs]

    if (search)
      list = list.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.triggers.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )

    if (filterPat    !== 'All') list = list.filter(p => p.pattern     === filterPat)
    if (filterStatus !== 'All') list = list.filter(p => p.status      === filterStatus)
    if (filterDest   !== 'All') list = list.filter(p => p.destination === filterDest)
    if (filterStudio !== 'All') list = list.filter(p => (p.studio || 'All Studios') === filterStudio)

    list.sort((a, b) => {
      if (sortBy === 'name')      return a.name.localeCompare(b.name)
      if (sortBy === 'modified')  return new Date(b.lastModified) - new Date(a.lastModified)
      if (sortBy === 'workflows') return b.attachedWorkflows - a.attachedWorkflows
      if (sortBy === 'sla')       return a.slaMinutes - b.slaMinutes
      return 0
    })

    return list
  }, [search, filterPat, filterStatus, filterDest, filterStudio, sortBy])

  // KPI stats
  const totalPacks      = packs.length
  const activePacks     = packs.filter(p => p.status === 'Active').length
  const sensitivePacks  = packs.filter(p => p.sensitiveSignalEnabled).length
  const totalWorkflows  = packs.reduce((s, p) => s + p.attachedWorkflows, 0)

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Pack Library</h1>
          <p className="page-subtitle">
            Versioned HTL behavior definitions — attach to any workflow or agent
          </p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm" icon={GitFork}>Import</Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/configure/packs/new')}
          >
            New Pack
          </Button>
        </div>
      </div>

      {/* ── Stat strip ────────────────────────────────────────────────────── */}
      <div className="pl-stat-bar">
        <div className="pl-stat-cell">
          <span className="pl-stat-icon pl-stat-icon--blue"><Package2 size={12}/></span>
          <span className="pl-stat-label">Total Packs</span>
          <span className="pl-stat-value">{totalPacks}</span>
        </div>
        <div className="pl-stat-cell">
          <span className="pl-stat-icon pl-stat-icon--green"><GitBranch size={12}/></span>
          <span className="pl-stat-label">Active Packs</span>
          <span className="pl-stat-value">{activePacks}</span>
          <span className="pl-stat-delta">↑ {activePacks} of {totalPacks} vs last 7d</span>
        </div>
        <div className="pl-stat-cell">
          <span className="pl-stat-icon pl-stat-icon--coral"><Shield size={12}/></span>
          <span className="pl-stat-label">Sensitive Signal</span>
          <span className="pl-stat-value">{sensitivePacks}</span>
        </div>
        <div className="pl-stat-cell">
          <span className="pl-stat-icon pl-stat-icon--purple"><Workflow size={12}/></span>
          <span className="pl-stat-label">Attached Workflows</span>
          <span className="pl-stat-value">{totalWorkflows}</span>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="pl-filter-bar">
        <div className="pl-filter-search">
          <Input
            placeholder="Search packs, triggers, descriptions…"
            icon={Search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="pl-filter-selects">
          <div className="pl-filter-select">
            <Select
              value={filterPat}
              onChange={e => setFilterPat(e.target.value)}
              options={[
                { value: 'All',          label: 'All Patterns' },
                { value: 'Handoff',      label: 'Handoff' },
                { value: 'Continuation', label: 'Continuation' },
              ]}
            />
          </div>

          <div className="pl-filter-select">
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              options={[
                { value: 'All',        label: 'All Statuses' },
                { value: 'Active',     label: 'Active' },
                { value: 'Draft',      label: 'Draft' },
                { value: 'Deprecated', label: 'Deprecated' },
              ]}
            />
          </div>

          <div className="pl-filter-select">
            <Select
              value={filterDest}
              onChange={e => setFilterDest(e.target.value)}
              options={destinations.map(d => ({ value: d, label: d === 'All' ? 'All Destinations' : d }))}
            />
          </div>

          <div className="pl-filter-select">
            <Select
              value={filterStudio}
              onChange={e => setFilterStudio(e.target.value)}
              options={[
                { value: 'All',                      label: 'All Studios'              },
                { value: 'Agentic Studio',           label: 'Agentic Studio'           },
                { value: 'Helix Governance Studio',  label: 'Helix Governance Studio'  },
                { value: 'Helix Data Studio',        label: 'Helix Data Studio'        },
              ]}
            />
          </div>

          <div className="pl-filter-sep" />

          <span className="pl-sort-label">Sort:</span>
          <div style={{ width: 148 }}>
            <Select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              options={[
                { value: 'modified',  label: 'Last Modified' },
                { value: 'name',      label: 'Name A–Z' },
                { value: 'workflows', label: 'Most Workflows' },
                { value: 'sla',       label: 'SLA (shortest)' },
              ]}
            />
          </div>

          {isFiltered && (
            <button className="pl-filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────────────────────── */}
      {isFiltered && (
        <div className="pl-results-count">
          {filtered.length === 0
            ? 'No packs match your filters'
            : `${filtered.length} of ${totalPacks} pack${filtered.length !== 1 ? 's' : ''}`}
        </div>
      )}

      {/* ── Pack list ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div className="pl-empty">
            <div className="pl-empty-icon">
              <Package2 size={22} />
            </div>
            <div className="pl-empty-title">No packs match your filters</div>
            <div className="pl-empty-sub">
              Try adjusting the pattern, status, or destination filters.
            </div>
            <button className="pl-empty-link" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((pack, i) => (
            <PackRow
              key={pack.id}
              pack={pack}
              index={i}
              onNavigate={id => navigate(`/configure/packs/${id}`)}
              onEdit={id => navigate(`/configure/packs/${id}/edit`)}
              menuOpenId={menuOpenId}
              onOpenMenu={(id, pos) => { setMenuOpenId(id); setMenuPos(pos) }}
            />
          ))
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div style={{ padding: '10px 4px 0', fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 16 }}>
          <span>
            <span style={{ color: 'var(--accent-purple)', marginRight: 4 }}>■</span>Handoff — AI hands off to a human immediately
          </span>
          <span>
            <span style={{ color: 'var(--accent-teal)', marginRight: 4 }}>■</span>Continuation — AI stays in loop, human reviews steps
          </span>
          <span style={{ color: 'var(--accent-coral)', marginRight: 4 }}>■</span>Sensitive signal protection active
        </div>
      )}

      {/* ── Menu rendered at position:fixed — above all stacking contexts ── */}
      {menuOpenId && menuPos && (
        <PackMenu
          pack={packs.find(p => p.id === menuOpenId)}
          pos={menuPos}
          onClose={() => { setMenuOpenId(null); setMenuPos(null) }}
          onEdit={() => { navigate(`/configure/packs/${menuOpenId}`); setMenuOpenId(null) }}
          onClone={() => setMenuOpenId(null)}
          onArchive={() => setMenuOpenId(null)}
        />
      )}
    </div>
  )
}
