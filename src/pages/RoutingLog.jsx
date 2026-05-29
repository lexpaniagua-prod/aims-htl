import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts'
import { Search } from 'lucide-react'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { Input, Select } from '../components/FormFields.jsx'
import { analytics } from '../data/mockData.js'
import { useChartColors, ChartTooltip } from '../utils/chartTheme.jsx'
import './RoutingLog.css'

const { routingDecisions } = analytics

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function RoutingLog() {
  const [search,         setSearch]         = useState('')
  const [filterFallback, setFilterFallback] = useState('all')
  const c = useChartColors()

  const total        = routingDecisions.length
  const fallbacks    = routingDecisions.filter(d => d.fallbackFired).length
  const uniquePacks  = new Set(routingDecisions.map(d => d.packName)).size
  const uniqueDests  = new Set(routingDecisions.map(d => d.destination)).size

  const pieData = [
    { name: 'Direct Route', value: total - fallbacks },
    { name: 'Fallback',     value: fallbacks },
  ]

  const filtered = useMemo(() => routingDecisions.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.packName.toLowerCase().includes(q) ||
      d.ruleMatched.toLowerCase().includes(q) ||
      d.destination.toLowerCase().includes(q) ||
      d.itemId.toLowerCase().includes(q)
    const matchFallback =
      filterFallback === 'all' ||
      (filterFallback === 'fallback' && d.fallbackFired) ||
      (filterFallback === 'direct'   && !d.fallbackFired)
    return matchSearch && matchFallback
  }), [search, filterFallback])

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Routing Decisions Log</h1>
          <p className="page-subtitle">Complete audit trail of every routing decision — last 30 days</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm">Export Log</Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="rl-summary">
        <div className="rl-summary-stats">
          {[
            { label: 'Total Decisions',  value: total,       colorKey: 'blue'   },
            { label: 'Fallback Fired',   value: fallbacks,   colorKey: 'amber'  },
            { label: 'Unique Packs',     value: uniquePacks, colorKey: 'purple' },
            { label: 'Destinations',     value: uniqueDests, colorKey: 'teal'   },
          ].map(s => (
            <div key={s.label} className="rl-stat-card">
              <div className={`rl-stat-value rl-stat-value--${s.colorKey}`}>{s.value}</div>
              <div className="rl-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rpt-card rl-donut-card">
          <div className="rpt-card-title">Route Distribution</div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={32} outerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  <Cell fill={c.teal} />
                  <Cell fill={c.amber} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: c.text3 }} iconType="circle" iconSize={7} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rpt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="rl-table-toolbar">
          <div style={{ flex: 1, maxWidth: 320 }}>
            <Input
              placeholder="Search pack, rule, destination…"
              icon={Search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: 140 }}>
            <Select
              value={filterFallback}
              onChange={e => setFilterFallback(e.target.value)}
              options={[
                { value: 'all',      label: 'All routes'    },
                { value: 'direct',   label: 'Direct only'   },
                { value: 'fallback', label: 'Fallback only' },
              ]}
            />
          </div>
          <span className="rl-count">{filtered.length} of {total}</span>
        </div>

        <div className="rl-table-wrap">
          <table className="rl-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Pack</th>
                <th>Rule Matched</th>
                <th>Destination</th>
                <th>Route</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.itemId} className={d.fallbackFired ? 'rl-row--fallback' : ''}>
                  <td className="rl-mono">{d.itemId}</td>
                  <td className="rl-pack">{d.packName}</td>
                  <td className="rl-mono rl-rule">{d.ruleMatched}</td>
                  <td className="rl-dest">{d.destination}</td>
                  <td>
                    {d.fallbackFired
                      ? <Badge label="Fallback" variant="amber" size="sm" />
                      : <Badge label="Direct"   variant="teal"  size="sm" />
                    }
                  </td>
                  <td className="rl-mono rl-ts">{fmtTime(d.timestamp)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: 12 }}>
                    No decisions match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
