---
name: taskboard-ops
description: Manage the FISHI TaskBoard — create, move, assign tasks
---

# TaskBoard Operations Skill

## Purpose
Manage tasks, sprints, and project tracking through the `board.md` file.

## Task Board Location
The task board lives at `.fishi/board.md` in the project root.

## Operations

### Create Task
1. Read the current `board.md` to find the highest task ID
2. Increment by 1 to generate the new task ID (format: `TASK-XXX`)
3. Add the task to the appropriate column (default: Backlog)
4. Include: title, description, assignee, priority, story points, epic reference

### Move Task
- Move tasks between columns: `Backlog` -> `Ready` -> `In Progress` -> `In Review` -> `Done`
- Update the task's status and timestamp when moving
- If moving to `Done`, verify that acceptance criteria are met

### Update Task
- Update task description, priority, assignee, or story points
- Add comments or notes to a task
- Link related tasks or blockers

### Task ID Generation
- Always read the board first to find the current highest ID
- Increment by 1: if highest is TASK-042, next is TASK-043
- Never reuse deleted task IDs
- Zero-pad to 3 digits

### Epic Management
- Epics use format `EPIC-XXX`
- Each epic has: title, description, acceptance criteria, linked tasks
- Track epic progress as percentage of completed child tasks

### Story Management
- Stories use format `STORY-XXX`
- Stories belong to an epic
- Stories break down into tasks
- Each story has acceptance criteria

### Sprint Management
- Sprint format: `Sprint <number>: <start-date> - <end-date>`
- Plan sprints by moving tasks from Backlog to Ready
- Track sprint velocity (story points completed per sprint)
- Update burndown: remaining points for each day of the sprint

### Burndown Updates
- When a task moves to Done, reduce the remaining points
- Calculate: planned points, completed points, remaining points
- Track daily progress

## Board Format

```markdown
# Project TaskBoard

## Current Sprint
Sprint 3: 2025-01-13 - 2025-01-24
Velocity: 21 pts | Planned: 24 pts | Completed: 8 pts

## Columns

### Backlog
- [ ] TASK-045: Description (3 pts) [EPIC-003]

### Ready
- [ ] TASK-043: Description (5 pts) [EPIC-002]

### In Progress
- [-] TASK-041: Description (3 pts) [EPIC-002] @agent-1

### In Review
- [-] TASK-039: Description (5 pts) [EPIC-001] @agent-2

### Done
- [x] TASK-038: Description (2 pts) [EPIC-001] @agent-1
```
