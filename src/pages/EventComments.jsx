import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { PEOPLE } from '../data/workQueueData'

// ── Helpers ────────────────────────────────────────────────────────────────────

const NOW = new Date('2026-07-02T09:00:00Z')

function timeAgo(iso) {
  const diffH = (NOW - new Date(iso)) / 3600000
  if (diffH < 1) return 'Just now'
  const diffD = Math.floor(diffH / 24)
  if (diffD >= 1) return `${diffD}d ago`
  return `${Math.floor(diffH)}h ago`
}

function person(id) {
  return PEOPLE.find(p => p.id === id)
}

function getExpertiseTags(p) {
  const tags = []
  if (p.partitions?.includes('compliance')) tags.push('Compliance')
  if (p.partitions?.includes('finance'))    tags.push('Finance')
  if (p.partitions?.includes('pii') || p.partitions?.includes('security')) tags.push('PII / Security')
  if (p.studios?.includes('gov'))     tags.push('Truth Plane')
  if (p.studios?.includes('data'))    tags.push('Data Ops')
  if (p.studios?.includes('agentic')) tags.push('Agentic')
  if (p.partitions?.includes('knowledge')) tags.push('Knowledge Base')
  return tags.slice(0, 3)
}

// @mention targets: Agent pinned first, then everyone — longest names first so the
// regex doesn't stop at a shorter name that happens to prefix a longer one.
const MENTION_TARGETS = [
  { id: 'agent', name: 'Agent', isAgent: true },
  ...PEOPLE.map(p => ({ id: p.id, name: p.name, isAgent: false })),
].sort((a, b) => b.name.length - a.name.length)

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MENTION_REGEX = new RegExp(
  '@(' + MENTION_TARGETS.map(t => escapeRegExp(t.name)).join('|') + ')(?![A-Za-z])',
  'g'
)

function renderBody(body) {
  const parts = body.split(MENTION_REGEX)
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const target = MENTION_TARGETS.find(t => t.name === part)
      return (
        <span key={i} className={`evc-mention-chip${target?.isAgent ? ' evc-mention-chip--agent' : ''}`}>
          @{part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── Avatar stack (thread header) ────────────────────────────────────────────────
function AvatarStack({ ids, max = 4 }) {
  const shown = ids.slice(0, max)
  const overflow = ids.length - shown.length
  return (
    <div className="evc-avatar-stack">
      {shown.map(id => {
        const p = person(id)
        return <span key={id} className="evc-avatar" title={p?.name}>{p?.initials || '??'}</span>
      })}
      {overflow > 0 && <span className="evc-avatar evc-avatar--overflow">+{overflow}</span>}
    </div>
  )
}

// ── Inline @mention popover ─────────────────────────────────────────────────────
function MentionPopover({ query, onPick }) {
  const q = query.toLowerCase()
  const matches = MENTION_TARGETS.filter(t => t.isAgent || t.name.toLowerCase().includes(q))
  if (!matches.length) return null
  return (
    <div className="evc-mention-popover">
      {matches.slice(0, 6).map(t => (
        <button
          key={t.id}
          type="button"
          className={`evc-mention-option${t.isAgent ? ' evc-mention-option--agent' : ''}`}
          onMouseDown={e => { e.preventDefault(); onPick(t) }}
        >
          <span className="evc-mention-option-avatar">{t.isAgent ? '🤖' : person(t.id)?.initials}</span>
          <span className="evc-mention-option-name">{t.isAgent ? '@ Agent' : t.name}</span>
          {!t.isAgent && <span className="evc-mention-option-role">{person(t.id)?.role}</span>}
        </button>
      ))}
    </div>
  )
}

// ── "Add people..." participant picker ──────────────────────────────────────────
function AddPeoplePicker({ query, setQuery, excludeIds, onPick }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const q = query.toLowerCase()
  const candidates = PEOPLE.filter(p =>
    !excludeIds.includes(p.id) &&
    (!q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q))
  )

  return (
    <div className="evc-addpeople-wrap" ref={wrapRef}>
      <input
        className="evc-addpeople-input"
        placeholder="Add people…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
      />
      {open && candidates.length > 0 && (
        <div className="evc-addpeople-menu">
          {candidates.map(p => {
            const tags = getExpertiseTags(p)
            return (
              <button
                key={p.id}
                type="button"
                className="evc-addpeople-option"
                onClick={() => { onPick(p); setQuery(''); setOpen(false) }}
              >
                <span className="evc-comment-avatar">{p.initials}</span>
                <div className="evc-addpeople-option-info">
                  <span className="evc-addpeople-option-name">{p.name}</span>
                  <span className="evc-addpeople-option-role">{p.role} · {p.dept}</span>
                  {tags.length > 0 && (
                    <div className="evc-addpeople-tags">
                      {tags.map(t => <span key={t} className="evc-addpeople-tag">{t}</span>)}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Comments section (shared by the slideout and the full-page view) ───────────
export default function CommentsSection({ event, thread, currentUser, onAddComment, onCloseThread, onReopenThread, notify, focusSignal }) {
  const [draft, setDraft] = useState('')
  const [pendingParticipants, setPendingParticipants] = useState([])
  const [addPeopleQuery, setAddPeopleQuery] = useState('')
  const [mentionActive, setMentionActive] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionedIds, setMentionedIds] = useState([])

  const sectionRef  = useRef(null)
  const textareaRef = useRef(null)
  const listRef     = useRef(null)

  useEffect(() => {
    if (!focusSignal) return
    const t = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      textareaRef.current?.focus()
    }, 60)
    return () => clearTimeout(t)
  }, [focusSignal])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [thread?.comments.length])

  const isOpen  = thread?.status === 'open'
  const canClose = isOpen && (currentUser.id === thread.initiatorId || currentUser.scope === 'manager' || currentUser.scope === 'executive')

  const handleTextareaChange = (e) => {
    const val = e.target.value
    setDraft(val)
    const cursor = e.target.selectionStart
    const upToCursor = val.slice(0, cursor)
    const at = upToCursor.lastIndexOf('@')
    if (at === -1) { setMentionActive(false); return }
    const after = upToCursor.slice(at + 1)
    if (/\s/.test(after)) { setMentionActive(false); return }
    setMentionActive(true)
    setMentionQuery(after)
  }

  const insertMention = (target) => {
    const el = textareaRef.current
    const cursor = el ? el.selectionStart : draft.length
    const upToCursor = draft.slice(0, cursor)
    const at = upToCursor.lastIndexOf('@')
    const before = draft.slice(0, at === -1 ? cursor : at)
    const after = draft.slice(cursor)
    const insertion = `@${target.name} `
    const next = before + insertion + after
    setDraft(next)
    setMentionActive(false)
    setMentionedIds(prev => prev.includes(target.id) ? prev : [...prev, target.id])
    requestAnimationFrame(() => {
      if (el) {
        const pos = (before + insertion).length
        el.focus()
        el.setSelectionRange(pos, pos)
      }
    })
  }

  const handleAddPerson = (p) => {
    setPendingParticipants(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p])
    notify?.(`${p.name} added — they'll be notified`)
  }

  const removePendingParticipant = (id) => {
    setPendingParticipants(prev => prev.filter(p => p.id !== id))
  }

  const handlePost = () => {
    if (!draft.trim()) return
    const mentionPersonIds = mentionedIds.filter(id => id !== 'agent')
    const addParticipantIds = [...new Set([...pendingParticipants.map(p => p.id), ...mentionPersonIds])]

    onAddComment(event.id, {
      authorId: currentUser.id,
      body: draft.trim(),
      mentions: mentionedIds,
      addParticipantIds,
    })

    const notifiedCount = new Set([...(thread?.participants || []), ...addParticipantIds, currentUser.id]).size - 1
    notify?.(`Comment posted — ${Math.max(notifiedCount, 0)} participant${notifiedCount === 1 ? '' : 's'} notified`)

    setDraft('')
    setPendingParticipants([])
    setMentionedIds([])
    setMentionActive(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handlePost()
    }
    if (e.key === 'Escape') setMentionActive(false)
  }

  const uniqueCommenterIds = thread ? [...new Set(thread.comments.map(c => c.authorId))] : []
  const commentCount = thread?.comments.length || 0

  return (
    <div className="evc-section" ref={sectionRef}>
      <div className="evc-header">
        <div className="evc-header-left">
          <span className="evc-header-title">Comments</span>
          {uniqueCommenterIds.length > 0 && <AvatarStack ids={uniqueCommenterIds} />}
          <span className="evc-count">{commentCount} comment{commentCount === 1 ? '' : 's'}</span>
        </div>
        <div className="evc-header-right">
          {thread && (
            <span className={`evc-status-badge evc-status-badge--${thread.status}`}>
              {thread.status === 'open' ? 'Open' : 'Closed'}
            </span>
          )}
          {canClose && (
            <button className="evc-close-link" onClick={() => onCloseThread(event.id)}>Close thread</button>
          )}
        </div>
      </div>

      <div className="evc-list" ref={listRef}>
        {!thread || thread.comments.length === 0 ? (
          <div className="evc-empty">No comments yet. Be the first to ask a question.</div>
        ) : (
          thread.comments.map(c => {
            const author = person(c.authorId)
            return (
              <div key={c.id} className="evc-comment">
                <span className="evc-comment-avatar">{c.authorId === 'agent' ? '🤖' : (author?.initials || '??')}</span>
                <div className="evc-comment-body-wrap">
                  <div className="evc-comment-top">
                    <span className="evc-comment-name">{c.authorId === 'agent' ? 'Agent' : (author?.name || 'Unknown')}</span>
                    {c.authorId === 'agent' && <span className="evc-agent-badge">Agent</span>}
                    {author?.role && <span className="evc-comment-role">{author.role}</span>}
                    <span className="evc-comment-time">{timeAgo(c.timestamp)}</span>
                  </div>
                  <div className="evc-comment-text">{renderBody(c.body)}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {(!thread || isOpen) ? (
        <div className="evc-composer">
          <AddPeoplePicker
            query={addPeopleQuery}
            setQuery={setAddPeopleQuery}
            excludeIds={[currentUser.id, ...pendingParticipants.map(p => p.id), ...(thread?.participants || [])]}
            onPick={handleAddPerson}
          />
          {pendingParticipants.length > 0 && (
            <div className="evc-pending-chips">
              {pendingParticipants.map(p => (
                <span key={p.id} className="evc-pending-chip">
                  {p.name}
                  <button type="button" onClick={() => removePendingParticipant(p.id)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="evc-input-wrap">
            <textarea
              ref={textareaRef}
              className="evc-textarea"
              rows={3}
              placeholder="Ask a question or add context… Use @ to mention someone"
              value={draft}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
            />
            {mentionActive && <MentionPopover query={mentionQuery} onPick={insertMention} />}
          </div>

          <div className="evc-composer-footer">
            <span className="evc-disclosure">Comments are not real-time. Participants are notified when you post.</span>
            <button className="wq-btn wq-btn--primary evc-post-btn" disabled={!draft.trim()} onClick={handlePost}>
              Post
            </button>
          </div>
        </div>
      ) : (
        <div className="evc-closed-notice">
          This thread is closed. <button className="evc-reopen-link" onClick={() => onReopenThread(event.id)}>Reopen thread</button> if needed.
        </div>
      )}
    </div>
  )
}
