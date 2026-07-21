import { useEffect, useMemo, useRef, useState } from "react"
import * as LucideIcons from "lucide-react"
import { ScreenLayout }   from "@/components/layouts/screen-layout"
import { ListViewSection } from "@/components/layouts/list-view-section"
import type { SidebarItem } from "@/components/ui/sidebar"
import { Header }         from "@/components/ui/header"
import { Button }         from "@/components/ui/button"
import { Tag }            from "@/components/ui/tag"
import { Pagination }     from "@/components/ui/pagination"
import { Tabs }           from "@/components/ui/tabs"
import { HighlightIcon }         from "@/components/ui/highlight-icon"
import { WidgetCanvasView }      from "@/components/layouts/widget-canvas-view"
import type { CanvasSlot }       from "@/components/layouts/widget-canvas-view"
import { Menu, MenuItem, MenuDivider } from "@/components/ui/menu-item"
import { SlideOut }       from "@/components/ui/slide-out"
import { ModalDialog }    from "@/components/ui/modal-dialog"
import { Input }          from "@/components/ui/input"
import { Table, TableCellAvatar } from "@/components/ui/table"
import type { TableColumn }       from "@/components/ui/table"
import type { EntityListItemData } from "@/components/ui/entity-list"

// ── Types ──────────────────────────────────────────────────────────────────────

type WorkerStatus   = "Active" | "Draft" | "Running"
type WorkerCategory = "Analytics" | "CX" | "Operations"

type Worker = {
  id:       string
  name:     string
  status:   WorkerStatus
  category: WorkerCategory
  owner:    string
  lastRun:  string
}

const STATUS_TAG: Record<WorkerStatus, "success" | "informative" | "neutral"> = {
  Active:  "success",
  Running: "informative",
  Draft:   "neutral",
}

const CATEGORY_ICON: Record<WorkerCategory, string> = {
  Analytics:  "BarChart3",
  CX:         "Headset",
  Operations: "Cog",
}

// ── Static data ────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "ai-workers",  label: "AI Workers",  icon: "Bot" },
  { id: "automations", label: "Automations", icon: "Zap" },
  { id: "knowledge",   label: "Knowledge",   icon: "LayoutGrid", hasChildren: true },
  { id: "analytics",   label: "Analytics",   icon: "BarChart3" },
  { id: "settings",    label: "Settings",    icon: "Settings" },
]

const WORKERS: Worker[] = [
  { id: "w1", name: "Revenue Forecast Analyzer",   status: "Active",  category: "Analytics",  owner: "Ana Torres",    lastRun: "4m ago"  },
  { id: "w2", name: "Customer Sentiment Tracker",  status: "Running", category: "CX",         owner: "Marco Silva",   lastRun: "12m ago" },
  { id: "w3", name: "Inventory Reorder Assistant", status: "Draft",   category: "Operations", owner: "Elena Ruiz",    lastRun: "—"       },
  { id: "w4", name: "Churn Risk Predictor",        status: "Active",  category: "Analytics",  owner: "David Kim",     lastRun: "1h ago"  },
  { id: "w5", name: "Support Ticket Triage",       status: "Active",  category: "CX",         owner: "Priya Patel",   lastRun: "2h ago"  },
  { id: "w6", name: "Warehouse Capacity Planner",  status: "Running", category: "Operations", owner: "James Chen",    lastRun: "6m ago"  },
  { id: "w7", name: "Campaign ROI Estimator",      status: "Draft",   category: "Analytics",  owner: "Sofia Martins", lastRun: "—"       },
  { id: "w8", name: "VoC Insights Summarizer",     status: "Draft",   category: "CX",         owner: "Liam O'Connor", lastRun: "—"       },
  { id: "w9", name: "Shift Scheduling Optimizer",  status: "Active",  category: "Operations", owner: "Nina Fischer",  lastRun: "30m ago" },
]

const FILTER_OPTIONS: Record<string, string[]> = {
  Status:   ["Active", "Draft", "Running"],
  Category: ["Analytics", "CX", "Operations"],
}

// ── Detail helpers ─────────────────────────────────────────────────────────────

type WorkerUserRole = "Owner" | "Editor" | "Viewer"
type WorkerUser = { name: string; email: string; role: WorkerUserRole; lastActive: string }
type LogStatus  = "Success" | "Warning" | "Failed"
type WorkerLog  = { id: string; workerName: string; status: LogStatus; startedAt: string; duration: string }

const TEAM = ["Ana Torres","Marco Silva","Elena Ruiz","David Kim","Priya Patel","James Chen","Sofia Martins","Liam O'Connor","Nina Fischer"]
const emailFor = (n: string) => n.toLowerCase().replace(/[^a-z\s]/g,"").trim().split(/\s+/).join(".")+"@acme.com"

const ROLE_TAG: Record<WorkerUserRole, "success" | "informative" | "neutral"> = {
  Owner: "success", Editor: "informative", Viewer: "neutral",
}

function getUsers(w: Worker): WorkerUser[] {
  const i = WORKERS.findIndex(x => x.id === w.id)
  return [
    { name: w.owner,        email: emailFor(w.owner),       role: "Owner",  lastActive: w.lastRun === "—" ? "3d ago" : w.lastRun },
    { name: TEAM[(i+1)%9],  email: emailFor(TEAM[(i+1)%9]), role: "Editor", lastActive: "1d ago" },
    { name: TEAM[(i+4)%9],  email: emailFor(TEAM[(i+4)%9]), role: "Viewer", lastActive: "5d ago" },
  ]
}

const LOG_TAG: Record<LogStatus, "success" | "alert" | "error"> = {
  Success: "success", Warning: "alert", Failed: "error",
}

function getLogs(w: Worker): WorkerLog[] {
  const i = WORKERS.findIndex(x => x.id === w.id)
  const statuses: LogStatus[] =
    w.status === "Draft" ? ["Warning","Success","Success","Failed"] :
    i % 3 === 0          ? ["Success","Success","Failed","Success"] :
    i % 3 === 1          ? ["Success","Warning","Success","Success"] :
                           ["Success","Success","Success","Warning"]
  const times     = [w.lastRun === "—" ? "2d ago" : w.lastRun, "1d ago", "2d ago", "4d ago"]
  const durations = ["3.2s","2.8s","0.4s","3.1s"]
  return statuses.map((status, j) => ({
    id: `#RUN-${String(i+1).padStart(2,"0")}${j+1}`,
    workerName: w.name,
    status,
    startedAt: times[j],
    duration:  durations[j],
  }))
}

// ── Table columns ──────────────────────────────────────────────────────────────

const USERS_COLS: TableColumn<WorkerUser>[] = [
  { key: "name",       header: "Name",        render: u => <div className="flex items-center gap-[8px]"><TableCellAvatar name={u.name} size="sm" /><span>{u.name}</span></div> },
  { key: "role",       header: "Role",        render: u => <Tag variant={ROLE_TAG[u.role]} size="sm">{u.role}</Tag> },
  { key: "lastActive", header: "Last active", align: "right" },
]

const SLIDE_LOGS_COLS: TableColumn<WorkerLog>[] = [
  { key: "id",        header: "Run" },
  { key: "status",    header: "Status",   render: l => <Tag variant={LOG_TAG[l.status]} size="sm">{l.status}</Tag> },
  { key: "startedAt", header: "Started" },
  { key: "duration",  header: "Duration", align: "right" },
]

const ALL_LOGS_COLS: TableColumn<WorkerLog>[] = [
  { key: "workerName", header: "Worker" },
  { key: "id",         header: "Run" },
  { key: "status",     header: "Status",   render: l => <Tag variant={LOG_TAG[l.status]} size="sm">{l.status}</Tag> },
  { key: "startedAt",  header: "Started" },
  { key: "duration",   header: "Duration", align: "right" },
]

// ── Detail row (SlideOut Overview) ────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[4px] py-[12px]" style={{ borderTop: "0.5px solid var(--field-border)" }}>
      <span className="text-[10px] font-bold uppercase tracking-[0.07em]" style={{ color: "var(--field-label)" }}>{label}</span>
      <div className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{children}</div>
    </div>
  )
}

// ── KPI Widget content — DS KPI widget pattern (variant 1) ───────────────────

type KpiContentProps = {
  value:       number | string
  feedback:    string
  iconName:    string
  iconVariant: "informative" | "success" | "neutral" | "alert" | "error"
}

function KpiContent({ value, feedback, iconName, iconVariant }: KpiContentProps) {
  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: "var(--color-text-title)" }}>
          {value}
        </span>
        <HighlightIcon size="lg" variant={iconVariant} iconName={iconName} />
      </div>
      <span style={{ fontSize: 12, color: "var(--color-text-subtitle)", marginTop: 6, display: "block" }}>
        {feedback}
      </span>
    </div>
  )
}

// ── Worker config / schedule data ─────────────────────────────────────────────

const SCHEDULE: Record<WorkerCategory, string> = {
  Analytics:  "Daily at 9:00 AM",
  CX:         "Every 2 hours",
  Operations: "Weekdays at 6:00 AM",
}

const INTEGRATION: Record<WorkerCategory, { input: string; output: string }> = {
  Analytics:  { input: "Data Warehouse",  output: "Analytics Dashboard" },
  CX:         { input: "Support Tickets", output: "CRM Platform"        },
  Operations: { input: "ERP System",      output: "Slack Alerts"        },
}

// ── Worker config widget content ──────────────────────────────────────────────

function WorkerConfigContent({ worker }: { worker: Worker }) {
  const integ = INTEGRATION[worker.category]
  const rows = [
    { label: "Category",  value: worker.category },
    { label: "Owner",     value: worker.owner },
    { label: "Schedule",  value: SCHEDULE[worker.category] },
    { label: "Input",     value: integ.input },
    { label: "Output",    value: integ.output },
    { label: "Last run",  value: worker.lastRun === "—" ? "Never" : worker.lastRun },
  ]
  return (
    <div style={{ padding: "0 16px 16px" }}>
      {rows.map(r => (
        <div key={r.label} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 0", borderBottom: "0.5px solid var(--field-border)",
        }}>
          <span style={{ fontSize: 12, color: "var(--color-text-subtitle)" }}>{r.label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-title)" }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Activity widget — mirrors DS ActivityWidgetContent, adapted for worker runs ─

const WORKER_RUN_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Success: { icon: "CircleCheck",   color: "var(--color-border-success-default)",  bg: "var(--color-surface-success-subtle)" },
  Warning: { icon: "TriangleAlert", color: "var(--color-surface-yellow-default)",  bg: "var(--color-surface-yellow-subtle)"  },
  Failed:  { icon: "CircleX",       color: "var(--color-text-error)",              bg: "var(--color-surface-error-subtle)"   },
}

function WorkerActivityContent({ logs }: { logs: WorkerLog[] }) {
  type LIcon = React.FC<{ size?: number; style?: React.CSSProperties }>
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-[6px]" style={{ overflowY: "auto", maxHeight: 280, padding: "0 16px 16px" }}>
      {logs.map((log, i) => {
        const cfg = WORKER_RUN_CONFIG[log.status] ?? WORKER_RUN_CONFIG["Success"]
        const Icon = (LucideIcons as unknown as Record<string, LIcon>)[cfg.icon]
        const isHov = hoveredIdx === i
        return (
          <div
            key={log.id}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: "8px 10px", borderRadius: 8,
              border: `1px solid ${isHov ? "var(--color-border-primary-default)" : "var(--hi-informative-bg)"}`,
              background: isHov ? "var(--color-surface-primary-subtle)" : "var(--widget-bg)",
              cursor: "pointer", transition: "background 150ms, border-color 150ms", flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {Icon && <Icon size={12} style={{ color: cfg.color }} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-title)",
                  flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.workerName} — {log.id}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {log.status === "Failed"  && <LucideIcons.XCircle       size={11} style={{ color: "var(--color-text-error)"             }} />}
                {log.status === "Warning" && <LucideIcons.AlertTriangle  size={11} style={{ color: "var(--color-surface-alert-default)" }} />}
                <span style={{ fontSize: 11, color: "var(--color-text-subtitle)" }}>{log.startedAt}</span>
                <LucideIcons.ChevronRight size={11} style={{ color: "var(--color-text-subtitle)" }} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: "1.4",
                margin: 0, paddingLeft: 34, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {log.status} run · Duration: {log.duration}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Entity list item factory ───────────────────────────────────────────────────

function toEntityItem(
  w: Worker,
  onPreview: (id: string) => void,
  onMenu:    (id: string, anchor: { left: number; top: number }) => void,
  onDetail:  (id: string) => void,
  getPtr:    () => { x: number; y: number },
): EntityListItemData {
  return {
    id:          w.id,
    title:       w.name,
    iconVariant: "info",
    iconName:    "Bot",
    primaryMeta:   [{ iconName: CATEGORY_ICON[w.category], label: w.category }],
    secondaryMeta: [
      { iconName: "User",  label: `Owner: ${w.owner}` },
      { iconName: "Clock", label: `Last run: ${w.lastRun}` },
    ],
    state:    { label: w.status, variant: STATUS_TAG[w.status] },
    showMenu: true,
    onMenuClick: () => {
      const { x, y } = getPtr()
      // Right-align menu with the button; clamp so it never overflows the viewport
      onMenu(w.id, {
        left: Math.max(4, Math.min(x - 252, window.innerWidth - 264)),
        top:  y + 20,
      })
    },
    onClick: () => onDetail(w.id),
    actions: [
      { label: "Publish", variant: "primary"   },
      { label: "Edit",    variant: "secondary" },
      { label: "Preview", icon: "Eye", variant: "tertiary", onClick: () => onPreview(w.id) },
    ],
  }
}

// ── Worker Detail View ────────────────────────────────────────────────────────

function WorkerDetailViewMichael({ worker, onBack }: { worker: Worker; onBack: () => void }) {
  const [tab,         setTab]         = useState<"overview" | "users" | "logs">("overview")
  const [logsPage,    setLogsPage]    = useState(1)
  const [logsPageSize,setLogsPageSize]= useState(5)

  const logs      = useMemo(() => getLogs(worker), [worker])
  const users     = useMemo(() => getUsers(worker), [worker])
  const pagedLogs = useMemo(() => logs.slice((logsPage - 1) * logsPageSize, logsPage * logsPageSize), [logs, logsPage, logsPageSize])

  const totalRuns   = logs.length
  const successRuns = logs.filter(l => l.status === "Success").length
  const failedRuns  = logs.filter(l => l.status === "Failed").length
  const avgDuration = (logs.reduce((s, l) => s + parseFloat(l.duration), 0) / totalRuns).toFixed(1) + "s"

  return (
    <ScreenLayout
      workspaceName="Acme Corp"
      userName="Juan Pérez"
      userEmail="juan@acme.com"
      sidebarItems={SIDEBAR_ITEMS}
      activeSidebarId="ai-workers"
      header={(isScrolled) => (
        <div>
          {!isScrolled && (
            <button
              onClick={onBack}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                border: "none", background: "none", cursor: "pointer",
                padding: "0 0 6px 0", color: "var(--primary)",
              }}
            >
              <LucideIcons.ChevronLeft size={13} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>AI Workers</span>
            </button>
          )}
          <Header
            size={isScrolled ? "compress" : "size-l"}
            title={worker.name}
            description={`${worker.category} · Owner: ${worker.owner} · Last run: ${worker.lastRun === "—" ? "Never" : worker.lastRun}`}
            tag={<Tag variant={STATUS_TAG[worker.status]} size="sm">{worker.status}</Tag>}
            primaryAction={
              <Button variant="main" size="sm">
                <LucideIcons.Pencil size={13} /> Edit
              </Button>
            }
          />
        </div>
      )}
      pagination={
        tab === "logs" && logs.length > logsPageSize ? (
          <Pagination
            currentPage={logsPage}
            totalItems={logs.length}
            itemsPerPage={logsPageSize}
            onPageChange={setLogsPage}
            onItemsPerPageChange={n => { setLogsPageSize(n); setLogsPage(1) }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        ) : undefined
      }
    >
      <Tabs
        items={[
          { id: "overview", label: "Overview" },
          { id: "users",    label: "Users"    },
          { id: "logs",     label: "Logs"     },
        ]}
        activeId={tab}
        onChange={(id) => { setTab(id as typeof tab); setLogsPage(1) }}
        className="mb-[16px]"
      />

      {/* ── Detail Overview — Widget Canvas ── */}
      {tab === "overview" && (
        <WidgetCanvasView
          initialSlots={[
            {
              uid: "total-runs", title: "Total Runs", colSpan: 1,
              content: <KpiContent value={totalRuns} feedback="All time" iconName="Activity" iconVariant="informative" />,
            },
            {
              uid: "successful", title: "Successful", colSpan: 1,
              content: <KpiContent value={successRuns} feedback={`${Math.round(successRuns / totalRuns * 100)}% success rate`} iconName="CircleCheck" iconVariant="success" />,
            },
            {
              uid: "failed", title: "Failed", colSpan: 1,
              content: <KpiContent value={failedRuns} feedback="Runs with errors" iconName="CircleX" iconVariant="error" />,
            },
            {
              uid: "avg-duration", title: "Avg Duration", colSpan: 1,
              content: <KpiContent value={avgDuration} feedback="Per run" iconName="Timer" iconVariant="neutral" />,
            },
            {
              uid: "run-history", title: "Run History", colSpan: 2, widthClass: "wide",
              content: (
                <div style={{ padding: "0 16px 16px" }}>
                  <Table columns={SLIDE_LOGS_COLS} data={logs} size="sm" emptyTitle="No runs" emptyDescription="This worker hasn't run yet." />
                </div>
              ),
            },
            {
              uid: "configuration", title: "Configuration", colSpan: 1,
              content: <WorkerConfigContent worker={worker} />,
            },
          ] satisfies CanvasSlot[]}
        />
      )}

      {/* ── Users tab ── */}
      {tab === "users" && (
        <Table
          columns={USERS_COLS}
          data={users}
          size="sm"
          emptyTitle="No users"
          emptyDescription="No one has access yet."
        />
      )}

      {/* ── Logs tab — always paginates ── */}
      {tab === "logs" && (
        <Table
          columns={SLIDE_LOGS_COLS}
          data={pagedLogs}
          size="sm"
          emptyTitle="No runs yet"
          emptyDescription="This worker hasn't run yet."
        />
      )}
    </ScreenLayout>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function PMMichaelTestV1Screen() {
  // Workers list state
  const [filterStatus,   setFilterStatus]   = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [openSlot,       setOpenSlot]       = useState<string | null>(null)
  const [page,           setPage]           = useState(1)
  const [pageSize,       setPageSize]       = useState(5)

  // Logs pagination — always shown on Logs tab
  const [logsPage,     setLogsPage]     = useState(1)
  const [logsPageSize, setLogsPageSize] = useState(10)

  // Main tabs
  const [mainTab, setMainTab] = useState<"overview" | "workers" | "logs">("overview")

  // SlideOut detail
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const openPreview = (id: string) => { setPreviewId(id); setActiveTab(0) }

  // New Worker modal
  const [showCreate,  setShowCreate]  = useState(false)
  const [newName,     setNewName]     = useState("")
  const [newCategory, setNewCategory] = useState<WorkerCategory | "">("")

  // Context menu for entity list items
  const [menuWorkerId, setMenuWorkerId] = useState<string | null>(null)
  const [menuAnchor,   setMenuAnchor]   = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  // Click-to-detail
  const [detailWorkerId, setDetailWorkerId] = useState<string | null>(null)

  // Pointer tracking — onMenuClick provides no event, so we track cursor globally
  const lastPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Derived
  const activeCount  = WORKERS.filter(w => w.status === "Active").length
  const runningCount = WORKERS.filter(w => w.status === "Running").length
  const draftCount   = WORKERS.filter(w => w.status === "Draft").length

  const filtered = useMemo(
    () => WORKERS.filter(w =>
      (!filterStatus   || w.status   === filterStatus) &&
      (!filterCategory || w.category === filterCategory)
    ),
    [filterStatus, filterCategory],
  )

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const allLogs   = useMemo(() => WORKERS.flatMap(getLogs), [])
  const pagedLogs = useMemo(
    () => allLogs.slice((logsPage - 1) * logsPageSize, logsPage * logsPageSize),
    [allLogs, logsPage, logsPageSize]
  )
  const recentLogs = useMemo(() => allLogs.slice(0, 5), [allLogs])

  const previewWorker = WORKERS.find(w => w.id === previewId)

  const handleCreate = () => {
    setShowCreate(false)
    setNewName("")
    setNewCategory("")
  }

  const openMenu = (id: string, anchor: { left: number; top: number }) => {
    setMenuWorkerId(id)
    setMenuAnchor(anchor)
  }

  // Keep lastPointer current for menu positioning
  useEffect(() => {
    const update = (e: MouseEvent) => { lastPointer.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener("mousemove", update)
    return () => window.removeEventListener("mousemove", update)
  }, [])

  // Close menu on any outside click
  useEffect(() => {
    if (!menuWorkerId) return
    const close = () => setMenuWorkerId(null)
    window.addEventListener("pointerdown", close)
    return () => window.removeEventListener("pointerdown", close)
  }, [menuWorkerId])

  // Early return — full-screen Worker detail page
  if (detailWorkerId) {
    const w = WORKERS.find(worker => worker.id === detailWorkerId)
    if (w) return <WorkerDetailViewMichael worker={w} onBack={() => setDetailWorkerId(null)} />
  }

  return (
    <ScreenLayout
      workspaceName="Acme Corp"
      userName="Juan Pérez"
      userEmail="juan@acme.com"
      sidebarItems={SIDEBAR_ITEMS}
      activeSidebarId="ai-workers"
      header={(isScrolled) => (
        <Header
          size={isScrolled ? "compress" : "size-l"}
          title="AI Workers"
          description="Manage and monitor AI workers for this tenant."
          tag={<Tag variant="success" size="sm">{activeCount} Active</Tag>}
          primaryAction={
            <Button variant="main" size="sm" onClick={() => setShowCreate(true)}>
              <LucideIcons.Plus size={13} /> New Worker
            </Button>
          }
        />
      )}
      pagination={
        mainTab === "workers" && filtered.length > pageSize
          ? (
              <Pagination
                currentPage={page}
                totalItems={filtered.length}
                itemsPerPage={pageSize}
                onPageChange={setPage}
                onItemsPerPageChange={n => { setPageSize(n); setPage(1) }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            )
          : mainTab === "logs" && allLogs.length > logsPageSize
          ? (
              <Pagination
                currentPage={logsPage}
                totalItems={allLogs.length}
                itemsPerPage={logsPageSize}
                onPageChange={setLogsPage}
                onItemsPerPageChange={n => { setLogsPageSize(n); setLogsPage(1) }}
                rowsPerPageOptions={[10, 25, 50]}
              />
            )
          : undefined
      }
    >
      {/* ── Main tabs ── */}
      <Tabs
        items={[
          { id: "overview", label: "Overview" },
          { id: "workers",  label: "Workers"  },
          { id: "logs",     label: "Logs"     },
        ]}
        activeId={mainTab}
        onChange={(id) => { setMainTab(id as typeof mainTab); setPage(1); setLogsPage(1) }}
        className="mb-[16px]"
      />

      {/* ── Overview tab — interactive Widget Canvas via WidgetCanvasView ── */}
      {mainTab === "overview" && (
        <WidgetCanvasView
          initialSlots={[
            {
              uid: "total-workers", title: "Total Workers", colSpan: 1,
              content: <KpiContent value={WORKERS.length} feedback="All categories" iconName="Bot" iconVariant="informative" />,
            },
            {
              uid: "active", title: "Active", colSpan: 1,
              content: <KpiContent value={activeCount} feedback="Running successfully" iconName="CircleCheck" iconVariant="success" />,
            },
            {
              uid: "running-now", title: "Running Now", colSpan: 1,
              content: <KpiContent value={runningCount} feedback="In execution" iconName="Play" iconVariant="informative" />,
            },
            {
              uid: "draft", title: "Draft", colSpan: 1,
              content: <KpiContent value={draftCount} feedback="Not yet published" iconName="FileText" iconVariant="neutral" />,
            },
            {
              uid: "recent-activity", title: "Recent Activity", colSpan: 2, widthClass: "wide",
              content: <WorkerActivityContent logs={recentLogs} />,
            },
          ] satisfies CanvasSlot[]}
        />
      )}

      {/* ── Workers tab — filtered list ── */}
      {mainTab === "workers" && (
        <ListViewSection
          items={paged.map(w => toEntityItem(w, openPreview, openMenu, setDetailWorkerId, () => lastPointer.current))}
          searchPlaceholder="Search workers..."
          filterSlots={[
            {
              placeholder: "Status",
              value:    filterStatus ?? undefined,
              onOpen:   () => setOpenSlot(p => p === "Status"   ? null : "Status"),
              onRemove: () => { setFilterStatus(null); setPage(1) },
            },
            {
              placeholder: "Category",
              value:    filterCategory ?? undefined,
              onOpen:   () => setOpenSlot(p => p === "Category" ? null : "Category"),
              onRemove: () => { setFilterCategory(null); setPage(1) },
            },
          ]}
          filterOptions={FILTER_OPTIONS}
          onFilterSelect={(slot, value) => {
            if (slot === "Status") setFilterStatus(value); else setFilterCategory(value)
            setPage(1)
            setOpenSlot(null)
          }}
          openSlot={openSlot}
          onOpenSlotChange={setOpenSlot}
          showPreview={false}
          emptyLabel="No workers match these filters."
        />
      )}

      {/* ── Logs tab — paginated run history (always shows Pagination) ── */}
      {mainTab === "logs" && (
        <Table
          columns={ALL_LOGS_COLS}
          data={pagedLogs}
          size="sm"
          emptyTitle="No logs yet"
          emptyDescription="No workers have run yet."
        />
      )}

      {/* ── Worker detail SlideOut ── */}
      <SlideOut
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
        title={previewWorker?.name ?? "Worker detail"}
        subtitle={previewWorker ? `${previewWorker.category} · ${previewWorker.status}` : ""}
        type="with-variants"
        size="s"
        showStatus={false}
        showSearchBar={false}
        showChips={false}
        showTabs
        showTab3
        tabLabels={["Overview", "Users", "Logs"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCta
        ctaPrimaryLabel="Publish"
        ctaSecondaryLabel="Edit"
      >
        {previewWorker && (
          <div className="flex flex-col">
            {activeTab === 0 && (
              <div className="flex flex-col">
                <DetailRow label="Status">
                  <Tag variant={STATUS_TAG[previewWorker.status]} size="sm">{previewWorker.status}</Tag>
                </DetailRow>
                <DetailRow label="Category">{previewWorker.category}</DetailRow>
                <DetailRow label="Owner">{previewWorker.owner}</DetailRow>
                <DetailRow label="Last run">{previewWorker.lastRun === "—" ? "Never" : previewWorker.lastRun}</DetailRow>
              </div>
            )}
            {activeTab === 1 && (
              <Table columns={USERS_COLS} data={getUsers(previewWorker)} size="sm"
                emptyTitle="No users" emptyDescription="No one has access yet." />
            )}
            {activeTab === 2 && (
              <Table columns={SLIDE_LOGS_COLS} data={getLogs(previewWorker)} size="sm"
                emptyTitle="No runs yet" emptyDescription="This worker hasn't run yet." />
            )}
          </div>
        )}
      </SlideOut>

      {/* ── New Worker creation modal ── */}
      <ModalDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        variant="content"
        showIcon
        iconName="Bot"
        title="New AI Worker"
        description="Configure your new worker. You can adjust all settings after creation."
        slot={
          <div className="flex flex-col gap-[16px]">
            {/* Desktop: no label prop — placeholder only */}
            <Input
              placeholder="Worker name"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            />
            <div className="flex flex-col gap-[8px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--field-label)" }}>
                Category
              </p>
              <div className="flex flex-col gap-[6px]">
                {(["Analytics", "CX", "Operations"] as WorkerCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className="w-full text-left flex items-center gap-[10px] px-[12px] py-[10px] rounded-[8px] transition-colors"
                    style={{
                      background: newCategory === cat ? "var(--color-surface-primary-subtle)" : "var(--field-bg)",
                      border:     newCategory === cat ? "1px solid var(--primary)" : "0.5px solid var(--field-border)",
                    }}
                  >
                    <LucideIcons.CheckCircle
                      size={14}
                      style={{ color: newCategory === cat ? "var(--primary)" : "var(--field-border)", flexShrink: 0 }}
                    />
                    <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
        ctaPrimary={{
          label:   "Create Worker",
          onClick: handleCreate,
        }}
        ctaSecondary={{
          label:   "Cancel",
          onClick: () => setShowCreate(false),
        }}
      />

      {/* ── Entity list context menu ── */}
      {menuWorkerId && (
        <div
          style={{ position: "fixed", left: menuAnchor.left, top: menuAnchor.top, zIndex: 10002 }}
          onPointerDown={e => e.stopPropagation()}
        >
          <Menu>
            <MenuItem
              label="Duplicate"
              leadingIcon={<LucideIcons.Copy size={14} />}
              onClick={() => setMenuWorkerId(null)}
            />
            <MenuItem
              label="Archive"
              leadingIcon={<LucideIcons.Archive size={14} />}
              onClick={() => setMenuWorkerId(null)}
            />
            <MenuDivider />
            <MenuItem
              label="Delete"
              leadingIcon={<LucideIcons.Trash2 size={14} />}
              onClick={() => setMenuWorkerId(null)}
            />
          </Menu>
        </div>
      )}
    </ScreenLayout>
  )
}
