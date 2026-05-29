import { useState, useEffect, useRef } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend
} from 'recharts'
import { Inbox, CheckCircle, AlertTriangle, Clock, Shield, Zap, X } from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import Button from '../components/Button.jsx'
import { analytics } from '../data/mockData.js'
import { useChartColors, ChartTooltip } from '../utils/chartTheme.jsx'
import './Overview.css'

const { dailyVolume, destinationBreakdown, sensitiveSignalVolume } = analytics

const SIG_META = [
  { key: 'hr',            label: 'HR',            colorKey: 'purple' },
  { key: 'legal',         label: 'Legal',         colorKey: 'amber'  },
  { key: 'security',      label: 'Security',      colorKey: 'blue'   },
  { key: 'safety',        label: 'Safety',        colorKey: 'coral'  },
  { key: 'whistleblower', label: 'Whistleblower', colorKey: 'teal'   },
]

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function Overview() {
  const [dateRange, setDateRange] = useState('30d')
  // Live volume — last entry increments every 45s to simulate real traffic
  const [liveVolume,  setLiveVolume]  = useState(() => dailyVolume.map(d => ({ ...d })))
  const [liveTotal,   setLiveTotal]   = useState(0)
  const c = useChartColors()

  useEffect(() => {
    const id = setInterval(() => {
      setLiveVolume(prev => {
        const next = prev.map(d => ({ ...d }))
        const last = next[next.length - 1]
        last.handoffs      = last.handoffs + 1
        last.continuations = last.continuations + (Math.random() > 0.5 ? 1 : 0)
        return next
      })
      setLiveTotal(t => t + 1)
    }, 45000)
    return () => clearInterval(id)
  }, [])

  const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30
  const slice = liveVolume.slice(-days)

  const volumeData = slice.map(d => ({
    date: fmtDate(d.date),
    Handoffs: d.handoffs,
    Continuations: d.continuations,
    Escalated: d.escalated,
  }))

  const groupedData = liveVolume.slice(-14).map(d => ({
    date: fmtDate(d.date),
    Handoffs: d.handoffs,
    Continuations: d.continuations,
  }))

  const destData = [
    { name: 'Inbox',       value: destinationBreakdown.inbox },
    { name: 'External',    value: destinationBreakdown.external },
    { name: 'Lightweight', value: destinationBreakdown.lightweight },
  ]

  const sigData = SIG_META.map(s => ({
    name: s.label,
    Count: sensitiveSignalVolume[s.key],
    colorKey: s.colorKey,
  }))

  const colorMap = {
    blue: c.blue, teal: c.teal, purple: c.purple,
    amber: c.amber, coral: c.coral, green: c.green,
  }

  const total     = slice.reduce((s, d) => s + d.handoffs + d.continuations, 0) + liveTotal
  const resolved  = slice.reduce((s, d) => s + d.resolved, 0)
  const escalated = slice.reduce((s, d) => s + d.escalated, 0)
  const sensitive = slice.reduce((s, d) => s + d.sensitive, 0)
  const sigTotal  = Object.values(sensitiveSignalVolume).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Operations Overview</h1>
          <p className="page-subtitle">Volume, routing, and sensitive signal trends across all packs</p>
        </div>
        <div className="page-actions">
          <select
            className="ov-date-select"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button variant="secondary" size="sm">Export</Button>
          <Button variant="primary" size="sm" icon={Zap}>
            Live View{liveTotal > 0 && <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '0 5px', fontSize: 10 }}>+{liveTotal}</span>}
          </Button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KPICard label="Total Items"       value={total.toLocaleString()} tint="blue"   icon={Inbox}         delta="+8%" />
        <KPICard label="Resolved"          value={resolved.toLocaleString()} tint="green" icon={CheckCircle} delta="+5%" />
        <KPICard label="Escalations"       value={escalated}              tint="coral"  icon={AlertTriangle} delta="-3%" />
        <KPICard label="Avg Handle Time"   value="4.2m"                   tint="amber"  icon={Clock}         delta="-0.5m" />
        <KPICard label="Sensitive Signals" value={sensitive}              tint="purple" icon={Shield}        delta="+14%" />
      </div>

      <div className="ov-chart-grid">
        {/* 1 — Volume trends */}
        <div className="rpt-card">
          <div className="rpt-card-title">Volume Trends</div>
          <div className="rpt-card-sub">Handoffs · Continuations · Escalations</div>
          <div className="ov-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} interval={Math.floor(days / 6)} />
                <YAxis tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Handoffs"      stroke={c.blue}  strokeWidth={2} dot={false} animationDuration={800} />
                <Line type="monotone" dataKey="Continuations" stroke={c.teal}  strokeWidth={2} dot={false} animationDuration={900} />
                <Line type="monotone" dataKey="Escalated"     stroke={c.coral} strokeWidth={2} dot={false} animationDuration={1000} />
                <Legend wrapperStyle={{ fontSize: 11, color: c.text3 }} iconType="circle" iconSize={7} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2 — Destination donut */}
        <div className="rpt-card">
          <div className="rpt-card-title">Destination Breakdown</div>
          <div className="rpt-card-sub">All items · last {days} days</div>
          <div className="ov-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={destData}
                  cx="50%" cy="50%"
                  innerRadius="42%" outerRadius="62%"
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {destData.map((_, i) => (
                    <Cell key={i} fill={[c.blue, c.purple, c.teal][i]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: c.text3 }} iconType="circle" iconSize={7} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 — Sensitive signals (horizontal bar) */}
        <div className="rpt-card">
          <div className="rpt-card-title">Sensitive Signal Classes</div>
          <div className="rpt-card-sub">Fires in last {days} days</div>
          <div className="ov-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sigData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: c.text2 }} tickLine={false} axisLine={false} width={76} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Count" radius={[0, 3, 3, 0]} animationDuration={800}>
                  {sigData.map((entry, i) => (
                    <Cell key={i} fill={colorMap[entry.colorKey] || c.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 — Handoffs vs Continuations */}
        <div className="rpt-card">
          <div className="rpt-card-title">Handoffs vs Continuations</div>
          <div className="rpt-card-sub">Last 14 days</div>
          <div className="ov-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Handoffs"      fill={c.blue} radius={[2, 2, 0, 0]} animationDuration={800} />
                <Bar dataKey="Continuations" fill={c.teal} radius={[2, 2, 0, 0]} animationDuration={900} />
                <Legend wrapperStyle={{ fontSize: 11, color: c.text3 }} iconType="circle" iconSize={7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sensitive signals summary table */}
      <div className="rpt-card">
        <div className="rpt-card-title">Sensitive Signal Summary</div>
        <div className="rpt-card-sub">Volume by class — last {days} days</div>
        <table className="ov-sig-table">
          <thead>
            <tr>
              <th>Signal Class</th>
              <th>Fires</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {SIG_META.map(s => {
              const count = sensitiveSignalVolume[s.key]
              return (
                <tr key={s.key}>
                  <td>
                    <span className={`ov-sig-dot ov-sig-dot--${s.colorKey}`} />
                    {s.label}
                  </td>
                  <td className="ov-mono">{count}</td>
                  <td className="ov-mono">{((count / sigTotal) * 100).toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
