export function getStatusCommand(): string {
  return `# /fishi-status — Project Status Dashboard

## Description
Show a comprehensive overview of project progress by reading FISHI state files directly.

## Instructions

When the user runs \`/fishi-status\`, execute these steps IN ORDER:

### 1. Read Current Phase

\`\`\`bash
cat .fishi/state/project.yaml
\`\`\`

Display the current phase, sprint number, and project type. Run:
\`\`\`bash
node .fishi/scripts/phase-runner.mjs current
\`\`\`

### 2. Read TaskBoard

\`\`\`bash
cat .fishi/taskboard/board.md
\`\`\`

Count tasks per column and display:
- Backlog: X tasks
- Ready: X tasks
- In Progress: X tasks
- In Review: X tasks
- Done: X tasks

Highlight any tasks marked as BLOCKED.

### 3. Read Gate Status

\`\`\`bash
cat .fishi/state/gates.yaml
\`\`\`

Show each gate with its status (pending, approved, rejected, skipped).
Flag any pending gates that are blocking progress.

### 4. Read Monitor Events

\`\`\`bash
cat .fishi/state/monitor.json
\`\`\`

Show the 5 most recent events with timestamps.

### 5. Check File Locks

\`\`\`bash
cat .fishi/state/file-locks.yaml
\`\`\`

Show any active file locks and which agent holds them.

### 6. Output Format

Present all information in this format:
\`\`\`
=== FISHI Project Status ===

Phase: {current phase} | Sprint: {sprint number}
Project: {project name} ({project type})

--- TaskBoard ---
  Backlog:     X tasks
  Ready:       X tasks
  In Progress: X tasks
  In Review:   X tasks
  Done:        X tasks

--- Gates ---
  {gate-name}: {status} ({timestamp})

--- Active Locks ---
  {file}: locked by {agent} for {task}

--- Recent Events ---
  {timestamp}: {event description}

--- Next Action ---
  {what should happen next based on current phase and state}
\`\`\`
`;
}
