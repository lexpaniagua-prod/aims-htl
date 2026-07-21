import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react"
import type { ReactNode } from "react"
import { GripVertical } from "lucide-react"
import { WidgetFather } from "@/components/ui/widget-father"
import type { WidgetWidthClass } from "@/components/ui/widget-father"

// ── Types ──────────────────────────────────────────────────────────────────────
//
// CanvasSlot:  content spec (from props — always reflects latest render)
// LayoutItem:  order + width state (in useState — tracks drag/resize mutations)
//
// Separating the two means content re-renders normally when the parent updates
// while layout state survives across re-renders.
// ─────────────────────────────────────────────────────────────────────────────

export interface CanvasSlot {
  uid: string
  title: string
  /** Column span: 1=narrow (1/3), 2=wide (2/3), 3=full (3/3). Default: 1 */
  colSpan?: 1 | 2 | 3
  /** DS width class. Defaults to colSpan-derived value if omitted. */
  widthClass?: WidgetWidthClass
  showRefresh?: boolean
  showMenu?: boolean
  showInfo?: boolean
  /** Content rendered inside WidgetFather */
  content: ReactNode
}

// ── Internal layout state model ───────────────────────────────────────────────

interface LayoutEntry {
  uid: string
  widthClass: WidgetWidthClass
}

interface StackGroup {
  type: "stack"
  uid: string
  slots: LayoutEntry[]
}

type LayoutItem = LayoutEntry | StackGroup

function isStack(e: LayoutItem): e is StackGroup {
  return (e as StackGroup).type === "stack"
}

function findInLayout(items: LayoutItem[], uid: string): LayoutEntry | null {
  for (const e of items) {
    if (isStack(e)) {
      const s = e.slots.find(s => s.uid === uid)
      if (s) return s
    } else if (e.uid === uid) return e
  }
  return null
}

function widthFromSpan(span: 1 | 2 | 3): WidgetWidthClass {
  return span === 1 ? "narrow" : span === 2 ? "wide" : "full"
}

function colSpanForWidth(w: WidgetWidthClass): 1 | 2 | 3 {
  return w === "narrow" ? 1 : w === "wide" ? 2 : 3
}

function toLayoutEntry(s: CanvasSlot): LayoutEntry {
  const colSpan = s.colSpan ?? 1
  return { uid: s.uid, widthClass: s.widthClass ?? widthFromSpan(colSpan) }
}

const HEIGHT_SNAPS = [96, 144, 192, 240, 288, 360, 480]

// ── Component ─────────────────────────────────────────────────────────────────

export interface WidgetCanvasViewProps {
  /**
   * Widget slot definitions. Each slot becomes one draggable/resizable WidgetFather.
   * Redefine this array on each render — content is looked up live so reactive
   * values (counts, rows, etc.) always reflect the latest state.
   */
  initialSlots: CanvasSlot[]
  className?: string
}

export function WidgetCanvasView({ initialSlots, className }: WidgetCanvasViewProps) {
  // ── Slot lookup: content + metadata (never stale) ─────────────────────────
  const slotMap = useMemo(
    () => new Map(initialSlots.map(s => [s.uid, s])),
    [initialSlots],
  )

  // ── Layout state: order + widthClass (mutable via drag/resize) ───────────
  const [layout, setLayout] = useState<LayoutItem[]>(() => initialSlots.map(toLayoutEntry))

  // ── Interaction state ─────────────────────────────────────────────────────
  const [hoveredUid,      setHoveredUid]      = useState<string | null>(null)
  const [hoveredEdge,     setHoveredEdge]     = useState<"left" | "right" | "bottom" | null>(null)
  const [dragUid,         setDragUid]         = useState<string | null>(null)
  const [dropUid,         setDropUid]         = useState<string | null>(null)
  const [dropSide,        setDropSide]        = useState<"before" | "after" | "stack-above" | "stack-below" | null>(null)
  const [pointerPos,      setPointerPos]      = useState<{ x: number; y: number } | null>(null)
  const [collapsedUids,   setCollapsedUids]   = useState<Set<string>>(new Set())
  const [widthByUid,      setWidthByUid]      = useState<Record<string, WidgetWidthClass>>({})
  const [resizing,        setResizing]        = useState<{
    uid: string; edge: "left" | "right"
    startX: number; startCols: number
    startRect: { left: number; top: number; width: number; height: number }
  } | null>(null)
  const [resizePreviewPx, setResizePreviewPx] = useState<number | null>(null)
  const [heightByUid,     setHeightByUid]     = useState<Record<string, number>>({})
  const [vertPreviewH,    setVertPreviewH]    = useState<{ uid: string; h: number } | null>(null)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const resizePreviewRef  = useRef<number | null>(null)
  const isResizingRef     = useRef(false)
  const gridRef           = useRef<HTMLDivElement>(null)
  const activeDragRef     = useRef<string | null>(null)
  const activeDropRef     = useRef<string | null>(null)
  const activeDropSideRef = useRef<"before" | "after" | "stack-above" | "stack-below" | null>(null)
  const dragPotentialRef  = useRef<{ uid: string; x: number; y: number } | null>(null)
  const dropRafRef        = useRef<number | null>(null)
  const vertResizeRef     = useRef<{ uid: string; startY: number; startH: number; moved: boolean } | null>(null)
  const vertPreviewRef    = useRef<number | null>(null)
  const flipInnerRefs     = useRef<Record<string, HTMLDivElement | null>>({})
  const flipPrevRects     = useRef<Record<string, DOMRect>>({})

  const isDragging = dragUid !== null

  // ── Live drag preview: reorders layout during drag-over ──────────────────
  const displayLayout = useMemo((): LayoutItem[] => {
    if (!dragUid || !dropUid || dragUid === dropUid) return layout

    let dragSlot: LayoutEntry | null = null
    const arr: LayoutItem[] = []
    for (const e of layout) {
      if (isStack(e)) {
        const slotI = e.slots.findIndex(s => s.uid === dragUid)
        if (slotI !== -1) {
          dragSlot = e.slots[slotI]
          const rem = e.slots.filter(s => s.uid !== dragUid)
          if (rem.length === 1) arr.push(rem[0])
          else if (rem.length > 1) arr.push({ ...e, slots: rem })
        } else arr.push(e)
      } else {
        if (e.uid === dragUid) dragSlot = e
        else arr.push(e)
      }
    }
    if (!dragSlot) return layout

    if ((dropSide === "stack-above" || dropSide === "stack-below") && dragSlot.widthClass === "narrow") {
      const targetI = arr.findIndex(e => isStack(e) ? e.slots.some(s => s.uid === dropUid) : e.uid === dropUid)
      if (targetI !== -1) {
        const targetEntry = arr[targetI]
        if (!isStack(targetEntry) && targetEntry.widthClass === "narrow") {
          const preview: StackGroup = {
            type: "stack", uid: "preview-stack",
            slots: dropSide === "stack-above" ? [dragSlot, targetEntry] : [targetEntry, dragSlot],
          }
          arr.splice(targetI, 1, preview)
          return arr
        }
      }
    }

    const targetI = arr.findIndex(e => isStack(e)
      ? (e.uid === dropUid || e.slots.some(s => s.uid === dropUid))
      : e.uid === dropUid,
    )
    if (targetI === -1) return layout
    arr.splice(dropSide === "after" ? targetI + 1 : targetI, 0, dragSlot)
    return arr
  }, [layout, dragUid, dropUid, dropSide])

  function getColWidthPx(): number {
    if (!gridRef.current) return 240
    // 3 columns, 2 gaps × 16px between them
    return (gridRef.current.offsetWidth - 32) / 3
  }

  // ── Horizontal resize ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!resizing) return
    function onMove(e: MouseEvent) {
      const dx = e.clientX - resizing!.startX
      const colW = getColWidthPx()
      const mult = resizing!.edge === "left" ? -1 : 1
      const newPx = Math.max(colW * 0.55, Math.min(colW * 3 + 32, resizing!.startRect.width + dx * mult))
      resizePreviewRef.current = newPx
      setResizePreviewPx(newPx)
    }
    function onUp() {
      const px = resizePreviewRef.current
      if (px !== null) {
        const colW = getColWidthPx()
        const cols = Math.max(1, Math.min(3, Math.round(px / colW))) as 1 | 2 | 3
        const newW: WidgetWidthClass = cols === 1 ? "narrow" : cols === 2 ? "wide" : "full"
        setWidthByUid(prev => ({ ...prev, [resizing!.uid]: newW }))
      }
      isResizingRef.current = false
      setResizing(null)
      setResizePreviewPx(null)
      resizePreviewRef.current = null
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      isResizingRef.current = false
      setResizing(null)
      setResizePreviewPx(null)
      resizePreviewRef.current = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("keydown", onEsc)
    }
  }, [resizing])

  // ── Drag-and-drop (threshold + tracking + commit) ─────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (dragPotentialRef.current) {
        const { uid, x, y } = dragPotentialRef.current
        if (Math.hypot(e.clientX - x, e.clientY - y) > 8) {
          dragPotentialRef.current = null
          activeDragRef.current = uid
          setDragUid(uid)
          setHoveredUid(null)
          setPointerPos({ x: e.clientX, y: e.clientY })
        }
        return
      }
      if (!activeDragRef.current) return
      setPointerPos({ x: e.clientX, y: e.clientY })
      const el = document.elementFromPoint(e.clientX, e.clientY)
      let foundSlotEl = (el as HTMLElement)?.closest?.("[data-slot-uid]") as HTMLElement | null

      // Gap detection: cursor in grid but not over any slot → find nearest slot
      if (!foundSlotEl && gridRef.current) {
        const gr = gridRef.current.getBoundingClientRect()
        if (e.clientX >= gr.left && e.clientX <= gr.right && e.clientY >= gr.top && e.clientY <= gr.bottom) {
          const all = Array.from(gridRef.current.querySelectorAll("[data-slot-uid]")) as HTMLElement[]
          let best: HTMLElement | null = null, minD = Infinity
          for (const s of all) {
            const r = s.getBoundingClientRect()
            const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
            if (dist < minD) { minD = dist; best = s }
          }
          foundSlotEl = best
        }
      }

      const uid = foundSlotEl?.dataset?.slotUid ?? null
      const newDrop = uid && uid !== activeDragRef.current ? uid : null

      let newSide: "before" | "after" | "stack-above" | "stack-below" | null = null
      if (newDrop && foundSlotEl) {
        const r = foundSlotEl.getBoundingClientRect()
        const dragEl = gridRef.current?.querySelector(`[data-slot-uid="${activeDragRef.current}"]`) as HTMLElement | null
        const dragIsNarrow = dragEl?.dataset?.slotWidth === "narrow"
        const targetIsNarrow = foundSlotEl?.dataset?.slotWidth === "narrow"
        if (dragIsNarrow && targetIsNarrow) {
          const yFrac = (e.clientY - r.top) / r.height
          if (yFrac < 0.35) newSide = "stack-above"
          else if (yFrac > 0.65) newSide = "stack-below"
          else newSide = e.clientX < r.left + r.width / 2 ? "before" : "after"
        } else {
          newSide = e.clientX < r.left + r.width / 2 ? "before" : "after"
        }
      }

      if (newDrop !== activeDropRef.current || newSide !== activeDropSideRef.current) {
        activeDropRef.current = newDrop
        activeDropSideRef.current = newSide
        if (dropRafRef.current !== null) cancelAnimationFrame(dropRafRef.current)
        dropRafRef.current = requestAnimationFrame(() => {
          setDropUid(activeDropRef.current)
          setDropSide(activeDropSideRef.current)
          dropRafRef.current = null
        })
      }
    }

    function onUp() {
      if (dropRafRef.current !== null) { cancelAnimationFrame(dropRafRef.current); dropRafRef.current = null }
      const dUid = activeDragRef.current
      const tUid = activeDropRef.current
      const side = activeDropSideRef.current
      if (dUid && tUid) {
        setLayout(prev => {
          let dragSlot: LayoutEntry | null = null
          const next: LayoutItem[] = []
          for (const e of prev) {
            if (isStack(e)) {
              const slotI = e.slots.findIndex(s => s.uid === dUid)
              if (slotI !== -1) {
                dragSlot = e.slots[slotI]
                const rem = e.slots.filter(s => s.uid !== dUid)
                if (rem.length === 1) next.push(rem[0])
                else if (rem.length > 1) next.push({ ...e, slots: rem })
              } else next.push(e)
            } else {
              if (e.uid === dUid) dragSlot = e
              else next.push(e)
            }
          }
          if (!dragSlot) return prev

          if (side === "stack-above" || side === "stack-below") {
            const tI = next.findIndex(e => isStack(e) ? e.slots.some(s => s.uid === tUid) : e.uid === tUid)
            if (tI !== -1) {
              const targetEntry = next[tI]
              if (!isStack(targetEntry) && targetEntry.widthClass === "narrow" && dragSlot.widthClass === "narrow") {
                const newStack: StackGroup = {
                  type: "stack",
                  uid: `stack-${dragSlot.uid}-${targetEntry.uid}`,
                  slots: side === "stack-above" ? [dragSlot, targetEntry] : [targetEntry, dragSlot],
                }
                next.splice(tI, 1, newStack)
                return next
              }
            }
            const fbI = next.findIndex(e => isStack(e) ? e.slots.some(s => s.uid === tUid) : e.uid === tUid)
            fbI !== -1 ? next.splice(fbI, 0, dragSlot) : next.push(dragSlot)
            return next
          }

          const tI = next.findIndex(e => isStack(e)
            ? (e.uid === tUid || e.slots.some(s => s.uid === tUid))
            : e.uid === tUid,
          )
          if (tI === -1) { next.push(dragSlot); return next }
          next.splice(side === "after" ? tI + 1 : tI, 0, dragSlot)
          return next
        })
      }
      dragPotentialRef.current = null
      activeDragRef.current = null
      activeDropRef.current = null
      activeDropSideRef.current = null
      setDragUid(null)
      setDropUid(null)
      setDropSide(null)
      setPointerPos(null)
    }

    function onEscDrag(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (dropRafRef.current !== null) { cancelAnimationFrame(dropRafRef.current); dropRafRef.current = null }
      dragPotentialRef.current = null
      activeDragRef.current = null
      activeDropRef.current = null
      activeDropSideRef.current = null
      setDragUid(null)
      setDropUid(null)
      setDropSide(null)
      setPointerPos(null)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("keydown", onEscDrag)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("keydown", onEscDrag)
    }
  }, [])

  // ── Grabbing cursor during drag ───────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = isDragging ? "grabbing" : ""
    document.body.style.userSelect = isDragging ? "none" : ""
    return () => { document.body.style.cursor = ""; document.body.style.userSelect = "" }
  }, [isDragging])

  // ── Vertical resize + collapse ────────────────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!vertResizeRef.current) return
      const dy = e.clientY - vertResizeRef.current.startY
      if (Math.abs(dy) > 3) vertResizeRef.current.moved = true
      if (vertResizeRef.current.moved) {
        const rawH = Math.max(72, vertResizeRef.current.startH + dy)
        vertPreviewRef.current = rawH
        setVertPreviewH({ uid: vertResizeRef.current.uid, h: rawH })
      }
    }
    function onUp() {
      if (!vertResizeRef.current) return
      const { uid, moved } = vertResizeRef.current
      if (moved && vertPreviewRef.current !== null) {
        const rawH = vertPreviewRef.current
        const snapped = HEIGHT_SNAPS.reduce((a, b) => Math.abs(a - rawH) < Math.abs(b - rawH) ? a : b)
        setHeightByUid(prev => ({ ...prev, [uid]: snapped }))
      } else if (!moved) {
        setCollapsedUids(prev => {
          const next = new Set(prev)
          next.has(uid) ? next.delete(uid) : next.add(uid)
          return next
        })
      }
      vertResizeRef.current = null
      vertPreviewRef.current = null
      setVertPreviewH(null)
    }
    function onEscVert(e: KeyboardEvent) {
      if (e.key !== "Escape" || !vertResizeRef.current) return
      vertResizeRef.current = null
      vertPreviewRef.current = null
      setVertPreviewH(null)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("keydown", onEscVert)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("keydown", onEscVert)
    }
  }, [])

  // ── FLIP step 1: capture rects before layout change ───────────────────────
  useLayoutEffect(() => {
    return () => {
      const rects: Record<string, DOMRect> = {}
      Object.entries(flipInnerRefs.current).forEach(([uid, el]) => {
        if (el) rects[uid] = el.getBoundingClientRect()
      })
      flipPrevRects.current = rects
    }
  })

  // ── FLIP step 2: invert → play spring animation ───────────────────────────
  useLayoutEffect(() => {
    const prev = flipPrevRects.current
    const timers: ReturnType<typeof setTimeout>[] = []
    Object.entries(flipInnerRefs.current).forEach(([uid, el]) => {
      if (!el || !prev[uid]) return
      const curr = el.getBoundingClientRect()
      const dx = prev[uid].left - curr.left
      const dy = prev[uid].top - curr.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
      el.style.transition = "none"
      el.style.transform = `translate(${dx}px, ${dy}px)`
      void el.getBoundingClientRect()
      el.style.transition = "transform 420ms cubic-bezier(0.34, 1.2, 0.64, 1)"
      el.style.transform = ""
      timers.push(setTimeout(() => {
        el.style.transition = ""
        el.style.transform = ""
      }, 450))
    })
    return () => timers.forEach(clearTimeout)
  }, [layout])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={className}>
      {/* Smooth resize overlay — fixed-position, no layout shift */}
      {resizing && resizePreviewPx !== null && (
        <div style={{
          position: "fixed",
          top: resizing.startRect.top,
          height: resizing.startRect.height,
          ...(resizing.edge === "left"
            ? { right: window.innerWidth - (resizing.startRect.left + resizing.startRect.width), width: resizePreviewPx }
            : { left: resizing.startRect.left, width: resizePreviewPx }
          ),
          background: "rgba(33,115,255,0.07)",
          border: "1.5px solid var(--color-border-primary-default)",
          borderRadius: 16,
          pointerEvents: "none",
          zIndex: 9999,
        }} />
      )}

      {/* 3-column canvas grid */}
      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          alignItems: "start",
        }}
      >
        {displayLayout.map(entry => {
          // ── StackGroup: two narrow slots in one column ───────────────────
          if (isStack(entry)) {
            return (
              <div
                key={entry.uid}
                data-slot-uid={entry.uid}
                style={{
                  gridColumn: "span 1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  userSelect: "none",
                  position: "relative",
                }}
              >
                {entry.slots.map(slot => {
                  const slotDef = slotMap.get(slot.uid)
                  if (!slotDef) return null
                  const isThisDragging = dragUid === slot.uid
                  const isHovering     = hoveredUid === slot.uid && !isDragging
                  const isGhost        = isThisDragging && !dropUid
                  const isLanding      = isThisDragging && !!dropUid
                  return (
                    <div
                      key={slot.uid}
                      data-slot-uid={slot.uid}
                      data-slot-width="narrow"
                      onMouseEnter={() => { if (!isDragging) setHoveredUid(slot.uid) }}
                      onMouseLeave={() => setHoveredUid(null)}
                      style={{
                        position: "relative",
                        borderRadius: 16,
                        opacity: isGhost ? 0.25 : 1,
                        transition: "opacity 150ms ease, transform 220ms ease",
                        transform: isThisDragging ? "scale(0.97)" : "scale(1)",
                        display: "flex",
                        flexDirection: "column",
                        userSelect: "none",
                      }}
                    >
                      <div
                        ref={el => { flipInnerRefs.current[slot.uid] = el }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", willChange: "transform" }}
                      >
                        {isLanding && (
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "var(--color-surface-primary-subtle)",
                            border: "2px solid var(--color-border-primary-lighter)",
                            borderRadius: 16, zIndex: 15, pointerEvents: "none",
                          }} />
                        )}
                        <WidgetFather
                          className="flex-1"
                          title={slotDef.title}
                          fillWidth
                          widthClass="narrow"
                          showRefresh={slotDef.showRefresh ?? true}
                          showMenu={slotDef.showMenu ?? true}
                          showInfo={slotDef.showInfo ?? false}
                          isHovered={isHovering}
                          isDragging={isThisDragging}
                          isCollapsed={collapsedUids.has(slot.uid)}
                          onGripMouseDown={e => {
                            if (isResizingRef.current || vertResizeRef.current) return
                            dragPotentialRef.current = { uid: slot.uid, x: e.clientX, y: e.clientY }
                          }}
                        >
                          {slotDef.content}
                        </WidgetFather>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          // ── Single slot ──────────────────────────────────────────────────
          const slotDef = slotMap.get(entry.uid)
          if (!slotDef) return null
          const currentWidth    = widthByUid[entry.uid] ?? entry.widthClass
          const isThisDragging  = dragUid === entry.uid
          const isThisResizing  = resizing?.uid === entry.uid
          const isVertResizing  = vertResizeRef.current?.uid === entry.uid
          const isHovering      = hoveredUid === entry.uid && !isDragging && !isThisResizing
          const edge            = isHovering ? hoveredEdge : null
          const edgeShadow      = edge === "left"
            ? "-2px 0 0 0 var(--color-border-primary-default)"
            : edge === "right"
              ? "2px 0 0 0 var(--color-border-primary-default)"
              : edge === "bottom"
                ? "0 2px 0 0 var(--color-border-primary-default)"
                : "none"
          const isGhost         = isThisDragging && !dropUid
          const isLanding       = isThisDragging && !!dropUid
          const explicitH       = vertPreviewH?.uid === entry.uid
            ? vertPreviewH.h
            : heightByUid[entry.uid]

          return (
            <div
              key={entry.uid}
              data-slot-uid={entry.uid}
              data-slot-width={entry.widthClass}
              onMouseEnter={() => { if (!isDragging) setHoveredUid(entry.uid) }}
              onMouseLeave={() => { setHoveredUid(null); setHoveredEdge(null) }}
              style={{
                position: "relative",
                gridColumn: `span ${colSpanForWidth(currentWidth)}`,
                opacity: isGhost ? 0.25 : (isThisResizing || isVertResizing) ? 0.7 : 1,
                borderRadius: 16,
                boxShadow: edgeShadow,
                transition: isDragging && !isThisDragging
                  ? "none"
                  : "opacity 150ms ease, transform 220ms ease, box-shadow 100ms",
                transform: isThisDragging ? "scale(0.97)" : "scale(1)",
                display: "flex",
                flexDirection: "column",
                height: explicitH,
                userSelect: "none",
              }}
            >
              {/* Left edge resize handle */}
              <div
                onMouseDown={e => {
                  e.stopPropagation(); e.preventDefault()
                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
                  isResizingRef.current = true
                  setResizing({ uid: entry.uid, edge: "left", startX: e.clientX, startCols: colSpanForWidth(currentWidth), startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } })
                  setResizePreviewPx(rect.width)
                  resizePreviewRef.current = rect.width
                }}
                onMouseEnter={() => setHoveredEdge("left")}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 12, cursor: "col-resize", zIndex: 20 }}
              />
              {/* Right edge resize handle */}
              <div
                onMouseDown={e => {
                  e.stopPropagation(); e.preventDefault()
                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
                  isResizingRef.current = true
                  setResizing({ uid: entry.uid, edge: "right", startX: e.clientX, startCols: colSpanForWidth(currentWidth), startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } })
                  setResizePreviewPx(rect.width)
                  resizePreviewRef.current = rect.width
                }}
                onMouseEnter={() => setHoveredEdge("right")}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ position: "absolute", right: 0, top: 8, bottom: 8, width: 12, cursor: "col-resize", zIndex: 20 }}
              />
              {/* Bottom edge — drag = resize height, click = collapse */}
              <div
                onMouseDown={e => {
                  if (isDragging || isResizingRef.current) return
                  e.stopPropagation()
                  const slotEl = e.currentTarget.parentElement as HTMLElement
                  const startH = slotEl.getBoundingClientRect().height
                  vertResizeRef.current = { uid: entry.uid, startY: e.clientY, startH, moved: false }
                }}
                onMouseEnter={() => setHoveredEdge("bottom")}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ position: "absolute", left: 8, right: 8, bottom: 0, height: 14, cursor: "row-resize", zIndex: 20 }}
              />
              {/* FLIP animation target */}
              <div
                ref={el => { flipInnerRefs.current[entry.uid] = el }}
                style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", willChange: "transform" }}
              >
                {isLanding && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "var(--color-surface-primary-subtle)",
                    border: "2px solid var(--color-border-primary-lighter)",
                    borderRadius: 16, zIndex: 15, pointerEvents: "none",
                    transition: "opacity 100ms",
                  }} />
                )}
                <WidgetFather
                  className="flex-1"
                  title={slotDef.title}
                  fillWidth
                  widthClass={currentWidth}
                  showRefresh={slotDef.showRefresh ?? true}
                  showMenu={slotDef.showMenu ?? true}
                  showInfo={slotDef.showInfo ?? false}
                  isHovered={isHovering}
                  isDragging={isThisDragging}
                  isCollapsed={collapsedUids.has(entry.uid)}
                  onGripMouseDown={e => {
                    if (isResizingRef.current || vertResizeRef.current) return
                    dragPotentialRef.current = { uid: entry.uid, x: e.clientX, y: e.clientY }
                  }}
                >
                  {slotDef.content}
                </WidgetFather>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating drag preview label — follows cursor */}
      {isDragging && pointerPos && (
        <div style={{
          position: "fixed",
          left: pointerPos.x + 14,
          top: pointerPos.y - 16,
          pointerEvents: "none",
          zIndex: 9999,
          background: "var(--widget-bg)",
          border: "1.5px solid var(--color-border-primary-default)",
          borderRadius: 8,
          padding: "8px 12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          minWidth: 120,
          display: "flex",
          alignItems: "center",
          gap: 6,
          userSelect: "none",
        }}>
          <GripVertical size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--color-text-title)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {findInLayout(layout, dragUid ?? "")
              ? slotMap.get(dragUid ?? "")?.title ?? ""
              : ""}
          </span>
        </div>
      )}
    </div>
  )
}
