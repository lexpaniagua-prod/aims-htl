import { useState } from 'react'
import { Plus, Pencil, X, MoreHorizontal } from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { triggerLibrary } from '../data/mockData.js'
import './Triggers.css'

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  'Customer behavior': { variant: 'blue',   icon: '💬' },
  'AI confidence':     { variant: 'purple', icon: '🤖' },
  'Score threshold':   { variant: 'amber',  icon: '📊' },
  'Specific event':    { variant: 'teal',   icon: '⚡' },
}
const TYPE_TABS = ['Customer behavior', 'AI confidence', 'Score threshold', 'Specific event']

// ─── Drawer ───────────────────────────────────────────────────────────────────
function TriggerDrawer({ trigger, onSave, onClose }) {
  const [name,        setName]        = useState(trigger?.name        || '')
  const [type,        setType]        = useState(trigger?.type        || 'Customer behavior')
  const [status,      setStatus]      = useState(trigger?.status      || 'active')
  const [description, setDescription] = useState(trigger?.description || '')
  const [keywords,    setKeywords]    = useState(trigger?.keywords    || [])
  const [kwInput,     setKwInput]     = useState('')
  const [threshold,   setThreshold]   = useState(trigger?.threshold   || 60)
  const [scoreType,   setScoreType]   = useState(trigger?.scoreType   || 'CSAT')
  const [operator,    setOperator]    = useState(trigger?.operator    || 'below')
  const [scoreValue,  setScoreValue]  = useState(trigger?.value       !== undefined ? String(trigger.value) : '3')
  const [eventType,   setEventType]   = useState(trigger?.event       || 'form_submit')
  const [eventDetail, setEventDetail] = useState(trigger?.formId      || '')

  const addKeyword = () => {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw)) { setKeywords(ks => [...ks, kw]); setKwInput('') }
  }

  const echo = () => {
    if (type === 'AI confidence')   return `Fires when AI confidence drops below ${threshold}%`
    if (type === 'Score threshold') return `Fires when ${scoreType} goes ${operator} ${scoreValue}`
    if (type === 'Specific event') {
      const labels = { form_submit: 'a form is submitted', status_change: 'status changes', tag_applied: 'a tag is applied', custom: 'a custom event occurs' }
      return `Fires when ${labels[eventType] || 'event occurs'}` + (eventDetail ? ` (${eventDetail})` : '')
    }
    return ''
  }

  const handleSave = () => {
    if (!name.trim()) return
    const base = { name, type, status }
    let extra = {}
    if (type === 'Customer behavior') extra = { description, keywords }
    if (type === 'AI confidence')     extra = { threshold }
    if (type === 'Score threshold')   extra = { scoreType, operator, value: parseFloat(scoreValue) || 0 }
    if (type === 'Specific event')    extra = { event: eventType, formId: eventDetail }
    onSave({ ...base, ...extra })
  }

  return (
    <>
      <div className="tl-overlay" onClick={onClose} />
      <div className="tl-drawer">
        {/* Header */}
        <div className="tl-drawer-hdr">
          <span className="tl-drawer-title">{trigger ? 'Edit Trigger' : 'New Trigger'}</span>
          <button className="tl-drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="tl-drawer-body">

          {/* Name */}
          <div className="tl-field">
            <label className="tl-label">Name <span className="tl-req">*</span></label>
            <input
              className="tl-input"
              placeholder="e.g. Customer asks to cancel"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="tl-field">
            <label className="tl-label">Type <span className="tl-req">*</span></label>
            <div className="tl-type-grid">
              {TYPE_TABS.map(t => {
                const sel = type === t
                const cfg = TYPE_CFG[t]
                return (
                  <button
                    key={t}
                    className={`tl-type-btn${sel ? ' tl-type-btn--sel' : ''}`}
                    onClick={() => setType(t)}
                  >
                    <span>{cfg.icon}</span>
                    <span>{t}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type-specific config */}
          {type === 'Customer behavior' && (
            <>
              <div className="tl-field">
                <label className="tl-label">Description</label>
                <textarea
                  className="tl-textarea"
                  placeholder="What customer action or intent should this detect?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="tl-field">
                <label className="tl-label">Keywords</label>
                {keywords.length > 0 && (
                  <div className="tl-kw-pills">
                    {keywords.map(kw => (
                      <span key={kw} className="tl-kw-pill">
                        {kw}
                        <button onClick={() => setKeywords(ks => ks.filter(k => k !== kw))}><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="tl-kw-row">
                  <input
                    className="tl-input"
                    placeholder="Add keyword and press Enter…"
                    value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  />
                  <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
                </div>
                <div className="tl-hint">The AI uses these as signals — exact match not required.</div>
              </div>
            </>
          )}

          {type === 'AI confidence' && (
            <div className="tl-field">
              <label className="tl-label">Confidence threshold</label>
              <div className="tl-slider-row">
                <span className="tl-slider-edge">30%</span>
                <input
                  type="range" min={30} max={90} step={5}
                  value={threshold}
                  className="tl-slider"
                  onChange={e => setThreshold(Number(e.target.value))}
                />
                <span className="tl-slider-edge">90%</span>
                <span className="tl-slider-val">{threshold}%</span>
              </div>
              <div className="tl-echo">Fires when AI confidence drops below <strong>{threshold}%</strong></div>
            </div>
          )}

          {type === 'Score threshold' && (
            <div className="tl-field">
              <label className="tl-label">Condition</label>
              <div className="tl-score-row">
                <select className="tl-sel" value={scoreType} onChange={e => setScoreType(e.target.value)}>
                  <option>CSAT</option>
                  <option>Deal value</option>
                  <option>Risk score</option>
                  <option>Invoice amount</option>
                  <option>Custom</option>
                </select>
                <select className="tl-sel" value={operator} onChange={e => setOperator(e.target.value)}>
                  <option value="below">below</option>
                  <option value="above">above</option>
                </select>
                <input
                  type="text"
                  className="tl-input-sm"
                  value={scoreValue}
                  onChange={e => setScoreValue(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="tl-echo">Fires when <strong>{scoreType}</strong> goes <strong>{operator}</strong> <strong>{scoreValue}</strong></div>
            </div>
          )}

          {type === 'Specific event' && (
            <div className="tl-field">
              <label className="tl-label">Event type</label>
              <select className="tl-sel-full" value={eventType} onChange={e => setEventType(e.target.value)}>
                <option value="form_submit">Form submitted</option>
                <option value="status_change">Status changes</option>
                <option value="tag_applied">Tag applied</option>
                <option value="custom">Custom event</option>
              </select>
              <input
                className="tl-input"
                style={{ marginTop: 8 }}
                placeholder={
                  eventType === 'form_submit'    ? 'Form ID or name…'
                  : eventType === 'tag_applied'  ? 'Tag name…'
                  : eventType === 'status_change'? 'New status value…'
                  : 'Event identifier…'
                }
                value={eventDetail}
                onChange={e => setEventDetail(e.target.value)}
              />
              {echo() && <div className="tl-echo">{echo()}</div>}
            </div>
          )}

          {/* Status */}
          <div className="tl-field">
            <label className="tl-label">Status</label>
            <div className="tl-status-row">
              {[
                { id: 'active', label: 'Active' },
                { id: 'draft',  label: 'Draft'  },
              ].map(s => (
                <button
                  key={s.id}
                  className={`tl-status-btn${status === s.id ? ' tl-status-btn--sel' : ''}`}
                  onClick={() => setStatus(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="tl-drawer-foot">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save Trigger
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Triggers() {
  const [triggers,     setTriggers]     = useState(triggerLibrary)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [hoveredPacks, setHoveredPacks] = useState(null)

  const filtered = triggers.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter   !== 'All' && t.type   !== typeFilter)   return false
    if (statusFilter !== 'All' && t.status !== statusFilter) return false
    return true
  })

  const openNew  = () => { setEditId(null); setDrawerOpen(true) }
  const openEdit = id => { setEditId(id);   setDrawerOpen(true) }
  const close    = () => { setDrawerOpen(false); setEditId(null) }

  const save = (data) => {
    if (editId) {
      setTriggers(ts => ts.map(t => t.id === editId ? { ...t, ...data, lastModified: 'just now' } : t))
    } else {
      const newId = 'trg-' + String(triggers.length + 1).padStart(3, '0')
      setTriggers(ts => [...ts, { id: newId, usedInPacks: 0, usedInPackNames: [], createdBy: 'Alexa M.', lastModified: 'just now', ...data }])
    }
    close()
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Triggers</h1>
          <p className="page-subtitle">
            Define reusable trigger conditions. Once created, they're available to select
            in any Pack's Triggers step — no need to rebuild the same logic each time.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={openNew}>
            New Trigger
          </Button>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="tl-filter-bar">
        <div className="tl-search-wrap">
          <input
            className="tl-search-input"
            placeholder="Search triggers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="tl-sel" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {TYPE_TABS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="tl-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <span className="tl-count">
          {filtered.length} trigger{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Trigger list ──────────────────────────────────────────────────── */}
      <div className="tl-list">
        {filtered.length === 0 && (
          <div className="tl-empty">No triggers match the current filters.</div>
        )}
        {filtered.map(t => {
          const cfg = TYPE_CFG[t.type] || TYPE_CFG['Customer behavior']
          return (
            <div key={t.id} className="tl-row">
              {/* Type icon */}
              <div className="tl-row-icon">{cfg.icon}</div>

              {/* Body */}
              <div className="tl-row-body">
                <div className="tl-row-name">{t.name}</div>
                {t.description && (
                  <div className="tl-row-desc">{t.description}</div>
                )}
                <div className="tl-row-meta">
                  <Badge label={t.type} variant={cfg.variant} size="sm" />
                  <div
                    className="tl-packs-chip"
                    onMouseEnter={() => setHoveredPacks(t.id)}
                    onMouseLeave={() => setHoveredPacks(null)}
                  >
                    Used in {t.usedInPacks} pack{t.usedInPacks !== 1 ? 's' : ''}
                    {hoveredPacks === t.id && t.usedInPackNames?.length > 0 && (
                      <div className="tl-packs-pop">
                        {t.usedInPackNames.map(p => (
                          <div key={p} className="tl-packs-pop-item">{p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="tl-meta-sep">·</span>
                  <span className="tl-meta-by">{t.createdBy}</span>
                  <span className="tl-meta-sep">·</span>
                  <span className="tl-meta-time">{t.lastModified}</span>
                </div>
              </div>

              {/* Right */}
              <div className="tl-row-right">
                <Badge
                  label={t.status === 'active' ? 'Active' : 'Draft'}
                  variant={t.status === 'active' ? 'teal' : 'amber'}
                  size="sm"
                />
                <button className="tl-edit-btn" onClick={() => openEdit(t.id)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="tl-icon-btn" title="More">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Drawer ────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <TriggerDrawer
          trigger={editId ? triggers.find(t => t.id === editId) : null}
          onSave={save}
          onClose={close}
        />
      )}
    </div>
  )
}
