import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  SlidersHorizontal, Plug, Inbox, BarChart2, Settings,
  Library, GitFork, Navigation, Radio, Hash,
  Link2, Network, Paperclip,
  List, CheckCircle, AlertTriangle, RefreshCw,
  LayoutDashboard, Clock, Route as RouteIcon, Activity, GraduationCap,
  FileText, CalendarOff, Zap, Shield,
  Bell, Search, Sun, Moon, ChevronDown, ChevronLeft, ChevronRight, User, Users
} from 'lucide-react'

import './shell.css'

// Pages
import Demo from './pages/Demo.jsx'
import PackLibrary from './pages/PackLibrary.jsx'
import Queue from './pages/Queue.jsx'
import WorkQueueLayout from './pages/WorkQueueLayout.jsx'
import WQOverview from './pages/WQOverview.jsx'
import WQQueue from './pages/WQQueue.jsx'
import WQActivity from './pages/WQActivity.jsx'
import WQAttestations from './pages/WQAttestations.jsx'
import WQTaskView from './pages/WQTaskView.jsx'
import WQMessages from './pages/WQMessages.jsx'
import WQMessagesProposal from './pages/WQMessagesProposal.jsx'
import Overview from './pages/Overview.jsx'
import Routing from './pages/Routing.jsx'
import Destinations from './pages/Destinations.jsx'
import SensitiveSignals from './pages/SensitiveSignals.jsx'
import Channels from './pages/Channels.jsx'
import NodeBinding from './pages/NodeBinding.jsx'
import AgenticNetworks from './pages/AgenticNetworks.jsx'
import PackAttachment from './pages/PackAttachment.jsx'
import Handled from './pages/Handled.jsx'
import Escalations from './pages/Escalations.jsx'
import Continuation from './pages/Continuation.jsx'
import SLA from './pages/SLA.jsx'
import RoutingLog from './pages/RoutingLog.jsx'
import Signals from './pages/Signals.jsx'
import TrainMe from './pages/TrainMe.jsx'
import InboxItem from './pages/InboxItem.jsx'
import Templates from './pages/Templates.jsx'
import OOOCoverage from './pages/OOOCoverage.jsx'
import Integrations from './pages/Integrations.jsx'
import Audit from './pages/Audit.jsx'
import PackBuilder from './pages/PackBuilder.jsx'
import Triggers from './pages/Triggers.jsx'
import TeamsAndQueues from './pages/TeamsAndQueues.jsx'
import TeamDetail from './pages/TeamDetail.jsx'
import ConditionDetail from './pages/ConditionDetail.jsx'

const NAV = [
  {
    section: null, icon: SlidersHorizontal,
    items: [
      { label: 'Work Queue', path: '/work-queue/overview', icon: List, badge: 12 },
      { label: 'Pack Library', path: '/configure/packs', icon: Library },
    ]
  },
  {
    section: 'Connect', icon: Plug,
    items: [
      { label: 'Node Binding', path: '/connect/nodes', icon: Link2 },
    ]
  },
  {
    section: 'Reports', icon: BarChart2,
    items: [
      { label: 'SLA', path: '/reports/sla', icon: Clock },
      { label: 'Routing Log', path: '/reports/routing-log', icon: RouteIcon },
      { label: 'Signals', path: '/reports/signals', icon: Activity },
      { label: 'Train Me', path: '/reports/train-me', icon: GraduationCap, badge: 7 },
      { label: 'Audit', path: '/settings/audit', icon: Shield },
    ]
  },
  {
    section: 'Settings', icon: Settings,
    items: [
      { label: 'Conditions',         path: '/settings/triggers',      icon: Zap        },
      { label: 'Teams & Queues',    path: '/settings/teams',         icon: Users      },
      { label: 'Destinations',      path: '/configure/destinations', icon: Navigation },
      { label: 'Sensitive Signals', path: '/configure/signals',      icon: Radio      },
    ]
  },
]

function useBreadcrumb(path) {
  const parts = path.split('/').filter(Boolean)
  const labels = {
    configure: 'Configure', connect: 'Connect', inbox: 'Inbox',
    reports: 'Reports', settings: 'Settings', demo: 'Demo',
    packs: 'Pack Library', routing: 'Routing', destinations: 'Destinations',
    signals: 'Sensitive Signals', channels: 'Channels',
    nodes: 'Node Binding', networks: 'Agentic Networks', attachment: 'Pack Attachment',
    'work-queue': 'Work Queue', 'work-queues': 'Work Queues', queue: 'Queue', handled: 'Handled', escalations: 'Escalations', continuation: 'Continuation', items: 'Item',
    attestations: 'Attestations', activity: 'Activity',
    overview: 'Overview', sla: 'SLA', 'routing-log': 'Routing Log', 'train-me': 'Train Me',
    templates: 'Templates', ooo: 'OOO & Coverage', integrations: 'Integrations', audit: 'Audit',
    conditions: 'Conditions', teams: 'Teams & Queues',
  }
  return ['HTL', ...parts.map(p => labels[p] || p)]
}

// ─── Live simulation data ─────────────────────────────────────────────────────
const LIVE_EVENTS = [
  { type: 'Handoff',     customer: 'Maria Chen',      pack: 'Customer Escalation — Tier 1' },
  { type: 'Hot Lead',    customer: 'James Rodriguez',  pack: 'Hot Lead Closure' },
  { type: 'Approval',    customer: 'Northfield Partners', pack: 'Invoice Approval — Finance' },
  { type: 'Handoff',     customer: 'Sarah Kim',        pack: 'Customer Escalation — Tier 1' },
  { type: 'Signal',      customer: 'Alex Thompson',    pack: 'Whistleblower & Compliance' },
  { type: 'Hot Lead',    customer: 'Jordan Martinez',  pack: 'Hot Lead Closure' },
  { type: 'Continuation',customer: 'Priya Patel',      pack: 'Procurement Gate — Mid-Market' },
]
let liveEventIdx = 0

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('htl-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('htl-sidebar-collapsed') === 'true'
  )
  const [queueCount,      setQueueCount]      = useState(12)
  const [liveToast,       setLiveToast]       = useState(null)
  const [expandedSection, setExpandedSection] = useState(null)

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section)
  }
  const toastTimer = useRef(null)
  const location = useLocation()
  const crumbs = useBreadcrumb(location.pathname)

  const toggleSidebar = () => {
    setSidebarCollapsed(c => {
      const next = !c
      localStorage.setItem('htl-sidebar-collapsed', String(next))
      return next
    })
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('htl-theme', next)
  }

  // Live item simulation — new item every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const evt = LIVE_EVENTS[liveEventIdx % LIVE_EVENTS.length]
      liveEventIdx++
      setQueueCount(c => c + 1)
      setLiveToast(evt)
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setLiveToast(null), 4500)
    }, 45000)
    return () => { clearInterval(interval); clearTimeout(toastTimer.current) }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return (
    <div className="shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-row">
            <div className="logo-mark" />
            <span className="logo-name">HTL</span>
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed
                ? <ChevronRight size={13} />
                : <ChevronLeft  size={13} />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="studio-switcher">
              <span>Human Touch Layer</span>
              <ChevronDown size={10} />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ section, icon: SectionIcon, items }) => {
            // In collapsed mode, rely on CSS :hover flyout — don't apply click-open class
            const isOpen   = section ? (!sidebarCollapsed && expandedSection === section) : true
            const isAlways = !section
            return (
              <div
                key={section ?? '__top__'}
                className={`nav-section${isOpen && !isAlways ? ' nav-section--open' : ''}`}
              >
                {section && (
                  <div
                    className="nav-section-label"
                    data-tooltip={section}
                    onClick={() => toggleSection(section)}
                    style={{ cursor: 'pointer' }}
                  >
                    <SectionIcon size={12} />
                    <span className="nav-section-text">{section}</span>
                    <ChevronDown
                      size={10}
                      style={{
                        marginLeft: 'auto',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-tertiary)',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                )}
                <div className={isAlways ? 'nav-submenu nav-submenu--always' : `nav-submenu${isOpen ? ' nav-submenu--open' : ''}`}>
                  {items.map(({ label, path, icon: Icon, badge }) => (
                    <NavLink
                      key={path}
                      to={path}
                      data-tooltip={label}
                      className={({ isActive }) =>
                        `nav-item${isActive ? ' nav-item--active' : ''}`
                      }
                    >
                      <Icon size={14} />
                      <span className="nav-item-label">{label}</span>
                      {badge != null && (
                        <span className={`nav-badge${path === '/work-queue/overview' && queueCount > 12 ? ' nav-badge--live' : ''}`}>
                          {path === '/work-queue/overview' ? queueCount : badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" data-tooltip="Alexa M. — Admin">
          <div className="user-avatar-sm">
            <User size={12} />
          </div>
          <div className="user-info">
            <span className="user-name">Alexa M.</span>
            <span className="user-role">Admin</span>
          </div>
          <Settings size={13} className="footer-settings" />
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">
              {crumbs.map((c, i) => (
                <span key={i} className="crumb-piece">
                  {i > 0 && <span className="crumb-sep">›</span>}
                  <span className={i === crumbs.length - 1 ? 'crumb-active' : 'crumb-muted'}>{c}</span>
                </span>
              ))}
            </span>
          </div>

          <div className="topbar-center">
            <div className="search-wrap">
              <Search size={13} className="search-icon" />
              <input className="search-input" placeholder="Search packs, agents, signals…" />
            </div>
          </div>

          <div className="topbar-right">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="icon-btn notif-btn" title="Notifications">
              <Bell size={15} />
              <span className="notif-dot" />
            </button>
            <button className="icon-btn" title="Settings">
              <Settings size={15} />
            </button>
            <div className="user-pill">
              <div className="user-avatar-sm" />
              <span>Northfield Partners</span>
            </div>
          </div>
        </header>

        {/* Live item toast */}
        {liveToast && (
          <div className="shell-live-toast" onClick={() => setLiveToast(null)}>
            <span className="shell-live-toast-dot" />
            <div className="shell-live-toast-body">
              <div className="shell-live-toast-title">New {liveToast.type} — {liveToast.customer}</div>
              <div className="shell-live-toast-pack">{liveToast.pack}</div>
            </div>
            <Inbox size={13} className="shell-live-toast-icon" />
          </div>
        )}

        {/* Page content */}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/work-queue/overview" replace />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/configure/packs" element={<PackLibrary />} />
            <Route path="/configure/packs/new" element={<PackBuilder />} />
            <Route path="/configure/packs/:id" element={<PackBuilder />} />
            <Route path="/configure/packs/:id/edit" element={<PackBuilder />} />
            <Route path="/configure/packs/:id/workflows" element={<PackBuilder />} />
            <Route path="/configure/packs/:id/versions" element={<PackBuilder />} />
            <Route path="/configure/routing" element={<Routing />} />
            <Route path="/configure/destinations" element={<Destinations />} />
            <Route path="/configure/signals" element={<SensitiveSignals />} />
            <Route path="/configure/channels" element={<Channels />} />
            <Route path="/connect/nodes" element={<NodeBinding />} />
            <Route path="/connect/networks" element={<AgenticNetworks />} />
            <Route path="/connect/attachment" element={<PackAttachment />} />
            <Route path="/inbox/queue" element={<Queue />} />
            <Route path="/work-queue" element={<WorkQueueLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<WQOverview />} />
              <Route path="work-queues" element={<WQQueue />} />
              <Route path="queue" element={<Navigate to="/work-queue/work-queues" replace />} />
              <Route path="messages" element={<WQMessages />} />
              <Route path="messages-proposal" element={<WQMessagesProposal />} />
              <Route path="activity" element={<WQActivity />} />
              <Route path="attestations" element={<WQAttestations />} />
              <Route path="task-view" element={<WQTaskView />} />
            </Route>
            <Route path="/inbox/items/:id" element={<InboxItem />} />
            <Route path="/inbox/handled" element={<Handled />} />
            <Route path="/inbox/escalations" element={<Escalations />} />
            <Route path="/inbox/continuation" element={<Continuation />} />
            <Route path="/reports/overview" element={<Overview />} />
            <Route path="/reports/sla" element={<SLA />} />
            <Route path="/reports/routing-log" element={<RoutingLog />} />
            <Route path="/reports/signals" element={<Signals />} />
            <Route path="/reports/train-me" element={<TrainMe />} />
            <Route path="/settings/templates" element={<Templates />} />
            <Route path="/settings/ooo" element={<OOOCoverage />} />
            <Route path="/settings/triggers" element={<Triggers />} />
            <Route path="/settings/conditions/:id" element={<ConditionDetail />} />
            <Route path="/settings/teams" element={<TeamsAndQueues />} />
            <Route path="/settings/teams/:id" element={<TeamDetail />} />
            <Route path="/settings/integrations" element={<Integrations />} />
            <Route path="/settings/audit" element={<Audit />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
