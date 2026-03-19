---
name: fishi-board
description: View and manage the TaskBoard
---

# /fishi-board — Kanban Board

## Description
Display the project kanban board and manage task movement between columns.

## Usage
```
/fishi-board                          # Display the full board
/fishi-board move <task-id> <column>  # Move a task to a column
/fishi-board add <title>              # Quick-add a task to Backlog
/fishi-board detail <task-id>         # Show full task details
/fishi-board filter <epic-id>         # Show tasks for a specific epic
```

## Instructions

### /fishi-board (Display)
- Read `.fishi/board.md`
- Render a visual kanban board:

```
=== TaskBoard — Sprint 3 ===

| Backlog (8)    | Ready (3)      | In Progress (2) | In Review (1)  | Done (6)       |
|----------------|----------------|-----------------|----------------|----------------|
| TASK-045 (3pt) | TASK-043 (5pt) | TASK-041 (3pt)  | TASK-039 (5pt) | TASK-038 (2pt) |
| TASK-046 (2pt) | TASK-044 (3pt) | TASK-042 (5pt)  |                | TASK-037 (3pt) |
| TASK-047 (5pt) | TASK-048 (2pt) |                 |                | TASK-036 (5pt) |
| ...            |                |                 |                | ...            |
```

### /fishi-board move <task-id> <column>
- Valid columns: `backlog`, `ready`, `in-progress`, `in-review`, `done`
- Update the task's position in `.fishi/board.md`
- Update the task's timestamp
- If moving to `done`:
  - Update sprint burndown (reduce remaining points)
  - Check if acceptance criteria are defined
- If moving to `in-progress`:
  - Check if an agent is assigned

### /fishi-board add <title>
- Trigger the TaskBoard Ops skill to create a new task
- Add to the Backlog column by default
- Prompt for: description, priority, story points, epic

### /fishi-board detail <task-id>
- Show full task details:
  - ID, title, description
  - Status, column, assignee
  - Priority, story points
  - Epic and story references
  - Acceptance criteria
  - Comments and history

### /fishi-board filter <epic-id>
- Display the board showing only tasks belonging to the specified epic
- Show epic progress summary at the top
