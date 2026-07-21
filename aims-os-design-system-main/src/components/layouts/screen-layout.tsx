import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Sparkles, Bell, Settings } from "lucide-react"
import { Topbar } from "@/components/ui/topbar"
import type { TopbarAction } from "@/components/ui/topbar"
import { Sidebar } from "@/components/ui/sidebar"
import type { SidebarItem } from "@/components/ui/sidebar"
import { AppBackground } from "@/components/ui/app-background"
import type { AppBgVariant } from "@/components/ui/app-background"

const DEFAULT_TOPBAR_ACTIONS: TopbarAction[] = [
  { icon: <Sparkles size={16} />, label: "AI",            variant: "primary" },
  { icon: <Bell     size={16} />, label: "Notifications" },
  { icon: <Settings size={16} />, label: "Settings"      },
]

// ── ScreenLayout ──────────────────────────────────────────────────────────────
//
// Canonical full-screen shell for PM prototypes.
//
// DS breakpoint values baked in — prototypes can't drift:
//   Horizontal margin: 32px (L Desktop 1440px — DS standard baseline)
//   Sidebar:           collapsed by default (56px)
//   Header zone:       outside scrollable area — stays visible on scroll
//   Scroll trigger:    isScrolled = scrollTop > 16px (matches Header compress threshold)
//   Pagination:        position: absolute; bottom: 0 — floats over the list
//                      Source: PatternListViewPage full-preview (App.tsx line ~9570)
//
// Usage:
//   <ScreenLayout
//     workspaceName="Acme Corp" userName="Juan" userEmail="juan@acme.com"
//     sidebarItems={MY_ITEMS} activeSidebarId="ai-workers"
//     header={(isScrolled) => (
//       <Header size={isScrolled ? "compress" : "size-l"} title="AI Workers" ... />
//     )}
//     pagination={
//       filtered.length > pageSize
//         ? <Pagination currentPage={page} totalItems={filtered.length} ... />
//         : undefined
//     }
//   >
//     <ListViewSection items={...} filterSlots={...} ... />
//   </ScreenLayout>

export interface ScreenLayoutProps {
  /** Topbar workspace label */
  workspaceName?: string
  /** Topbar user display name */
  userName?: string
  /** Topbar user email */
  userEmail?: string
  /** Topbar company name (right side) */
  companyName?: string
  /** Topbar action buttons — defaults to AI + Notifications + Settings */
  topbarActions?: TopbarAction[]
  /** AppBackground color variant — defaults to "default" */
  bgVariant?: AppBgVariant
  /** Left sidebar navigation items */
  sidebarItems: SidebarItem[]
  /** ID of the active sidebar item */
  activeSidebarId?: string
  /**
   * Header render prop — receives isScrolled (true when content scrollTop > 16px).
   * Use it to switch between Header size="size-l" (default) and size="compress".
   *
   * The Header lives outside the scrollable area so it stays visible when the
   * list scrolls. This matches the canonical AIMS OS List View pattern.
   */
  header: (isScrolled: boolean) => ReactNode
  /**
   * Scrollable content: Filters + entity cards. No Pagination here.
   * Rendered with DS-spec L-desktop padding: 8px top · 32px sides · 64px bottom.
   * The 64px bottom leaves space for the floating Pagination bar.
   * Do NOT add extra horizontal padding to children — it is already applied here.
   */
  children: ReactNode
  /**
   * Optional Pagination — rendered with position: absolute; bottom: 0 so it
   * floats over the list (content scrolls behind the glass bar).
   * Pass <Pagination ... /> directly; ScreenLayout handles the positioning.
   * Omit when there is only one page of results.
   *
   * @example
   * pagination={
   *   filtered.length > pageSize
   *     ? <Pagination currentPage={page} totalItems={filtered.length} itemsPerPage={pageSize} onPageChange={setPage} />
   *     : undefined
   * }
   */
  pagination?: ReactNode
}

export function ScreenLayout({
  workspaceName,
  userName,
  userEmail,
  companyName = "AIMS OS",
  topbarActions = DEFAULT_TOPBAR_ACTIONS,
  bgVariant = "default",
  sidebarItems,
  activeSidebarId,
  header,
  children,
  pagination,
}: ScreenLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => setIsScrolled(el.scrollTop > 16)
    el.addEventListener("scroll", handler)
    return () => el.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      <AppBackground variant={bgVariant} />
      <Topbar
        workspaceName={workspaceName}
        userName={userName}
        userEmail={userEmail}
        companyName={companyName}
        actions={topbarActions}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — collapsed by default to maximise content area */}
        <Sidebar
          items={sidebarItems}
          activeId={activeSidebarId}
          defaultCollapsed={true}
        />

        {/* Main column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header zone — outside the scroll container, stays visible on scroll */}
          <div className="shrink-0 relative">
            {header(isScrolled)}
            {/* Gradient fade below compressed header — appears on scroll to signal content scrolling behind */}
            {isScrolled && (
              <div
                style={{
                  position: "absolute",
                  bottom: -20,
                  left: 0,
                  right: 0,
                  height: 20,
                  background: "linear-gradient(to bottom, var(--canvas), transparent)",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
            )}
          </div>

          {/* Content area — relative so Pagination can float at the bottom */}
          <div className="flex-1 relative overflow-hidden">

            {/* Scrollable list — 64px bottom padding leaves room for floating Pagination */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto"
              style={{ padding: "8px 32px 64px" }}
            >
              {children}
            </div>

            {/* Pagination floats over the list — content scrolls behind it */}
            {pagination && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
                {pagination}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
