import { useState, useMemo, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search, Send, Users, Sparkles, X } from 'lucide-react'
import { PEOPLE, STUDIOS } from '../data/workQueueData'

// ─── Proposal-local mock data ───────────────────────────────────────────────────
// Self-contained: does not read or write workQueueData.js. Threads are inspired by
// the same events/messages already in the app (Break Glass, KBU coverage, GE-FIN
// conflicts, SalesForecastPA migration, PII hold, budget, cross-studio incident)
// so the content feels continuous with the rest of the prototype.

const TODAY_ISO = '2026-07-02'

const CONVERSATIONS = [
  {
    id: 'grp-1', type: 'group', name: 'HTL Team Announcements', memberIds: PEOPLE.map(p => p.id),
    messages: [
      { from: 'p11', timestamp: '2026-06-17T07:00:00Z', body: 'All managers must complete Q2 access recertification by June 27. Failure to certify will trigger automatic access suspension. Contact IT Security with questions.' },
      { from: 'p1',  timestamp: '2026-06-17T08:00:00Z', body: 'Scheduled maintenance for embedding index refresh and connector token rotation on Jun 20, 02:00–04:00 UTC. All HITL queues will pause during the window. Please ensure critical events are resolved before then.' },
      { from: 'p1',  timestamp: '2026-06-20T04:05:00Z', body: 'Maintenance completed successfully — all queues back online.' },
    ],
  },
  {
    id: 'dm-1', type: 'dm', participants: ['p1', 'p2'],
    messages: [
      { from: 'p2', timestamp: '2026-06-17T09:05:00Z', body: "I've approved BG-0091 from my side. Can you confirm the second approval? The incident team is waiting." },
      { from: 'p1', timestamp: '2026-06-17T09:12:00Z', body: 'Confirmed — I just approved the second signature on Break Glass. Incident team is clear to proceed.' },
      { from: 'p2', timestamp: '2026-06-17T09:14:00Z', body: 'Perfect, thank you. Logging it in the audit trail now.' },
    ],
  },
  {
    id: 'dm-2', type: 'dm', participants: ['p1', 'p3'],
    messages: [
      { from: 'p3', timestamp: '2026-06-17T07:30:00Z', body: "Just a heads up — I've picked up Luis's delegated items (EVT-006, EVT-011). Will action KBU review today." },
      { from: 'p1', timestamp: '2026-06-17T07:41:00Z', body: 'Thanks Priya, appreciate you covering. Ping me if the KBU decision needs an exec sign-off.' },
    ],
  },
  {
    id: 'dm-3', type: 'dm', participants: ['p10', 'p9'],
    messages: [
      { from: 'p10', timestamp: '2026-06-17T10:00:00Z', body: "The auto-migrate option on EVT-008 looks safe to me but want a second opinion before we touch the agentic spec. Can you review?" },
      { from: 'p9',  timestamp: '2026-06-17T10:22:00Z', body: "Reviewed it — auto-migrate handles the Truth v3.1 → v4 mapping cleanly. I'd go ahead." },
      { from: 'p10', timestamp: '2026-06-17T10:24:00Z', body: 'Great, kicking it off now.' },
    ],
  },
  {
    id: 'dm-4', type: 'dm', participants: ['p2', 'p4'],
    messages: [
      { from: 'p4', timestamp: '2026-06-30T14:22:00Z', body: "Hey Marcus — quick question. Do you have context on why GE-FIN-001 and GE-FIN-007 are showing as conflicting in the latest DIAN intake? I can see them flagged but I don't have access to the original source documents to verify which one is actually correct. Is this something that was already reviewed last quarter?" },
      { from: 'p2', timestamp: '2026-06-30T15:03:00Z', body: 'Good catch — GE-FIN-007 supersedes 001, it was corrected in the Q1 review but the old claim never got archived. Go ahead and flag 001 for retirement.' },
      { from: 'p4', timestamp: '2026-06-30T15:06:00Z', body: "Got it, thank you! I'll close it out in KCON." },
    ],
  },
  {
    id: 'dm-5', type: 'dm', participants: ['p10', 'p6'],
    messages: [
      { from: 'p10', timestamp: '2026-07-01T08:45:00Z', body: "Casey — heads up on the SalesForecastPA workflow spec. It's still pinned to Truth v3.1 which retires Jul 1. Do you know if Taylor already started the migration, or do we need to escalate this?" },
      { from: 'p6',  timestamp: '2026-07-01T08:52:00Z', body: "Looking into it now. Taylor was supposed to handle it but I haven't seen any PR yet." },
      { from: 'p10', timestamp: '2026-07-01T09:03:00Z', body: "Can you take ownership and push the update today? I'll send the attestation once it's ready. We can't let this slip past cutover." },
      { from: 'p6',  timestamp: '2026-07-01T09:20:00Z', body: "On it — I'll have the workflow spec repointed to v4 by end of day and send the attestation." },
    ],
  },
  {
    id: 'dm-6', type: 'dm', participants: ['p5', 'p3'],
    messages: [
      { from: 'p5', timestamp: '2026-06-18T11:00:00Z', body: 'Priya — the monthly embedding re-index window is set for Jun 20, 02:00–04:00 UTC. Want me to widen it an hour given the index size growth?' },
      { from: 'p3', timestamp: '2026-06-18T11:15:00Z', body: "Let's keep it at 2 hours for now, but flag it if we get close to the limit." },
    ],
  },
  {
    id: 'dm-7', type: 'dm', participants: ['p7', 'p4'],
    messages: [
      { from: 'p7', timestamp: '2026-06-17T09:40:00Z', body: 'Jordan — following up on PII-HOLD-0614. Security scan flagged 34 SSNs in the HR batch upload. Can compliance sign off on the redaction plan once I send it over?' },
      { from: 'p4', timestamp: '2026-06-17T09:52:00Z', body: "Yes, send it my way and I'll get it reviewed today." },
    ],
  },
  {
    id: 'dm-8', type: 'dm', participants: ['p8', 'p2'],
    messages: [
      { from: 'p8', timestamp: '2026-06-19T13:10:00Z', body: 'Marcus, GE-FIN budget is sitting at 62% with 14 days left in the period. Projected overage is around 8% — want me to draft a reforecast?' },
      { from: 'p2', timestamp: '2026-06-19T13:25:00Z', body: 'Yes please, and loop in Finance leadership on the projection.' },
    ],
  },
  {
    id: 'dm-9', type: 'dm', participants: ['p11', 'p1'],
    messages: [
      { from: 'p11', timestamp: '2026-07-02T08:15:00Z', body: "Alexa — saw the cross-studio schema mismatch (CHAIN-0712) hit Critical. What's the ETA on the patch?" },
      { from: 'p1',  timestamp: '2026-07-02T08:22:00Z', body: "Team's applying the schema patch now — full quote pipeline should be back within the hour." },
      { from: 'p11', timestamp: '2026-07-02T08:23:00Z', body: 'Great, keep me posted if it slips.' },
    ],
  },
  {
    id: 'dm-10', type: 'dm', participants: ['p12', 'p3'],
    messages: [
      { from: 'p12', timestamp: '2026-06-20T16:00:00Z', body: "Priya — thanks again for covering KBU-4490 while I'm out. I'm back Jun 25 and can take it back then if it's still open." },
      { from: 'p3',  timestamp: '2026-06-20T16:05:00Z', body: 'No problem, I\'ve got it handled. Enjoy the rest of your time off!' },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function person(id) { return PEOPLE.find(p => p.id === id) }

function avatarColor(id) {
  const p = person(id)
  const studioKey = p?.studios?.[0]
  return STUDIOS[studioKey]?.accentColor || '#6b7280'
}

function otherParticipant(conv, currentUserId) {
  const otherId = conv.participants.find(id => id !== currentUserId)
  return person(otherId)
}

function lastMessage(conv) {
  return conv.messages[conv.messages.length - 1]
}

function dayLabel(iso) {
  const day = iso.slice(0, 10)
  if (day === TODAY_ISO) return 'Today'
  const yest = new Date(TODAY_ISO); yest.setDate(yest.getDate() - 1)
  if (day === yest.toISOString().slice(0, 10)) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function previewLabel(iso) {
  const label = dayLabel(iso)
  return label === 'Today' ? timeLabel(iso) : label
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ conv, currentUserId, size = 38 }) {
  if (conv.type === 'group') {
    return (
      <div className="wmp-avatar wmp-avatar--group" style={{ width: size, height: size, fontSize: size * 0.4 }}>
        <Users size={size * 0.5} />
      </div>
    )
  }
  const p = otherParticipant(conv, currentUserId)
  return (
    <div
      className="wmp-avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `${avatarColor(p?.id)}26`, color: avatarColor(p?.id), borderColor: `${avatarColor(p?.id)}55` }}
    >
      {p?.initials || '??'}
    </div>
  )
}

// ─── Sidebar contact row ─────────────────────────────────────────────────────
function ContactRow({ conv, currentUserId, isActive, isUnread, onClick }) {
  const last = lastMessage(conv)
  const title = conv.type === 'group' ? conv.name : otherParticipant(conv, currentUserId)?.name || 'Unknown'
  const senderPrefix = last.from === currentUserId ? 'You: ' : (conv.type === 'group' ? `${person(last.from)?.name.split(' ')[0]}: ` : '')

  return (
    <button
      className={`wmp-contact${isActive ? ' wmp-contact--active' : ''}`}
      onClick={onClick}
    >
      <Avatar conv={conv} currentUserId={currentUserId} />
      <div className="wmp-contact-main">
        <div className="wmp-contact-top">
          <span className="wmp-contact-name">{title}</span>
          <span className="wmp-contact-time">{previewLabel(last.timestamp)}</span>
        </div>
        <div className="wmp-contact-bottom">
          <span className={`wmp-contact-preview${isUnread ? ' wmp-contact-preview--unread' : ''}`}>
            {senderPrefix}{last.body}
          </span>
          {isUnread && <span className="wmp-unread-dot" />}
        </div>
      </div>
    </button>
  )
}

// ─── Thread ──────────────────────────────────────────────────────────────────
function Thread({ conv, currentUser, onSend }) {
  const [draft, setDraft] = useState('')
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [conv.messages.length, conv.id])

  const title = conv.type === 'group' ? conv.name : otherParticipant(conv, currentUser.id)?.name || 'Unknown'
  const subtitle = conv.type === 'group'
    ? `${conv.memberIds.length} members`
    : [otherParticipant(conv, currentUser.id)?.role, otherParticipant(conv, currentUser.id)?.dept].filter(Boolean).join(' · ')

  const handleSend = () => {
    if (!draft.trim()) return
    onSend(conv.id, draft.trim())
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  let lastDay = null

  return (
    <div className="wmp-thread">
      <div className="wmp-thread-header">
        <Avatar conv={conv} currentUserId={currentUser.id} size={36} />
        <div className="wmp-thread-header-info">
          <div className="wmp-thread-header-name">{title}</div>
          <div className="wmp-thread-header-sub">{subtitle}</div>
        </div>
      </div>

      <div className="wmp-thread-body" ref={bodyRef}>
        {conv.messages.map((msg, i) => {
          const day = dayLabel(msg.timestamp)
          const showDivider = day !== lastDay
          lastDay = day
          const isMe = msg.from === currentUser.id
          const sender = person(msg.from)
          return (
            <div key={i}>
              {showDivider && (
                <div className="wmp-day-divider"><span>{day}</span></div>
              )}
              <div className={`wmp-bubble-row${isMe ? ' wmp-bubble-row--me' : ' wmp-bubble-row--them'}`}>
                <div className={`wmp-bubble${isMe ? ' wmp-bubble--me' : ' wmp-bubble--them'}`}>
                  {conv.type === 'group' && !isMe && (
                    <div className="wmp-bubble-sender" style={{ color: avatarColor(msg.from) }}>{sender?.name}</div>
                  )}
                  <div className="wmp-bubble-body">{msg.body}</div>
                  <div className="wmp-bubble-time">{timeLabel(msg.timestamp)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="wmp-composer">
        <input
          className="wmp-composer-input"
          placeholder="Type a message…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="wmp-send-btn" disabled={!draft.trim()} onClick={handleSend} aria-label="Send">
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function WQMessagesProposal() {
  const { currentUser } = useOutletContext()
  const [conversations, setConversations] = useState(CONVERSATIONS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [openedIds, setOpenedIds] = useState(new Set())
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const myConversations = useMemo(() => {
    return conversations
      .filter(c => c.type === 'group' ? c.memberIds.includes(currentUser.id) : c.participants.includes(currentUser.id))
      .sort((a, b) => new Date(lastMessage(b).timestamp) - new Date(lastMessage(a).timestamp))
  }, [conversations, currentUser.id])

  useEffect(() => {
    if (myConversations.length && !myConversations.some(c => c.id === activeId)) {
      setActiveId(myConversations[0].id)
      setOpenedIds(prev => new Set([...prev, myConversations[0].id]))
    }
  }, [myConversations, activeId])

  const isUnread = (conv) => {
    const last = lastMessage(conv)
    return last.from !== currentUser.id && !openedIds.has(conv.id)
  }

  const filtered = myConversations.filter(c => {
    if (filter === 'unread' && !isUnread(c)) return false
    if (filter === 'groups' && c.type !== 'group') return false
    const q = search.toLowerCase()
    if (!q) return true
    const title = c.type === 'group' ? c.name : otherParticipant(c, currentUser.id)?.name || ''
    const matchesTitle = title.toLowerCase().includes(q)
    const matchesBody = c.messages.some(m => m.body.toLowerCase().includes(q))
    return matchesTitle || matchesBody
  })

  const activeConv = conversations.find(c => c.id === activeId)

  const handleSelect = (id) => {
    setActiveId(id)
    setOpenedIds(prev => new Set([...prev, id]))
  }

  const handleSend = (convId, body) => {
    setConversations(prev => prev.map(c => c.id === convId
      ? { ...c, messages: [...c.messages, { from: currentUser.id, timestamp: new Date().toISOString(), body }] }
      : c
    ))
  }

  return (
    <div className="wmp-root">
      {!bannerDismissed && (
        <div className="wmp-banner">
          <span className="wmp-banner-icon"><Sparkles size={14} /></span>
          <span className="wmp-banner-text">
            <strong>Proposal —</strong> a threaded, contact-based messaging view alongside the existing
            Messages tab. Explores a familiar chat pattern for team questions, attestation requests, and DMs.
          </span>
          <button className="wmp-banner-close" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="wmp-shell">
        <div className="wmp-sidebar">
          <div className="wmp-sidebar-header">
            <div className="wmp-sidebar-title">Messages</div>
            <div className="wmp-search-wrap">
              <Search size={13} className="wmp-search-icon" />
              <input
                className="wmp-search-input"
                placeholder="Search or start a new chat"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="wmp-filter-pills">
              {[
                { id: 'all',    label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'groups', label: 'Groups' },
              ].map(f => (
                <button
                  key={f.id}
                  className={`wmp-filter-pill${filter === f.id ? ' wmp-filter-pill--active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="wmp-contact-list">
            {filtered.length === 0 ? (
              <div className="wmp-empty">No conversations match.</div>
            ) : (
              filtered.map(c => (
                <ContactRow
                  key={c.id}
                  conv={c}
                  currentUserId={currentUser.id}
                  isActive={c.id === activeId}
                  isUnread={isUnread(c)}
                  onClick={() => handleSelect(c.id)}
                />
              ))
            )}
          </div>
        </div>

        {activeConv ? (
          <Thread conv={activeConv} currentUser={currentUser} onSend={handleSend} />
        ) : (
          <div className="wmp-thread wmp-thread--empty">
            <div className="wmp-empty-state">
              <Users size={28} />
              <p>Select a conversation to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
