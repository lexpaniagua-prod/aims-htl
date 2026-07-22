import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import './WalkMe.css'

// ─── AIMS-OS Demo WalkMe (React port) ───────────────────────────────────────
// Adapted from the demo-walkme skill's 6 required upgrades, driven by
// react-router's useNavigate instead of the vanilla hash route().
//
// Step schema: { title, body, route, target, scrollToTarget, setup, pulse }

function getRect(selector) {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null
  return el.getBoundingClientRect()
}

export default function WalkMe({ steps, storageKey = 'walkme' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 560)
  const popoverRef = useRef(null)
  const triggerRef = useRef(null)
  const liveRegionRef = useRef(null)
  const prevFocusRef = useRef(null)

  const stepKey = `${storageKey}-step`
  const total = steps.length
  const step = steps[stepIndex]

  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // ── Deep-link: ?tour=N auto-starts at step N (1-based) ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const n = parseInt(params.get('tour'), 10)
    if (n && n >= 1 && n <= total) {
      startAt(n - 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Resize tracking for mobile bottom-sheet breakpoint ───────────────────
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 560)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Position the spotlight hole on the current step's target ────────────
  const measure = useCallback(() => {
    if (!step) return
    const r = getRect(step.target)
    setRect(r)
    if (r && step.scrollToTarget) {
      const el = document.querySelector(step.target)
      el?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' })
      // Re-measure after the scroll settles (2-pass reposition)
      setTimeout(() => setRect(getRect(step.target)), reducedMotion ? 0 : 320)
    }
  }, [step, reducedMotion])

  useLayoutEffect(() => {
    if (!open || !step) return
    let cancelled = false

    const run = async () => {
      if (step.setup) await step.setup({ navigate })
      if (step.route && location.pathname !== step.route) {
        navigate(step.route)
      }
      // Give the route/DOM a tick to render before measuring
      requestAnimationFrame(() => { if (!cancelled) measure() })
    }
    run()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex])

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, measure])

  // ── Persist progress ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) localStorage.setItem(stepKey, String(stepIndex))
  }, [open, stepIndex, stepKey])

  const hasSavedProgress = () => {
    const saved = localStorage.getItem(stepKey)
    return saved != null && Number(saved) > 0 && Number(saved) < total - 1
  }

  function startAt(i) {
    prevFocusRef.current = document.activeElement
    setStepIndex(Math.max(0, Math.min(i, total - 1)))
    setOpen(true)
  }

  function start() {
    const saved = Number(localStorage.getItem(stepKey) || 0)
    startAt(hasSavedProgress() ? saved : 0)
  }

  function finish() {
    localStorage.removeItem(stepKey)
    close()
  }

  function skip() {
    close()
  }

  function restart() {
    localStorage.removeItem(stepKey)
    startAt(0)
  }

  function close() {
    setOpen(false)
    // Focus returns to the trigger button on exit
    requestAnimationFrame(() => (prevFocusRef.current || triggerRef.current)?.focus?.())
  }

  function next() {
    if (stepIndex >= total - 1) { finish(); return }
    setStepIndex(i => i + 1)
  }

  function prev() {
    setStepIndex(i => Math.max(0, i - 1))
  }

  // ── Focus trap + keyboard nav ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    // Move focus into the popover on each step
    const t = setTimeout(() => {
      popoverRef.current?.querySelector('[data-walkme-autofocus]')?.focus()
    }, 30)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); return }
      if (e.key === 'Tab') {
        const focusables = popoverRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKeyDown) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex])

  // ── ARIA live announcement ────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !step || !liveRegionRef.current) return
    liveRegionRef.current.textContent = `Step ${stepIndex + 1} of ${total}: ${step.title}`
  }, [open, stepIndex, step, total])

  if (!steps || total === 0) return null

  const PAD = 6
  const hole = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  // Popover placement: below the target if room, else above; centered if no target
  let popoverStyle = {}
  if (!isMobile) {
    if (hole) {
      const spaceBelow = window.innerHeight - (hole.top + hole.height)
      const top = spaceBelow > 220 ? hole.top + hole.height + 14 : Math.max(14, hole.top - 234)
      const left = Math.min(Math.max(hole.left, 16), window.innerWidth - 356)
      popoverStyle = { top, left }
    } else {
      popoverStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
  }

  return (
    <>
      {/* Floating trigger — always visible, toggle at will */}
      <button
        ref={triggerRef}
        className="walkme-trigger"
        onClick={open ? close : start}
        title={open ? 'Close walkthrough' : (hasSavedProgress() ? 'Continue walkthrough' : 'Take the tour')}
      >
        <HelpCircle size={16} />
        <span>{hasSavedProgress() && !open ? 'Continue' : 'Walk me through it'}</span>
      </button>

      {open && step && (
        <div className={`walkme-overlay${reducedMotion ? ' walkme-no-motion' : ''}`}>
          {/* 4-strip mask — leaves a click-through hole over the target */}
          {hole ? (
            <>
              <div className="walkme-mask" style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} onClick={close} />
              <div className="walkme-mask" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} onClick={close} />
              <div className="walkme-mask" style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} onClick={close} />
              <div className="walkme-mask" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} onClick={close} />
              <div
                className={`walkme-ring${step.pulse ? ' walkme-ring--pulse' : ''}`}
                style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
              />
            </>
          ) : (
            <div className="walkme-mask walkme-mask--full" onClick={close} />
          )}

          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label={step.title}
            className={`walkme-popover${isMobile ? ' walkme-popover--sheet' : ''}`}
            style={popoverStyle}
          >
            <div className="walkme-popover-head">
              <span className="walkme-step-count">Step {stepIndex + 1} of {total}</span>
              {stepIndex > 0 && (
                <button className="walkme-link" onClick={restart} title="Restart from step 1">
                  Restart
                </button>
              )}
              <button className="walkme-link walkme-link--skip" onClick={skip}>
                Skip tour
              </button>
            </div>
            <div className="walkme-title">{step.title}</div>
            <div className="walkme-body" dangerouslySetInnerHTML={{ __html: step.body }} />
            <div className="walkme-progress">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`walkme-dot${i === stepIndex ? ' walkme-dot--active' : i < stepIndex ? ' walkme-dot--done' : ''}`}
                />
              ))}
            </div>
            <div className="walkme-actions">
              {stepIndex > 0 && (
                <button className="walkme-btn walkme-btn--ghost" onClick={prev}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <button className="walkme-btn walkme-btn--primary" onClick={next} data-walkme-autofocus>
                {stepIndex >= total - 1 ? 'Finish' : <>Next <ChevronRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visually hidden live region for screen readers */}
      <div ref={liveRegionRef} aria-live="polite" className="walkme-sr-only" />
    </>
  )
}
