import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, FileCheck, FileX } from 'lucide-react'
import { Drawer } from '../components/Modal'
import { ATTESTATIONS, PEOPLE, EVENTS } from '../data/workQueueData'
import AttestModal from './AttestModal'

function personName(id) {
  return PEOPLE.find(p => p.id === id)?.name || id
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }) {
  return (
    <span className={`wq-att-status wq-att-status--${status}`}>
      {status === 'verified' ? <FileCheck size={11} /> : <FileX size={11} />}
      {status === 'verified' ? 'Verified' : 'Pending'}
    </span>
  )
}

function AttestationDrawer({ att, onClose }) {
  if (!att) return null
  const event = att.linkedEvent ? EVENTS.find(e => e.id === att.linkedEvent) : null

  return (
    <Drawer
      open
      title={`Attestation ${att.id}`}
      subtitle={`Requested ${fmtDate(att.requestedDate)}`}
      onClose={onClose}
    >
      <div className="wq-att-drawer">
        <div className="wq-att-drawer-row">
          <span className="wq-att-drawer-label">From</span>
          <span>{personName(att.from)}</span>
        </div>
        <div className="wq-att-drawer-row">
          <span className="wq-att-drawer-label">To</span>
          <span>{personName(att.to)}</span>
        </div>
        <div className="wq-att-drawer-row">
          <span className="wq-att-drawer-label">Status</span>
          <StatusBadge status={att.status} />
        </div>
        <div className="wq-att-drawer-row">
          <span className="wq-att-drawer-label">Audit hash</span>
          <code className="wq-att-hash">{att.auditHash}</code>
        </div>

        <div className="wq-att-drawer-section">
          <div className="wq-att-drawer-section-title">Question</div>
          <p className="wq-att-drawer-question">{att.question}</p>
        </div>

        {att.response && (
          <div className="wq-att-drawer-section">
            <div className="wq-att-drawer-section-title">Response</div>
            <p className="wq-att-drawer-response">{att.response}</p>
          </div>
        )}

        {event && (
          <div className="wq-att-drawer-section">
            <div className="wq-att-drawer-section-title">Linked Event</div>
            <div className="wq-att-event-preview">
              <div className="wq-att-event-id">{event.id}</div>
              <div className="wq-att-event-title">{event.title}</div>
              <div className="wq-att-event-detail">{event.detail}</div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}

export default function WQAttestations() {
  const { currentUser } = useOutletContext()
  const [attestations] = useState(ATTESTATIONS)
  const [selected, setSelected] = useState(null)
  const [newOpen, setNewOpen] = useState(false)

  return (
    <div className="wq-attestations">
      <div className="wq-att-toolbar">
        <h3 className="wq-section-heading">Attestations</h3>
        <button className="wq-btn wq-btn--primary" onClick={() => setNewOpen(true)}>
          <Plus size={14} /> New Attestation
        </button>
      </div>

      <div className="wq-table-wrap">
        <table className="wq-table">
          <thead>
            <tr>
              <th>ID</th><th>From</th><th>To</th><th>Linked Event</th>
              <th>Status</th><th>Requested</th><th>Question</th>
            </tr>
          </thead>
          <tbody>
            {attestations.map(a => (
              <tr
                key={a.id}
                className="wq-att-row"
                onClick={() => setSelected(a)}
              >
                <td className="wq-td-mono">{a.id}</td>
                <td>{personName(a.from)}</td>
                <td>{personName(a.to)}</td>
                <td className="wq-td-mono">{a.linkedEvent || '—'}</td>
                <td><StatusBadge status={a.status} /></td>
                <td className="wq-td-muted">{fmtDate(a.requestedDate)}</td>
                <td className="wq-att-question-preview">{a.question.slice(0, 80)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AttestationDrawer att={selected} onClose={() => setSelected(null)} />

      {newOpen && (
        <AttestModal
          event={null}
          defaultMode="formal"
          currentUserId={currentUser.id}
          onClose={() => setNewOpen(false)}
        />
      )}
    </div>
  )
}
