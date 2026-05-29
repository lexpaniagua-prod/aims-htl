import './StepIndicator.css'
import { Check } from 'lucide-react'

export default function StepIndicator({ steps, current }) {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className={`step${active ? ' step--active' : ''}${done ? ' step--done' : ''}`}>
            {i > 0 && <div className={`step-line${done || active ? ' step-line--filled' : ''}`} />}
            <div className="step-node">
              {done ? <Check size={11} /> : <span>{i + 1}</span>}
            </div>
            <div className="step-label">{step}</div>
          </div>
        )
      })}
    </div>
  )
}
