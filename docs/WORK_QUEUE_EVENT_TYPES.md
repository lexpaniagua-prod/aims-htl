# Work Queue — Event Types Reference

This document specifies, in rebuildable detail, every event type in the HTL Work
Queue module: the shared three-tier UI (card → slideout → full page), the data
schema each type expects, and the exact content/behavior of each type's
slideout and full-page "decision surface." It is written so the same set of
event types — and the same level of interactivity — can be reconstructed in a
different project from this document alone, without reading the source.

Source of truth (this project): `src/data/workQueueData.js`,
`src/pages/EventTypeBlocks.jsx`, `src/pages/EventSlideout.jsx`,
`src/pages/WQEventPage.jsx`, `src/pages/WQQueue.jsx`.

---

## 1. Architecture — three tiers of the same event

Every event renders at three levels of detail, all driven by the **same event
object** and the **same `eventCategory` dispatcher** — there is one
`eventCategory → component` switch for the compact view and one for the full
view, so adding a type means adding one case to each switch, not rebuilding a
screen.

| Tier | Component | Purpose |
|---|---|---|
| **Card** | `EventCard` (in the queue list) | Scannable: id, due status, title, one-line detail, action buttons, tag row. |
| **Slideout** | `EventSlideout` (drawer, opens on card click) | Fast context without leaving the list: 3–6 lines of type-specific summary. |
| **Full page** | `WQEventPage` (dedicated route) | The actual decision surface: full situation, all evidence, the real action buttons, side panel (Thread / Attestation / Audit Trail). |

Two dispatcher functions do all the routing:

```jsx
// Compact — rendered inside the slideout
export function SlideoutTypeContext({ event, thread, onNavigateToEvent, notify }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  switch (event.eventCategory) {
    case 'htl-continuation':    return <ContinuationSlide event={event} md={md} />
    case 'htl-handoff':         return <HandoffSlide event={event} md={md} />
    case 'inbound-question':    return <MessageSlide event={event} thread={thread} />
    case 'train-me':            return <TrainMeSlide event={event} md={md} />
    case 'gov-promotion':       return <GovProposalSlide event={event} md={md} />
    case 'gov-review':          return <GovReviewSlide event={event} md={md} />
    case 'gov-break-glass':     return <GovBreakGlassSlide event={event} md={md} />
    case 'gov-change-request':  return <GovChangeRequestSlide event={event} md={md} />
    case 'question':            return <QuestionSlide event={event} onNavigateToEvent={onNavigateToEvent} />
    case 'client-continuation': return <ContinuationSlide event={event} md={md} notify={notify} />
    case 'client-handoff':      return <HandoffSlide event={event} md={md} notify={notify} />
    default: return null
  }
}

// Full — rendered on the dedicated event page
export function DecisionSurface({ event, onDecide, onAsk, onEscalate, thread, onCloseThread,
                                   notify, status, onStatusChange, currentUser, onAnswer, onNavigateToEvent }) {
  const md = EVENT_MODAL_DATA[event.id] || {}
  switch (event.eventCategory) {
    case 'htl-continuation':    return <ContinuationFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'htl-handoff':         return <HandoffFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} status={status} onStatusChange={onStatusChange} />
    case 'inbound-question':    return <MessageFull event={event} thread={thread} onAsk={onAsk} onEscalate={onEscalate} onCloseThread={onCloseThread} notify={notify} />
    case 'train-me':            return <TrainMeFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'question':            return <QuestionFull event={event} onAsk={onAsk} onEscalate={onEscalate} onAnswer={onAnswer} onNavigateToEvent={onNavigateToEvent} />
    case 'gov-promotion':       return <GovProposalFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'gov-review':          return <GovReviewFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'gov-break-glass':     return <GovBreakGlassFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} currentUser={currentUser} />
    case 'gov-change-request':  return <GovChangeRequestFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} />
    case 'client-continuation': return <ContinuationFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} notify={notify} />
    case 'client-handoff':      return <HandoffFull event={event} md={md} onDecide={onDecide} onAsk={onAsk} onEscalate={onEscalate} status={status} onStatusChange={onStatusChange} notify={notify} />
    default: return null
  }
}
```

**Key porting insight:** the type-specific components (`ContinuationSlide`,
`ContinuationFull`, etc.) are shared by more than one `eventCategory` where the
underlying shape is identical — e.g. `client-continuation` reuses
`ContinuationSlide`/`ContinuationFull` verbatim, just with an extra
`customerCard` field on the event (see §6). Don't duplicate components for a
"variant" of a type if the only difference is extra optional data.

---

## 2. Core data model

### 2.1 Event object — fields common to (almost) every event

```js
{
  id: 'EVT-001',                 // unique, used as the routing key everywhere
  severity: 'now',                // 'now' | 'red' | 'yellow' | 'green'  (see §2.2)
  studio: 'gov',                   // 'gov' | 'data' | 'agentic' | 'client'  (see §2.3)
  ownerId: 'p1',                   // person id who owns this in "My Work"
  title: '...',                    // card headline
  detail: '...',                   // one/two sentence plain-language description
  blastRadius: { workflows: 14, agents: 3, description: '...' }, // optional; workflows/agents drive the inline "Blocks N workflows" badge
  dueLabel: 'Due now',             // human label shown on the card/slideout
  dueDate: '2026-07-02',           // ISO date, drives sort/urgency coloring
  dueToday: true,
  type: 'approve',                 // EVENT_TYPES key — drives the colored "type" badge (see §2.4)
  origin: 'customer',              // 'customer' | 'internal' — a secondary filter facet
  missionCritical: true,           // shows the red "Mission Critical" badge + inline blast text
  eventCategory: 'gov-promotion',  // THE dispatcher key (see §2.5) — determines slideout/full content
  quickActions: ['Approve', 'Edit', 'Block'],  // flavor text only, not read by any component
  spec: 'DIAN-4821',               // shown in the full-page header + escalation modal summary
  kind: 'DIAN Intake',              // shown in the full-page header
  sourceWorkflow: {                 // optional — powers the "Trace" pill/drawer AND the "WORKFLOW TRACE" section
    id: 'WF-...', name: 'Enterprise Inbound Lead Qualification',
    steps: [
      { step: 1, label: 'Visitor identified', status: 'done', timestamp: '2026-07-02T09:58:00Z' },
      // status: 'done' | 'paused' | 'error' | 'blocked' | 'pending'
    ],
  },
  customerCard: { /* see §6 — only present on client-continuation / client-handoff */ },
}
```

Everything else (claims, drafts, key facts, comparisons, etc.) that's specific
to one `eventCategory` lives in a **separate** lookup keyed by event id, never
inline on the event object itself:

```js
export const EVENT_MODAL_DATA = {
  'EVT-001': { claims: [...], conflicts: [...] },   // gov-promotion shape
  'EVT-002': { agent: '...', draftEmail: {...} },    // htl-continuation shape
  // ...
}
```

This separation matters: it keeps the event list (used for filtering/sorting/
counting) lightweight, and lets each `eventCategory` define its own `md` shape
independently — the dispatcher looks it up by `event.id` and hands it to the
right component (`const md = EVENT_MODAL_DATA[event.id] || {}`).

### 2.2 Severity (`SEVERITY`)

| key | label | color |
|---|---|---|
| `now` | Act Now | `#f43f5e` |
| `red` | Critical | `#ef4444` |
| `yellow` | Action | `#f59e0b` |
| `green` | Heads-up | `#10b981` |

### 2.3 Studio (`STUDIOS`)

| key | name | short badge | accent |
|---|---|---|---|
| `gov` | Helix Governance Studio | GOV | `#8b5cf6` |
| `data` | Helix Data Studio | DATA | `#0ea5e9` |
| `agentic` | Agentic Studio | AGNT | `#10b981` |
| `client` | Client | CLIENT | `#14b8a6` |

`client` is a presentation-layer studio: the underlying workflow may
technically run through Agentic Studio, but customer-facing events are tagged
`studio: 'client'` so they read as customer-facing at a glance and get their
own filter option.

### 2.4 Type badge (`EVENT_TYPES`) — what KIND of decision, not what SITUATION

This is a *separate* taxonomy from `eventCategory`. It answers "what kind of
action does this need" (Approve / Review / Respond / …), independent of which
tailored view renders. Multiple `eventCategory` values can share the same
`type`.

| key | label | color |
|---|---|---|
| `approve` | Approve | `#3b82f6` |
| `review` | Review | `#8b5cf6` |
| `respond` | Respond | `#14b8a6` |
| `resolve` | Resolve | `#f59e0b` |
| `acknowledge` | Acknowledge | `#10b981` |
| `train` | Train Me | `#f43f5e` |
| `inbound-question` | Question | `#f59e0b` |
| `question` | Question | `#f59e0b` |
| `client-continuation` | Client · Continuation | `#14b8a6` |
| `client-handoff` | Client · Handoff | `#14b8a6` |

### 2.5 `eventCategory` — the dispatcher key (the actual "event type" list)

This is what the rest of this document calls an "event type." Ten values exist:

1. `htl-continuation` — HTL Continuation
2. `htl-handoff` — HTL Handoff
3. `inbound-question` — Question (agent-intercepted message)
4. `train-me` — Train Me
5. `gov-promotion` — Gov Promotion
6. `gov-review` — Gov Review
7. `gov-break-glass` — Gov Break Glass
8. `gov-change-request` — Gov Change Request
9. `client-continuation` — Client Continuation
10. `client-handoff` — Client Handoff

(There is an eleventh dispatcher case, `question`, for a person-to-person
"Ask" question created at runtime rather than a static mock event — see §3.11.)

---

## 3. Shared UI building blocks

Build these first — every event type composes them.

### 3.1 `ConfirmBar` — the universal "are you sure" step

Every destructive/final action goes through a confirm step instead of firing
immediately:

```jsx
<ConfirmBar
  text="Human-readable summary of exactly what will happen."
  confirmLabel="Confirm Send"     // button text
  danger={false}                   // true → red/danger button styling
  disabled={false}                 // e.g. disabled until a reason is typed
  onCancel={() => setView('idle')}
  onConfirm={() => onDecide('Approved — sent on behalf of agent')}
>
  {/* optional children — e.g. a reason textarea rendered above the buttons */}
</ConfirmBar>
```

Renders: a text line, optional children, then a `Cancel` (ghost) + primary/danger
confirm button row. `onDecide(summaryString)` is the generic "this event is
resolved" callback — every type's terminal actions funnel through it with a
human-readable audit string.

### 3.2 `SecondaryLinks` — Ask / Escalate, always available

```jsx
<SecondaryLinks onAsk={onAsk} onEscalate={onEscalate} />
```

Two small text links ("Ask", separated by "·", "Escalate" in coral) rendered
at the bottom of every type's DECISION section — regardless of what the
primary decision actions are, the user can always loop in a teammate or
escalate instead.

### 3.3 `ClaimsList` — shared claim-by-claim decision list

Used by both **Gov Promotion** and **Gov Review** (§3.5/3.6) — a colleague
working a Gov Promotion can route an individual claim to Gov Review, so the
same claim-decision UI must exist in both places.

For each claim, renders:
- Header row: claim id, confidence % (color-coded: ≥85% green, ≥70% amber, else red), a `CONFLICT` badge if `claim.conflict`, and a `Corrected` badge if it's been edited (see below).
- Claim text (or the corrected replacement text, or an italic "(cleared — no replacement text)" placeholder if the correction was saved empty).
- If corrected: the **original** text shown below, struck through — corrections never destroy the original.
- If conflicting: a mini two-source comparison (`Source A — value` / `Source B — value`).
- Three buttons: **Approve**, **Reject**, **Correct**.

**Correct behavior (this is the part most likely to be missed on a rebuild):**
clicking **Correct** does NOT just mark a decision — it opens an inline
`<textarea>` pre-filled with the claim's current effective text (original, or
the last-saved correction if one exists). The user can edit it, clear it
entirely, or leave it. Two buttons close the editor: **Cancel** (discards the
draft, decision stays whatever it was) and **Save correction** (writes the
draft as the new displayed value, marks the claim `Corrected`, keeps the
`Original: ...` line visible below). The claim's decision state is
independently set to `'correct'` the moment the editor opens (so the parent's
"has every claim been decided" check passes), separate from whether text was
actually changed.

```
claim state per id:  decision: 'approve' | 'reject' | 'correct' | undefined
                      draft:    in-progress textarea value (while editor open)
                      saved:    the committed corrected text (undefined = no correction saved)
```

### 3.4 Section anatomy (full page)

Every full-page type is a stack of `<div className="section">` blocks, each
with an uppercase `SECTION TITLE`. The recurring section names, in the order
they tend to appear:

`SITUATION` / `REQUEST` / `MESSAGE` / `SUBMISSION` / `CHANGE DETAIL` /
`ASKED BY` → `[type-specific evidence/claims/comparison sections]` →
`WORKFLOW TRACE` (if `sourceWorkflow` present) → `DECISION` (always last,
always ends with `SecondaryLinks`).

A `Customer Card` section (§6) is inserted directly after the first section
whenever `event.customerCard` exists — for any type, not just Client ones,
though today only `client-continuation`/`client-handoff` populate it.

---

## 4. Card anatomy (list view)

Every card, regardless of type, shows:
- **Meta row** (left): event id, comment-count button (if a thread exists), due-status pill, and — if mission-critical with `blastRadius.workflows > 0` — an inline "Blocks N workflows · N agents" note.
- **Action row** (top-right): Skip (resurface in 2h), Details (→ full page), Ask (→ question modal), Escalate (→ escalation modal), and a `⋮` menu (Trace, plus Take it/Nudge/Reassign when viewing a team queue).
- **Title + one-line detail** (body).
- **Tag row** (bottom-right): severity badge, studio badge, type badge, team badge, Mission Critical badge, Covering-for badge, owner badge (team view only).

Clicking anywhere on the card body (not a button) opens the **slideout**.

## 5. Slideout anatomy (drawer)

Fixed structure, in order: severity color strip → header (severity/studio/type
badges + Mission Critical + close button + event id) → title + due pill →
quick context (`event.detail` + blast-radius line) → Trace pill (if
`sourceWorkflow`) → **`SlideoutTypeContext`** (the type-specific 3–6 line
summary, §7) → actions (`Open full details`, `Ask`, `Escalate`) → comment
indicator (count + last comment preview + "View thread →") → footer (id ·
created-date · studio name).

## 6. Customer Card — the Client-event differentiator

Renders only when `event.customerCard` is present, immediately after the
first (`SITUATION`/`REQUEST`) section on the full page, and as the very first
element inside the type-context block on the slideout. It is what lets a
generic Continuation/Handoff view also serve a customer-facing case, without
forking the component.

**Schema:**
```js
customerCard: {
  customerId: 'UCP-88312',
  name: 'Marcus Webb',
  channel: 'webchat',          // 'webchat' | 'vcard' | 'voice' | 'email'
  sentiment: 'positive',        // 'positive' | 'neutral' | 'concerned' | 'frustrated'
  relationshipSummary: '1-2 sentence prose.',
  openDeals: [ { name: 'Enterprise Platform Trial', stage: 'Interest', value: '$180,000 ARR est.' } ],
  lastInteraction: { date: '2 min ago', summary: '...' },
  agentHistory: [ { agentName: 'SupportBot v2', date: '8 days ago', outcome: 'Ticket opened, unresolved' } ],
}
```

**Renders:** a "Customer" eyebrow label → name + channel badge (icon + label:
Website Chat / VCard / Voice / Email) → sentiment row (colored dot: green
positive, gray neutral, amber concerned, red frustrated) → relationship
summary paragraph → open-deal chips (`name · stage · value`) → last
interaction (date + summary) → compact agent-history list (`agent · date —
outcome`) → a "View full UCP profile →" link (mock action — fires a toast,
`notify(\`Opening UCP profile for ${name}...\`)`, no real navigation).

Visual treatment: elevated card background, a colored (teal, in this project)
left border, clearly distinguishing it from workflow-context sections.

---

## 7. Per-event-type reference

For each type: what triggers it, the `md` shape, the slideout content, the
full-page sections, and the decision state machine.

### 7.1 HTL Continuation (`htl-continuation`)

**Concept:** an internal automated workflow paused mid-task because it's
about to take an external/consequential action and isn't confident enough to
proceed alone. A human reviews the prepared output and decides: send,
edit-then-send, or block.

**`md` shape:**
```js
{
  agent: 'SalesForecastPA',      // which agent paused
  model: 'GE-Comms-v2.1',
  confidence: 0.71,                // 0–1, drives the color-coded % display
  geClass: 'GE-COMM',              // classification tag; 'GE-COMM' specifically triggers a rose-highlighted recipient row
  draftEmail: { to: '...', subject: '...', body: '...' },  // optional — if absent, the "prepared output" section doesn't render
}
```

**Slideout (`ContinuationSlide`):** Customer Card (if present) → `Agent: {agent} · {workflow name}` → "About to send an external communication on this workflow's behalf." → `Confidence: NN%` (color-coded) → `Recipient: {to}` (rose-highlighted if `geClass === 'GE-COMM'`) → footer note "Workflow paused — resuming requires your decision."

**Full page (`ContinuationFull`):**
1. `SITUATION` — `event.detail`, fact grid (Workflow / Agent / Model / GE Classification), big confidence number.
2. Customer Card (if `event.customerCard`).
3. `WHAT THE AGENT PREPARED` (only if `md.draftEmail`) — the draft body, editable in-place when in editing mode; fact grid (Recipient / Subject / Channel).
4. `WORKFLOW TRACE` (if `sourceWorkflow`) — the step timeline.
5. `DECISION` — states: `idle → confirm-approve` / `idle → editing → confirm-edit` / `idle → confirm-block`.
   - **Approve and send** → confirm → `onDecide('Approved — sent on behalf of agent')`.
   - **Edit then send** → opens the draft as an editable textarea → **Confirm Send** → confirm → `onDecide('Edited output sent — logged to audit')`.
   - **Block** → confirm (requires a typed reason) → `onDecide('Blocked — workflow terminated')`.
   - Always ends with `SecondaryLinks`.

### 7.2 HTL Handoff (`htl-handoff`)

**Concept:** an agent finished everything it could automate and is handing
full ownership to a human — there's no more automation to run, just a manual
follow-up.

**`md` shape:**
```js
{
  entityName: 'Jordan Ellis — Northfield Capital Partners',
  recordId: 'LEAD-8834',
  sourceSystem: 'Web Inquiry Form',
  handoffReason: 'Lead score 94/100 exceeds the 90-point auto-handoff threshold',
  keyFacts: ['...', '...'],           // bullet list
  recommendations: ['...', '...'],     // bullet list
  nextSuggestedAction: 'Call within 24 hours — prospect flagged urgency',  // slideout only
  crmRecord: 'CRM-99213',
  knowledgeContract: 'KC-ADVISORY-ONBOARDING',
  transcriptSummary: '...',
}
```

**Slideout (`HandoffSlide`):** Customer Card (if present) → `Entity: {entityName}` → `{nextSuggestedAction}` → `{handoffReason}` (muted) → footer note "You now own this — agent will not continue."

**Full page (`HandoffFull`):**
1. `SITUATION` — detail, fact grid (Workflow / Entity / Record ID / Source), `{handoffReason}` note.
2. Customer Card (if present).
3. `WHAT THE AGENT PREPARED FOR YOU` — Key facts list, Recommendations list, fact grid (CRM record / Knowledge Contract), transcript summary note.
4. `WORKFLOW TRACE` (if `sourceWorkflow`).
5. `DECISION` — driven by an externally-managed `status` string (`'Open' | 'In Progress' | 'Resolved'`, lifted to the page level, not local to this component):
   - `status` not yet In Progress/Resolved → **Acknowledge and take ownership** (`onStatusChange('In Progress')`) + **Reassign** (toggles a people list filtered to `PEOPLE.filter(p => p.studios?.includes(event.studio))`, clicking a person calls `onDecide('Reassigned to {name}')`).
   - `status === 'In Progress'` → shows an inline "Ownership acknowledged — logged to audit" note + **Mark resolved** (`onDecide('Marked resolved — logged to audit')`).
   - Always ends with `SecondaryLinks`.

### 7.3 Question / inbound message (`inbound-question`)

**Concept:** a message thread (not a decision) — someone sent something that
needs a reply, not an approval.

**Data lives on the comment thread, not `EVENT_MODAL_DATA`.** The thread
object (`commentThreads[event.id]`) has shape `{ status, initiatorId,
participants: [...], comments: [{ id, authorId, timestamp, body, mentions }] }`.

**Slideout (`MessageSlide`):** `From: {sender.name} · {sender.role}` (from the first comment's author) → the first comment's body (clamped) → footer note (`"{N} messages in this thread"` or `"Message thread"`).

**Full page (`MessageFull`):**
1. `MESSAGE` — sender avatar/name/role/timestamp, full body of the first comment.
2. Action row: **Reply** (`onAsk` — opens the Ask flow addressed as a reply), **Forward** (mock toast, not wired), **Mark as read** (mock toast), **Close thread** (only if `thread.status === 'open'`).
3. `SecondaryLinks`.

### 7.4 Train Me (`train-me`)

**Concept:** the model predicted something and the real outcome differed — a
human correction here retrains the model, not just fixes one record.

**`md` shape:**
```js
{
  submitter: 'Name', submitterRole: 'Role', submittedAt: '2026-06-17T...',
  note: 'Why this is being submitted.',
  currentValue: '1.12', proposedValue: '1.15',
  canonRecord: 'PRICE-MODEL-Q3',
  affectedAgents: ['ForecastAgent v3', 'PricingBot'],   // optional
}
```

**Slideout (`TrainMeSlide`):** `Submitted by: {submitter} · {submitterRole}` → a current→proposed compare row → `Record: {canonRecord}` → note (muted).

**Full page (`TrainMeFull`):**
1. `SUBMISSION` — submitter header, note, a current-value/proposed-value comparison block, fact grid (Record).
2. `REVIEW AND EDIT BEFORE PROMOTING` — an editable text input pre-filled with `proposedValue` (so the human can tweak the exact value before promoting), with a "Reset to proposed value" link that appears once edited.
3. `IMPACT` (if `affectedAgents`) — chip list of affected agents + a note ("Promoting will update on next retrieval by N agents").
4. `DECISION` — states: `idle → confirm-promote` (optional note field) → `onDecide('Promoted to Canon — model will retrain')`; or `idle → confirm-reject` (required reason) → `onDecide('Rejected — submitter will be notified')`.
5. `SecondaryLinks`.

### 7.5 Gov Promotion (`gov-promotion`)

**Concept:** a document/policy was parsed and claims extracted; a human
attests to (approves/rejects/corrects) each claim before it's promoted to the
canonical "Truth Plane," with special handling for claims that conflict
between two sources.

**`md` shape:**
```js
{
  claims: [
    { id: 'CLM-001', text: '...', confidence: 0.94, conflict: false },
    { id: 'CLM-005', text: '...', confidence: 0.79, conflict: true },
  ],
  conflicts: [
    { claimId: 'CLM-005', sourceA: { name: 'Financial Policy Manual v12', value: '±150bps', lastVerified: '2026-03-01' },
                            sourceB: { name: 'Risk Framework Q1 2026',    value: '±200bps', lastVerified: '2026-04-15' } },
  ],
  workflowsBlockedNames: ['FinancePolicyBot', '...'],   // flavor only
}
```

**Slideout (`GovProposalSlide`):** `Document: {workflow name or spec}` → `Claims: N extracted [· M conflicting]` → `Destination: Truth Plane` → if `blastRadius.workflows > 0`: rose note "Blocks N workflows until resolved."

**Full page (`GovProposalFull`):**
1. `SITUATION` — detail, a 4-step pipeline visual (`Indexing → Claim Detection → Conflict Check → KCON Routing`), fact grid (Destination: Truth Plane).
2. `CLAIMS EXTRACTED (N)` — the shared `ClaimsList` (§3.3), passed `claims` + `conflicts`.
3. `DECISION` — **Approve all non-conflicted** (bulk-sets every non-conflicting claim to `approve`) + **Submit attestation** (disabled until every conflicting claim has a decision) → confirm (shows counts: approved/rejected/flagged) → `onDecide('Attestation submitted — logged to audit')`.
4. `SecondaryLinks`.

### 7.6 Gov Review (`gov-review`)

**Concept:** a colleague working a Gov Promotion hit a claim they didn't have
sign-off authority on (or were unsure about) and routed it to a specific
reviewer — this is that reviewer's screen. Reuses `ClaimsList`.

**`md` shape:**
```js
{
  requestedBy: { name: 'Marcus H.', role: 'Governance Lead' },
  requestedAt: '2026-06-17T09:40:00Z',
  requestReason: "I don't have sign-off authority on... needs Compliance Lead review before I can attest to it.",
  linkedProposal: { id: 'EVT-001', spec: 'DIAN-4821', title: '...' },
  claims: [ { id: 'CLM-005', text: '...', confidence: 0.79, conflict: true } ],
  conflicts: [ /* same shape as gov-promotion */ ],
}
```

**Slideout (`GovReviewSlide`):** `Requested by: {name} · {role}` → request reason (clamped) → `Awaiting review: N claim(s)` → if linked: `From {spec} · {title}` (muted).

**Full page (`GovReviewFull`):**
1. `REQUEST` — requester header + timestamp, request reason, fact grid (Linked proposal) if present.
2. `ITEMS TO REVIEW (N)` — the shared `ClaimsList`.
3. `DECISION` — **Submit review** (disabled until every item has a decision) → confirm (counts approved/rejected, notes it returns to the requester) → `onDecide('Review submitted — logged to audit')`.
4. `SecondaryLinks`.

### 7.7 Gov Break Glass (`gov-break-glass`)

**Concept:** emergency access request outside the normal process, always
requiring **two** approvers (a "two-key gate") before access is granted.

**`md` shape:**
```js
{
  requestor: 'Marcus H.', requestorRole: 'Governance Lead', requestTime: '2026-06-17T08:00:00Z',
  targetPartition: 'PII — Identity Records', partitionClassification: 'Restricted — PII',
  accessScope: 'Read + Write', duration: '4 hours',
  justification: 'Incident IR-2026-0617: ...',
  incidentRef: 'IR-2026-0617',
  firstApprover: 'Devon N.', firstApprovalTime: '2026-06-17T08:10:00Z',
  secondApprover: 'Alexa M.',
  approvalRequired: 2, approvalReceived: 1,
  lastBreakGlass: { date: '2026-05-02', requester: 'Devon N.', outcome: 'Approved — no incidents' },  // optional history note
}
```

**Slideout (`GovBreakGlassSlide`):** `Requester: {requestor} · {requestorRole}` → `Partition: {targetPartition}` → `Duration: {duration}` → justification (rose text) → approval status row (first approver avatar + "`{received}` of `{required}` approvers confirmed").

**Full page (`GovBreakGlassFull`):**
1. `REQUEST` — requester header, fact grid (Partition / Classification / Access scope / Duration), justification (rose), Incident ref if present.
2. `SECURITY CONTEXT` — hardcoded "Risk classification: Critical" (red), plus a note about the last Break Glass on this partition if `md.lastBreakGlass` exists.
3. `APPROVER STATUS — TWO-KEY GATE` — first approver row (marked Confirmed + timestamp), second approver row (marked Pending), hint text "Both approvers must confirm before access is granted."
4. `DECISION` — **Approve access ({approvalNum} of {required})** → confirm → `onDecide(\`Access approved ({approvalNum} of {required}) — logged to audit\`)`; or **Deny** → confirm (required reason) → `onDecide('Access denied — requester notified')`. `isSecondApprover = currentUser?.name === md.secondApprover` is computed but used only for future gating (not currently disabling the button in this build — a real port should disable "Approve" unless the logged-in user *is* the pending approver).
5. `SecondaryLinks`.

### 7.8 Gov Change Request (`gov-change-request`)

**Concept:** a proposed change to a rule/threshold/configuration, compared
side-by-side against the current value, needing sign-off before it takes
effect.

**`md` shape:**
```js
{
  submitter: 'Devon N.', submitterRole: 'IT Security', submittedAt: '2026-05-15T...',
  rationale: 'Compliance Standards Manual v4 supersedes Risk Framework Q1 2026 following the May compliance update.',
  changeType: 'Correct conflict',
  sourceA: { name: 'Risk Framework Q1 2026', value: '0.85', confidence: 0.78, lastVerified: '2026-04-01', owner: 'Jordan T.' },
  sourceB: { name: 'Compliance Standards Manual v4', value: '0.90', confidence: 0.92, lastVerified: '2026-05-15', owner: 'Devon N.' },
  affectedAgents: ['ComplianceBot v2.3', 'RiskScoringAgent', 'AuditPrepAgent'],
  canonRecord: 'GE-COMP-004',
}
```

**Slideout (`GovChangeRequestSlide`):** `Submitted by: {submitter} · {submitterRole}` → `Record: {canonRecord}` → a `sourceA.value → sourceB.value` compare row → rationale (muted, truncated to 80 chars) → `Affects N agents.` if present.

**Full page (`GovChangeRequestFull`):**
1. `CHANGE DETAIL` — submitter header, rationale, fact grid (Change type).
2. `COMPARISON` — two side-by-side source cards (Current vs Proposed), each with name/value/confidence(%)/verified-date/owner; impact chip list; hint text with affected-agent count.
3. `MODIFY BEFORE ACCEPTING` (only when in `modify` view) — editable input pre-filled with the proposed value, "Reset to proposed" link once changed.
4. `DECISION` — four primary paths from idle: **Accept change** → confirm (optional note) → `onDecide('Change accepted — logged to audit')`; **Modify before accepting** → opens the modify field → **Accept with modifications** (disabled until actually modified) → confirm → `onDecide('Accepted with modifications — logged to audit')`; **Reject** → confirm (required reason) → `onDecide('Rejected — submitter notified')`; **Request more information** → confirm ("Send a question to {submitter}?") → calls `onAsk` directly (opens the comment thread) instead of `onDecide`.
5. `SecondaryLinks`.

### 7.9 Client Continuation (`client-continuation`)

**Concept:** identical mechanics to HTL Continuation (§7.1) — reuses
`ContinuationSlide`/`ContinuationFull` component-for-component — except the
workflow talking to the model is customer-facing (website chat, VCard, or
voice), so the event always carries `event.customerCard` (§6), and the
`event.type`/`STUDIOS` badges read "Client · Continuation" / `CLIENT` instead
of the internal equivalents. Everything else — the confidence display, the
draft-output editing flow, the trace timeline, the Approve/Edit/Block
decision — is the exact same component and behavior as §7.1.

**Additional/different fields vs. §7.1:** `event.studio = 'client'`,
`event.type = 'client-continuation'`, `event.origin = 'customer'`,
`event.customerCard = {...}` (required, see §6). `md` shape is identical to
§7.1's (`agent`, `model`, `confidence`, `geClass`, `draftEmail`).

### 7.10 Client Handoff (`client-handoff`)

**Concept:** identical mechanics to HTL Handoff (§7.2) — reuses
`HandoffSlide`/`HandoffFull` verbatim — for a customer-facing handoff (a
VCard prospect asking for a human, or a voice call escalated for a vulnerable
customer). Always carries `event.customerCard`.

**Additional/different fields vs. §7.2:** `event.studio = 'client'`,
`event.type = 'client-handoff'`, `event.origin = 'customer'`,
`event.customerCard = {...}` (required). `md` shape is identical to §7.2's
(`entityName`, `recordId`, `sourceSystem`, `handoffReason`, `keyFacts`,
`recommendations`, `crmRecord`, `knowledgeContract`, `transcriptSummary`).

### 7.11 Question (person-to-person `Ask`) — the `question` dispatcher case

Not a static mock type — this is what an event looks like when it's *created
at runtime* by one user asking another a question via the "Ask" action
elsewhere in the queue (as opposed to `inbound-question`, which is a
pre-existing message thread). Its display fields live directly on the event
object (`askedById`, `questionText`, `askedAt`, `whyText`, `linkedEvent`)
rather than in `EVENT_MODAL_DATA`, since it's generated, not authored as mock
data.

**Slideout (`QuestionSlide`):** `Asked by: {asker.name} · {asker.role}` →
question text (clamped) → a clickable linked-event chip if `event.linkedEvent`
exists (navigates to that event) → due label (muted).

**Full page (`QuestionFull`):**
1. `ASKED BY` — asker header + timestamp.
2. `QUESTION` — the full question text.
3. `CONTEXT` (if `whyText`) — the "why I'm asking" note.
4. `LINKED EVENT` (if present) — a clickable card (id + title) that navigates there.
5. `RESPONSE` — a textarea + **Send response** (disabled until non-empty) → `onAnswer(text)`.
6. `SecondaryLinks`.

---

## 8. Porting checklist

To rebuild this pattern in a new project:

1. **Define the four taxonomies first** (§2.2–2.5): severity tiers, the type-badge
   map, the studio map, and your list of `eventCategory` values. Colors are
   cosmetic — the *shape* (key/label/color, or key/label/verb/desc/color) is
   what other code depends on.
2. **Split event data from per-type detail data.** One flat array of event
   objects (small, filterable/sortable fields only) + one lookup object keyed
   by event id for the heavy per-type payload (`EVENT_MODAL_DATA`
   equivalent). Never inline claims/drafts/comparisons onto the event object.
3. **Build the two dispatchers** (`SlideoutTypeContext`, `DecisionSurface`)
   as plain `switch (event.eventCategory)` statements before writing any
   individual type's UI — this forces you to decide up front which types can
   share a component (e.g. any "paused workflow awaiting a decision" type
   should probably reuse a single Continuation-style component, the way
   `client-continuation` reuses `htl-continuation`'s).
4. **Build the shared primitives before the types**: a confirm-step wrapper
   (§3.1), a persistent Ask/Escalate footer (§3.2), and — if any type
   involves reviewing a list of extracted items — the claim-list-with-inline-
   correction pattern (§3.3), since at least two types will likely need it.
5. **Decide, per type, what state is local vs. lifted.** Most types keep their
   view-state (`idle` / `confirm-*` / `editing`) local to the full-page
   component. HTL/Client Handoff is the exception — its `status` (`Open` /
   `In Progress` / `Resolved`) is lifted to the page level because it needs to
   persist across a re-render triggered by acknowledging ownership.
6. **Add the Customer Card block last**, as a single optional section
   conditioned on one field (`event.customerCard`) — do not fork any
   component to support it; that's the whole point of the pattern in §6.
7. **Verify** each new type in the browser at both tiers (slideout AND full
   page) with a real mock event before considering it done — a type is only
   "in" once both dispatcher cases render without falling through to `null`.
