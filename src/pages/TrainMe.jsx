import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts'
import { GraduationCap, CheckCircle, ThumbsDown, Clock, MessageSquare } from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { analytics } from '../data/mockData.js'
import { useChartColors, ChartTooltip } from '../utils/chartTheme.jsx'
import './TrainMe.css'

const { trainMeData, composerUsage, dailyVolume } = analytics

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const TOPIC_VOLUMES = [71, 58, 49, 38, 29]

export default function TrainMe() {
  const c = useChartColors()

  const topicsData = trainMeData.topTopics.map((topic, i) => ({
    name: topic.length > 32 ? topic.substring(0, 30) + '…' : topic,
    Submissions: TOPIC_VOLUMES[i],
  }))

  const composerData = [
    { name: 'Accepted', value: composerUsage.accepted  },
    { name: 'Modified', value: composerUsage.modified  },
    { name: 'Rejected', value: composerUsage.rejected  },
  ]

  const trendData = dailyVolume.map(d => ({
    date: fmtDate(d.date),
    Reviewed: Math.round((d.handoffs + d.continuations) * 0.22),
    Promoted: Math.round((d.handoffs + d.continuations) * 0.15),
  }))

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Train Me & Quality Loop</h1>
          <p className="page-subtitle">AI response review, composer metrics, and correction feedback loop</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" size="sm" icon={GraduationCap}>Review Queue</Button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KPICard label="Submitted"            value={trainMeData.submitted}                                              tint="blue"   icon={GraduationCap} />
        <KPICard label="Promoted"             value={trainMeData.promoted}                                               tint="green"  icon={CheckCircle}   delta={`${(trainMeData.promotionRate * 100).toFixed(0)}% rate`} />
        <KPICard label="Rejected"             value={trainMeData.rejected}                                               tint="coral"  icon={ThumbsDown} />
        <KPICard label="Pending Review"       value={trainMeData.pending}                                                tint="amber"  icon={Clock} />
        <KPICard label="Composer Acceptance"  value={`${(composerUsage.acceptanceRate * 100).toFixed(0)}%`}              tint="purple" icon={MessageSquare}  delta={`${composerUsage.suggestionsShown.toLocaleString()} shown`} />
      </div>

      {/* Chart row */}
      <div className="tm-chart-grid">
        {/* Horizontal bar — top topics */}
        <div className="rpt-card">
          <div className="rpt-card-title">Top Correction Topics</div>
          <div className="rpt-card-sub">Submissions by subject area</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicsData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: c.text2 }} tickLine={false} axisLine={false} width={186} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Submissions" fill={c.blue} radius={[0, 3, 3, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut — composer outcomes */}
        <div className="rpt-card">
          <div className="rpt-card-title">Composer Suggestion Outcomes</div>
          <div className="rpt-card-sub">{composerUsage.suggestionsShown.toLocaleString()} suggestions shown</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={composerData}
                  cx="50%" cy="50%"
                  innerRadius="38%" outerRadius="58%"
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  <Cell fill={c.teal} />
                  <Cell fill={c.blue} />
                  <Cell fill={c.coral} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: c.text3 }} iconType="circle" iconSize={7} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Submission trend line chart */}
      <div className="rpt-card" style={{ marginBottom: 16 }}>
        <div className="rpt-card-title">Review Submission Trend</div>
        <div className="rpt-card-sub">Daily reviewed vs promoted — last 30 days</div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: c.text3 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="Reviewed" stroke={c.blue}  strokeWidth={2} dot={false} animationDuration={800} />
              <Line type="monotone" dataKey="Promoted" stroke={c.teal}  strokeWidth={2} dot={false} strokeDasharray="5 3" animationDuration={1000} />
              <Legend wrapperStyle={{ fontSize: 11, color: c.text3 }} iconType="circle" iconSize={7} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent corrections */}
      <div className="rpt-card">
        <div className="rpt-card-title">Recent Corrections</div>
        <div className="rpt-card-sub">Latest submissions by your team</div>
        <div className="tm-corrections">
          {trainMeData.recentCorrections.map((item, i) => (
            <div key={i} className="tm-correction-row">
              <div>
                <div className="tm-correction-topic">{item.topic}</div>
                <div className="tm-correction-meta">
                  by {item.correctedBy} · {new Date(item.submittedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <Badge label="Submitted" variant="blue" size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
