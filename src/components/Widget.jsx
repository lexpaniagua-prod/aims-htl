import { RefreshCw } from 'lucide-react'
import './Widget.css'

// DS Widget Father — the shared shell every dashboard widget (KPI, table,
// activity feed, etc.) is composed inside. The Father handles title,
// header actions, and optional footer CTAs; the body slot is contextual.
// Reference: aims-os-design-system.vercel.app/?page=widget-father
export default function Widget({ title, description, onRefresh, headerRight, footer, children, className = '' }) {
  return (
    <div className={`widget ${className}`}>
      <div className="widget-header">
        <div className="widget-header-titles">
          <span className="widget-title">{title}</span>
          {description && <span className="widget-description">{description}</span>}
        </div>
        {(onRefresh || headerRight) && (
          <div className="widget-header-actions">
            {onRefresh && (
              <button className="widget-icon-btn" title="Refresh" onClick={onRefresh}>
                <RefreshCw size={13} />
              </button>
            )}
            {headerRight}
          </div>
        )}
      </div>
      <div className="widget-body">
        {children}
      </div>
      {footer && <div className="widget-footer">{footer}</div>}
    </div>
  )
}
