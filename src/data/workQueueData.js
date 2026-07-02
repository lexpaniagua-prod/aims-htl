// ─── Mike's taxonomy — severity tiers ────────────────────────────────────────
export const SEVERITY = {
  now:    { key: 'now',    label: 'Act Now',  color: '#f43f5e', bgClass: 'sev-now',    textClass: 'sev-now-text'    },
  red:    { key: 'red',    label: 'Critical', color: '#ef4444', bgClass: 'sev-red',    textClass: 'sev-red-text'    },
  yellow: { key: 'yellow', label: 'Action',   color: '#f59e0b', bgClass: 'sev-yellow', textClass: 'sev-yellow-text' },
  green:  { key: 'green',  label: 'Heads-up', color: '#10b981', bgClass: 'sev-green',  textClass: 'sev-green-text'  },
}
export const SEVERITY_ORDER = ['now', 'red', 'yellow', 'green']

// ─── Mike's taxonomy — event types ───────────────────────────────────────────
export const EVENT_TYPES = {
  approve:     { key: 'approve',     label: 'Approve',     verb: 'Approve',     desc: 'Decision required to approve or reject',   color: '#3b82f6' },
  review:      { key: 'review',      label: 'Review',      verb: 'Review',      desc: 'Human review required before proceeding',  color: '#8b5cf6' },
  respond:     { key: 'respond',     label: 'Respond',     verb: 'Respond',     desc: 'Response or action required',              color: '#14b8a6' },
  resolve:     { key: 'resolve',     label: 'Resolve',     verb: 'Resolve',     desc: 'Conflict or issue to be resolved',         color: '#f59e0b' },
  acknowledge: { key: 'acknowledge', label: 'Acknowledge', verb: 'Acknowledge', desc: 'Informational — confirm awareness',        color: '#10b981' },
  train:       { key: 'train',       label: 'Train Me',    verb: 'Decide',      desc: 'Human decision trains the model',          color: '#f43f5e' },
  message:     { key: 'message',     label: 'Message',     verb: 'Reply',       desc: 'Agent-intercepted message requiring human review', color: '#06b6d4' },
}

// ─── Studios ──────────────────────────────────────────────────────────────────
export const STUDIOS = {
  gov:     { key: 'gov',     name: 'Helix Governance Studio', short: 'GOV',   accentColor: '#8b5cf6' },
  data:    { key: 'data',    name: 'Helix Data Studio',       short: 'DATA',  accentColor: '#0ea5e9' },
  agentic: { key: 'agentic', name: 'Agentic Studio',          short: 'AGNT',  accentColor: '#10b981' },
}

// ─── People (12 entries) ──────────────────────────────────────────────────────
export const PEOPLE = [
  {
    id: 'p1',  name: 'Alexa M.',   initials: 'AM', role: 'Admin',              dept: 'Platform',
    scope: 'executive', studios: ['gov','data','agentic'], partitions: ['*'],
  },
  {
    id: 'p2',  name: 'Marcus H.',  initials: 'MH', role: 'Governance Lead',    dept: 'Risk',
    scope: 'manager',   studios: ['gov'],            partitions: ['finance','legal','compliance'],
  },
  {
    id: 'p3',  name: 'Priya K.',   initials: 'PK', role: 'Data Ops Manager',   dept: 'Data',
    scope: 'manager',   studios: ['data'],           partitions: ['pii','data-ops'],
  },
  {
    id: 'p4',  name: 'Jordan T.',  initials: 'JT', role: 'Compliance Analyst', dept: 'Risk',
    scope: 'individual', studios: ['gov'],           partitions: ['compliance'],
  },
  {
    id: 'p5',  name: 'Sam R.',     initials: 'SR', role: 'Data Engineer',      dept: 'Data',
    scope: 'individual', studios: ['data'],          partitions: ['data-ops'],
  },
  {
    id: 'p6',  name: 'Casey V.',   initials: 'CV', role: 'Agentic Ops',        dept: 'AI Ops',
    scope: 'individual', studios: ['agentic'],       partitions: ['agentic'],
  },
  {
    id: 'p7',  name: 'Devon N.',   initials: 'DN', role: 'IT Security',        dept: 'IT',
    scope: 'individual', studios: ['gov','data'],    partitions: ['security','pii'],
  },
  {
    id: 'p8',  name: 'Riley P.',   initials: 'RP', role: 'Finance Analyst',    dept: 'Finance',
    scope: 'individual', studios: ['gov'],           partitions: ['finance'],
  },
  {
    id: 'p9',  name: 'Taylor B.',  initials: 'TB', role: 'ML Engineer',        dept: 'AI Ops',
    scope: 'individual', studios: ['agentic','data'], partitions: ['agentic','data-ops'],
  },
  {
    id: 'p10', name: 'Morgan C.',  initials: 'MC', role: 'Agentic Ops Lead',   dept: 'AI Ops',
    scope: 'manager',   studios: ['agentic'],        partitions: ['agentic'],
  },
  {
    id: 'p11', name: 'Quinn S.',   initials: 'QS', role: 'CTO',                dept: 'Executive',
    scope: 'executive', studios: ['gov','data','agentic'], partitions: ['*'],
  },
  {
    id: 'p12', name: 'Luis F.',    initials: 'LF', role: 'KB Curator',         dept: 'Knowledge',
    scope: 'individual', studios: ['gov'],           partitions: ['knowledge'],
    ooo: { until: '2026-06-25', delegate: 'p3' },
  },
]

// ─── Events (18 entries) ──────────────────────────────────────────────────────
export const EVENTS = [
  // ── Act Now ─────────────────────────────────────────────────────────
  {
    id: 'EVT-001', severity: 'now', studio: 'gov', ownerId: 'p2',
    title: 'DIAN Intake: Financial Policy PDF requires approval',
    detail: '7 claims extracted, 2 knowledge conflicts detected. Will block FinancePolicyBot until resolved.',
    blastRadius: { workflows: 14, agents: 3, description: 'Blocks FinancePolicyBot and downstream compliance workflows' },
    dueLabel: 'Due now', dueDate: '2026-07-02', type: 'approve', origin: 'customer', dueToday: true, missionCritical: true,
    quickActions: ['Approve Intake', 'View Claims', 'Reject'],
    spec: 'DIAN-4821', kind: 'DIAN Intake',
    sourceWorkflow: {
      id: 'WF-9901', name: 'DIAN Claim Extraction Pipeline',
      steps: [
        { step: 1, timestamp: '2026-06-17T08:00:00Z', label: 'Document Received',   status: 'done',    detail: 'Financial Policy PDF uploaded to /diane-intake/wealth-mgmt' },
        { step: 2, timestamp: '2026-06-17T08:01:30Z', label: 'Claim Extraction',    status: 'done',    detail: '7 claims extracted by DIAN parser v2.4' },
        { step: 3, timestamp: '2026-06-17T08:02:00Z', label: 'Conflict Detection',  status: 'done',    detail: '2 conflicts: GE-FIN-001 vs GE-FIN-007' },
        { step: 4, timestamp: '2026-06-17T08:02:10Z', label: 'Human Approval Gate', status: 'paused',  detail: 'Awaiting human approval before committing to Truth Registry' },
        { step: 5, timestamp: null,                    label: 'Commit to Truth',     status: 'pending', detail: 'Will write approved claims to Truth Registry' },
      ],
    },
  },
  {
    id: 'EVT-002', severity: 'now', studio: 'agentic', ownerId: 'p10',
    title: 'HITL Pause: SalesForecastPA about to send external email',
    detail: 'Agent paused before GE-COMM action. Confidence 0.71 — below threshold. External recipient: partner@gefinancial.com.',
    blastRadius: { workflows: 3, agents: 1, description: 'SalesForecastPA stalled, downstream report generation blocked' },
    dueLabel: 'Paused', dueDate: '2026-07-02', type: 'approve', origin: 'customer', dueToday: true, missionCritical: true,
    quickActions: ['Allow Send', 'Block Send', 'Edit Draft'],
    spec: 'GE-COMM', kind: 'HITL Pause',
    sourceWorkflow: {
      id: 'WF-7712', name: 'SalesForecastPA External Comms',
      steps: [
        { step: 1, timestamp: '2026-06-17T09:10:00Z', label: 'Forecast Generated', status: 'done',    detail: 'Q3 sales forecast compiled from CRM + pipeline data' },
        { step: 2, timestamp: '2026-06-17T09:11:20Z', label: 'Recipient Lookup',   status: 'done',    detail: 'Recipient resolved: partner@gefinancial.com (external)' },
        { step: 3, timestamp: '2026-06-17T09:11:25Z', label: 'Confidence Check',   status: 'done',    detail: 'Confidence 0.71 — below 0.85 threshold for auto-send' },
        { step: 4, timestamp: '2026-06-17T09:11:26Z', label: 'HITL Gate',          status: 'paused',  detail: 'Waiting for human authorization to send external email' },
        { step: 5, timestamp: null,                    label: 'Send / Cancel',      status: 'pending', detail: 'Action pending human decision' },
      ],
    },
  },
  {
    id: 'EVT-003', severity: 'now', studio: 'data', ownerId: 'p3',
    title: 'Watch-folder ingest: 3 docs queued in /diane-intake/wealth-mgmt',
    detail: 'Documents staged and validated. Awaiting human approval before DIAN parsing begins.',
    blastRadius: { workflows: 8, agents: 2, description: 'Wealth Management knowledge base update blocked' },
    dueLabel: 'Queued 14m ago', dueDate: '2026-07-02', type: 'approve', origin: 'customer', dueToday: true, missionCritical: true,
    quickActions: ['Approve Ingest', 'Preview Docs', 'Reject'],
    spec: 'INGEST-338', kind: 'Watch Folder',
  },
  {
    id: 'EVT-004', severity: 'now', studio: 'gov', ownerId: 'p1',
    title: 'Break Glass: Temp PII partition access request',
    detail: 'Emergency PII access for incident response. Requires 2 approvers. 1 of 2 approvals received.',
    blastRadius: { workflows: 1, agents: 0, description: 'Incident response workflow stalled pending second approval' },
    dueLabel: 'Awaiting 2nd approval', dueDate: '2026-07-02', type: 'approve', origin: 'internal', dueToday: true, missionCritical: true,
    quickActions: ['Approve Access', 'Deny Access'],
    spec: 'BG-0091', kind: 'Break Glass',
  },

  // ── Critical ─────────────────────────────────────────────────────────
  {
    id: 'EVT-005', severity: 'red', studio: 'gov', ownerId: 'p4',
    title: 'Salesforce connector OAuth expires in 4 days',
    detail: 'Token expiration will break DIAN intake pipeline and 57 downstream workflows. Renew before Jun 21.',
    blastRadius: { workflows: 57, agents: 8, description: 'All Salesforce-dependent workflows will fail on expiry' },
    dueLabel: 'Jun 21', dueDate: '2026-06-21', type: 'respond', origin: 'internal', dueToday: false, missionCritical: true,
    quickActions: ['Renew OAuth', 'View Connector'],
    spec: 'CONN-SF-001', kind: 'Connector Health',
  },
  {
    id: 'EVT-006', severity: 'red', studio: 'gov', ownerId: 'p12',
    title: 'KBU TTL expiring: Return Policy v3 — 6 days',
    detail: 'Knowledge Base Unit auto-expires in 6 days. Review and extend TTL or replace with updated policy.',
    blastRadius: { workflows: 12, agents: 4, description: 'ReturnPolicyBot and ServiceDesk agents will lose policy context' },
    dueLabel: 'Jun 23', dueDate: '2026-06-23', type: 'review', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Extend TTL', 'Replace KBU', 'Archive'],
    spec: 'KBU-4490', kind: 'KBU Expiry',
    coveringFor: 'p12',
  },
  {
    id: 'EVT-007', severity: 'red', studio: 'cross', ownerId: 'p10',
    title: 'Cross-studio chain: Salesforce → DIAN → QuoteBot version mismatch',
    detail: 'Schema mismatch between Salesforce v47 output and DIAN parser expecting v45. QuoteBot stalled.',
    blastRadius: { workflows: 22, agents: 5, description: 'Full quote generation pipeline broken across three studios' },
    dueLabel: 'Blocking', dueDate: '2026-07-02', type: 'resolve', origin: 'customer', dueToday: true, missionCritical: true,
    quickActions: ['View Mismatch', 'Apply Schema Patch', 'Rollback'],
    spec: 'CHAIN-0712', kind: 'Schema Conflict',
    sourceWorkflow: {
      id: 'WF-0800', name: 'Cross-Studio Quote Pipeline',
      steps: [
        { step: 1, timestamp: '2026-06-17T06:00:00Z', label: 'Salesforce Data Pull', status: 'done',    detail: 'Account data pulled via SF v47 connector' },
        { step: 2, timestamp: '2026-06-17T06:01:00Z', label: 'DIAN Parse',           status: 'error',   detail: 'Schema mismatch — expected v45 field `account_code`, got `accountId`' },
        { step: 3, timestamp: null,                    label: 'QuoteBot Generation',  status: 'blocked', detail: 'Waiting for schema resolution' },
        { step: 4, timestamp: null,                    label: 'CRM Write-back',       status: 'pending', detail: 'Will update Salesforce opportunity on completion' },
      ],
    },
  },
  {
    id: 'EVT-008', severity: 'yellow', studio: 'agentic', ownerId: 'p9',
    title: 'Agent WorkflowSpec pinned to retiring Truth version',
    detail: 'ForecastAgent workflow spec references Truth v3.1 which retires Jul 1. Update pin or auto-migrate.',
    blastRadius: { workflows: 4, agents: 1, description: 'ForecastAgent will break on Truth v3.1 retirement' },
    dueLabel: 'Jul 1', dueDate: '2026-07-01', type: 'respond', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Update Pin', 'Auto-migrate', 'Dismiss'],
    spec: 'SPEC-FA-009', kind: 'Version Pin',
  },
  {
    id: 'EVT-009', severity: 'yellow', studio: 'gov', ownerId: 'p4',
    title: 'Knowledge Contract expiring: TR access for ComplianceBot',
    detail: "ComplianceBot's read access to the Truth Registry partition expires in 18 days. Renew or reassign.",
    blastRadius: { workflows: 7, agents: 1, description: 'ComplianceBot will lose knowledge access on contract expiry' },
    dueLabel: 'Jul 5', dueDate: '2026-07-05', type: 'review', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Renew Contract', 'View Terms'],
    spec: 'KC-2204', kind: 'Knowledge Contract',
  },
  {
    id: 'EVT-010', severity: 'yellow', studio: 'gov', ownerId: 'p2',
    title: 'Sandbox claim RC-4412 stuck in KCON review — 11 days',
    detail: 'Claim RC-4412 ("regional multiplier = 1.15") has been in KCON review for 11 days. Resolution required.',
    blastRadius: { workflows: 3, agents: 2, description: 'RegionalPricingBot using stale multiplier pending resolution' },
    dueLabel: '11 days idle', type: 'respond', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Approve Claim', 'Reject Claim', 'Escalate'],
    spec: 'RC-4412', kind: 'KCON Review',
  },
  {
    id: 'EVT-011', severity: 'yellow', studio: 'gov', ownerId: 'p12',
    title: 'Train Me: Regional multiplier correction awaiting decision',
    detail: 'Model predicted 1.12 but ground truth is 1.15. Your decision will update the regional pricing model.',
    blastRadius: { workflows: 2, agents: 1, description: 'Pricing model accuracy affected until decision made' },
    dueLabel: 'Open', type: 'train', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Confirm 1.15', 'Override', 'Skip'],
    spec: 'TM-0881', kind: 'Train Me',
    coveringFor: 'p12',
  },
  {
    id: 'EVT-012', severity: 'yellow', studio: 'gov', ownerId: 'p2',
    title: 'Conflict in Truth: GE-COMP threshold — two sources disagree',
    detail: 'Compliance threshold GE-COMP-004: Source A says 0.85, Source B says 0.90. Resolution determines bot behavior.',
    blastRadius: { workflows: 6, agents: 3, description: 'ComplianceBot using lower threshold until conflict resolved' },
    dueLabel: 'Open', type: 'resolve', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Accept 0.90', 'Accept 0.85', 'Request Review'],
    spec: 'CONF-GE-004', kind: 'Truth Conflict',
  },

  // ── Heads-up ─────────────────────────────────────────────────────────
  {
    id: 'EVT-013', severity: 'green', studio: 'data', ownerId: 'p5',
    title: 'Embedding index refresh due (monthly)',
    detail: 'Monthly embedding re-index is scheduled. Approve window to avoid disruption during peak hours.',
    blastRadius: { workflows: 0, agents: 0, description: '' },
    dueLabel: 'Jun 20', dueDate: '2026-06-20', type: 'respond', origin: 'internal', dueToday: true, missionCritical: false,
    quickActions: ['Schedule Window', 'Auto-approve'],
    spec: 'IDX-MONTHLY', kind: 'Maintenance',
  },
  {
    id: 'EVT-014', severity: 'green', studio: 'gov', ownerId: 'p8',
    title: 'GE-FIN budget 62% consumed',
    detail: 'Financial governance envelope at 62% with 14 days remaining in period. Projected overage: 8%.',
    blastRadius: { workflows: 0, agents: 0, description: '' },
    dueLabel: 'Jun 30', dueDate: '2026-06-30', type: 'acknowledge', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Acknowledge', 'View Budget'],
    spec: 'GE-FIN-BUDGET', kind: 'Budget Alert',
  },
  {
    id: 'EVT-015', severity: 'green', studio: 'gov', ownerId: 'p1',
    title: 'Quarterly access recertification due',
    detail: 'Q2 access recertification window opens Jun 20. 24 users require recertification across 3 partitions.',
    blastRadius: { workflows: 0, agents: 0, description: '' },
    dueLabel: 'Jun 20', dueDate: '2026-06-20', type: 'review', origin: 'internal', dueToday: true, missionCritical: false,
    quickActions: ['Open Recertification', 'Delegate'],
    spec: 'RECERT-Q2-2026', kind: 'Access Review',
  },
  {
    id: 'EVT-016', severity: 'green', studio: 'agentic', ownerId: 'p6',
    title: 'AdvisorCopilot engagement report ready',
    detail: 'Weekly engagement summary: 847 interactions, 94% resolution rate, 3 escalations. No action required.',
    blastRadius: { workflows: 0, agents: 0, description: '' },
    dueLabel: 'Informational', type: 'acknowledge', origin: 'customer', dueToday: false, missionCritical: false,
    quickActions: ['Acknowledge', 'View Report'],
    spec: 'RPT-ADVISOR-W24', kind: 'Report',
  },

  // ── Helix Data Studio — additional events ────────────────────────────
  {
    id: 'EVT-017', severity: 'red', studio: 'data', ownerId: 'p3',
    title: 'PII pipeline hold: SSNs detected in raw upload',
    detail: 'Automated PII scan flagged 34 SSN patterns in /uploads/hr-batch-0614. Pipeline paused pending human review and redaction approval.',
    blastRadius: { workflows: 9, agents: 2, description: 'HR analytics pipeline fully blocked pending PII review' },
    dueLabel: 'Paused', dueDate: '2026-07-02', type: 'approve', origin: 'internal', dueToday: true, missionCritical: true,
    quickActions: ['Approve Redaction', 'Reject Upload', 'View Flagged Fields'],
    spec: 'PII-HOLD-0614', kind: 'PII Hold',
  },
  {
    id: 'EVT-018', severity: 'yellow', studio: 'data', ownerId: 'p5',
    title: 'Entity resolution conflict: "Northfield Partners" vs "Northfield Capital"',
    detail: 'Deduplication model is 68% confident these are the same entity. Human decision required to merge or keep separate.',
    blastRadius: { workflows: 5, agents: 3, description: 'CRM dedup pipeline stalled; duplicate entity records affecting downstream reports' },
    dueLabel: 'Open', type: 'resolve', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Merge Entities', 'Keep Separate', 'Request More Data'],
    spec: 'ENT-DEDUP-0441', kind: 'Entity Resolution',
  },

  // ── Messages ──────────────────────────────────────────────────────────
  {
    id: 'EVT-019', severity: 'yellow', studio: 'gov', ownerId: 'p2',
    title: 'Jordan T. asking about GE-FIN-001 vs GE-FIN-007 conflict',
    detail: 'Jordan T. has a question about conflicting knowledge sources in the latest DIAN intake. Needs your context before they can proceed.',
    blastRadius: { workflows: 0, agents: 0, description: '' },
    dueLabel: 'Awaiting reply', type: 'message', origin: 'internal', dueToday: false, missionCritical: false,
    quickActions: ['Reply', 'Forward', 'Dismiss'],
    spec: 'MSG-0441', kind: 'Team Message',
    messageData: {
      kind: 'question',
      subject: 'Quick question on GE-FIN conflict',
      thread: [
        {
          from: 'p4',
          timestamp: '2026-06-30T14:22:00Z',
          body: 'Hey Marcus — quick question. Do you have context on why GE-FIN-001 and GE-FIN-007 are showing as conflicting in the latest DIAN intake? I can see them flagged but I don\'t have access to the original source documents to verify which one is actually correct. Is this something that was already reviewed last quarter?',
        },
      ],
    },
  },
  {
    id: 'EVT-020', severity: 'yellow', studio: 'agentic', ownerId: 'p6',
    title: 'Morgan C. requesting attestation on SalesForecastPA migration',
    detail: 'Morgan C. is asking Casey to confirm ownership of the SalesForecastPA migration before the Truth v3.1 cutover. Two messages unread.',
    blastRadius: { workflows: 0, agents: 0, description: '' },
    dueLabel: 'Reply needed', dueDate: '2026-07-02', type: 'message', origin: 'internal', dueToday: true, missionCritical: false,
    quickActions: ['Reply', 'Forward', 'Dismiss'],
    spec: 'MSG-0512', kind: 'Attestation Request',
    messageData: {
      kind: 'attestation-request',
      subject: 'SalesForecastPA — Truth v3.1 migration ownership',
      thread: [
        {
          from: 'p10',
          timestamp: '2026-07-01T08:45:00Z',
          body: 'Casey — heads up on the SalesForecastPA workflow spec. It\'s still pinned to Truth v3.1 which retires Jul 1. Do you know if Taylor already started the migration, or do we need to escalate this?',
        },
        {
          from: 'p6',
          timestamp: '2026-07-01T08:52:00Z',
          body: 'Looking into it now. Taylor was supposed to handle it but I haven\'t seen any PR yet.',
        },
        {
          from: 'p10',
          timestamp: '2026-07-01T09:03:00Z',
          body: 'Can you take ownership and push the update today? I\'ll send the attestation once it\'s ready. We can\'t let this slip past cutover.',
        },
      ],
    },
  },
]

// ─── Transfers (3 entries) ────────────────────────────────────────────────────
export const TRANSFERS = [
  {
    id: 'TRF-001',
    from: 'p12', to: 'p3',
    reason: 'OOO auto-delegation — Luis F. out Jun 17–25',
    mode: 'ooo-auto',
    eventCount: 2, blastRadius: 'Low',
    initiator: 'System',
    timestamp: '2026-06-17T07:00:00Z',
  },
  {
    id: 'TRF-002',
    from: 'p4', to: 'p2',
    reason: 'Manager-initiated: Jordan T. capacity overflow (7 open items)',
    mode: 'manager-initiated',
    eventCount: 2, blastRadius: 'Medium',
    initiator: 'Marcus H.',
    timestamp: '2026-06-17T09:30:00Z',
  },
  {
    id: 'TRF-003',
    from: 'p8', to: 'p2',
    reason: 'System escalation: SLA breach risk on EVT-014, EVT-015',
    mode: 'system-escalation',
    eventCount: 2, blastRadius: 'Low',
    initiator: 'System',
    timestamp: '2026-06-17T10:15:00Z',
  },
]

// ─── Audit log (15 entries — hash-chained) ────────────────────────────────────
export const AUDIT_LOG = [
  { id: 'AUD-001', timestamp: '2026-06-17T07:00:00Z', actor: 'System',    action: 'OOO Transfer',         studio: 'gov',     artifact: 'EVT-006, EVT-011', risk: 'low',      outcome: 'success',   hash: 'a1b2c3d4', prevHash: '00000000' },
  { id: 'AUD-002', timestamp: '2026-06-17T07:15:00Z', actor: 'Alexa M.',  action: 'Login',                studio: 'cross',   artifact: 'Session',          risk: 'none',     outcome: 'success',   hash: 'e5f6a7b8', prevHash: 'a1b2c3d4' },
  { id: 'AUD-003', timestamp: '2026-06-17T07:32:00Z', actor: 'Marcus H.', action: 'Approved Intake',      studio: 'gov',     artifact: 'EVT-003',          risk: 'medium',   outcome: 'success',   hash: 'c9d0e1f2', prevHash: 'e5f6a7b8' },
  { id: 'AUD-004', timestamp: '2026-06-17T07:45:00Z', actor: 'Priya K.',  action: 'Reviewed KBU',         studio: 'gov',     artifact: 'KBU-4490',         risk: 'low',      outcome: 'success',   hash: 'a3b4c5d6', prevHash: 'c9d0e1f2' },
  { id: 'AUD-005', timestamp: '2026-06-17T08:02:10Z', actor: 'System',    action: 'HITL Pause Triggered', studio: 'agentic', artifact: 'EVT-002',          risk: 'high',     outcome: 'paused',    hash: 'e7f8a9b0', prevHash: 'a3b4c5d6' },
  { id: 'AUD-006', timestamp: '2026-06-17T08:10:00Z', actor: 'Devon N.',  action: 'Approved Break Glass', studio: 'gov',     artifact: 'BG-0091',          risk: 'critical', outcome: 'partial',   hash: 'c1d2e3f4', prevHash: 'e7f8a9b0' },
  { id: 'AUD-007', timestamp: '2026-06-17T08:30:00Z', actor: 'Jordan T.', action: 'Responded to Claim',   studio: 'gov',     artifact: 'RC-4412',          risk: 'medium',   outcome: 'pending',   hash: 'a5b6c7d8', prevHash: 'c1d2e3f4' },
  { id: 'AUD-008', timestamp: '2026-06-17T08:45:00Z', actor: 'Sam R.',    action: 'Scheduled Index',      studio: 'data',    artifact: 'IDX-MONTHLY',      risk: 'low',      outcome: 'scheduled', hash: 'e9f0a1b2', prevHash: 'a5b6c7d8' },
  { id: 'AUD-009', timestamp: '2026-06-17T09:00:00Z', actor: 'System',    action: 'PII Hold Triggered',   studio: 'data',    artifact: 'PII-HOLD-0614',    risk: 'critical', outcome: 'blocked',   hash: 'c3d4e5f6', prevHash: 'e9f0a1b2' },
  { id: 'AUD-010', timestamp: '2026-06-17T09:11:26Z', actor: 'System',    action: 'HITL Gate Created',    studio: 'agentic', artifact: 'EVT-002',          risk: 'high',     outcome: 'paused',    hash: 'a7b8c9d0', prevHash: 'c3d4e5f6' },
  { id: 'AUD-011', timestamp: '2026-06-17T09:30:00Z', actor: 'Marcus H.', action: 'Transfer Initiated',   studio: 'gov',     artifact: 'TRF-002',          risk: 'low',      outcome: 'success',   hash: 'e1f2a3b4', prevHash: 'a7b8c9d0' },
  { id: 'AUD-012', timestamp: '2026-06-17T09:48:00Z', actor: 'Taylor B.', action: 'Version Pin Updated',  studio: 'agentic', artifact: 'SPEC-FA-009',      risk: 'low',      outcome: 'pending',   hash: 'c5d6e7f8', prevHash: 'e1f2a3b4' },
  { id: 'AUD-013', timestamp: '2026-06-17T10:00:00Z', actor: 'Riley P.',  action: 'Acknowledged Budget',  studio: 'gov',     artifact: 'GE-FIN-BUDGET',    risk: 'none',     outcome: 'success',   hash: 'a9b0c1d2', prevHash: 'c5d6e7f8' },
  { id: 'AUD-014', timestamp: '2026-06-17T10:15:00Z', actor: 'System',    action: 'SLA Escalation',       studio: 'gov',     artifact: 'TRF-003',          risk: 'medium',   outcome: 'escalated', hash: 'e3f4a5b6', prevHash: 'a9b0c1d2' },
  { id: 'AUD-015', timestamp: '2026-06-17T10:30:00Z', actor: 'Alexa M.',  action: 'Attestation Created',  studio: 'cross',   artifact: 'ATT-001',          risk: 'low',      outcome: 'pending',   hash: 'c7d8e9f0', prevHash: 'e3f4a5b6' },
]

// ─── Attestations (3 entries) ─────────────────────────────────────────────────
export const ATTESTATIONS = [
  {
    id: 'ATT-001',
    from: 'p1', to: 'p2',
    linkedEvent: 'EVT-004',
    status: 'pending',
    requestedDate: '2026-06-17T10:30:00Z',
    question: 'Please confirm that Break Glass access request BG-0091 follows the documented incident response protocol and that the second approval is being sought in good faith.',
    response: null,
    auditHash: 'c7d8e9f0',
  },
  {
    id: 'ATT-002',
    from: 'p2', to: 'p4',
    linkedEvent: 'EVT-010',
    status: 'pending',
    requestedDate: '2026-06-16T14:00:00Z',
    question: 'Attest that claim RC-4412 (regional multiplier 1.15) is consistent with Q2 2026 pricing model documentation and has been validated against at least two independent sources.',
    response: null,
    auditHash: 'e3f4a5b6',
  },
  {
    id: 'ATT-003',
    from: 'p1', to: 'p3',
    linkedEvent: 'EVT-017',
    status: 'verified',
    requestedDate: '2026-06-15T09:00:00Z',
    question: "Please verify that PII redaction procedures applied to /uploads/hr-batch-0613 comply with the company's data handling policy and GDPR Article 17.",
    response: "Confirmed. Redaction was performed using the approved automated pipeline with manual spot-check on 10% of records. Full compliance verified.",
    auditHash: 'a9b0c1d2',
  },
]

// ─── Per-event modal detail data ─────────────────────────────────────────────
export const EVENT_MODAL_DATA = {
  'EVT-003': {
    docs: [
      { name: 'Wealth_Management_Policy_Update_Q2.pdf', size: '2.4 MB', pages: 18, status: 'validated' },
      { name: 'Risk_Framework_Addendum_2026.pdf',       size: '1.1 MB', pages: 7,  status: 'validated' },
      { name: 'Investment_Guidelines_Revision_3.pdf',   size: '3.8 MB', pages: 24, status: 'validated' },
    ],
  },

  'EVT-004': {
    requestor: 'Marcus H.',
    requestorRole: 'Governance Lead',
    requestTime: '2026-06-17T08:00:00Z',
    targetPartition: 'PII — Identity Records',
    justification: 'Incident IR-2026-0617: Unauthorized access detected in identity partition. Requires immediate forensic review to assess scope and remediate.',
    duration: '4 hours',
    firstApprover: 'Devon N.',
    firstApprovalTime: '2026-06-17T08:10:00Z',
    approvalRequired: 2,
    approvalReceived: 1,
  },

  'EVT-007': {
    chain: [
      { name: 'Salesforce CRM',  version: '47', status: 'ok',      note: 'Data exported with v47 schema (`accountId` field)' },
      { name: 'DIAN Parser',     version: '45', status: 'error',   note: 'Expected `account_code` — not found in v47 schema' },
      { name: 'QuoteBot',        version: null,  status: 'blocked', note: 'Waiting for DIAN output — stalled since 06:01' },
    ],
    sourceA: { name: 'Salesforce CRM v47',   value: '`accountId`',    confidence: 1.0, lastVerified: '2026-06-17', owner: 'IT Operations' },
    sourceB: { name: 'DIAN Parser v45 Spec', value: '`account_code`', confidence: 1.0, lastVerified: '2026-04-01', owner: 'Morgan C.' },
    affectedAgents:    ['QuoteBot v3.0', 'SalesForecastPA', 'ContractDraftAgent'],
    affectedWorkflows: ['Cross-Studio Quote Pipeline', 'Contract Generation', 'CRM Sync'],
    canonRecord: 'CHAIN-0712',
  },

  'EVT-017': {
    flaggedFields: [
      { field: 'SSN',                  count: 34,  rows: '12–45, 78, 102–134, 201–208' },
      { field: 'Email (potential PII)', count: 212, rows: 'Multiple ranges' },
      { field: 'DOB',                  count: 18,  rows: '56–73' },
    ],
    filename: '/uploads/hr-batch-0614',
    uploadedBy: 'HR System (automated)',
    uploadedAt: '2026-06-14T15:30:00Z',
    totalRows: 312,
  },


  'EVT-001': {
    claims: [
      { id: 'CLM-001', text: 'Minimum required return on equity for wealth management accounts is 7.2% per annum', confidence: 0.94, conflict: false },
      { id: 'CLM-002', text: 'Portfolio rebalancing must occur within 5 business days of threshold breach', confidence: 0.91, conflict: false },
      { id: 'CLM-003', text: 'Advisory fee cap for managed accounts is 1.5% of AUM annually', confidence: 0.88, conflict: false },
      { id: 'CLM-004', text: 'Compliance review required for accounts exceeding $2M in exposure', confidence: 0.95, conflict: false },
      { id: 'CLM-005', text: 'Interest rate sensitivity threshold: ±150bps triggers mandatory review', confidence: 0.79, conflict: true },
      { id: 'CLM-006', text: 'Client notification required within 48 hours of material portfolio change', confidence: 0.92, conflict: false },
      { id: 'CLM-007', text: 'Liquidity reserve minimum is 8% of total portfolio value', confidence: 0.71, conflict: true },
    ],
    conflicts: [
      {
        claimId: 'CLM-005',
        sourceA: { name: 'Financial Policy Manual v12', value: '±150bps', lastVerified: '2026-03-01' },
        sourceB: { name: 'Risk Framework Q1 2026',    value: '±200bps', lastVerified: '2026-04-15' },
      },
      {
        claimId: 'CLM-007',
        sourceA: { name: 'Financial Policy Manual v12',   value: '8% reserve',  lastVerified: '2026-03-01' },
        sourceB: { name: 'Basel III Compliance Template', value: '10% reserve', lastVerified: '2026-01-20' },
      },
    ],
    workflowsBlockedNames: ['FinancePolicyBot', 'WealthMgmtAdvisor', 'ComplianceChecker'],
  },

  'EVT-002': {
    draftEmail: {
      to: 'partner@gefinancial.com',
      subject: 'Q3 2026 Sales Forecast — Northfield Partners Portfolio Review',
      body: 'Dear Partner,\n\nWe are pleased to share the Q3 2026 sales forecast for your portfolio. Based on our analysis of current market conditions and historical performance, we project a 12.4% increase in AUM over the next quarter.\n\nKey highlights:\n• Revenue trajectory: $4.2M → $4.72M projected\n• Risk-adjusted return: 8.1% (above 7.2% target)\n• Top performing segment: Wealth Management (+18.3%)\n\nPlease review the attached detailed report.\n\nBest regards,\nSalesForecastPA on behalf of Northfield Partners Advisory',
    },
  },

  'EVT-006': {
    kbuText: 'RETURN POLICY v3.0 — Effective Sep 1, 2025\n\nStandard Returns: Customers may return most items within 30 days of purchase for a full refund to the original payment method. Items must be in original condition with all packaging intact.\n\nExtended Window: Premium account holders receive a 60-day return window. Electronics carry a 15-day return window regardless of account tier.\n\nNon-Returnable: Customized products, digital downloads, and perishables are non-returnable. Gift cards may be exchanged but not refunded.\n\nProcess: Returns must be initiated through the customer portal or by contacting support. Refunds processed within 5–7 business days.',
    history: { lastModified: '2025-09-01', by: 'Jordan T.', version: '3.0' },
    ttlDays: 6,
    usedBy: ['ReturnPolicyBot', 'ServiceDeskAgent', 'CustomerResolutionFlow'],
  },

  'EVT-009': {
    contractTerms: 'Knowledge Contract KC-2204\nGrantee: ComplianceBot\nResource: Truth Registry — compliance partition\nAccess Level: Read-only\nValid: 2025-07-05 → 2026-07-05\n\nPermits read access to compliance thresholds, regulatory mappings, and policy flags. Does not permit write or delete operations. Rate-limited to 500 reads/hour.',
    history: { issued: '2025-07-05', by: 'Marcus H.', version: '1.2' },
    usedBy: ['ComplianceBot v2.3'],
  },

  'EVT-011': {
    currentValue: '1.12',
    proposedValue: '1.15',
    submitter: 'Riley P.',
    submittedAt: '2026-06-14T10:30:00Z',
    note: 'Ground truth from Q1 2026 regional performance audit confirms the multiplier should be 1.15. The model has been predicting 1.12 based on training data from 2024 that predates the regional pricing restructure.',
    canonRecord: 'GE-PRICING-REGIONAL-MULT',
    affectedAgents: ['RegionalPricingBot', 'QuoteGeneratorAgent'],
  },

  'EVT-012': {
    sourceA: { name: 'Risk Framework Q1 2026',        value: '0.85', confidence: 0.78, lastVerified: '2026-04-01', owner: 'Jordan T.' },
    sourceB: { name: 'Compliance Standards Manual v4', value: '0.90', confidence: 0.92, lastVerified: '2026-05-15', owner: 'Devon N.' },
    affectedAgents:    ['ComplianceBot v2.3', 'RiskScoringAgent', 'AuditPrepAgent'],
    affectedWorkflows: ['Quarterly Compliance Check', 'Risk Assessment Pipeline', 'Audit Preparation Workflow'],
    canonRecord: 'GE-COMP-004',
  },

  'EVT-014': {
    budgetLimit: 500000,
    budgetSpent: 310000,
    period: 'Q2 2026 (Apr 1 – Jun 30)',
    topWorkflows: [
      { name: 'DIAN Claim Extraction Pipeline',  spend: 87400 },
      { name: 'Compliance Monitoring — Daily',   spend: 62300 },
      { name: 'Knowledge Base Maintenance',      spend: 48900 },
      { name: 'Agent Health Checks',             spend: 31200 },
      { name: 'Audit Trail Generation',          spend: 28800 },
    ],
  },

  'EVT-015': {
    accessGrants: [
      { name: 'Jordan T.', access: 'KCON Read — compliance partition', lastReviewed: '2026-03-15' },
      { name: 'Riley P.',  access: 'GE-FIN Read — finance partition',  lastReviewed: '2026-03-15' },
      { name: 'Devon N.', access: 'PII Read — security partition',     lastReviewed: '2026-03-20' },
      { name: 'Sam R.',   access: 'Data Pipeline Write — data-ops',    lastReviewed: '2025-12-01' },
      { name: 'Taylor B.', access: 'Agentic Spec Deploy — agentic',   lastReviewed: '2026-01-10' },
      { name: 'Luis F.',  access: 'Knowledge Base Write — knowledge',  lastReviewed: '2025-12-15' },
    ],
  },

  'EVT-016': {
    reportMetrics: {
      period: 'Week 24, 2026 (Jun 10–16)',
      agent: 'AdvisorCopilot v3.2',
      interactions: 847,
      resolutionRate: '94%',
      avgHandleTime: '4.2 min',
      escalations: 3,
      topTopics: ['Portfolio Rebalancing', 'Fee Inquiries', 'Account Access', 'Compliance Questions'],
    },
  },

  'EVT-018': {
    sourceA: { name: 'Northfield Partners', records: 847, source: 'Salesforce CRM',  lastUpdated: '2026-06-15' },
    sourceB: { name: 'Northfield Capital',  records: 23,  source: 'NetSuite ERP',    lastUpdated: '2026-05-30' },
    matchSignals: ['Address match (92%)', 'Phone prefix match (88%)', 'Industry code match (100%)', 'Contact name partial match (71%)'],
    modelConfidence: 0.68,
  },
}

// ─── Messages (5 entries) ─────────────────────────────────────────────────────
export const MESSAGES = [
  {
    id: 'MSG-001', type: 'broadcast', pinned: true,
    from: 'p1', to: null,
    subject: 'Platform Maintenance Window — Jun 20, 02:00–04:00 UTC',
    body: 'Scheduled maintenance for embedding index refresh and connector token rotation. All HITL queues will pause during the window. Please ensure critical events are resolved before then.',
    linkedEvent: 'EVT-013',
    timestamp: '2026-06-17T08:00:00Z',
  },
  {
    id: 'MSG-002', type: 'broadcast', pinned: true,
    from: 'p11', to: null,
    subject: 'Q2 Access Recertification — Mandatory Completion by Jun 27',
    body: 'All managers must complete Q2 access recertification by June 27. Failure to certify will trigger automatic access suspension. Contact IT Security with questions.',
    linkedEvent: 'EVT-015',
    timestamp: '2026-06-17T07:00:00Z',
  },
  {
    id: 'MSG-003', type: 'dm', pinned: false,
    from: 'p2', to: 'p1',
    subject: "Re: Break Glass Approval",
    body: "I've approved BG-0091 from my side. Can you confirm the second approval? The incident team is waiting.",
    linkedEvent: 'EVT-004',
    timestamp: '2026-06-17T09:05:00Z',
  },
  {
    id: 'MSG-004', type: 'dm', pinned: false,
    from: 'p3', to: 'p1',
    subject: "Covering Luis's queue",
    body: "Just a heads up — I've picked up Luis's delegated items (EVT-006, EVT-011). Will action KBU review today.",
    linkedEvent: 'EVT-006',
    timestamp: '2026-06-17T07:30:00Z',
  },
  {
    id: 'MSG-005', type: 'dm', pinned: false,
    from: 'p10', to: 'p9',
    subject: 'ForecastAgent version pin — need your input',
    body: 'The auto-migrate option on EVT-008 looks safe to me but want a second opinion before we touch the agentic spec. Can you review?',
    linkedEvent: 'EVT-008',
    timestamp: '2026-06-17T10:00:00Z',
  },
]
