import './KPICard.css'

export default function KPICard({ label, value, icon: Icon, tint = 'blue', delta }) {
  const isPositive = delta && !delta.startsWith('-')
  return (
    <div className={`kpi-card kpi-card--${tint}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <span className={`kpi-icon kpi-icon--${tint}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {delta && (
        <div className={`kpi-delta ${isPositive ? 'kpi-delta--up' : 'kpi-delta--down'}`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          {delta} vs last 7d
        </div>
      )}
    </div>
  )
}
