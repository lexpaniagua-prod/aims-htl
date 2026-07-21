import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (items: number) => void
  rowsPerPageOptions?: number[]
  className?: string
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  rowsPerPageOptions = [5, 25, 50, 100, 200],
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const [dropOpen, setDropOpen]   = useState(false)
  const [dropPos,  setDropPos]    = useState<{ left: number; bottom: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectorRef  = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropOpen])

  if (totalPages <= 1) return null

  const start   = (currentPage - 1) * itemsPerPage + 1
  const end     = Math.min(currentPage * itemsPerPage, totalItems)
  const isFirst = currentPage === 1
  const isLast  = currentPage === totalPages

  function openDrop() {
    if (!onItemsPerPageChange) return
    if (dropOpen) { setDropOpen(false); return }
    if (!selectorRef.current || !containerRef.current) return
    const sel  = selectorRef.current.getBoundingClientRect()
    const cont = containerRef.current.getBoundingClientRect()
    setDropPos({
      left:   sel.left,
      bottom: window.innerHeight - cont.top + 4, // 4px gap above container
    })
    setDropOpen(true)
  }

  function selectOption(val: number) {
    setDropOpen(false)
    onItemsPerPageChange?.(val)
  }

  const navBtn = (disabled: boolean, onClick: () => void, label: string, Icon: React.FC<{ size?: number; strokeWidth?: number }>) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center rounded-[4px] transition-colors"
      style={{
        width: 24, height: 24,
        border: "none", background: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "var(--color-icon-neutral-dark)",
        opacity: disabled ? 0.35 : 1,
        padding: 0,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-neutral-default)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  )

  return (
    <div ref={containerRef} className={cn("flex items-center w-full", className)} style={{ padding: "8px 12px" }}>
      {/* Inner container — floating surface */}
      <div
        className="flex items-center justify-between w-full"
        style={{
          padding: "4px 8px",
          gap: 40,
          background: "var(--surface-floating-default)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--color-border-neutral-default)",
          borderRadius: 6,
          height: 32,
        }}
      >
        {/* Left zone: Rows per page */}
        <div className="flex items-center shrink-0" style={{ gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-subtitle)", whiteSpace: "nowrap" }}>
            Rows per page:
          </span>

          {/* Custom selector button */}
          <button
            ref={selectorRef}
            type="button"
            onClick={openDrop}
            disabled={!onItemsPerPageChange}
            aria-haspopup="listbox"
            aria-expanded={dropOpen}
            className="flex items-center gap-[4px] transition-colors"
            style={{
              background: "none",
              border: "none",
              cursor: onItemsPerPageChange ? "pointer" : "default",
              padding: 0,
              outline: "none",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-label)" }}>
              {itemsPerPage}
            </span>
            <ChevronUp
              size={10}
              strokeWidth={2.5}
              style={{
                color: "var(--color-icon-neutral-dark)",
                transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms",
              }}
            />
          </button>
        </div>

        {/* Right zone: range text + nav */}
        <div className="flex items-center shrink-0" style={{ gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-label)", whiteSpace: "nowrap" }}>
            {start}–{end} of {totalItems} items
          </span>
          <div className="flex items-center" style={{ gap: 12 }}>
            {navBtn(isFirst, () => onPageChange(currentPage - 1), "Previous page", ChevronLeft)}
            {navBtn(isLast,  () => onPageChange(currentPage + 1), "Next page",     ChevronRight)}
          </div>
        </div>
      </div>

      {/* Floating dropdown — fixed, above container, left-aligned to selector */}
      {dropOpen && dropPos && (
        <div
          role="listbox"
          aria-label="Rows per page"
          style={{
            position: "fixed",
            left: dropPos.left,
            bottom: dropPos.bottom,
            zIndex: 10002,
            background: "var(--surface-floating-default)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--color-border-neutral-default)",
            borderRadius: 6,
            overflow: "hidden",
            minWidth: 64,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {rowsPerPageOptions.map(opt => (
            <button
              key={opt}
              role="option"
              aria-selected={opt === itemsPerPage}
              type="button"
              onClick={() => selectOption(opt)}
              className="w-full flex items-center px-[12px] transition-colors"
              style={{
                height: 32,
                fontSize: 12,
                fontWeight: opt === itemsPerPage ? 600 : 400,
                color: opt === itemsPerPage ? "var(--primary)" : "var(--color-text-label)",
                background: opt === itemsPerPage ? "var(--color-surface-neutral-default)" : "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={e => { if (opt !== itemsPerPage) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-neutral-default)" }}
              onMouseLeave={e => { if (opt !== itemsPerPage) (e.currentTarget as HTMLElement).style.background = "none" }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
