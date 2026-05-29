import './Button.css'

export default function Button({
  children, variant = 'primary', size = 'md',
  icon: Icon, iconRight: IconRight,
  disabled, onClick, type = 'button', className = ''
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children && <span>{children}</span>}
      {IconRight && <IconRight size={size === 'sm' ? 12 : 14} />}
    </button>
  )
}
