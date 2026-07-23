// ─── Work Queue WalkMe — guided tour steps ──────────────────────────────────
// Plain, end-user-facing language. Every step's `target` is a real selector —
// re-check these after any layout change (see the demo-walkme-react skill).
//
// A note on `setup` + `route` ordering: the engine runs `setup` BEFORE
// navigating to `step.route`. So a step can only `setup`-click something that
// already exists on the CURRENT page — never something that only appears
// after this same step's own route change. Steps that need "navigate, then
// click something on the new page" are split across two consecutive steps:
// one that only sets `route`, followed by one (no `route`) that only
// `setup`-clicks.

const closeAnyOverlay = async () => {
  document.querySelector('.modal-close')?.click()
}

export const WQ_TOUR_STEPS = [
  {
    title: 'Welcome to your Work Queue',
    body: 'This is where every task, approval, and decision that needs <strong>you</strong> shows up — across every studio you work with. Let’s walk through how to use it.',
    route: '/work-queue/overview',
  },
  {
    title: 'Your Day, assembled for you',
    body: 'The <strong>Overview</strong> tab starts you off with the single most urgent item, plus quick shortcuts to your work, your team’s work, and any messages waiting on you.',
    route: '/work-queue/overview',
    target: '.wqov-col-myday',
    scrollToTarget: true,
  },
  {
    title: 'Counts at a glance',
    body: 'These cards break your workload down by <strong>urgency</strong> (Act Now, Critical, Action, Heads-up) and by <strong>what kind of decision</strong> it is. Click any card to jump straight to that filtered list.',
    route: '/work-queue/overview',
    target: '.wqov-count-row',
    scrollToTarget: true,
  },
  {
    title: 'Studio Health',
    body: 'This strip shows how healthy each studio you touch is doing right now, with a trend arrow for the last week. Click a studio to see exactly what would move its score up.',
    route: '/work-queue/overview',
    target: '.wqov-health-strip',
    scrollToTarget: true,
  },
  {
    title: 'The Work Queues tab — your real list',
    body: 'This is where you’ll spend most of your time: every item that needs a decision from you, as individual cards you can act on directly.',
    route: '/work-queue/work-queues',
  },
  {
    title: 'My Work vs. My Team',
    body: '<strong>My Work</strong> shows only what’s assigned to you. <strong>My Team</strong> (for managers) shows everyone’s items, so you can step in, nudge someone, or reassign work if it’s stuck.',
    route: '/work-queue/work-queues',
    target: '.wq-view-toggle',
    pulse: true,
  },
  {
    title: 'Search and filter',
    body: 'Search by event ID, spec, or keyword, or narrow the list by <strong>Team</strong>, <strong>Studio</strong>, <strong>Type</strong>, or <strong>Due date</strong> using the dropdowns on the right.',
    route: '/work-queue/work-queues',
    target: '.wq-filter-bar',
    scrollToTarget: true,
  },
  {
    title: 'Severity chips — how urgent is it?',
    body: 'Every item is bucketed by urgency: <strong>Act Now</strong> (drop what you’re doing), <strong>Critical</strong> (high priority), <strong>Action</strong> (needs a response this week), and <strong>Heads-up</strong> (FYI, no action required). Click a chip to filter the list to just that tier. The Default/Today/Due Date chips next to them just change the sort order.',
    route: '/work-queue/work-queues',
    target: '.wq-sev-chips',
    scrollToTarget: true,
  },
  {
    title: 'Anatomy of a card',
    body: 'Each card shows the event ID, how many comments are on it, and its due status up top. Below that: the title, a plain-language description, and — when relevant — how many <strong>workflows or agents</strong> are blocked until you act.',
    route: '/work-queue/work-queues',
    target: '.wq-event-card',
    scrollToTarget: true,
  },

  // ── Every action on a card, one at a time ──────────────────────────────────
  {
    title: 'Skip — put it down for a bit',
    body: 'Not ready for this one yet? <strong>Skip</strong> pushes it to the bottom of your list and it resurfaces automatically in <strong>2 hours</strong>. Nothing is lost or reassigned — it’s just out of your way for now.',
    route: '/work-queue/work-queues',
    target: '[data-tour="wq-skip-btn"]',
    scrollToTarget: true,
  },
  {
    title: 'Details — open the full case',
    body: '<strong>Details</strong> takes you into the complete internal view for this event: every claim, every piece of evidence, and the actual decision controls. Let’s open one.',
    route: '/work-queue/work-queues',
    target: '[data-tour="wq-details-btn"]',
    scrollToTarget: true,
  },
  {
    title: 'Inside the full case view',
    body: 'This is the internal view. The main panel holds the decision itself — the claims, evidence, and the action you need to take. The side panel on the right keeps <strong>Attestations</strong> and the <strong>Audit log</strong> one click away.',
    route: '/work-queue/event/EVT-001',
    target: '.wqep-root',
    scrollToTarget: true,
  },
  {
    title: 'Back in the list',
    body: 'Most of the time you won’t need the full case — you can act right from the card. Let’s go through the rest of the buttons.',
    route: '/work-queue/work-queues',
    target: '.wq-card-action-row',
    scrollToTarget: true,
  },
  {
    title: 'Ask — loop in a teammate',
    body: '<strong>Ask</strong> opens a short form to send a question to anyone in the company. It creates a task for them and adds the question to this event’s thread, so the context travels with it.',
    setup: closeAnyOverlay,
    target: '[data-tour="wq-ask-btn"]',
    scrollToTarget: true,
  },
  {
    title: 'The Ask form',
    body: 'Pick who you’re asking, write your question, and optionally set a due date. They’ll get a task; you’ll see their answer land back in this event’s thread.',
    setup: async () => {
      await closeAnyOverlay()
      document.querySelector('[data-tour="wq-ask-btn"]')?.click()
    },
    target: '.qm-body',
  },
  {
    title: 'Escalate — send it up',
    body: '<strong>Escalate</strong> is for when something is outside your authority, too risky to decide alone, or you just need help. It notifies whoever you pick and flags the event as escalated.',
    setup: closeAnyOverlay,
    target: '[data-tour="wq-escalate-btn"]',
    scrollToTarget: true,
  },
  {
    title: 'The Escalate form',
    body: 'Say why you’re escalating, add the people who need to weigh in, and leave a message explaining what you need from them. You can also mark it <strong>High priority</strong>.',
    setup: async () => {
      await closeAnyOverlay()
      document.querySelector('[data-tour="wq-escalate-btn"]')?.click()
    },
    target: '[data-tour="wq-escalate-modal"]',
  },
  {
    title: 'The ⋮ menu — more actions',
    body: 'Click the three dots for a few less-frequent actions, starting with <strong>Trace</strong>.',
    setup: closeAnyOverlay,
    target: '[data-tour="wq-card-menu-btn"]',
    scrollToTarget: true,
  },
  {
    title: 'Trace — see how it got here',
    body: 'Here’s the menu open. <strong>Trace</strong> shows the automated workflow that led to this event — every step it took, in order, before it needed a human.',
    setup: async () => {
      await closeAnyOverlay()
      document.querySelector('[data-tour="wq-card-menu-btn"]')?.click()
    },
    target: '[data-tour="wq-card-menu"]',
  },
  {
    title: 'The workflow trace',
    body: 'Each step shows what happened and when — done, paused, blocked, or errored — so you can see exactly why this landed in your queue instead of finishing automatically.',
    // Re-open the menu and click Trace in one atomic setup rather than
    // relying on the previous step's menu staying open — CardMenu closes
    // itself on ANY outside mousedown, including the click on this tour's
    // own "Next" button that just fired to reach this step.
    setup: async () => {
      await closeAnyOverlay()
      document.querySelector('[data-tour="wq-card-menu-btn"]')?.click()
      await new Promise(r => setTimeout(r, 60))
      document.querySelector('[data-tour="wq-trace-item"]')?.click()
    },
    target: '.drawer.drawer--open',
  },
  {
    title: 'Take it, Nudge, Reassign — team actions',
    body: 'When you’re viewing <strong>My Team</strong> instead of My Work, the ⋮ menu adds three more options: <strong>Take it</strong> (claim it for yourself), <strong>Nudge</strong> (remind whoever owns it), and <strong>Reassign</strong> (hand it to someone else). They only appear in team view, since they only make sense for work you’re not personally holding.',
    setup: closeAnyOverlay,
  },

  // ── Clicking the card itself ────────────────────────────────────────────────
  {
    title: 'Click the card for a quick preview',
    body: 'Clicking anywhere on the card (not a button) opens a fast preview without leaving the list — the same information as Details, in a lighter panel.',
    setup: async () => {
      await closeAnyOverlay()
      document.querySelector('.wq-event-card')?.click()
    },
    target: '.evsl-drawer',
  },
  {
    title: 'Tags tell you the context',
    body: 'The colored tags at the bottom of each card tell you the <strong>studio</strong> it came from (like Governance or Agentic), the <strong>type</strong> of decision (Approve, Review, Respond, Resolve, Acknowledge, Train, or Message), the team it’s routed to, and whether it’s <strong>Mission Critical</strong>.',
    setup: async () => {
      document.querySelector('.evsl-close-btn')?.click()
    },
    target: '.wq-card-tags-row',
    scrollToTarget: true,
  },

  // ── Every event type, briefly ───────────────────────────────────────────────
  {
    title: 'Every event has a tailored internal view',
    body: 'Beyond the general layout, the full case view adapts to the <strong>kind</strong> of situation it is. Here’s a quick look at each one.',
    route: '/work-queue/work-queues',
  },
  {
    title: 'HTL Continuation',
    body: 'An automated workflow got partway through and paused because it wasn’t confident enough to keep going on its own. You review what it drafted so far and decide: let it continue, edit it first, or block it.',
    route: '/work-queue/event/EVT-002',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'HTL Handoff',
    body: 'An agent finished everything it could automate and is handing the rest to you directly — there’s no more automation to run, just a manual follow-up that needs a human touch.',
    route: '/work-queue/event/EVT-021',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Client Continuation',
    body: 'Same idea as HTL Continuation, but the workflow talking to the AI is customer-facing — a website chat, VCard, or voice call. That’s why you’ll see a <strong>Customer Card</strong> here too: the customer’s profile, relationship history, and sentiment, so you have the context to respond to a real person, not just resume a workflow.',
    route: '/work-queue/event/EVT-C001',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Client Handoff',
    body: 'A customer-facing AI handed the conversation to you directly — no more automation to run. The <strong>Customer Card</strong> at the top gives you everything you need to pick up where the AI left off: who they are, what they’ve asked, and how they’re feeling about it.',
    route: '/work-queue/event/EVT-C004',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Question',
    body: 'A direct question from a colleague, sent through the queue instead of chat, so it doesn’t get buried. You can answer it right here and it counts as handling the event.',
    route: '/work-queue/event/EVT-022',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Train Me',
    body: 'The system made a prediction and the real outcome turned out different. Your correction here doesn’t just fix this one case — it retrains the model so it does better next time.',
    route: '/work-queue/event/EVT-011',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Gov Promotion',
    body: 'A policy or workflow change is proposed and ready to go live — but needs your formal sign-off first. You review each underlying claim and approve or reject it before it’s promoted.',
    route: '/work-queue/event/EVT-001',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Gov Review',
    body: 'Someone hit a conflict or judgment call that’s outside their sign-off authority, and they’re asking you — as the reviewer — to make the final call before the case can move forward.',
    route: '/work-queue/event/EVT-006',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Gov Break Glass',
    body: 'An emergency access request, used only for incident response outside the normal process. It always requires a <strong>second approver</strong> before access is actually granted.',
    route: '/work-queue/event/EVT-004',
    target: '.wqep-detail',
    scrollToTarget: true,
  },
  {
    title: 'Gov Change Request',
    body: 'A proposed change to a rule, threshold, or configuration that needs your sign-off before it takes effect — so nothing shifts in production without a human checking it first.',
    route: '/work-queue/event/EVT-012',
    target: '.wqep-detail',
    scrollToTarget: true,
  },

  {
    title: 'Messages',
    body: 'Direct messages and broadcasts from teammates and the system land here — separate from your action queue, so a quick note never gets buried under approvals.',
    route: '/work-queue/messages',
  },
  {
    title: 'Activity — Transfers & Audit Ledger',
    body: '<strong>Transfers</strong> shows every time work moved between people — out-of-office handoffs, manager reassignments, or system escalations. The <strong>Audit Ledger</strong> tab next to it is the tamper-proof record of every action ever taken, with a hash chain you can verify.',
    route: '/work-queue/activity',
    target: '.wq-sub-tabs',
  },
  {
    title: 'Attestations',
    body: 'Some changes need a formal sign-off — from you or from someone without studio access. This tab tracks who’s attested to what, and what’s still pending.',
    route: '/work-queue/attestations',
    target: '.wq-attestations',
  },
  {
    title: 'Task View',
    body: 'A focused, one-at-a-time view for working through your queue item by item without the distraction of the full list — handy when you just want to power through.',
    route: '/work-queue/task-view',
  },
  {
    title: 'That’s the tour!',
    body: 'You can reopen this walkthrough any time with the <strong>Walk me through it</strong> button in the corner — it’ll remember where you left off if you close it partway through.',
    route: '/work-queue/overview',
  },
]
