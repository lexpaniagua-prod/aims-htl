import './HighlightIcon.css'

// DS Highlight Icon — small tinted glyph chip used for row/card type markers.
// Reference: aims-os-design-system.vercel.app/?page=highlight-icon
export default function HighlightIcon({ icon: Icon, variant = 'neutral', size = 24, className = '' }) {
  return (
    <span className={`hi-icon hi-icon--${variant} ${className}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.66)} strokeWidth={1.75} />
    </span>
  )
}
