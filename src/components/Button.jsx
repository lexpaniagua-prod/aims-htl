import './Button.css'

export default function Button({
  children, variant = 'primary', size = 'md', pill = false,
  icon: Icon, iconRight: IconRight,
  disabled, onClick, type = 'button', className = ''
}) {
  const iconAlone = !children && (Icon || IconRight)
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${pill ? ' btn--pill' : ''}${iconAlone ? ' btn--icon-alone' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} strokeWidth={1.75} />}
      {children && <span>{children}</span>}
      {IconRight && <IconRight size={size === 'sm' ? 12 : 14} strokeWidth={1.75} />}
    </button>
  )
}
