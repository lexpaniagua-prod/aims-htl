import { useState, useRef, useEffect, useCallback, type ReactNode } from "react"
import { ChevronDown, Search, SearchX, Menu, LogOut, HelpCircle, X, SlidersHorizontal, LayoutGrid, Sparkle, Radio, MessageSquare, Users, Shield, Bookmark, Briefcase, Plus, UserPlus, Zap, Globe, Clock, Bell, User, Moon, Sun } from "lucide-react"
import { HighlightIcon, type HighlightIconVariant } from "@/components/ui/highlight-icon"
import { Tag, type TagVariant } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

/**
 * Topbar — AIMS OS Design System
 * Source: Figma v6rmYKA2zmyXWOahlxLOeI · COMPONENT_SET 8603:52598 (2 variants)
 * Developer Reference: node 12706:849
 *
 * DS Structure:
 *   Default  1440×36px — VERTICAL outer; inner row HORIZONTAL SPACE_BETWEEN (1424×28px at y=4)
 *   Tablet   1440×34px — same zones, left zone 172px (adds hamburger button)
 *
 * Three horizontal zones:
 *   LEFT  (140×28px)  — workspace avatar (16px) + name (10px Semi Bold) + chevron
 *                        Border/Primary/Subtle · opens workspace switcher dropdown
 *   CENTER (250×24px) — search trigger (opens Global Search overlay on click)
 *   RIGHT (232×28px)  — Sub-A (80×24): isotipo 24×19 + 3×TopbarButton
 *                        Vertical divider (1px, Border/Neutral/Subtle)
 *                        Sub-B (136×28): company selector + profile avatar
 *                        Sub-B frame: same Border/Primary/Subtle border as LEFT
 *
 * Action buttons (Sub-A, left to right — DS COMPONENT_SET 8603:52851):
 *   1. IA-icon     → Sparkles  · Type=Main Action · radial gradient bg (rgba(33,115,255) → rgba(9,226,171))
 *   2. Notifications-icon → Bell    · Type=Tertiary · transparent bg
 *   3. Settings-icon      → Settings · Type=Tertiary · transparent bg
 *
 * All colors via CSS custom properties — see index.css --topbar-* vars.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type WorkspaceItem = {
  id:          string
  name:        string
  description?: string
  avatarSrc?:  string
  tag?:        "Active" | "Member" | string
}

export type TopbarAction = {
  icon:      ReactNode
  label:     string
  badge?:    boolean
  variant?:  "default" | "primary"
  onClick?:  () => void
}

export type TopbarVariant = "default" | "tablet"

export type TopbarProps = {
  workspaceName?:       string
  workspaceAvatarSrc?:  string
  workspaces?:          WorkspaceItem[]
  selectedWorkspaceId?: string
  onWorkspaceSelect?:   (id: string) => void
  onWorkspaceClick?:    () => void
  searchPlaceholder?:   string
  onSearchFocus?:       () => void
  actions?:             TopbarAction[]
  companyName?:         string
  companyAvatarSrc?:    string
  onCompanyClick?:      () => void
  userName?:            string
  userEmail?:           string
  userAvatarSrc?:       string
  onProfileClick?:      () => void
  tenants?:             WorkspaceItem[]
  selectedTenantId?:    string
  onTenantSelect?:      (id: string) => void
  themeMode?:           ThemeMode
  onThemeChange?:       (mode: ThemeMode) => void
  isDark?:              boolean
  onThemeToggle?:       () => void
  variant?:             TopbarVariant
  onMenuClick?:         () => void
  className?:           string
}

// ── Hook: close on outside click ───────────────────────────────────────────

function useClickOutside(
  ref: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [ref, onClose])
}

// ── Internal: avatar circle ────────────────────────────────────────────────

function TopbarAvatar({
  name = "",
  src,
  size = 16,
}: {
  name?: string
  src?:  string
  size?: number
}) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?"
  return (
    <div
      className="flex items-center justify-center shrink-0 rounded-full overflow-hidden"
      style={{
        width: size, height: size,
        background:  src ? undefined : "var(--primary)",
        color:       "var(--color-button-primary-text-default)",
        fontSize:    size * 0.44, fontWeight: 700, lineHeight: 1,
        boxShadow:   "0 0 0 1px var(--topbar-avatar-ring)",
      }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials
      }
    </div>
  )
}

// ── Internal: Left Menu — workspace switcher dropdown ─────────────────────
// DS: Left Menu - Topbar 15251:5395 · 320×332px · VERTICAL gap:0
// Row structure: Avatar 24px + text stack (name 14px w:500 + desc 12px w:500) + Tag (neutral)
// Selected row bg: --topbar-menu-item-sel · Default: transparent

export function TopbarLeftMenu({
  workspaces,
  selectedId,
  onSelect,
  pos,
  isStatic = false,
}: {
  workspaces:  WorkspaceItem[]
  selectedId?: string
  onSelect?:   (id: string) => void
  pos?:        { top: number; left: number }
  isStatic?:   boolean
}) {
  return (
    <div
      style={{
        position:     isStatic ? "relative" : (pos ? "fixed" : "absolute"),
        top:          isStatic ? undefined   : (pos ? pos.top : "calc(100% + 4px)"),
        left:         isStatic ? undefined   : (pos ? pos.left : 0),
        zIndex:       isStatic ? undefined   : 9999,
        width:              320,
        background:         "var(--menu-bg)",
        backdropFilter:     "saturate(180%) blur(16px)",
        WebkitBackdropFilter: "saturate(180%) blur(16px)",
        border:             "1px solid var(--menu-divider)",
        borderRadius:       8,
        boxShadow:          "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)",
        overflow:           "hidden",
      }}
    >
      {/* ── Section header row — 28px ─────────────────── */}
      <div
        className="flex items-center px-[16px]"
        style={{ height: 28 }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.07em]"
          style={{ color: "var(--topbar-menu-text-dim)" }}
        >
          Workspaces
        </span>
      </div>

      {/* ── Workspace rows — 56px each ────────────────── */}
      {workspaces.map(ws => {
        const isSelected = ws.id === selectedId
        return (
          <button
            key={ws.id}
            onClick={() => onSelect?.(ws.id)}
            className="w-full flex items-center text-left transition-colors cursor-pointer"
            style={{
              height:     56,
              gap:        16,
              padding:    "8px 16px",
              background: isSelected ? "var(--topbar-menu-item-sel)" : "transparent",
            }}
            onMouseEnter={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--menu-item-hover)"
            }}
            onMouseLeave={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"
            }}
          >
            {/* Avatar 24×24 */}
            <TopbarAvatar name={ws.name} src={ws.avatarSrc} size={24} />

            {/* Text stack: name 14px w:500 + description 12px w:500 */}
            <div className="flex-1 flex flex-col gap-[2px] min-w-0">
              <span
                className="text-[14px] font-medium leading-[1.3] truncate"
                style={{ color: isSelected ? "var(--topbar-menu-text)" : "var(--topbar-menu-text)" }}
              >
                {ws.name}
              </span>
              {ws.description && (
                <span
                  className="text-[12px] font-medium leading-[1.3] truncate"
                  style={{ color: "var(--topbar-menu-text-dim)" }}
                >
                  {ws.description}
                </span>
              )}
            </div>

            {/* Tag — neutral for all, matching DS "Tag" neutral chips */}
            {ws.tag && (
              <Tag variant="neutral" size="sm" className="shrink-0">
                {ws.tag}
              </Tag>
            )}
          </button>
        )
      })}

      {/* ── Footer: new workspace ─────────────────────── */}
      <div
        className="flex items-center px-[16px]"
        style={{ height: 40, borderTop: "1px solid var(--menu-divider)" }}
      >
        <button
          className="flex items-center gap-[6px] text-[12px] font-medium transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: "var(--primary)" }}
        >
          <Plus size={12} strokeWidth={2.5} />
          New workspace
        </button>
      </div>
    </div>
  )
}

// ── Internal: Right Menu — profile + tenant dropdown ──────────────────────
// DS: Right menu - Topbar 15349:23474 · 320×332px · VERTICAL gap:0
// Theme row: Theme-icon + "Theme" label + [Auto 52×28] [Sun 24×24] [Moon 24×24]
// Tenant row: current tenant + Chevron-down (28×28) → expands tenant list

export type ThemeMode = "auto" | "light" | "dark"

export function TopbarRightMenu({
  userName,
  userEmail,
  userAvatarSrc,
  companyName,
  companyAvatarSrc,
  tenants        = [],
  selectedTenantId,
  onTenantSelect,
  themeMode,
  onThemeChange,
  isDark,
  onThemeToggle,
  pos,
  isStatic = false,
}: {
  userName?:         string
  userEmail?:        string
  userAvatarSrc?:    string
  companyName?:      string
  companyAvatarSrc?: string
  tenants?:          WorkspaceItem[]
  selectedTenantId?: string
  onTenantSelect?:   (id: string) => void
  themeMode?:        ThemeMode
  onThemeChange?:    (mode: ThemeMode) => void
  isDark?:           boolean
  onThemeToggle?:    () => void
  pos?:              { top: number; right: number }
  isStatic?:         boolean
}) {
  const [tenantExpanded, setTenantExpanded] = useState(false)
  const [tenantSearch, setTenantSearch] = useState("")
  const [themeHover, setThemeHover] = useState<"auto" | "light" | "dark" | null>(null)
  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase())
  )
  // Derive active theme: prefer explicit themeMode, fallback to isDark boolean
  const activeTheme: ThemeMode = themeMode ?? (isDark ? "dark" : "light")
  // DS row: HORIZONTAL gap:16 pad:T8R16B8L16
  const MenuRow = ({
    icon,
    label,
    height = 40,
    right,
  }: {
    icon:    React.ReactNode
    label:   string
    height?: number
    right?:  React.ReactNode
  }) => (
    <button
      className="w-full flex items-center text-left transition-colors cursor-pointer"
      style={{ height, gap: 16, padding: "8px 16px" }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--menu-item-hover)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span className="shrink-0" style={{ color: "var(--topbar-menu-text-dim)", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--topbar-menu-text)" }}>
        {label}
      </span>
      {right}
    </button>
  )

  const Divider = () => (
    <div style={{ height: 1, background: "var(--menu-divider)" }} />
  )

  return (
    <div
      style={{
        position:             isStatic ? "relative" : (pos ? "fixed" : "absolute"),
        top:                  isStatic ? undefined   : (pos ? pos.top : "calc(100% + 4px)"),
        right:                isStatic ? undefined   : (pos ? pos.right : 0),
        zIndex:               isStatic ? undefined   : 9999,
        width:                320,
        background:           "var(--menu-bg)",
        backdropFilter:       "saturate(180%) blur(16px)",
        WebkitBackdropFilter: "saturate(180%) blur(16px)",
        border:               "1px solid var(--menu-divider)",
        borderRadius:         8,
        boxShadow:            "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)",
        overflow:             "hidden",
      }}
    >
      {/* ── 1. Account info (50px) ──────────────────── */}
      <div
        className="flex items-center"
        style={{ height: 50, gap: 16, padding: "8px 16px" }}
      >
        <TopbarAvatar name={userName || ""} src={userAvatarSrc} size={24} />
        <div className="flex-1 flex flex-col min-w-0">
          <span
            className="text-[14px] font-medium leading-[1.3] truncate"
            style={{ color: "var(--topbar-menu-text)" }}
          >
            {userName || "User"}
          </span>
          {userEmail && (
            <span
              className="text-[10px] font-medium leading-[1.3] truncate mt-[1px]"
              style={{ color: "var(--topbar-menu-text-dim)" }}
            >
              {userEmail}
            </span>
          )}
        </div>
      </div>

      <Divider />

      {/* ── 2. Workspace section ─────────────────────── */}
      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          gap:           tenantExpanded && tenants.length > 0 ? 4 : 0,
        }}
      >
        {/* Label + current tenant */}
        <div>
          {/* Section label 28px — shows count when expanded */}
          <div className="flex items-center px-[16px]" style={{ height: 28 }}>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.07em]"
              style={{ color: "var(--topbar-menu-text-dim)" }}
            >
              {tenantExpanded && tenants.length > 0
                ? `Workspace (${tenants.length})`
                : "Workspace"}
            </span>
          </div>

          {/* Current tenant row 50px */}
          <div
            className="flex items-center"
            style={{ height: 50, gap: 16, padding: "8px 16px" }}
          >
            <TopbarAvatar name={companyName || ""} src={companyAvatarSrc} size={24} />
            <div className="flex-1 flex flex-col min-w-0">
              <span
                className="text-[14px] font-medium leading-[1.3] truncate"
                style={{ color: "var(--topbar-menu-text)" }}
              >
                {companyName || "Company"}
              </span>
              <span
                className="text-[10px] font-medium leading-[1.3] mt-[1px]"
                style={{ color: "var(--topbar-menu-text-dim)" }}
              >
                Owner
              </span>
            </div>
            {tenants.length > 0 && (
              <button
                onClick={() => {
                  const next = !tenantExpanded
                  setTenantExpanded(next)
                  if (!next) setTenantSearch("")
                }}
                className="shrink-0 flex items-center justify-center rounded-[6px] transition-all cursor-pointer"
                style={{
                  width:      28, height: 28,
                  background: tenantExpanded ? "var(--menu-item-hover)" : "transparent",
                  color:      "var(--topbar-menu-text-dim)",
                }}
                aria-label={tenantExpanded ? "Collapse tenants" : "Expand tenants"}
              >
                <ChevronDown
                  size={14} strokeWidth={1.75}
                  className={cn("transition-transform duration-150", tenantExpanded && "rotate-180")}
                />
              </button>
            )}
          </div>
        </div>

        {/* Expanded sub-card: search + filtered tenant list */}
        {tenantExpanded && tenants.length > 0 && (
          <div
            style={{
              margin:       "0 8px",
              borderRadius: 8,
              overflow:     "hidden",
              boxShadow:    "8px 8px 8px rgba(0,0,0,0.08)",
              border:       "1px solid var(--menu-divider)",
            }}
          >
            {/* Search input */}
            <div
              style={{
                background: "var(--menu-bg)",
                padding:    "4px 16px",
              }}
            >
              <div
                className="flex items-center"
                style={{
                  border:       "0.5px solid var(--topbar-menu-text-dim)",
                  borderRadius: 8,
                  height:       32,
                  gap:          4,
                  padding:      "0 12px",
                }}
              >
                <Search
                  size={14} strokeWidth={1.75}
                  style={{ color: "var(--topbar-menu-text-dim)", flexShrink: 0 }}
                />
                <input
                  value={tenantSearch}
                  onChange={e => setTenantSearch(e.target.value)}
                  placeholder="Search"
                  autoFocus
                  className="flex-1 bg-transparent border-0 outline-none text-[14px] font-medium placeholder:font-medium"
                  style={{
                    color: "var(--topbar-menu-text)",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Tenant rows — 40px each, 24px avatar, name only */}
            <div style={{ maxHeight: 192, overflowY: "auto" }}>
              {filteredTenants.length > 0 ? filteredTenants.map(t => {
                const isSel = t.id === selectedTenantId
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onTenantSelect?.(t.id)
                      setTenantExpanded(false)
                      setTenantSearch("")
                    }}
                    className="w-full flex items-center text-left cursor-pointer transition-colors"
                    style={{
                      height:     40,
                      gap:        8,
                      padding:    "8px 16px",
                      background: isSel ? "var(--topbar-menu-item-sel)" : "var(--menu-bg)",
                    }}
                    onMouseEnter={e => {
                      if (!isSel) (e.currentTarget as HTMLElement).style.background = "var(--menu-item-hover)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background =
                        isSel ? "var(--topbar-menu-item-sel)" : "var(--menu-bg)"
                    }}
                  >
                    <TopbarAvatar name={t.name} src={t.avatarSrc} size={24} />
                    <span
                      className="flex-1 min-w-0 text-[14px] font-medium truncate"
                      style={{ color: "var(--topbar-menu-text)" }}
                    >
                      {t.name}
                    </span>
                    {isSel && (
                      <div
                        className="shrink-0 w-[6px] h-[6px] rounded-full"
                        style={{ background: "var(--primary)" }}
                      />
                    )}
                  </button>
                )
              }) : (
                <div
                  className="flex items-center justify-center"
                  style={{ height: 40 }}
                >
                  <span className="text-[13px]" style={{ color: "var(--topbar-menu-text-dim)" }}>
                    No results
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* ── 3. Menu items ───────────────────────────── */}
      <MenuRow icon={<User size={14} strokeWidth={1.75} />} label="Profile & preferences" />
      <MenuRow icon={<Bell size={14} strokeWidth={1.75} />} label="Notifications preferences" />

      {/* ── Theme row (44px) — DS: [Theme-icon][Theme label][Auto 52×28][Sun 24×24][Moon 24×24] */}
      <div className="flex items-center" style={{ height: 44, gap: 16, padding: "8px 16px" }}>
        <span className="shrink-0" style={{ color: "var(--topbar-menu-text-dim)", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Moon size={14} strokeWidth={1.75} />
        </span>
        <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--topbar-menu-text)" }}>
          Theme
        </span>

        {/* Three-button selector: Auto (52×28) + Sun (24×24) + Moon (24×24) */}
        <div
          className="flex items-center"
          style={{
            gap:          4,
            padding:      "2px",
            borderRadius: 8,
            background:   "var(--menu-item-hover)",
            border:       "1px solid var(--menu-divider)",
          }}
        >
          {/* Auto */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => onThemeChange?.("auto")}
              onMouseEnter={() => setThemeHover("auto")}
              onMouseLeave={() => setThemeHover(null)}
              className="flex items-center justify-center rounded-[6px] transition-colors cursor-pointer text-[12px] font-medium"
              style={{
                height:     24, padding: "0 10px",
                background: activeTheme === "auto" ? "var(--topbar-menu-item-sel)" : "transparent",
                color:      activeTheme === "auto" ? "var(--primary)" : "var(--topbar-menu-text-dim)",
              }}
            >
              Auto
            </button>
            {themeHover === "auto" && (
              <div
                role="tooltip"
                className="absolute pointer-events-none"
                style={{
                  bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)",
                  whiteSpace: "nowrap", zIndex: 10,
                  background: "var(--tooltip-bg)",
                  borderRadius: 4, padding: "3px 8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: "var(--tooltip-text)" }}>Automatic</span>
              </div>
            )}
          </div>

          {/* Light */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { onThemeChange?.("light"); if (isDark) onThemeToggle?.() }}
              onMouseEnter={() => setThemeHover("light")}
              onMouseLeave={() => setThemeHover(null)}
              className="flex items-center justify-center rounded-[6px] transition-colors cursor-pointer"
              style={{
                width:      24, height: 24,
                background: activeTheme === "light" ? "var(--topbar-menu-item-sel)" : "transparent",
                color:      activeTheme === "light" ? "var(--primary)" : "var(--topbar-menu-text-dim)",
              }}
              aria-label="Light theme"
            >
              <Sun size={13} strokeWidth={1.75} />
            </button>
            {themeHover === "light" && (
              <div
                role="tooltip"
                className="absolute pointer-events-none"
                style={{
                  bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)",
                  whiteSpace: "nowrap", zIndex: 10,
                  background: "var(--tooltip-bg)",
                  borderRadius: 4, padding: "3px 8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: "var(--tooltip-text)" }}>Light</span>
              </div>
            )}
          </div>

          {/* Dark */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { onThemeChange?.("dark"); if (!isDark) onThemeToggle?.() }}
              onMouseEnter={() => setThemeHover("dark")}
              onMouseLeave={() => setThemeHover(null)}
              className="flex items-center justify-center rounded-[6px] transition-colors cursor-pointer"
              style={{
                width:      24, height: 24,
                background: activeTheme === "dark" ? "var(--topbar-menu-item-sel)" : "transparent",
                color:      activeTheme === "dark" ? "var(--primary)" : "var(--topbar-menu-text-dim)",
              }}
              aria-label="Dark theme"
            >
              <Moon size={13} strokeWidth={1.75} />
            </button>
            {themeHover === "dark" && (
              <div
                role="tooltip"
                className="absolute pointer-events-none"
                style={{
                  bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)",
                  whiteSpace: "nowrap", zIndex: 10,
                  background: "var(--tooltip-bg)",
                  borderRadius: 4, padding: "3px 8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: "var(--tooltip-text)" }}>Dark</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <MenuRow icon={<HelpCircle size={14} strokeWidth={1.75} />} label="Help & docs" />

      <Divider />

      {/* ── 4. Sign out ─────────────────────────────── */}
      <button
        className="w-full flex items-center text-left transition-colors cursor-pointer"
        style={{ height: 40, gap: 16, padding: "8px 16px" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--signout-hover-bg)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <span className="shrink-0" style={{ color: "var(--signout-icon)", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LogOut size={14} strokeWidth={1.75} />
        </span>
        <span className="text-[14px] font-medium" style={{ color: "var(--signout-text)" }}>
          Sign out
        </span>
      </button>
    </div>
  )
}

// ── Global Search ─────────────────────────────────────────────────────────
// DS: Figma 15394:15568 · Global Search - menu COMPONENT_SET · 700×600px
// Surface: rgba(255/22,255/22,255/22,0.92) + backdrop-filter:blur(16px) — frosted floating card
// Filters card: Figma 15396:25505 · same blur spec · radius 8
// 5 variants: Default · No results · Search results · Few results · Loading

type SearchFilter = "all" | "agents" | "channels" | "conversations" | "people" | "policies" | "tickets" | "workspaces"

export type SearchResultItem = {
  id:       string
  title:    string
  subtitle: string
  type:     string
  timeAgo?: string
}

export type GlobalSearchProps = {
  open:           boolean
  onClose:        () => void
  recentSearches?: SearchResultItem[]
  results?:        SearchResultItem[]
  loading?:        boolean
  onResultClick?:  (item: SearchResultItem) => void
}

// DS type → HighlightIcon variant + lucide icon
const TYPE_HI: Record<string, { variant: HighlightIconVariant; Icon: React.FC<{ size: number; strokeWidth: number }> }> = {
  agents:        { variant: "purple",     Icon: Sparkle        },
  network:       { variant: "informative",Icon: Globe          },
  tickets:       { variant: "alert",      Icon: Bookmark       },
  policies:      { variant: "success",    Icon: Shield         },
  people:        { variant: "informative",Icon: Users          },
  channels:      { variant: "light-blue", Icon: Radio          },
  conversations: { variant: "informative",Icon: MessageSquare  },
  workspaces:    { variant: "neutral",    Icon: Briefcase      },
}

const SEARCH_FILTERS: { id: SearchFilter; label: string; Icon: React.FC<{ size: number; strokeWidth: number }> }[] = [
  { id: "all",           label: "All",           Icon: LayoutGrid    },
  { id: "agents",        label: "Agents",        Icon: Sparkle       },
  { id: "channels",      label: "Channels",      Icon: Radio         },
  { id: "conversations", label: "Conversations", Icon: MessageSquare },
  { id: "people",        label: "People",        Icon: Users         },
  { id: "policies",      label: "Policies",      Icon: Shield        },
  { id: "tickets",       label: "Tickets",       Icon: Bookmark      },
  { id: "workspaces",    label: "Workspaces",    Icon: Briefcase     },
]

const DEFAULT_SUGGESTED: { variant: HighlightIconVariant; Icon: React.FC<{ size: number; strokeWidth: number }>; label: string }[] = [
  { variant: "informative", Icon: Plus,    label: "Create work item" },
  { variant: "success",     Icon: UserPlus,label: "Invite member"    },
  { variant: "purple",      Icon: Zap,     label: "New automation"   },
]

const DEFAULT_RECENT: SearchResultItem[] = [
  { id: "r1", title: "Lead triage",                          subtitle: "Network · 8 agents · 96.6%",        type: "network",  timeAgo: "1h ago" },
  { id: "r2", title: "Sammy - Service Desk",                 subtitle: "Agent · in workspace",              type: "agents",   timeAgo: "2h ago" },
  { id: "r3", title: "Multi-tenant agent rollout · PRD-459", subtitle: "Ticket · open · Edgarda Sierra",    type: "tickets",  timeAgo: "3h ago" },
  { id: "r4", title: "PII redaction · P-2025",               subtitle: "Policy · draft · Miguel Torres",    type: "policies", timeAgo: "3h ago" },
  { id: "r5", title: "Thomas Gonzales",                      subtitle: "Person · Owner · thomas@aimsos.ai", type: "people",   timeAgo: "5h ago" },
]

// Full mock dataset — used for internal filtering when no `results` prop is provided
const MOCK_ALL_RESULTS: SearchResultItem[] = [
  { id: "a1", title: "Sammy — Service Desk",        subtitle: "Agent · active · workspace: Product",          type: "agents",        timeAgo: "2h ago"  },
  { id: "a2", title: "Lead Qualifier Bot",           subtitle: "Agent · active · 94.2% accuracy",              type: "agents",        timeAgo: "1d ago"  },
  { id: "a3", title: "Onboarding Assistant",         subtitle: "Agent · draft · workspace: Engineering",        type: "agents",        timeAgo: "3d ago"  },
  { id: "a4", title: "Escalation Router",            subtitle: "Agent · paused · workspace: Support",           type: "agents",        timeAgo: "5d ago"  },
  { id: "n1", title: "Lead triage",                  subtitle: "Network · 8 agents · 96.6% success rate",      type: "network",       timeAgo: "1h ago"  },
  { id: "n2", title: "Customer support flow",        subtitle: "Network · 12 agents · 89.1% success rate",     type: "network",       timeAgo: "2d ago"  },
  { id: "n3", title: "Outbound SDR sequence",        subtitle: "Network · 5 agents · 78.4% success rate",      type: "network",       timeAgo: "4d ago"  },
  { id: "t1", title: "Multi-tenant rollout · PRD-459", subtitle: "Ticket · open · Edgarda Sierra",             type: "tickets",       timeAgo: "3h ago"  },
  { id: "t2", title: "Rate limiting on API · PRD-521", subtitle: "Ticket · in progress · Marcus Reid",         type: "tickets",       timeAgo: "1d ago"  },
  { id: "t3", title: "Dashboard permissions audit",  subtitle: "Ticket · done · Sarah Chen",                   type: "tickets",       timeAgo: "5d ago"  },
  { id: "t4", title: "SSO integration · PRD-512",    subtitle: "Ticket · open · Thomas Gonzales",              type: "tickets",       timeAgo: "2d ago"  },
  { id: "p1", title: "PII redaction · P-2025",       subtitle: "Policy · draft · Miguel Torres",               type: "policies",      timeAgo: "3h ago"  },
  { id: "p2", title: "Data retention · P-2024",      subtitle: "Policy · active · Michael O.",                 type: "policies",      timeAgo: "2d ago"  },
  { id: "p3", title: "Access control · P-2023",      subtitle: "Policy · active · Sarah Chen",                 type: "policies",      timeAgo: "1w ago"  },
  { id: "pe1", title: "Thomas Gonzales",             subtitle: "Person · Owner · thomas@aimsos.ai",            type: "people",        timeAgo: "5h ago"  },
  { id: "pe2", title: "Sarah Chen",                  subtitle: "Person · Member · sarah@aimsos.ai",            type: "people",        timeAgo: "1d ago"  },
  { id: "pe3", title: "Marcus Reid",                 subtitle: "Person · Admin · marcus@aimsos.ai",            type: "people",        timeAgo: "3d ago"  },
  { id: "pe4", title: "Edgarda Sierra",              subtitle: "Person · Member · edgarda@aimsos.ai",          type: "people",        timeAgo: "2d ago"  },
  { id: "c1",  title: "Support Chat",                subtitle: "Channel · active · 234 conversations",         type: "channels",      timeAgo: "30m ago" },
  { id: "c2",  title: "Sales Inbox",                 subtitle: "Channel · active · 89 conversations",          type: "channels",      timeAgo: "1h ago"  },
  { id: "c3",  title: "Onboarding Emails",           subtitle: "Channel · paused · 12 conversations",          type: "channels",      timeAgo: "3d ago"  },
  { id: "cv1", title: "Onboarding flow Q&A",         subtitle: "Conversation · resolved · 12 messages",        type: "conversations", timeAgo: "2h ago"  },
  { id: "cv2", title: "API integration support",     subtitle: "Conversation · open · 5 messages",             type: "conversations", timeAgo: "4h ago"  },
  { id: "cv3", title: "Billing inquiry — Acme Corp", subtitle: "Conversation · escalated · 19 messages",       type: "conversations", timeAgo: "1d ago"  },
  { id: "w1",  title: "Product Design",              subtitle: "Workspace · 8 members · active",                type: "workspaces",    timeAgo: "1h ago"  },
  { id: "w2",  title: "Engineering",                 subtitle: "Workspace · 15 members · active",               type: "workspaces",    timeAgo: "3h ago"  },
  { id: "w3",  title: "Marketing",                   subtitle: "Workspace · 6 members · active",                type: "workspaces",    timeAgo: "2d ago"  },
]

// Type key normalisation: filter chip id → type value used in SearchResultItem
const FILTER_TYPE_MAP: Record<string, string> = {
  agents: "agents", channels: "channels", conversations: "conversations",
  people: "people", policies: "policies", tickets: "tickets",
  workspaces: "workspaces", networks: "network",
}
// FiltersCard "Type" option label → type value
const CARD_TYPE_MAP: Record<string, string> = {
  Agents: "agents", Networks: "network", Tickets: "tickets",
  Policies: "policies", People: "people", Channels: "channels",
  Conversations: "conversations", Workspaces: "workspaces",
}

// ── Shared frosted-glass panel style (theme-adaptive) ─────────────────────
// Dark mode: dark surface rgba(16,22,40,0.94) · Light mode: white rgba(255,255,255,0.97)
const PANEL_STYLE: React.CSSProperties = {
  background:           "var(--gs-bg)",
  backdropFilter:       "saturate(180%) blur(16px)",
  WebkitBackdropFilter: "saturate(180%) blur(16px)",
  border:               "1px solid var(--gs-border)",
  borderRadius:         8,
}

// ── Filter Tag — DS Tag component with per-section color + remove button ──
// ── Skeleton row — mirrors ResultRow layout with shimmer placeholders ────────
function SkeletonRow({ titleW = "55%", subtitleW = "38%" }: { titleW?: string; subtitleW?: string }) {
  return (
    <div className="flex items-center gap-[12px] px-[16px] py-[8px]">
      <div
        className="shrink-0 rounded-[8px] animate-pulse"
        style={{ width: 32, height: 32, background: "var(--gs-chip-inactive-bg)" }}
      />
      <div className="flex-1 flex flex-col gap-[7px]">
        <div
          className="rounded-full animate-pulse"
          style={{ height: 11, width: titleW, background: "var(--gs-chip-inactive-bg)" }}
        />
        <div
          className="rounded-full animate-pulse"
          style={{ height: 9, width: subtitleW, background: "var(--gs-chip-inactive-bg)", opacity: 0.55 }}
        />
      </div>
    </div>
  )
}

// Each filter section maps to a different DS Tag variant so pills are visually distinct.
const FILTER_TAG_VARIANTS: Record<string, TagVariant> = {
  "Type":   "informative",   // blue  — Primary/Informative
  "Owner":  "purple",        // purple
  "Status": "success",       // green
}

function FilterTag({ label, section, onRemove }: { label: string; section: string; onRemove: () => void }) {
  const variant: TagVariant = FILTER_TAG_VARIANTS[section] ?? "informative"
  return (
    <Tag
      variant={variant}
      size="sm"
      className="shrink-0 whitespace-nowrap cursor-default"
      trailingIcon={
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
          style={{ width: 12, height: 12, color: "currentColor" }}
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      }
    >
      {label}
    </Tag>
  )
}

// ── Filters Card ──────────────────────────────────────────────────────────
// DS: Figma 15396:25505 · 298×320px · ALWAYS light/white surface (both themes)
// Floats as absolute overlay over the GS panel — NOT an inline section
// Position relative to GS panel: left=48px top=68px (Figma node 15394:18422)

const FILTER_SECTIONS = [
  { label: "Type",   options: ["Agents","Networks","Tickets","Policies","People","Channels","Conversations","Workspaces"] },
  { label: "Owner",  options: ["Me","Edgardo Sierra","Sarah Chen","Marcus Reid"] },
  { label: "Status", options: ["Active","Draft","Open","In Progress","Done","Archived"] },
]

function FiltersCard({
  onApply,
}: {
  onApply?: (sel: Record<string, string[]>) => void
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({})

  const toggle = (section: string, option: string) =>
    setSelected(prev => {
      const cur = prev[section] ?? []
      return { ...prev, [section]: cur.includes(option) ? cur.filter(o => o !== option) : [...cur, option] }
    })

  const hasAny = Object.values(selected).some(arr => arr.length > 0)

  return (
    <div
      style={{
        width:                298,
        background:           "var(--fc-bg)",
        backdropFilter:       "saturate(180%) blur(5px)",
        WebkitBackdropFilter: "saturate(180%) blur(5px)",
        border:               "1px solid var(--fc-border)",
        borderRadius:         8,
        padding:              12,
        display:              "flex",
        flexDirection:        "column",
        gap:                  12,
        boxShadow:            "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      {/* Filter sections — no dividers, just gap from parent */}
      {FILTER_SECTIONS.map(sec => (
        <div key={sec.label} className="flex flex-col" style={{ gap: 8 }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.07em]"
            style={{ color: "var(--fc-label)", lineHeight: 1 }}
          >
            {sec.label}
          </p>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {sec.options.map(opt => {
              const active = (selected[sec.label] ?? []).includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => toggle(sec.label, opt)}
                  className="text-[12px] font-medium rounded-full leading-5 cursor-pointer transition-colors"
                  style={{
                    padding:    "0 8px",
                    background: active ? "var(--primary)" : "var(--fc-chip-bg)",
                    color:      active ? "var(--color-button-primary-text-default)" : "var(--fc-chip-fg)",
                    border:     active ? "none" : `1px solid var(--fc-chip-bd)`,
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* CTA row — no separator, flush with last section */}
      <div className="flex items-center justify-end" style={{ gap: 8 }}>
        <button
          onClick={() => setSelected({})}
          className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-70"
          style={{
            height:     28,
            padding:    "4px 12px",
            borderRadius: 4,
            color:      "var(--fc-cta-clear)",
          }}
        >
          Clear all
        </button>
        <button
          onClick={() => { onApply?.(selected) }}
          className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90"
          style={{
            height:     28,
            padding:    "4px 12px",
            borderRadius: 8,
            background: hasAny ? "var(--primary)" : "var(--primary)",
            color:      hasAny ? "var(--color-button-primary-text-default)" : "var(--color-button-primary-text-disabled)",
            opacity:    hasAny ? 1 : 0.5,
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ── Result / suggestion row ───────────────────────────────────────────────
// Uses HighlightIcon size="sm" with DS variant per entity type

function ResultRow({ item, onResultClick }: { item: SearchResultItem; onResultClick?: (i: SearchResultItem) => void }) {
  const [hovered, setHovered] = useState(false)
  const meta = TYPE_HI[item.type] ?? { variant: "informative" as HighlightIconVariant, Icon: Globe }
  return (
    <button
      onClick={() => onResultClick?.(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-[12px] px-[16px] py-[8px] text-left transition-colors"
      style={{
        background:    hovered ? "var(--gs-row-hover)" : "transparent",
        backdropFilter: hovered ? "blur(16px)" : undefined,
      }}
    >
      <HighlightIcon
        size="sm"
        variant={meta.variant}
        iconColor="dark"
        icon={<meta.Icon size={14} strokeWidth={1.75} />}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: "var(--gs-text)" }}>{item.title}</div>
        <div className="text-[11px] truncate" style={{ color: "var(--gs-text-dim)" }}>{item.subtitle}</div>
      </div>
      {item.timeAgo && (
        <div className="flex items-center gap-[4px] shrink-0">
          <Clock size={11} strokeWidth={1.75} style={{ color: "var(--gs-text-meta)" }} />
          <span className="text-[11px]" style={{ color: "var(--gs-text-meta)" }}>{item.timeAgo}</span>
        </div>
      )}
    </button>
  )
}

export function GlobalSearch({
  open,
  onClose,
  recentSearches = DEFAULT_RECENT,
  results,
  loading = false,
  onResultClick,
}: GlobalSearchProps) {
  const [query,          setQuery]          = useState("")
  const [activeFilter,   setActiveFilter]   = useState<SearchFilter>("all")
  const [filtersOpen,    setFiltersOpen]     = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({})

  // Internal async state — used when no `results` prop is provided (uncontrolled mode)
  const [internalResults, setInternalResults] = useState<SearchResultItem[] | undefined>(undefined)
  const [internalLoading, setInternalLoading] = useState(false)
  const isControlled = results !== undefined

  const inputRef       = useRef<HTMLInputElement>(null)
  const panelRef       = useRef<HTMLDivElement>(null)
  const filtersCardRef = useRef<HTMLDivElement>(null)
  const slidersBtnRef  = useRef<HTMLButtonElement>(null)

  // Focus input on open, reset all state on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery(""); setActiveFilter("all"); setFiltersOpen(false)
      setAppliedFilters({}); setInternalResults(undefined); setInternalLoading(false)
    }
  }, [open])

  // ── Internal filtering (uncontrolled mode) ────────────────────────────────
  // When query, activeFilter or appliedFilters change, filter MOCK_ALL_RESULTS.
  // Filter chips (activeFilter) apply instantly; text query shows skeleton first.
  useEffect(() => {
    if (isControlled) return

    const q           = query.trim().toLowerCase()
    const hasQ        = q.length > 0
    const hasF        = activeFilter !== "all"
    const cardTypes   = (appliedFilters["Type"] ?? []).map(l => CARD_TYPE_MAP[l]).filter(Boolean)
    const hasCardType = cardTypes.length > 0
    const isIdle      = !hasQ && !hasF && !hasCardType

    if (isIdle) { setInternalResults(undefined); setInternalLoading(false); return }

    // Skeleton delay only for text input; filter-only changes are instant
    const delay = hasQ ? 380 : 0
    if (hasQ) setInternalLoading(true)

    const timer = setTimeout(() => {
      let filtered = MOCK_ALL_RESULTS

      // 1. Chip filter (activeFilter)
      if (hasF) {
        const mapped = FILTER_TYPE_MAP[activeFilter]
        if (mapped) filtered = filtered.filter(r => r.type === mapped)
      }

      // 2. FiltersCard Type section
      if (hasCardType) {
        filtered = filtered.filter(r => cardTypes.includes(r.type))
      }

      // 3. Text query (title + subtitle)
      if (hasQ) {
        filtered = filtered.filter(r =>
          r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)
        )
      }

      setInternalResults(filtered)
      setInternalLoading(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, activeFilter, appliedFilters, isControlled])

  // Escape key: first closes FiltersCard if open, then closes GlobalSearch
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (filtersOpen) setFiltersOpen(false)
      else onClose()
    }
  }, [onClose, filtersOpen])
  useEffect(() => {
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [handleKey])

  // Close FiltersCard when clicking outside it (but not on the sliders button)
  useEffect(() => {
    if (!filtersOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const inCard    = filtersCardRef.current?.contains(target)
      const inSliders = slidersBtnRef.current?.contains(target)
      if (!inCard && !inSliders) setFiltersOpen(false)
    }
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0)
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler) }
  }, [filtersOpen])

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current?.contains(e.target as Node)) onClose()
  }

  if (!open) return null

  // Resolve effective state (controlled vs uncontrolled)
  const effectiveResults  = isControlled ? results   : internalResults
  const effectiveLoading  = isControlled ? loading   : internalLoading

  const hasQuery          = query.trim().length > 0
  const hasResults        = effectiveResults && effectiveResults.length > 0
  const hasAppliedFilters = Object.values(appliedFilters).some(arr => arr.length > 0)
  const isFiltering       = hasQuery || hasAppliedFilters || activeFilter !== "all"
  const noResults         = isFiltering && !effectiveLoading && effectiveResults !== undefined && effectiveResults.length === 0

  const removeAppliedFilter = (section: string, value: string) => {
    setAppliedFilters(prev => {
      const next = (prev[section] ?? []).filter(v => v !== value)
      const updated = { ...prev }
      if (next.length === 0) delete updated[section]
      else updated[section] = next
      return updated
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[80px]"
      style={{ background: "var(--gs-scrim)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
      onMouseDown={handleBackdrop}
    >
      <div
        ref={panelRef}
        className="relative flex flex-col overflow-hidden"
        style={{ ...PANEL_STYLE, width: 700, height: 600, boxShadow: "0 20px 60px rgba(0,0,0,0.36)" }}
      >
        {/* ── Search input row ─────────────────────────────────────
            When filters are applied, tags appear inline before the cursor.
            DS variants 2–5 show "Type: Network ×" style chips in the input. */}
        <div
          className="flex items-center gap-[8px] px-[16px]"
          style={{ minHeight: 56, flexShrink: 0, borderBottom: "1px solid var(--gs-divider)" }}
        >
          <Search size={16} strokeWidth={1.75} className="shrink-0" style={{ color: "var(--gs-text-dim)" }} />

          {/* Tags + text input in a scrollable row */}
          <div
            className="flex-1 flex items-center gap-[6px] min-w-0 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {Object.entries(appliedFilters).flatMap(([section, vals]) =>
              vals.map(val => (
                <FilterTag
                  key={`${section}:${val}`}
                  label={`${section}: ${val}`}
                  section={section}
                  onRemove={() => removeAppliedFilter(section, val)}
                />
              ))
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={hasAppliedFilters ? "Search…" : "Search agents, networks, tickets, policies, people…"}
              className="bg-transparent outline-none text-[13px] placeholder:text-[var(--gs-text-dim)] shrink-0"
              style={{ color: "var(--gs-text)", flex: "1 0 100px", minWidth: 100 }}
            />
          </div>

          {/* Clear all (query + filters) */}
          {(query || hasAppliedFilters) && (
            <button
              onClick={() => { setQuery(""); setAppliedFilters({}) }}
              className="shrink-0 transition-opacity hover:opacity-70"
            >
              <X size={14} strokeWidth={1.75} style={{ color: "var(--gs-text-dim)" }} />
            </button>
          )}

          {/* esc shortcut pill */}
          <div
            className="shrink-0 flex items-center px-[8px] rounded-[5px]"
            style={{ height: 22, background: "var(--gs-kbd-bg)" }}
          >
            <span className="text-[11px] font-medium" style={{ color: "var(--gs-kbd-fg)" }}>esc</span>
          </div>
        </div>

        {/* ── Filter chips row ──────────────────────────────────── */}
        <div
          className="flex items-center gap-[6px] px-[12px]"
          style={{ height: 40, borderBottom: "1px solid var(--gs-divider)", overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}
        >
          {/* Sliders icon — toggles FiltersCard overlay */}
          <button
            ref={slidersBtnRef}
            onClick={() => setFiltersOpen(v => !v)}
            className="shrink-0 w-[24px] h-[24px] flex items-center justify-center rounded-[6px] transition-colors"
            style={{
              background: filtersOpen ? "var(--fc-trigger-active-bg)" : "transparent",
              color:      filtersOpen ? "var(--primary)"         : "var(--gs-text-dim)",
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} />
          </button>

          {/* Type filter chips */}
          {SEARCH_FILTERS.map(f => {
            const isActive = activeFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="shrink-0 flex items-center gap-[4px] px-[10px] rounded-full text-[12px] font-medium transition-all"
                style={{
                  height:     22,
                  background: isActive ? "var(--primary)" : "var(--gs-chip-inactive-bg)",
                  color:      isActive ? "var(--color-button-primary-text-default)" : "var(--gs-chip-inactive-fg)",
                }}
              >
                <f.Icon size={11} strokeWidth={1.75} />
                {f.label}
              </button>
            )
          })}
        </div>

        {/* ── Content area ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>

          {/* Loading — skeleton rows that mirror ResultRow layout */}
          {effectiveLoading && (
            <div className="py-[8px]">
              <SkeletonRow titleW="52%" subtitleW="36%" />
              <SkeletonRow titleW="64%" subtitleW="42%" />
              <SkeletonRow titleW="48%" subtitleW="30%" />
              <SkeletonRow titleW="70%" subtitleW="45%" />
              <SkeletonRow titleW="58%" subtitleW="38%" />
            </div>
          )}

          {/* No results — DS variant 2: icon + heading + subtext + clear link */}
          {noResults && !effectiveLoading && (
            <div className="flex flex-col items-center justify-center gap-[12px] py-[56px]">
              <div
                className="w-[48px] h-[48px] flex items-center justify-center rounded-[12px]"
                style={{ background: "var(--gs-chip-inactive-bg)" }}
              >
                <SearchX size={22} strokeWidth={1.5} style={{ color: "var(--gs-text-dim)" }} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold" style={{ color: "var(--gs-text)" }}>
                  No matches found
                </p>
                <p className="text-[13px] mt-[4px]" style={{ color: "var(--gs-text-dim)" }}>
                  Try fewer words or different keywords
                </p>
              </div>
              {(hasAppliedFilters || activeFilter !== "all") && (
                <button
                  onClick={() => { setAppliedFilters({}); setActiveFilter("all") }}
                  className="text-[13px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Search results — DS variants 3 & 4 */}
          {isFiltering && hasResults && !effectiveLoading && (
            <div className="py-[8px]">
              {effectiveResults!.map(item => (
                <ResultRow key={item.id} item={item} onResultClick={onResultClick} />
              ))}
            </div>
          )}

          {/* Default state — suggested actions + recent searches (DS variant 1) */}
          {!isFiltering && !effectiveLoading && (
            <>
              <div className="pt-[8px]">
                <p
                  className="px-[16px] pb-[4px] text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--gs-section-label)" }}
                >
                  Suggested actions
                </p>
                {DEFAULT_SUGGESTED.map(action => (
                  <button
                    key={action.label}
                    className="w-full flex items-center gap-[12px] px-[16px] py-[9px] text-left transition-colors hover:bg-[var(--gs-row-hover)]"
                  >
                    <HighlightIcon
                      size="sm"
                      variant={action.variant}
                      iconColor="dark"
                      icon={<action.Icon size={14} strokeWidth={1.75} />}
                    />
                    <span className="text-[13px] font-medium" style={{ color: "var(--gs-text)" }}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mx-[16px] my-[4px]" style={{ height: 1, background: "var(--gs-divider)" }} />

              <div className="pb-[8px]">
                <p
                  className="px-[16px] pt-[8px] pb-[4px] text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--gs-section-label)" }}
                >
                  Recent searches
                </p>
                {recentSearches.map(item => (
                  <ResultRow key={item.id} item={item} onResultClick={onResultClick} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────
            DS: "↑↓ Navigate" always; "↩ Enter" only when results exist */}
        <div
          className="flex items-center justify-between px-[16px] shrink-0"
          style={{ height: 36, borderTop: "1px solid var(--gs-divider)" }}
        >
          <div className="flex items-center gap-[5px]">
            <span
              className="px-[6px] rounded-[4px] text-[11px] font-medium"
              style={{ background: "var(--gs-kbd-bg)", color: "var(--gs-kbd-fg)" }}
            >
              ↑↓
            </span>
            <span className="text-[11px]" style={{ color: "var(--gs-text-meta)" }}>Navigate</span>
          </div>
          {(hasResults || (!hasQuery && !hasAppliedFilters)) && (
            <div className="flex items-center gap-[5px]">
              <span
                className="px-[6px] rounded-[4px] text-[11px] font-medium"
                style={{ background: "var(--gs-kbd-bg)", color: "var(--gs-kbd-fg)" }}
              >
                ↵
              </span>
              <span className="text-[11px]" style={{ color: "var(--gs-text-meta)" }}>
                {hasResults ? "Open" : "Enter"}
              </span>
            </div>
          )}
        </div>

        {/* ── FiltersCard — floating absolute overlay ───────────────
            DS Figma 15394:18422: node is a SIBLING to the GS panel at depth=1
            in the app frame, positioned at x=418/y=218 (GS panel at x=370/y=150)
            → relative to panel: left=48px top=68px · always white surface */}
        {filtersOpen && (
          <div
            ref={filtersCardRef}
            className="absolute"
            style={{ top: 68, left: 48, zIndex: 20 }}
            onMouseDown={e => e.stopPropagation()}
          >
            <FiltersCard
              onApply={(sel) => {
                setAppliedFilters(sel)
                setFiltersOpen(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── TopbarTooltip — appears below topbar elements ────────────────────────
// DS Hover examples (8603:53715): dark pill, optional subtitle, no arrow.
// Title: 11px Medium rgba(255,255,255,0.90)
// Subtitle (optional): 10px Regular rgba(255,255,255,0.55)
function TopbarTooltip({
  title,
  subtitle,
  visible,
}: {
  title: string
  subtitle?: string
  visible: boolean
}) {
  if (!visible) return null
  return (
    <div
      role="tooltip"
      className="absolute pointer-events-none z-50"
      style={{
        top: "calc(100% + 6px)",
        left: "50%",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        background: "var(--topbar-menu-bg)",
        border: "1px solid var(--gs-input-border)",
        borderRadius: 6,
        padding: subtitle ? "5px 10px" : "3px 8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      }}
    >
      <span className="text-[11px] font-medium block" style={{ color: "var(--gs-text)" }}>
        {title}
      </span>
      {subtitle && (
        <span className="text-[10px] block mt-[1px]" style={{ color: "var(--gs-text-dim)" }}>
          {subtitle}
        </span>
      )}
    </div>
  )
}

// ── TopbarButton — exported for layout shells ─────────────────────────────
// DS COMPONENT_SET 8603:52851: 24×24 button, two visual variants:
//   "default"  → Type=Tertiary · transparent bg · DS hover/focus tokens
//   "primary"  → Type=Main Action · radial gradient (AIMS blue→teal) · DS exact colors

export function TopbarButton({
  icon,
  label,
  badge   = false,
  variant = "default",
  onClick,
}: {
  icon:      ReactNode
  label:     string
  badge?:    boolean
  variant?:  "default" | "primary"
  onClick?:  (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  if (variant === "primary") {
    return (
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          aria-label={label}
          onClick={onClick}
          className="relative w-[24px] h-[24px] flex items-center justify-center shrink-0 cursor-pointer transition-opacity hover:opacity-85 focus-visible:outline-none"
          style={{
            background:   "radial-gradient(circle at 61% 68%, rgba(33,115,255,1) 29%, rgba(9,226,171,1) 61%)",
            borderRadius: 8,
            boxShadow:    "4px 8px 12px 8px rgba(9,226,171,0.16)",
          }}
        >
          <span style={{ color: "var(--color-icon-neutral-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </span>
          {badge && (
            <span
              className="absolute top-0 right-0 w-[8px] h-[8px] rounded-full"
              style={{ background: "var(--topbar-badge-bg)" }}
            />
          )}
        </button>
        <TopbarTooltip title={label} visible={hovered} />
      </div>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        aria-label={label}
        onClick={onClick}
        className={cn(
          "relative w-[24px] h-[24px] flex items-center justify-center rounded-[4px] shrink-0",
          "text-[var(--topbar-icon)]",
          "hover:bg-[var(--topbar-btn-hover-bg)]",
          "focus-visible:bg-[var(--topbar-btn-focus-bg)] outline-none",
          "transition-colors cursor-pointer",
        )}
      >
        {icon}
        {badge && (
          <span
            className="absolute top-0 right-0 w-[8px] h-[8px] rounded-full"
            style={{ background: "var(--topbar-badge-bg)" }}
          />
        )}
      </button>
      <TopbarTooltip title={label} visible={hovered} />
    </div>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────

export function Topbar({
  workspaceName        = "Product Name",
  workspaceAvatarSrc,
  workspaces           = [],
  selectedWorkspaceId,
  onWorkspaceSelect,
  onWorkspaceClick,
  searchPlaceholder    = "Search…",
  onSearchFocus,
  actions              = [],
  companyName          = "Company",
  companyAvatarSrc,
  onCompanyClick,
  userName             = "User",
  userEmail,
  userAvatarSrc,
  onProfileClick,
  tenants              = [],
  selectedTenantId,
  onTenantSelect,
  themeMode,
  onThemeChange,
  isDark,
  onThemeToggle,
  variant              = "default",
  onMenuClick,
  className,
}: TopbarProps) {
  const isTablet  = variant === "tablet"
  const height    = isTablet ? 34 : 36
  const leftWidth = isTablet ? 172 : 140

  const [leftMenuOpen,  setLeftMenuOpen]  = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [leftMenuPos,   setLeftMenuPos]   = useState<{ top: number; left: number } | null>(null)
  const [rightMenuPos,  setRightMenuPos]  = useState<{ top: number; right: number } | null>(null)
  const [wsHover,       setWsHover]       = useState(false)
  const [searchHover,   setSearchHover]   = useState(false)
  const [profileHover,  setProfileHover]  = useState(false)
  const leftRef  = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useClickOutside(leftRef,  () => setLeftMenuOpen(false))
  useClickOutside(rightRef, () => setRightMenuOpen(false))

  // Zone frame styles — shared by left zone and sub-group B
  const zoneBase = "flex items-center rounded-[8px] transition-all duration-150"
  const zoneBorderIdle   = "border border-[var(--topbar-workspace-border)]"
  const zoneBorderActive = "border border-[var(--topbar-zone-hover-bd)] bg-[var(--topbar-zone-hover-bg)]"
  const zoneHover        = "hover:border-[var(--topbar-zone-hover-bd)] hover:bg-[var(--topbar-zone-hover-bg)]"

  return (
    <header className={cn("w-full flex flex-col", className)} style={{ height }}>

      {/* ── Content row: 28px tall, 4px from top ──────────────── */}
      <div className="flex items-center justify-between h-[28px] mt-[4px] px-[8px]">

        {/* LEFT ZONE — workspace selector ──────────────────────── */}
        <div ref={leftRef} className="relative shrink-0">
          <div
            className={cn(
              zoneBase, zoneBorderIdle, zoneHover,
              leftMenuOpen && zoneBorderActive,
              "gap-[8px] cursor-pointer",
            )}
            style={{
              width:         leftWidth, height: 28,
              paddingLeft:   4, paddingRight: 4,
              paddingTop:    2, paddingBottom: 2,
            }}
            onMouseEnter={() => setWsHover(true)}
            onMouseLeave={() => setWsHover(false)}
          >
            {isTablet && (
              <button
                aria-label="Open navigation"
                onClick={onMenuClick}
                className={cn(
                  "w-[24px] h-[24px] flex items-center justify-center rounded-[4px] shrink-0",
                  "text-[var(--topbar-icon)] hover:bg-[var(--topbar-btn-hover-bg)]",
                  "focus-visible:bg-[var(--topbar-btn-focus-bg)] outline-none transition-colors cursor-pointer",
                )}
              >
                <Menu size={14} strokeWidth={1.75} />
              </button>
            )}
            <TopbarAvatar name={workspaceName} src={workspaceAvatarSrc} />
            <button
              className="flex items-center gap-[6px] flex-1 min-w-0 cursor-pointer"
              onClick={() => {
                if (workspaces.length > 0) {
                  if (!leftMenuOpen && leftRef.current) {
                    const r = leftRef.current.getBoundingClientRect()
                    setLeftMenuPos({ top: r.bottom + 4, left: r.left })
                  }
                  setLeftMenuOpen(v => !v)
                  setRightMenuOpen(false)
                } else {
                  onWorkspaceClick?.()
                }
              }}
              aria-label="Switch workspace"
            >
              <span
                className="text-[10px] font-semibold truncate flex-1 text-left"
                style={{ color: "var(--topbar-text)" }}
              >
                {workspaceName}
              </span>
              <ChevronDown
                size={12} strokeWidth={2}
                className={cn("shrink-0 transition-transform duration-150", leftMenuOpen && "rotate-180")}
                style={{ color: "var(--topbar-icon)" }}
              />
            </button>
          </div>

          <TopbarTooltip
            title="Workspace"
            subtitle="Move across studios"
            visible={wsHover && !leftMenuOpen}
          />
          {leftMenuOpen && workspaces.length > 0 && (
            <TopbarLeftMenu
              workspaces={workspaces}
              selectedId={selectedWorkspaceId}
              onSelect={id => {
                onWorkspaceSelect?.(id)
                setLeftMenuOpen(false)
              }}
              pos={leftMenuPos ?? undefined}
            />
          )}
        </div>

        {/* CENTER ZONE — search trigger ─────────────────────────── */}
        <div
          className="w-[250px] h-[24px] shrink-0 relative"
          onMouseEnter={() => setSearchHover(true)}
          onMouseLeave={() => setSearchHover(false)}
        >
          <div
            role="button"
            aria-label={searchPlaceholder}
            className="w-full h-full flex items-center gap-[6px] px-[8px] cursor-text transition-opacity hover:opacity-80"
            style={{
              background:   "var(--topbar-search-bg)",
              border:       "1px solid var(--topbar-search-border)",
              borderRadius: 6,
            }}
            onClick={() => { setSearchOpen(true); onSearchFocus?.() }}
          >
            <Search
              size={12} strokeWidth={1.75} className="shrink-0"
              style={{ color: "var(--topbar-text-secondary)" }}
            />
            <span
              className="text-[11px] flex-1 truncate select-none"
              style={{ color: "var(--topbar-text-secondary)" }}
            >
              {searchPlaceholder}
            </span>
          </div>
          <TopbarTooltip
            title="Global search"
            subtitle="Search across apps, agents, and data"
            visible={searchHover && !searchOpen}
          />
        </div>

        {/* RIGHT ZONE ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-[8px] shrink-0" style={{ width: 232, height: 28 }}>

          {/* Sub-group A: 3 action buttons (DS: 80×24, gap:4)
               isotipo white GROUP is in the DS file but sits at x:0 behind the
               IA button's gradient bg — not rendered as a separate interactive element */}
          <div className="flex items-center gap-[4px]" style={{ width: 80, height: 24 }}>
            {actions.slice(0, 3).map((a, i) => (
              <TopbarButton
                key={i}
                icon={a.icon}
                label={a.label}
                badge={a.badge}
                variant={a.variant}
                onClick={a.onClick}
              />
            ))}
          </div>

          {/* Vertical divider — Border/Neutral/Subtle */}
          <div
            className="shrink-0"
            style={{ width: 1, height: 28, background: "var(--topbar-divider)" }}
          />

          {/* Sub-group B: company selector + profile avatar (136×28) */}
          <div ref={rightRef} className="relative shrink-0">
            <div
              className={cn(
                zoneBase, zoneBorderIdle, zoneHover,
                rightMenuOpen && zoneBorderActive,
                "gap-[8px] cursor-pointer",
              )}
              style={{
                width:       136, height: 28,
                paddingLeft: 4, paddingRight: 4,
                paddingTop:  2, paddingBottom: 2,
              }}
              onClick={() => {
                if (!rightMenuOpen && rightRef.current) {
                  const r = rightRef.current.getBoundingClientRect()
                  setRightMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
                }
                setRightMenuOpen(v => !v)
                setLeftMenuOpen(false)
                onProfileClick?.()
              }}
              aria-label="Open profile menu"
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (!rightMenuOpen && rightRef.current) {
                    const r = rightRef.current.getBoundingClientRect()
                    setRightMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
                  }
                  setRightMenuOpen(v => !v)
                  setLeftMenuOpen(false)
                }
              }}
            >
              <div
                className="flex items-center gap-[4px] flex-1 min-w-0"
                onClick={e => { e.stopPropagation(); onCompanyClick?.() }}
                role="button"
                aria-label="Switch company"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onCompanyClick?.() }}}
              >
                <TopbarAvatar name={companyName} src={companyAvatarSrc} />
                <span
                  className="text-[10px] truncate flex-1 text-left"
                  style={{ color: "var(--topbar-text-secondary)" }}
                >
                  {companyName}
                </span>
              </div>
              <div
                className="relative shrink-0 flex items-center"
                onMouseEnter={() => setProfileHover(true)}
                onMouseLeave={() => setProfileHover(false)}
              >
                <div
                  className="flex items-center justify-center rounded-full transition-all hover:ring-1 hover:ring-[var(--topbar-avatar-ring)]"
                  style={{ width: 16, height: 16 }}
                >
                  <TopbarAvatar name={userName} src={userAvatarSrc} />
                </div>
                <TopbarTooltip title="Profile & account" visible={profileHover && !rightMenuOpen} />
              </div>
            </div>

            {rightMenuOpen && (
              <TopbarRightMenu
                userName={userName}
                userEmail={userEmail}
                userAvatarSrc={userAvatarSrc}
                companyName={companyName}
                companyAvatarSrc={companyAvatarSrc}
                tenants={tenants}
                selectedTenantId={selectedTenantId}
                onTenantSelect={onTenantSelect}
                themeMode={themeMode}
                onThemeChange={onThemeChange}
                isDark={isDark}
                onThemeToggle={onThemeToggle}
                pos={rightMenuPos ?? undefined}
              />
            )}
          </div>

        </div>
      </div>

      {/* ── Bottom divider — Border/Neutral/Subtle ──────────────── */}
      <div className="flex-1 border-b" style={{ borderColor: "var(--topbar-divider)" }} />

      {/* ── Global Search overlay ─────────────────────────────────── */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

    </header>
  )
}
