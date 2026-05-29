import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts'
import { Radio, AlertTriangle, Shield } from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import { analytics, rosters } from '../data/mockData.js'
import { useChartColors, ChartTooltip } from '../utils/chartTheme.jsx'
import './Signals.css'

const { sensitiveSignalVolume, dailyVolume } = analytics

const SIG_META = {
  safety:       { label: 'Customer Safety',  colorKey: 'coral'  },
  legal:        { label: 'Legal Sensitive',  colorKey: 'amber'  },
  hr:           { label: 'HR Confidential', colorKey: 'purple' },
  security:     { label: 'Security',         colorKey: 'blue'   },
  whistleblower:{ label: 'Whistleblower',   colorKey: 'teal'   },
}

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function Signals() {
  const c = useChartColors()

  const colorMap = {
    blue: c.blue, teal: c.teal, purple: c.purple,
    amber: c.amber, coral: c.coral,
  }

  const total = Object.values(sensitiveSignalVolume).reduce((a, b) => a + b, 0)

  const barData = Object.entries(sensitiveSignalVolume).map(([key, val]) => ({
    name: SIG_META[key]?.label || key,
    Count: val,
    colorKey: SIG_META[key]?.colorKey || 'blue',
  }))

  const areaData = dailyVolume.map(d => ({
    date: fmtDate(d.date),
    Signals: d.sensitive,
  }))

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Sensitive Signals Report</h1>
          <p className="page-subtitle">Detection, acknowledgment, and roster coverage — last 30 days</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm">Configure Signals</Button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KPICard label="Total Signals"    value={total}                          tint="amber"  icon={Radio}         delta="+14%" />
        <KPICard label="HR / People"      value={sensitiveSignalVolume.hr}        tint="purple" icon={Shield} />
        <KPICard label="Legal Mentions"   value={sensitiveSignalVolume.legal}     tint="amber"  icon={AlertTriangle} />
        <KPICard label="Safety Events"    value={sensitiveSignalVolume.safety}    tint="coral"  icon={AlertTriangle} />
        <KPICard label="Security Events"  value={sensitiveSignalVolume.security}  tint="blue"   icon={Shield} />
      </div>

      <div className="sig-chart-row">
        {/* Bar chart — by class */}
        <div className="rpt-card">
          <div className="rpt-card-title">Signal Fires by Class</div>
          <div className="rpt-card-sub">Last 30 days — all detection types</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: c.text2 }} tickLine={false} axisLine={false} width={118} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Count" radius={[0, 3, 3, 0]} animationDuration={800}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={colorMap[entry.colorKey] || c.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area chart — 30-day trend */}
        <div className="rpt-card">
          <div className="rpt-card-title">30-Day Signal Trend</div>
          <div className="rpt-card-sub">Daily sensitive signal detection count</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="sigGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c.amber} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={c.amber} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Signals" stroke={c.amber} fill="url(#sigGrad)" strokeWidth={2} dot={false} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Roster coverage table */}
      <div className="rpt-card">
        <div className="rpt-card-title">Roster Coverage</div>
        <div className="rpt-card-sub">Acknowledgment requirements and escalation paths</div>
        <table className="sig-roster-table">
          <thead>
            <tr>
              <th>Signal Class</th>
              <th>Members</th>
              <th>Min Required</th>
              <th>Mandatory Ack</th>
              <th>Primary Escalation</th>
            </tr>
          </thead>
          <tbody>
            {rosters.map(r => (
              <tr key={r.signalClass}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 12 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {r.description.length > 72 ? r.description.substring(0, 70) + '…' : r.description}
                  </div>
                </td>
                <td className="sig-mono">{r.members.length}</td>
                <td className="sig-mono">{r.minRequired}</td>
                <td>
                  <Badge
                    label={r.mandatoryAck ? 'Required' : 'Optional'}
                    variant={r.mandatoryAck ? 'coral' : 'gray'}
                    size="sm"
                  />
                </td>
                <td style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 220 }}>
                  {r.escalationPath.split('→')[0].trim()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
