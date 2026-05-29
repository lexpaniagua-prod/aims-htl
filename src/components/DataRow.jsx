import './DataRow.css'

export default function DataRow({ title, description, meta = [], status, timestamp, actions = [], onClick }) {
  return (
    <div className={`data-row${onClick ? ' data-row--clickable' : ''}`} onClick={onClick}>
      <div className="data-row-body">
        <div className="data-row-title">{title}</div>
        {description && <div className="data-row-desc">{description}</div>}
        {meta.length > 0 && (
          <div className="data-row-meta">
            {meta.map((m, i) => (
              <span key={i} className="meta-chip">
                {m.icon && <m.icon size={11} />}
                {m.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="data-row-right">
        {status}
        {timestamp && <span className="data-row-ts">{timestamp}</span>}
        {actions.length > 0 && (
          <div className="data-row-actions" onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
