import './Badge.css'

export default function Badge({ label, variant = 'gray', size = 'md' }) {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {label}
    </span>
  )
}
