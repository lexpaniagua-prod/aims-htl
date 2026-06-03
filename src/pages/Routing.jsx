import { useState, useMemo } from 'react'
import { routingRules, packs, analytics, teamsAndQueues } from '../data/mockData.js'
import { Drawer } from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import KPICard from '../components/KPICard.jsx'
import { Select, Textarea } from '../components/FormFields.jsx'
import { GitFork, Activity, Clock, AlertTriangle, Plus, ArrowUp, ArrowDown, Check, X } from 'lucide-react'
import './Routing.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function Donut({ pct, size = 88, stroke = 9 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
    >
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--accent-teal)"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Signal → Badge variant ───────────────────────────────────────────────────
const SIGNAL_COLORS = {
  csat_low:         'coral',
  agent_escalate:   'amber',
  low_confidence:   'gray',
  safety_critical:  'coral',
  invoice_mid:      'blue',
  invoice_large:    'blue',
  invoice_critical: 'purple',
  invoice_anomaly:  'amber',
  intent_critical:  'teal',
  intent_high:      'teal',
  demo_request:     'blue',
  expansion_signal: 'purple',
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Routing() {
  const [filterPack, setFilterPack] = useState('All')
  const [filterSig,  setFilterSig]  = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [isNew,      setIsNew]      = useState(false)
  const [draftFallback, setDraftFallback] = useState([''])
  const [draftRule, setDraftRule] = useState({
    packId: '', condition: '', destination: '', signal: '', priority: 1, timeoutMinutes: 15,
  })

  // newest timestamp per ruleMatched
  const lastTriggeredMap = useMemo(() => {
    const map = {}
    analytics.routingDecisions.forEach(d => {
      if (!map[d.ruleMatched] || d.timestamp > map[d.ruleMatched]) {
        map[d.ruleMatched] = d.timestamp
      }
    })
    return map
  }, [])

  // routing health %
  const healthPct = useMemo(() => {
    const total = analytics.routingDecisions.length
    if (!total) return 100
    const ok = analytics.routingDecisions.filter(d => !d.fallbackFired).length
    return Math.round((ok / total) * 100)
  }, [])

  // pack name options for filter
  const packOptions = useMemo(() => {
    const names = new Set()
    routingRules.forEach(r => {
      const p = packs.find(p => p.id === r.packId)
      if (p) names.add(p.name)
    })
    return ['All', ...Array.from(names)]
  }, [])

  // signal options for filter
  const signalOptions = useMemo(() => {
    const sigs = new Set(routingRules.map(r => r.signal))
    return ['All', ...Array.from(sigs)]
  }, [])

  // filtered rules
  const filtered = useMemo(() => {
    return routingRules.filter(r => {
      const p = packs.find(p => p.id === r.packId)
      const packName = p ? p.name : ''
      if (filterPack !== 'All' && packName !== filterPack) return false
      if (filterSig  !== 'All' && r.signal !== filterSig)  return false
      return true
    })
  }, [filterPack, filterSig])

  const isFiltered = filterPack !== 'All' || filterSig !== 'All'

  // stats
  const totalRules   = routingRules.length
  const packsCount   = new Set(routingRules.map(r => r.packId)).size
  const avgTimeout   = Math.round(
    routingRules.reduce((s, r) => s + r.timeoutMinutes, 0) / routingRules.length
  )

  function openNewRule() {
    setIsNew(true)
    setSelected(null)
    setDraftRule({ packId: packs[0]?.id || '', condition: '', destination: '', signal: '', priority: 1, timeoutMinutes: 15 })
    setDraftFallback([''])
    setDrawerOpen(true)
  }

  function openDrawer(rule) {
    setIsNew(false)
    setSelected(rule)
    setDraftRule({ packId: rule.packId, condition: rule.condition, destination: rule.destination, signal: rule.signal, priority: rule.priority, timeoutMinutes: rule.timeoutMinutes })
    setDraftFallback([rule.destination, rule.fallback, 'On-call Manager'])
    setDrawerOpen(true)
  }

  function updateDraft(key, val) { setDraftRule(d => ({ ...d, [key]: val })) }
  function addFallback() { setDraftFallback(fb => [...fb, '']) }
  function removeFallback(i) { setDraftFallback(fb => fb.filter((_, idx) => idx !== i)) }
  function updateFallback(i, val) { setDraftFallback(fb => fb.map((f, idx) => idx === i ? val : f)) }

  function moveChain(i, dir) {
    setDraftFallback(prev => {
      const next = [...prev]
      const target = i + dir
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }

  function formatTimeout(min) {
    if (min >= 60) {
      const h = min / 60
      return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
    }
    return `${min}m`
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Routing Rules</h1>
          <p className="page-subtitle">Signal-based dispatch rules that route work to the right destination and fallback chain</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={Plus} onClick={openNewRule}>New Rule</Button>
        </div>
      </div>

      {/* ── Top row: health widget + KPIs ── */}
      <div className="routing-top-row">
        {/* Health widget */}
        <div className="routing-health-widget">
          <div className="routing-health-chart">
            <Donut pct={healthPct} />
            <span className="routing-health-pct">{healthPct}%</span>
          </div>
          <div>
            <div className="routing-health-label">Routing Health</div>
            <div className="routing-health-sub">
              {analytics.routingDecisions.filter(d => !d.fallbackFired).length} of {analytics.routingDecisions.length} decisions routed to primary destination
            </div>
            {healthPct < 95 && (
              <div className="routing-health-warn">
                <AlertTriangle size={11} />
                {analytics.routingDecisions.filter(d => d.fallbackFired).length} fallback fires detected
              </div>
            )}
          </div>
        </div>

        {/* KPI grid */}
        <div className="routing-kpis">
          <KPICard
            label="Total Rules"
            value={totalRules}
            tint="blue"
            icon={GitFork}
          />
          <KPICard
            label="Packs Covered"
            value={packsCount}
            tint="teal"
            icon={Activity}
          />
          <KPICard
            label="Avg Timeout"
            value={formatTimeout(avgTimeout)}
            tint="purple"
            icon={Clock}
          />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="pl-filter-bar">
        <Select
          className="pl-filter-select"
          value={filterPack}
          onChange={e => setFilterPack(e.target.value)}
          options={packOptions.map(n => ({ value: n, label: n }))}
        />
        <Select
          className="pl-filter-select"
          value={filterSig}
          onChange={e => setFilterSig(e.target.value)}
          options={signalOptions.map(s => ({ value: s, label: s === 'All' ? 'All Signals' : s }))}
        />
        {isFiltered && (
          <button
            className="pl-filter-clear"
            onClick={() => { setFilterPack('All'); setFilterSig('All') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Rules table ── */}
      <div className="rules-table-wrap">
        <div className="rules-table-header">
          <span>Pack</span>
          <span>Condition</span>
          <span>Signal</span>
          <span>Destination</span>
          <span>Fallback</span>
          <span>Timeout</span>
          <span>Last Triggered</span>
        </div>

        {filtered.map(rule => {
          const pack = packs.find(p => p.id === rule.packId)
          const packName = pack ? pack.name : rule.packId
          const lastTs = lastTriggeredMap[rule.id]

          return (
            <div
              key={rule.id}
              className="rule-row"
              onClick={() => openDrawer(rule)}
            >
              <span className="rule-pack">{packName}</span>
              <span className="rule-condition">{rule.condition}</span>
              <span>
                <Badge
                  label={rule.signal}
                  variant={SIGNAL_COLORS[rule.signal] || 'gray'}
                  size="sm"
                />
              </span>
              <span className="rule-dest">{rule.destination}</span>
              <span className="rule-fallback">{rule.fallback}</span>
              <span className="rule-timeout">{formatTimeout(rule.timeoutMinutes)}</span>
              <span className="rule-lasttriggered">
                {lastTs ? relativeTime(lastTs) : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Drawer: Rule Editor (New + Edit) ── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={isNew ? 'New Rule' : `Edit Rule — ${selected?.signal ?? ''}`}
        subtitle={isNew ? 'Create a new routing rule' : `Pack: ${packs.find(p => p.id === selected?.packId)?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" icon={Check}>{isNew ? 'Create Rule' : 'Save Rule'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Pack context note (new only — rules belong to packs, not assigned here) */}
          {isNew && (
            <div style={{ padding: '10px 13px', background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              💡 This rule will appear in the global routing log. To attach it directly to a Pack, open the Pack and configure routing from <strong>Builder → Routing & Response</strong>.
            </div>
          )}

          {/* Primary rule summary (edit only) */}
          {!isNew && selected && (
            <div>
              <div className="rdr-label">Primary Rule</div>
              <Textarea value={`${selected.condition} → ${selected.destination}`} onChange={() => {}} rows={3} />
            </div>
          )}

          {/* IF / THEN blocks */}
          <div>
            <div className="rdr-label">Condition / Destination</div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-blue)', marginBottom: 6 }}>IF</div>
                {isNew ? (
                  <textarea
                    placeholder="e.g. CSAT rating ≤ 2 submitted during conversation"
                    value={draftRule.condition}
                    onChange={e => updateDraft('condition', e.target.value)}
                    rows={3}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'DM Mono', fontSize: 11, outline: 'none', resize: 'none', lineHeight: 1.5 }}
                  />
                ) : (
                  <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{selected?.condition}</div>
                )}
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Mono', fontSize: 16, flexShrink: 0, alignSelf: 'center' }}>→</div>
              <div style={{ flex: 1, padding: '10px 12px', background: 'var(--accent-teal-dim)', border: '1px solid var(--accent-teal-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-teal)', marginBottom: 6 }}>THEN</div>
                {isNew ? (
                  <select
                    value={draftRule.destination}
                    onChange={e => updateDraft('destination', e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: draftRule.destination ? 'var(--text-primary)' : 'var(--accent-teal)', fontFamily: 'DM Mono', fontSize: 11, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">— Select destination —</option>
                    {teamsAndQueues.filter(t => t.status === 'active').map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{selected?.destination}</div>
                )}
              </div>
            </div>
          </div>

          {/* Fallback chain — editable + add/remove */}
          <div>
            <div className="rdr-label">Fallback Chain</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {draftFallback.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8, background: 'var(--bg-card-elevated)', border: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', minWidth: 18, flexShrink: 0 }}>{i + 1}</span>
                  <select
                    value={item}
                    onChange={e => updateFallback(i, e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: item ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '4px 0' }}
                  >
                    <option value="">— Select a team or queue —</option>
                    {teamsAndQueues.filter(t => t.status === 'active').map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => moveChain(i, -1)} disabled={i === 0}
                      style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)', padding: 3, borderRadius: 4, display: 'flex' }}>
                      <ArrowUp size={12} />
                    </button>
                    <button onClick={() => moveChain(i, 1)} disabled={i === draftFallback.length - 1}
                      style={{ background: 'none', border: 'none', cursor: i === draftFallback.length - 1 ? 'default' : 'pointer', color: i === draftFallback.length - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)', padding: 3, borderRadius: 4, display: 'flex' }}>
                      <ArrowDown size={12} />
                    </button>
                    {draftFallback.length > 1 && (
                      <button onClick={() => removeFallback(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 3, borderRadius: 4, display: 'flex', transition: 'color 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-coral)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addFallback}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent-blue)', background: 'var(--accent-blue-dim)', border: '1px dashed var(--accent-blue-border)', borderRadius: 7, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s, color 0.12s', width: '100%', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-blue)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-blue-dim)'; e.currentTarget.style.color = 'var(--accent-blue)' }}
            >
              <Plus size={12} /> Add Fallback Step
            </button>
          </div>

          {/* Timeout */}
          <div>
            <div className="rdr-label">Timeout</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                value={draftRule.timeoutMinutes}
                min={1}
                onChange={e => updateDraft('timeoutMinutes', e.target.value)}
                style={{ width: 80, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'DM Mono', fontSize: 13, outline: 'none' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>minutes</span>
            </div>
          </div>

          {/* Signal + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="rdr-label">Signal</div>
              {isNew ? (
                <input
                  placeholder="e.g. csat_low"
                  value={draftRule.signal}
                  onChange={e => updateDraft('signal', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'DM Mono', fontSize: 12, outline: 'none' }}
                />
              ) : (
                <Badge label={selected?.signal} variant={SIGNAL_COLORS[selected?.signal] || 'gray'} size="sm" />
              )}
            </div>
            <div>
              <div className="rdr-label">Priority</div>
              <select
                value={draftRule.priority}
                onChange={e => updateDraft('priority', Number(e.target.value))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'DM Mono', fontSize: 13, outline: 'none' }}
              >
                {[0, 1, 2, 3].map(p => <option key={p} value={p}>{p === 0 ? 'Critical (P0)' : `P${p}`}</option>)}
              </select>
            </div>
          </div>

        </div>
      </Drawer>
    </div>
  )
}
