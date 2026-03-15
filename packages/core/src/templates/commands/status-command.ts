export function getStatusCommand(): string {
  return `# /fishi-status — Project Status

## Description
Show a comprehensive overview of project progress, active agents, and TaskBoard summary.

## Usage
\`\`\`
/fishi-status
/fishi-status --sprint     # Show current sprint details only
/fishi-status --agents     # Show active agent status only
/fishi-status --verbose    # Show full details for all sections
\`\`\`

## Instructions

When the user runs \`/fishi-status\`, gather and display the following:

### 1. Sprint Summary
- Read \`.fishi/board.md\` for current sprint info
- Display:
  - Sprint name and date range
  - Days remaining
  - Story points: planned / completed / remaining
  - Burndown status (on track / behind / ahead)

### 2. TaskBoard Summary
- Count tasks by column:
  - Backlog: X tasks
  - Ready: X tasks
  - In Progress: X tasks
  - In Review: X tasks
  - Done: X tasks (this sprint)
- Highlight any blocked tasks

### 3. Active Agents
- Check \`.fishi/agents/\` for active agent state files
- For each agent, show:
  - Agent role (orchestrator, developer, reviewer, etc.)
  - Current task assignment
  - Status (working, waiting, idle)
  - Last activity timestamp

### 4. Recent Activity
- Show last 5 completed tasks
- Show last 3 commits (if in a git repo)
- Note any pending gate approvals

### 5. Output Format
\`\`\`
=== Project Status ===

Sprint 3: Jan 13 - Jan 24 (4 days remaining)
Progress: [=========>    ] 62% (15/24 pts)

TaskBoard:
  Backlog:     8 tasks
  Ready:       3 tasks
  In Progress: 2 tasks (TASK-041, TASK-044)
  In Review:   1 task  (TASK-039)
  Done:        6 tasks

Active Agents: 2
  orchestrator: idle
  developer-1:  working on TASK-041

Pending Gates: 1
  GATE-007: Design approval for user notifications
\`\`\`
`;
}
