export function getGateCommand(): string {
  return `# /fishi-gate — Gate Management

## Description
Manage quality gates — approve, reject, skip, or list pending gate checks.

## Usage
\`\`\`
/fishi-gate list                    # List all pending gates
/fishi-gate approve <gate-id>       # Approve a gate
/fishi-gate reject <gate-id>        # Reject a gate with feedback
/fishi-gate skip <gate-id>          # Skip a gate (requires reason)
/fishi-gate status <gate-id>        # Show details of a specific gate
\`\`\`

## Instructions

### Gate Types
Gates are quality checkpoints that require human approval before proceeding:
- **Design Gate**: Approve a design before implementation starts
- **Code Review Gate**: Approve code changes before merge
- **Test Gate**: Verify test results before deployment
- **Deploy Gate**: Approve deployment to production
- **Architecture Gate**: Approve significant architectural decisions

### /fishi-gate list
- Read \`.fishi/gates/\` for pending gate files
- Display each gate with:
  - Gate ID (format: \`GATE-XXX\`)
  - Type (design, code-review, test, deploy, architecture)
  - Description
  - Requesting agent/task
  - Created timestamp
  - Status (pending, approved, rejected, skipped)

### /fishi-gate approve <gate-id>
- Mark the gate as approved
- Record approver and timestamp
- Notify the waiting agent/task that it can proceed
- Log the approval in \`.fishi/memory/gate-log.md\`

### /fishi-gate reject <gate-id>
- Ask for rejection feedback (what needs to change)
- Mark the gate as rejected with the feedback
- Move the related task back to "In Progress"
- The agent must address the feedback and re-submit the gate

### /fishi-gate skip <gate-id>
- Require a reason for skipping
- Mark the gate as skipped with the reason
- Log a warning — skipped gates are tracked as tech debt
- Allow the blocked work to proceed

### Gate File Format
\`\`\`yaml
id: GATE-007
type: design
status: pending
task: TASK-041
description: "Design approval for user notification system"
created: 2025-01-17T14:30:00Z
artifacts:
  - docs/product/notifications.md
  - docs/api/notifications-api.yaml
resolution: null
resolved_at: null
resolved_by: null
feedback: null
\`\`\`

### Output Format
\`\`\`
=== Pending Gates ===

GATE-007 [design] — Design approval for user notifications
  Task: TASK-041 | Created: Jan 17, 14:30
  Artifacts: docs/product/notifications.md

GATE-008 [code-review] — Auth middleware implementation
  Task: TASK-043 | Created: Jan 17, 16:00
  Artifacts: src/middleware/auth.ts

2 gates pending approval.
\`\`\`
`;
}
