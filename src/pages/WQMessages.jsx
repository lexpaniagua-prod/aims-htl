import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Flag, Send, Pin } from 'lucide-react'
import { Modal } from '../components/Modal'
import { MESSAGES, PEOPLE, EVENTS } from '../data/workQueueData'

function fmtTs(iso) {
  const d = new Date(iso)
  const now = new Date('2026-06-18T12:00:00Z')
  const diffH = (now - d) / 3600000
  if (diffH < 24) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return 'Yesterday ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function personName(id) {
  return PEOPLE.find(p => p.id === id)?.name || id
}
function personInitials(id) {
  return PEOPLE.find(p => p.id === id)?.initials || '??'
}

function eventTitle(evtId) {
  return EVENTS.find(e => e.id === evtId)?.title || evtId
}

function TypeBadge({ type, pinned }) {
  if (pinned || type === 'broadcast') {
    return <span className="wqm-badge wqm-badge--broadcast">Announcement</span>
  }
  return <span className="wqm-badge wqm-badge--dm">Question</span>
}

// ── Reply Modal ────────────────────────────────────────────────────────────────
function ReplyModal({ msg, currentUser, onClose, onSend }) {
  const sender = PEOPLE.find(p => p.id === msg.from)
  const [body, setBody] = useState('')

  const handleSend = () => {
    if (!body.trim()) return
    onSend({
      id: `MSG-${Date.now()}`,
      type: 'dm',
      pinned: false,
      from: currentUser.id,
      to: msg.from,
      subject: `Re: ${msg.subject}`,
      body,
      linkedEvent: msg.linkedEvent || null,
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reply to ${sender?.name || 'Unknown'}`}
      subtitle={msg.subject}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="wq-btn wq-btn--primary" disabled={!body.trim()} onClick={handleSend}>
            <Send size={12} style={{ marginRight: 4 }} /> Send Reply
          </button>
        </div>
      }
    >
      <div className="wqm-reply-form">
        <div className="wqm-quoted">
          <div className="wqm-quoted-meta">{sender?.name} · {fmtTs(msg.timestamp)}</div>
          <div className="wqm-quoted-body">{msg.body}</div>
        </div>
        <label className="wq-form-label" style={{ marginTop: 12 }}>
          Your reply
          <textarea
            className="wq-form-textarea"
            rows={4}
            placeholder={`Reply to ${sender?.name}…`}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </label>
      </div>
    </Modal>
  )
}

// ── Forward Modal ──────────────────────────────────────────────────────────────
function ForwardModal({ msg, currentUser, onClose, onSend }) {
  const [to, setTo] = useState('')
  const [note, setNote] = useState('')

  const handleSend = () => {
    if (!to) return
    onSend({
      id: `MSG-${Date.now()}`,
      type: 'dm',
      pinned: false,
      from: currentUser.id,
      to,
      subject: `Fwd: ${msg.subject}`,
      body: note ? `${note}\n\n— Forwarded —\n${msg.body}` : `— Forwarded —\n${msg.body}`,
      linkedEvent: msg.linkedEvent || null,
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Forward Message"
      subtitle={msg.subject}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="wq-btn wq-btn--primary" disabled={!to} onClick={handleSend}>
            <Send size={12} style={{ marginRight: 4 }} /> Forward
          </button>
        </div>
      }
    >
      <div className="wqm-reply-form">
        <label className="wq-form-label">
          Forward to
          <select
            className="wq-form-select"
            value={to}
            onChange={e => setTo(e.target.value)}
          >
            <option value="">Select recipient…</option>
            {PEOPLE.filter(p => p.id !== currentUser.id).map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
            ))}
          </select>
        </label>
        <label className="wq-form-label" style={{ marginTop: 12 }}>
          Add a note (optional)
          <textarea
            className="wq-form-textarea"
            rows={2}
            placeholder="Add context for the recipient…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </label>
        <div className="wqm-quoted" style={{ marginTop: 12 }}>
          <div className="wqm-quoted-meta">Original · {personName(msg.from)} · {fmtTs(msg.timestamp)}</div>
          <div className="wqm-quoted-body">{msg.body}</div>
        </div>
      </div>
    </Modal>
  )
}

// ── Compose Modal ──────────────────────────────────────────────────────────────
function ComposeModal({ currentUser, onClose, onSend }) {
  const [draft, setDraft] = useState({ to: '', body: '', pin: false, event: '' })

  const handleSend = () => {
    if (!draft.to || !draft.body) return
    onSend({
      id: `MSG-${Date.now()}`,
      type: 'dm',
      pinned: draft.pin,
      from: currentUser.id,
      to: draft.to,
      subject: draft.body.slice(0, 60),
      body: draft.body,
      linkedEvent: draft.event || null,
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New Message"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="wq-btn wq-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="wq-btn wq-btn--primary" disabled={!draft.to || !draft.body} onClick={handleSend}>
            <Send size={12} style={{ marginRight: 4 }} /> Send
          </button>
        </div>
      }
    >
      <div className="wqm-reply-form">
        <label className="wq-form-label">
          To
          <select className="wq-form-select" value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}>
            <option value="">Select recipient…</option>
            {PEOPLE.filter(p => p.id !== currentUser.id).map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
            ))}
          </select>
        </label>
        <label className="wq-form-label" style={{ marginTop: 12 }}>
          Message
          <textarea
            className="wq-form-textarea"
            rows={4}
            placeholder="Write your message…"
            value={draft.body}
            onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
          />
        </label>
        <label className="wq-form-label" style={{ marginTop: 12 }}>
          Link to event (optional)
          <select className="wq-form-select" value={draft.event} onChange={e => setDraft(d => ({ ...d, event: e.target.value }))}>
            <option value="">None</option>
            {EVENTS.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.id} — {ev.title.slice(0, 50)}</option>
            ))}
          </select>
        </label>
        <label className="wq-form-check" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={draft.pin} onChange={e => setDraft(d => ({ ...d, pin: e.target.checked }))} />
          Pin to dashboard
        </label>
      </div>
    </Modal>
  )
}

// ── Message Card ───────────────────────────────────────────────────────────────
function MessageCard({ msg, currentUser, onReply, onForward }) {
  const isMe = msg.to === currentUser.id || (msg.type === 'broadcast')
  const sender = PEOPLE.find(p => p.id === msg.from)
  const evtTitle = msg.linkedEvent ? eventTitle(msg.linkedEvent) : null

  return (
    <div className={`wqm-card${msg.pinned ? ' wqm-card--pinned' : ''}`}>
      <div className="wqm-card-header">
        <div className="wqm-card-sender-row">
          <span className="wqm-avatar">{personInitials(msg.from)}</span>
          <span className="wqm-sender-name">{sender?.name || 'Unknown'}</span>
          {isMe && msg.type === 'dm' && <span className="wqm-you-tag">— you</span>}
          {msg.pinned && <Pin size={10} className="wqm-pin-icon" />}
          <TypeBadge type={msg.type} pinned={msg.pinned} />
        </div>
        <span className="wqm-ts">{fmtTs(msg.timestamp)}</span>
      </div>

      <div className="wqm-subject">{msg.subject}</div>
      <div className="wqm-body">{msg.body}</div>

      {evtTitle && (
        <div className="wqm-linked">
          <Flag size={11} className="wqm-linked-icon" />
          <span className="wqm-linked-label">Linked item:</span>
          <span className="wqm-linked-title">{evtTitle}</span>
          <span className="wqm-linked-id">{msg.linkedEvent}</span>
        </div>
      )}

      <div className="wqm-actions">
        <button className="wq-btn wq-btn--ghost" onClick={() => onReply(msg)}>Reply</button>
        <button className="wq-btn wq-btn--ghost" onClick={() => onForward(msg)}>Forward</button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function WQMessages() {
  const { currentUser } = useOutletContext()
  const [messages, setMessages] = useState(MESSAGES)
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null)
  const [forwardTarget, setForwardTarget] = useState(null)

  const addMessage = (msg) => setMessages(m => [msg, ...m])

  const sorted = [...messages].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  const broadcasts = sorted.filter(m => m.pinned || m.type === 'broadcast')
  const dms = sorted.filter(m => !m.pinned && m.type === 'dm')

  return (
    <div className="wqm-root">
      <div className="wqm-toolbar">
        <button className="wq-btn wq-btn--primary" onClick={() => setComposeOpen(true)}>
          <Send size={13} style={{ marginRight: 5 }} /> Compose
        </button>
      </div>

      {broadcasts.length > 0 && (
        <section className="wqm-section">
          <div className="wqm-section-label">ANNOUNCEMENTS & BROADCASTS</div>
          {broadcasts.map(msg => (
            <MessageCard key={msg.id} msg={msg} currentUser={currentUser} onReply={setReplyTarget} onForward={setForwardTarget} />
          ))}
        </section>
      )}

      {dms.length > 0 && (
        <section className="wqm-section">
          <div className="wqm-section-label">DIRECT MESSAGES & TEAMMATE QUESTIONS</div>
          {dms.map(msg => (
            <MessageCard key={msg.id} msg={msg} currentUser={currentUser} onReply={setReplyTarget} onForward={setForwardTarget} />
          ))}
        </section>
      )}

      {composeOpen && (
        <ComposeModal currentUser={currentUser} onClose={() => setComposeOpen(false)} onSend={addMessage} />
      )}
      {replyTarget && (
        <ReplyModal msg={replyTarget} currentUser={currentUser} onClose={() => setReplyTarget(null)} onSend={addMessage} />
      )}
      {forwardTarget && (
        <ForwardModal msg={forwardTarget} currentUser={currentUser} onClose={() => setForwardTarget(null)} onSend={addMessage} />
      )}
    </div>
  )
}
