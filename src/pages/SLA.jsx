import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine
} from 'recharts'
import { CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import { analytics } from '../data/mockData.js'
import { useChartColors, ChartTooltip } from '../utils/chartTheme.jsx'
import './SLA.css'

const { slaPerformance, dailyVolume } = analytics

function fmtMin(m) {
  if (m >= 1440) return `${Math.round(m / 1440)}d`
  if (m >= 60)   return `${(m / 60).toFixed(1)}h`
  return `${m}m`
}

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function SLA() {
  const c = useChartColors()

  const avgCompliance = slaPerformance.reduce((s, p) => s + p.complianceRate, 0) / slaPerformance.length
  const totalBreaches = slaPerformance.reduce((s, p) => s + p.breachCount, 0)
  const avgHandle     = slaPerformance.reduce((s, p) => s + p.avgHandleMinutes, 0) / slaPerformance.length
  const atRisk        = slaPerformance.filter(p => p.complianceRate < 0.9).length

  const complianceData = slaPerformance.map(p => ({
    name: p.packName.split('—')[0].trim().substring(0, 24),
    Compliance: Math.round(p.complianceRate * 100),
  }))

  const queueData = dailyVolume.map(d => ({
    date: fmtDate(d.date),
    Depth: d.handoffs + d.continuations,
    Escalated: d.escalated,
  }))

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">SLA & Queue Performance</h1>
          <p className="page-subtitle">Service level compliance and queue depth — last 30 days</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm">Export CSV</Button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KPICard label="Overall SLA"    value={`${(avgCompliance * 100).toFixed(1)}%`} tint="green" icon={CheckCircle}  delta="+0.6%" />
        <KPICard label="Total Breaches" value={totalBreaches}                           tint="coral" icon={AlertTriangle} delta="-8%" />
        <KPICard label="Avg Handle"     value={fmtMin(Math.round(avgHandle))}           tint="blue"  icon={Clock}         delta="-12%" />
        <KPICard label="At-Risk Packs"  value={atRisk}                                  tint="amber" icon={TrendingUp} />
      </div>

      <div className="sla-chart-grid">
        {/* Compliance bar chart */}
        <div className="rpt-card">
          <div className="rpt-card-title">SLA Compliance by Pack</div>
          <div className="rpt-card-sub">% handled within target — dashed line = 90% floor</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                <XAxis
                  type="number" domain={[0, 100]}
                  tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis
                  type="category" dataKey="name" width={136}
                  tick={{ fontSize: 10, fill: c.text2 }} tickLine={false} axisLine={false}
                />
                <Tooltip content={<ChartTooltip valueFormatter={v => `${v}%`} />} />
                <ReferenceLine x={90} stroke={c.amber} strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="Compliance" radius={[0, 3, 3, 0]} animationDuration={900}>
                  {complianceData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.Compliance >= 95 ? c.teal : entry.Compliance >= 90 ? c.amber : c.coral}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queue depth area chart */}
        <div className="rpt-card">
          <div className="rpt-card-title">Queue Depth (30 days)</div>
          <div className="rpt-card-sub">Daily items entering queue · Escalations overlay</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={queueData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c.blue}  stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c.blue}  stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="escGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c.coral} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c.coral} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Depth"     stroke={c.blue}  fill="url(#depthGrad)" strokeWidth={2} dot={false} animationDuration={800} />
                <Area type="monotone" dataKey="Escalated" stroke={c.coral} fill="url(#escGrad)"   strokeWidth={2} dot={false} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-pack SLA table */}
      <div className="rpt-card">
        <div className="rpt-card-title">Per-Pack SLA Performance</div>
        <div className="rpt-card-sub">30-day compliance summary</div>
        <table className="sla-table">
          <thead>
            <tr>
              <th>Pack</th>
              <th>SLA Target</th>
              <th>Compliance</th>
              <th>Avg Handle</th>
              <th>Breaches</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {slaPerformance.map(p => {
              const pct = Math.round(p.complianceRate * 100)
              const ok  = pct >= 90
              return (
                <tr key={p.packName}>
                  <td className="sla-pack-name">{p.packName}</td>
                  <td className="sla-mono">{fmtMin(p.slaTargetMinutes)}</td>
                  <td className="sla-mono">
                    <span style={{
                      color: pct >= 95 ? 'var(--accent-teal)' : pct >= 90 ? 'var(--accent-amber)' : 'var(--accent-coral)',
                      fontWeight: 600,
                    }}>
                      {pct}%
                    </span>
                  </td>
                  <td className="sla-mono">{fmtMin(Math.round(p.avgHandleMinutes))}</td>
                  <td className="sla-mono">{p.breachCount}</td>
                  <td>
                    <Badge label={ok ? 'On Track' : 'At Risk'} variant={ok ? 'teal' : 'coral'} size="sm" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
