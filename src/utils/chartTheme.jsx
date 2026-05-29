import { useState, useEffect } from 'react'

function readVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function buildColors() {
  return {
    blue:   readVar('--accent-blue')    || '#4f9cf0',
    teal:   readVar('--accent-teal')    || '#34d399',
    purple: readVar('--accent-purple')  || '#a78bfa',
    amber:  readVar('--accent-amber')   || '#fbbf24',
    coral:  readVar('--accent-coral')   || '#fb7185',
    green:  readVar('--accent-green')   || '#86efac',
    text2:  readVar('--text-secondary') || '#8b90a7',
    text3:  readVar('--text-tertiary')  || '#4e5368',
    border: readVar('--border')         || 'rgba(255,255,255,0.07)',
  }
}

export function useChartColors() {
  const [c, setC] = useState(buildColors)
  useEffect(() => {
    const obs = new MutationObserver(() => setC(buildColors()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return c
}

export function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card-elevated)',
      border: '1px solid var(--border-strong)',
      borderRadius: 8,
      padding: '8px 12px',
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      color: 'var(--text-primary)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      pointerEvents: 'none',
    }}>
      {label && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 10, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '1px 0' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', marginRight: 4 }}>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {valueFormatter ? valueFormatter(entry.value) : (entry.value?.toLocaleString() ?? entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
