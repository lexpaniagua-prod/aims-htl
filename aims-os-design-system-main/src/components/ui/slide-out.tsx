/**
 * Slide Out — AIMS OS DS · node 5066:9783
 * Frosted-glass overlay panel from the right.
 * type="with-variants" | "full-slot"  ×  size="m" (635px) | "s" (420px)
 *
 * Panel surface : Surface/Floating/Default — rgba(255,255,255,0.92) light | rgba(16,22,40,0.92) dark
 * Backdrop-blur : 30px
 * Shadow        : -24px -24px 60px 0px rgba(0,0,0,0.08)
 * Radius        : Radius-XL 24px (M) | Radius-L 16px (S) — top-left + bottom-left only
 *
 * Resize handle : hover left edge → blue 2px line + grip dots → drag to snap to window.innerWidth/2
 */
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Pencil, Search, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, type TabItem } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip } from "@/components/ui/tooltip"
import { Chip } from "@/components/ui/chip"

// ── Types ─────────────────────────────────────────────────────────────────────

export type SlideOutType = "with-variants" | "full-slot"
export type SlideOutSize = "m" | "s"

export interface SlideOutProps {
  open: boolean
  onClose: () => void
  /** Panel type. Default: "with-variants" */
  type?: SlideOutType
  /** Width + radius variant. Default: "m" */
  size?: SlideOutSize
  /** Close panel when backdrop is clicked. Default: true */
  closeOnBackdrop?: boolean
  /**
   * When true, renders the panel inline without portal or backdrop.
   * Used for playground previews. Default: false
   */
  previewMode?: boolean
  /**
   * Whether the left edge drag-to-resize handle is shown.
   * Only applies in portal mode. Default: true
   */
  resizable?: boolean

  // ── Header (with-variants only) ──────────────────────────────────────────
  title?: string
  /** DS prop: description. Optional subtitle below title. */
  subtitle?: string
  /** DS prop: icon. Show purple highlight icon in header. Default: true */
  showIcon?: boolean
  /** Custom content for the header icon container. Default: <Sparkles/> */
  iconContent?: React.ReactNode
  /** DS prop: status. Show green status tag. Default: true */
  showStatus?: boolean
  statusLabel?: string
  /** DS prop: topButton. Show edit/action button in header. Default: true */
  showTopButton?: boolean
  /**
   * Custom icon for the top button — swap per context.
   * Examples: <MoreHorizontal/> for a menu, <ExternalLink/> for a page redirect.
   * Default: <Pencil size={14}/>
   */
  topButtonIcon?: React.ReactNode
  onTopButtonClick?: () => void
  /** DS prop: close. Show X close button. Default: true */
  showClose?: boolean

  // ── Tabs (with-variants only) ─────────────────────────────────────────────
  /** DS prop: tabs. Default: true */
  showTabs?: boolean
  /** DS prop: tab3. Show third tab. Default: true */
  showTab3?: boolean
  tabLabels?: [string, string, string]
  activeTab?: number
  onTabChange?: (i: number) => void

  // ── Search (with-variants only) ───────────────────────────────────────────
  /** DS prop: searchBar. Default: true */
  showSearchBar?: boolean

  // ── Chips (with-variants only) ────────────────────────────────────────────
  /** DS prop: chips. Default: true */
  showChips?: boolean
  chipLabels?: string[]
  activeChip?: number
  onChipChange?: (i: number) => void

  // ── Slot ──────────────────────────────────────────────────────────────────
  /** Replaces the "Replace content here" placeholder when provided */
  children?: React.ReactNode

  // ── CTA footer (with-variants only) ──────────────────────────────────────
  /** DS prop: cta. Show bottom action buttons. Default: true */
  showCta?: boolean
  ctaPrimaryLabel?: string
  ctaSecondaryLabel?: string
  onCtaPrimary?: () => void
  onCtaSecondary?: () => void

  /** DS prop: scrollbar. Show scrollbar in the panel. Default: false */
  showScrollbar?: boolean
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SlideOut({
  open,
  onClose,
  type = "with-variants",
  size = "m",
  closeOnBackdrop = true,
  previewMode = false,
  resizable = true,
  title = "Title of section",
  subtitle = "Subtitle with a short description of what the user can do here",
  showIcon = true,
  iconContent,
  showStatus = true,
  statusLabel = "Status",
  showTopButton = true,
  topButtonIcon,
  onTopButtonClick,
  showClose = true,
  showTabs = true,
  showTab3 = true,
  tabLabels = ["Tab 1", "Tab 2", "Tab 3"],
  activeTab = 0,
  onTabChange,
  showSearchBar = true,
  showChips = true,
  chipLabels = ["All", "Category 1", "Category 2", "Category 3", "Category 4"],
  activeChip = 0,
  onChipChange,
  children,
  showCta = true,
  ctaPrimaryLabel = "Button",
  ctaSecondaryLabel = "Button",
  onCtaPrimary,
  onCtaSecondary,
  showScrollbar = false,
  className,
}: SlideOutProps) {
  const isM = size === "m"
  const isWithVariants = type === "with-variants"

  // ── Drag-to-resize state ────────────────────────────────────────────────
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const [isActiveDrag, setIsActiveDrag] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number; active: boolean }>({
    startX: 0, startWidth: 0, active: false,
  })

  const defaultWidth = isWithVariants && isM ? 635 : isM ? 600 : 420
  const panelWidth = dragWidth ?? defaultWidth

  // ── Chips scroll ref ────────────────────────────────────────────────────
  const chipsContainerRef = useRef<HTMLDivElement>(null)
  const scrollChips = () => {
    chipsContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" })
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (previewMode) return
    e.preventDefault()
    e.stopPropagation()
    const snapDefault = defaultWidth
    const snapHalf = window.innerWidth / 2
    const startWidth = dragWidth ?? defaultWidth
    dragRef.current = { startX: e.clientX, startWidth, active: true }
    setIsActiveDrag(true)

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      const delta = dragRef.current.startX - ev.clientX
      const newW = Math.max(snapDefault, Math.min(snapHalf, dragRef.current.startWidth + delta))
      setDragWidth(newW)
    }

    const onMouseUp = (ev: MouseEvent) => {
      dragRef.current.active = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      setIsActiveDrag(false)
      const delta = dragRef.current.startX - ev.clientX
      const finalW = Math.max(snapDefault, Math.min(snapHalf, dragRef.current.startWidth + delta))
      const threshold = (snapHalf - snapDefault) * 0.4
      setDragWidth(finalW > snapDefault + threshold ? snapHalf : null)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  // ── Escape key ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (previewMode || !open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose, previewMode])

  // ── Body scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    if (previewMode) return
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open, previewMode])

  const headerIcon = iconContent ?? <Sparkles size={isM ? 24 : 18} style={{ color: "var(--primary)" }} />

  const visibleTabItems: TabItem[] = (showTab3 ? tabLabels : [tabLabels[0], tabLabels[1]]).map(
    (label, i) => ({ id: String(i), label }),
  )

  // ── Icon buttons (topButton + close) ──────────────────────────────────
  const TopBtn = showTopButton ? (
    <Button
      variant="tertiary"
      size="sm"
      iconPosition="alone"
      icon={topButtonIcon ?? <Pencil size={14} />}
      onClick={onTopButtonClick}
      aria-label="Top action"
    />
  ) : null

  const CloseBtn = showClose ? (
    <Button
      variant="tertiary"
      size="sm"
      iconPosition="alone"
      icon={<X size={14} />}
      onClick={onClose}
      aria-label="Close panel"
    />
  ) : null

  // ── Panel aside ────────────────────────────────────────────────────────
  const aside = (
    <aside
      className={cn(
        "relative flex flex-col shrink-0 h-full backdrop-blur-[30px]",
        !previewMode && !isActiveDrag && "transition-transform duration-300 ease-out",
        !previewMode && (open ? "translate-x-0" : "translate-x-full"),
        showScrollbar ? "overflow-y-auto" : "overflow-hidden",
        className,
      )}
      style={{
        width: panelWidth,
        padding: "32px 24px",
        gap: isWithVariants && isM ? 24 : !isWithVariants && isM ? 32 : isWithVariants ? 16 : 24,
        background: "var(--slide-out-bg)",
        boxShadow: "var(--slide-out-shadow)",
        borderRadius: isM ? "24px 0 0 24px" : "16px 0 0 16px",
        display: "flex",
        flexDirection: "column",
        transition: !previewMode && !isActiveDrag
          ? "width 220ms ease, transform 300ms ease-out"
          : undefined,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "slide-out-title" : undefined}
    >
      {/* ── Drag-to-resize handle (portal mode only) ────────────────────── */}
      {!previewMode && resizable && (
        <div
          className="absolute left-0 top-0 bottom-0 z-10 group/rz flex items-center"
          style={{ width: 12, cursor: "col-resize" }}
          onMouseDown={handleResizeMouseDown}
        >
          {/* Blue edge line — 1px per spec */}
          <div
            className="absolute inset-y-0 left-0 opacity-0 group-hover/rz:opacity-100 transition-opacity duration-150"
            style={{ width: 1, background: "var(--primary)" }}
          />
          {/* Grip dots */}
          <div
            className="absolute left-[5px] flex flex-col gap-[3px] opacity-0 group-hover/rz:opacity-100 transition-opacity duration-150"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-full" style={{ width: 3, height: 3, background: "var(--primary)" }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Header group (with-variants only) ─────────────────────────────── */}
      {isWithVariants && (
        <div
          className="flex flex-col items-start shrink-0 w-full"
          style={{ gap: isM ? 16 : 12 }}
        >
          {/* Size M header row */}
          {isM && (
            <div className="flex items-start gap-[4px] w-full">
              <div className="flex gap-[8px] items-start flex-1 min-w-0">
                {showIcon && (
                  <div
                    className="flex items-center justify-center shrink-0 rounded-[8px]"
                    style={{ width: 40, height: 40, padding: 8, background: "var(--color-surface-purple-more-subtle)" }}
                  >
                    {headerIcon}
                  </div>
                )}
                <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                  <div className="flex gap-[8px] items-center min-w-0">
                    <Tooltip content={title} side="cursor" triggerClassName="block min-w-0 flex-1">
                      <p
                        id="slide-out-title"
                        className="font-semibold truncate block"
                        style={{ fontSize: 24, letterSpacing: "0.25px", lineHeight: 1, color: "var(--color-text-title)" }}
                      >
                        {title}
                      </p>
                    </Tooltip>
                    {showStatus && (
                      <div
                        className="flex gap-[4px] items-center px-[8px] py-[4px] rounded-[8px] shrink-0"
                        style={{ height: 24, background: "var(--color-surface-success-more-subtle)", border: "1px solid var(--color-border-success-lighter)" }}
                      >
                        <span className="font-medium whitespace-nowrap leading-[20px]" style={{ fontSize: 14, color: "var(--color-text-success)" }}>
                          {statusLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  {subtitle && (
                    <Tooltip content={subtitle} side="cursor" triggerClassName="block min-w-0">
                      <p
                        className="font-medium"
                        style={{
                          fontSize: 14,
                          color: "var(--slide-out-body)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        } as React.CSSProperties}
                      >
                        {subtitle}
                      </p>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="flex gap-[4px] items-center shrink-0">
                {TopBtn}
                {CloseBtn}
              </div>
            </div>
          )}

          {/* Size S header row */}
          {!isM && (
            <div className="flex items-start gap-[4px] w-full">
              <div className="flex gap-[8px] items-start flex-1 min-w-0">
                {showIcon && (
                  <div
                    className="flex items-center justify-center shrink-0 rounded-[8px]"
                    style={{ width: 32, height: 32, padding: 8, background: "var(--color-surface-purple-more-subtle)" }}
                  >
                    {headerIcon}
                  </div>
                )}
                <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                  <div className="flex gap-[4px] items-center min-w-0">
                    <Tooltip content={title} side="cursor" triggerClassName="block min-w-0 flex-1">
                      <p
                        id="slide-out-title"
                        className="font-semibold truncate block"
                        style={{ fontSize: 18, letterSpacing: "0.25px", lineHeight: 1, color: "var(--color-text-title)" }}
                      >
                        {title}
                      </p>
                    </Tooltip>
                    {showStatus && (
                      <div
                        className="flex gap-[4px] items-center px-[8px] py-[4px] rounded-[8px] shrink-0"
                        style={{ height: 20, background: "var(--color-surface-success-more-subtle)", border: "1px solid var(--color-border-success-lighter)" }}
                      >
                        <span className="font-medium whitespace-nowrap leading-[20px]" style={{ fontSize: 12, color: "var(--color-text-success)" }}>
                          {statusLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  {subtitle && (
                    <Tooltip content={subtitle} side="cursor" triggerClassName="block min-w-0">
                      <p
                        className="font-medium"
                        style={{
                          fontSize: 12,
                          color: "var(--slide-out-body)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        } as React.CSSProperties}
                      >
                        {subtitle}
                      </p>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="flex gap-[4px] items-start shrink-0">
                {TopBtn}
                {CloseBtn}
              </div>
            </div>
          )}

          {/* DS Tabs — no border-bottom wrapper so inactive tabs have no underline */}
          {showTabs && (
            <Tabs
              items={visibleTabItems}
              activeId={String(activeTab)}
              onChange={(id) => onTabChange?.(Number(id))}
              size="s"
              className="w-full pb-[2px]"
            />
          )}

          {/* DS Input — search bar */}
          {showSearchBar && (
            <Input
              size="sm"
              leftIcon={<Search size={14} />}
              placeholder="Search"
            />
          )}
        </div>
      )}

      {/* ── Category chips (with-variants only) ───────────────────────────── */}
      {isWithVariants && showChips && (
        <div className="flex items-center gap-[6px] shrink-0 w-full">
          {/* Chip list — horizontal scroll, scrollbar hidden until hover (aims-scroll) */}
          <div
            ref={chipsContainerRef}
            className="aims-scroll flex gap-[8px] items-center flex-1 min-w-0"
            style={{ overflowX: "auto", paddingBottom: 2 }}
          >
            {chipLabels.map((label, i) => (
              <Chip
                key={i}
                variant={i === activeChip ? "primary" : "secondary"}
                size={isM ? "m" : "s"}
                className="shrink-0"
                onClick={() => onChipChange?.(i)}
              >
                {label}
              </Chip>
            ))}
          </div>
          {/* DS Button tertiary — scrolls chips right, has DS hover bg */}
          <Button
            variant="tertiary"
            size="sm"
            iconPosition="alone"
            icon={<ChevronRight size={14} />}
            onClick={scrollChips}
            aria-label="Scroll chips"
          />
        </div>
      )}

      {/* ── Content slot ─────────────────────────────────────────────────── */}
      {children ? (
        <ScrollArea axis="y" className="flex-1 min-h-0 w-full rounded-[8px]">
          {children}
        </ScrollArea>
      ) : (
        <div
          className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-[8px] w-full"
          style={{ border: "1px dashed var(--color-border-primary-lighter)" }}
        >
          <span
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: 18, lineHeight: 1, color: "var(--primary)" }}
          >
            Replace content here
          </span>
        </div>
      )}

      {/* ── CTA footer — DS Button component for correct hover states ─────── */}
      {isWithVariants && showCta && (
        <div className="flex gap-[8px] items-center justify-end shrink-0 w-full">
          <Button
            variant="secondary"
            size={isM ? "default" : "sm"}
            onClick={onCtaSecondary}
          >
            {ctaSecondaryLabel}
          </Button>
          <Button
            variant="primary"
            size={isM ? "default" : "sm"}
            onClick={onCtaPrimary}
          >
            {ctaPrimaryLabel}
          </Button>
        </div>
      )}
    </aside>
  )

  // ── Inline (playground preview) ───────────────────────────────────────────
  if (previewMode) return aside

  // ── Portal (normal use) ───────────────────────────────────────────────────
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end pointer-events-none",
        open && "pointer-events-auto",
      )}
      aria-hidden={!open}
    >
      {/* Scrim — semi-transparent overlay + backdrop blur for visual emphasis */}
      <div
        className={cn("absolute inset-0", open ? "opacity-100" : "opacity-0")}
        style={{
          background: "var(--slide-out-overlay)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          transition: "opacity 300ms ease",
        }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      {aside}
    </div>,
    document.body,
  )
}
