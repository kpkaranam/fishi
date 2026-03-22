export function getBoardCommand(): string {
  return `# /fishi-board — Kanban Board

## Description
Display the project kanban board by reading the taskboard state file and presenting tasks grouped by column.

## Usage
\`\`\`
/fishi-board                          # Display the full board
/fishi-board move <task-id> <column>  # Move a task to a column
/fishi-board add <title>              # Quick-add a task to Backlog
/fishi-board detail <task-id>         # Show full task details
\`\`\`

## Instructions

### /fishi-board (Display)

Read the taskboard file:
\`\`\`bash
cat .fishi/taskboard/board.md
\`\`\`

Also read sprint info for context:
\`\`\`bash
cat .fishi/state/project.yaml
\`\`\`

Parse the board and display tasks grouped by column with counts:

\`\`\`
=== TaskBoard — Sprint {N} ===

| Backlog ({count}) | Ready ({count}) | In Progress ({count}) | In Review ({count}) | Done ({count}) |
|--------------------|-----------------|----------------------|--------------------|--------------------|
| {task-id}: {title} | {task-id}: ...  | {task-id}: ...       | {task-id}: ...     | {task-id}: ...     |
| {task-id}: {title} |                 |                      |                    | {task-id}: ...     |

Total: {total} tasks | Blocked: {blocked count}
\`\`\`

Highlight any BLOCKED tasks with their blocking reason.

### /fishi-board move <task-id> <column>

Valid columns: backlog, ready, in-progress, in-review, done

1. Read the current board: \`cat .fishi/taskboard/board.md\`
2. Move the task to the new column by editing \`.fishi/taskboard/board.md\`
3. If moving to done, verify acceptance criteria are met
4. If moving to in-progress, verify an agent is assigned
5. Display the updated board

### /fishi-board add <title>

1. Read the current board: \`cat .fishi/taskboard/board.md\`
2. Generate a new task ID (next sequential number)
3. Add the task to the Backlog column in \`.fishi/taskboard/board.md\`
4. Ask the user for: description, priority, assigned agent
5. Display the updated board

### /fishi-board detail <task-id>

1. Read the board: \`cat .fishi/taskboard/board.md\`
2. Find the task by ID
3. Display full details: ID, title, description, status, assigned agent, priority, acceptance criteria, history
`;
}
