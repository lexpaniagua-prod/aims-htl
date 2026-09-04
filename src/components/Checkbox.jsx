import { Check } from 'lucide-react'
import './Checkbox.css'

// DS Checkbox — outline-only in the unchecked state (no white fill),
// filled accent-blue with a white check when checked.
// Reference: aims-os-design-system.vercel.app/?page=checkbox
export default function Checkbox({ checked, onChange, disabled, className = '' }) {
  return (
    <span
      className={`ds-checkbox${checked ? ' ds-checkbox--checked' : ''}${disabled ? ' ds-checkbox--disabled' : ''} ${className}`}
      role="checkbox"
      aria-checked={checked}
      onClick={disabled ? undefined : () => onChange?.(!checked)}
    >
      {checked && <Check size={11} strokeWidth={3} color="#fff" />}
    </span>
  )
}
