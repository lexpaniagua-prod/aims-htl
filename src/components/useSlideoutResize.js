import { useState, useRef, useCallback, useEffect } from 'react'

// DS SlideOut anatomy — drag-to-expand: hover the left edge to reveal a
// resize handle, drag left to grow, release snaps to either the default
// width or half the viewport (whichever is closer).
export function useSlideoutResize(defaultWidth) {
  const [width, setWidth] = useState(defaultWidth)
  const draggingRef = useRef(false)

  useEffect(() => { setWidth(defaultWidth) }, [defaultWidth])

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      if (!draggingRef.current) return
      const next = window.innerWidth - ev.clientX
      setWidth(Math.max(defaultWidth, Math.min(next, window.innerWidth * 0.9)))
    }
    const onUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidth(w => (w > window.innerWidth * 0.4 ? window.innerWidth * 0.5 : defaultWidth))
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [defaultWidth])

  return { width, onPointerDown }
}
