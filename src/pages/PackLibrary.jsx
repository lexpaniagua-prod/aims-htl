import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, GitFork, Pencil, Archive, MoreHorizontal,
  ArrowUpDown, Copy, Trash2, Eye, Shield, Workflow,
  GitBranch, RefreshCw, Package2, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import KPICard from '../components/KPICard.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { Input } from '../components/FormFields.jsx'
import { packs } from '../data/mockData.js'
import './PackLibrary.css'

// Single-select dropdown — DS Menu/Dropdown, size S, used for filters and
// sort in place of a bare browser <select>.
function MenuSelect({ value, options, onChange, width }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const triggerRef = useRef(null)
  const wrapRef = useRef(null)

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setMenuStyle({ top: r.bottom + 4, left: r.left, minWidth: r.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find(o => o.value === value)

  return (
    <div className="pl-menu-select" ref={wrapRef} style={width ? { width } : undefined}>
      <button
        ref={triggerRef}
        className="pl-menu-select-trigger"
        onClick={() => open ? setOpen(false) : openMenu()}
      >
        <span>{current?.label ?? value}</span>
        <ChevronDown size={12} />
      </button>
      {open && createPortal(
        <div className="pl-menu-select-menu" style={menuStyle}>
          {options.map(o => (
            <button
              key={o.value}
              className={`pl-menu-select-item${o.value === value ? ' pl-menu-select-item--active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

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

// ─── Pagination — DS Pagination component ──────────────────────────────────
function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const canPrev = page > 1
  const canNext = end < total

  return (
    <div className="pl-pagination">
      <div className="pl-pagination-size">
        <span>Rows per page:</span>
        <MenuSelect
          value={String(pageSize)}
          onChange={v => onPageSizeChange(Number(v))}
          width={64}
          options={[5, 10, 20, 50].map(n => ({ value: String(n), label: String(n) }))}
        />
      </div>
      <div className="pl-pagination-nav">
        <span>{start}–{end} of {total} items</span>
        <button className="pl-pagination-arrow" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        <button className="pl-pagination-arrow" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Config maps ─────────────────────────────────────────────────────────────
// Status is the one piece of metadata that stays color-coded (top-right
// corner badge) — everything else in the row is plain/neutral context.
const STATUS_CONFIG = {
  Active:     { variant: 'teal'  },
  Draft:      { variant: 'amber' },
  Deprecated: { variant: 'gray'  },
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
  const PatIcon = pack.pattern === 'Handoff' ? GitBranch : RefreshCw
  const rowClass = [
    'pack-row',
    pack.status === 'Draft'      ? 'pack-row--draft'      : '',
    pack.status === 'Deprecated' ? 'pack-row--deprecated' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={rowClass}
      style={{ '--row-delay': `${index * 40}ms` }}
      onClick={() => onNavigate(pack.id)}
    >
      {/* Pattern icon — its color is the primary "what kind" signal, so the
          tag below doesn't need to repeat it in color; meaning is one hover
          away instead of a permanent legend line. */}
      <div
        className={`pack-icon pack-icon--${pack.pattern.toLowerCase()}`}
        title={pack.pattern === 'Handoff' ? 'Handoff — AI hands off to a human immediately' : 'Continuation — AI stays in the loop, human reviews each step'}
      >
        <PatIcon size={15} />
      </div>

      {/* Body */}
      <div className="pack-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span className="pack-row-name">{pack.name}</span>
          <span className="pack-version">{pack.version}</span>
          {pack.sensitiveSignalEnabled && (
            <span title="Sensitive signal protection active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Mono', fontSize: 10, color: 'var(--accent-coral)', background: 'var(--accent-coral-dim)', border: '1px solid var(--accent-coral-border)', borderRadius: 4, padding: '1px 6px' }}>
              <Shield size={9} /> sensitive
            </span>
          )}
        </div>

        <div className="pack-row-desc">{pack.description}</div>

        {/* Context only — plain/neutral, not color-coded (color is reserved
            for states that need the user's attention, e.g. the sensitive
            indicator above). Status carries the one semantic color that
            matters here, and lives in its own corner instead. */}
        <div className="pack-row-meta">
          <span className="pack-tag-neutral">{pack.pattern}</span>
          <span className="pack-tag-neutral">{pack.destination}</span>
          {pack.studio && <span className="pack-tag-neutral">{pack.studio}</span>}
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

      {/* Right — status (the one thing worth a color, top corner) + last
          modified + overflow menu. Edit/Duplicate/Archive live in the menu
          only now, not as separate hover icons. */}
      <div className="pack-row-right">
        <Badge
          label={pack.status}
          variant={STATUS_CONFIG[pack.status]?.variant || 'gray'}
          size="sm"
        />
        <span className="pack-modified">{relativeTime(pack.lastModified)}</span>

        <div className="pack-menu-wrap" ref={moreRef} onClick={e => e.stopPropagation()}>
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
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(5)

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

  // Reset to page 1 whenever the filtered set changes size — otherwise a
  // narrower filter can leave the view stranded on a now-empty page.
  useEffect(() => { setPage(1) }, [search, filterPat, filterStatus, filterDest, filterStudio])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

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
            variant="main"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/configure/packs/new')}
          >
            New Pack
          </Button>
        </div>
      </div>

      {/* ── Stat strip — DS Highlight Card, one per KPI ─────────────────────── */}
      <div className="pl-kpi-grid">
        <KPICard label="Total Packs" value={totalPacks} icon={Package2} tint="blue" />
        <KPICard label="Active Packs" value={activePacks} icon={GitBranch} tint="green" delta={`${activePacks} of ${totalPacks}`} />
        <KPICard label="Sensitive Signal" value={sensitivePacks} icon={Shield} tint="coral" />
        <KPICard label="Attached Workflows" value={totalWorkflows} icon={Workflow} tint="purple" />
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
          <MenuSelect
            value={filterPat}
            onChange={setFilterPat}
            width={148}
            options={[
              { value: 'All',          label: 'All Patterns' },
              { value: 'Handoff',      label: 'Handoff' },
              { value: 'Continuation', label: 'Continuation' },
            ]}
          />

          <MenuSelect
            value={filterStatus}
            onChange={setFilterStatus}
            width={148}
            options={[
              { value: 'All',        label: 'All Statuses' },
              { value: 'Active',     label: 'Active' },
              { value: 'Draft',      label: 'Draft' },
              { value: 'Deprecated', label: 'Deprecated' },
            ]}
          />

          <MenuSelect
            value={filterDest}
            onChange={setFilterDest}
            width={148}
            options={destinations.map(d => ({ value: d, label: d === 'All' ? 'All Destinations' : d }))}
          />

          <MenuSelect
            value={filterStudio}
            onChange={setFilterStudio}
            width={148}
            options={[
              { value: 'All',                      label: 'All Studios'              },
              { value: 'Agentic Studio',           label: 'Agentic Studio'           },
              { value: 'Helix Governance Studio',  label: 'Helix Governance Studio'  },
              { value: 'Helix Data Studio',        label: 'Helix Data Studio'        },
            ]}
          />

          <div className="pl-filter-sep" />

          <MenuSelect
            value={sortBy}
            onChange={setSortBy}
            width={148}
            options={[
              { value: 'modified',  label: 'Last Modified' },
              { value: 'name',      label: 'Name A–Z' },
              { value: 'workflows', label: 'Most Workflows' },
              { value: 'sla',       label: 'SLA (shortest)' },
            ]}
          />

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

      {/* ── Pack list — DS Entity List: each row is its own Card Container
          (size sm), not one continuously-bordered/divided list. ─────────── */}
      <div className="pack-list">

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
          paginated.map((pack, i) => (
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

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <Pagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={n => { setPageSize(n); setPage(1) }}
        />
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
