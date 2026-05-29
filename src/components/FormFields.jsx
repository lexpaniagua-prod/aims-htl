import './FormFields.css'

export function Input({ label, id, type = 'text', placeholder, value, onChange, error, hint, icon: Icon, ...rest }) {
  return (
    <div className="field-wrap">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <div className={`input-wrap${Icon ? ' input-wrap--icon' : ''}${error ? ' input-wrap--error' : ''}`}>
        {Icon && <Icon size={13} className="input-icon" />}
        <input
          id={id}
          type={type}
          className="field-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...rest}
        />
      </div>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

export function Select({ label, id, value, onChange, options = [], error, hint, ...rest }) {
  return (
    <div className="field-wrap">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <div className={`input-wrap input-wrap--select${error ? ' input-wrap--error' : ''}`}>
        <select id={id} className="field-input field-select" value={value} onChange={onChange} {...rest}>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

export function Textarea({ label, id, placeholder, value, onChange, rows = 4, error, hint, ...rest }) {
  return (
    <div className="field-wrap">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <textarea
        id={id}
        className={`field-input field-textarea${error ? ' field-input--error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        {...rest}
      />
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
