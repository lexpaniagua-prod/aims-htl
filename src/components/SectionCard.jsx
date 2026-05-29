import './SectionCard.css'

export default function SectionCard({ title, subtitle, headerAction, children, noPad }) {
  return (
    <div className="section-card">
      {(title || headerAction) && (
        <div className="section-card-header">
          <div>
            {title && <div className="section-card-title">{title}</div>}
            {subtitle && <div className="section-card-subtitle">{subtitle}</div>}
          </div>
          {headerAction && <div className="section-card-action">{headerAction}</div>}
        </div>
      )}
      <div className={`section-card-body${noPad ? ' section-card-body--no-pad' : ''}`}>
        {children}
      </div>
    </div>
  )
}
