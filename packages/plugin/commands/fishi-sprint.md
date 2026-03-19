---
name: fishi-sprint
description: Sprint operations — plan, start, review, close
---

# /fishi-sprint — Sprint Management

## Description
View current sprint status or plan the next sprint.

## Usage
```
/fishi-sprint                   # Show current sprint overview
/fishi-sprint plan              # Plan the next sprint
/fishi-sprint review            # Review the current/completed sprint
/fishi-sprint velocity          # Show velocity chart across sprints
/fishi-sprint close             # Close the current sprint
```

## Instructions

### /fishi-sprint (Current Sprint Overview)
- Read `.fishi/board.md` for sprint data
- Display:
  ```
  === Sprint 3: Jan 13 - Jan 24 ===

  Days Remaining: 4
  Velocity Target: 21 pts (based on average)

  Burndown:
    Planned:   24 pts
    Completed: 15 pts
    Remaining:  9 pts
    Status:    On Track

  Tasks:
    Completed: 6 (15 pts)
    In Flight: 3 (11 pts)
    Not Started: 1 (2 pts)

  Risks:
    - TASK-042 has been in progress for 3 days (estimated 2 days)
  ```

### /fishi-sprint plan
- Show the current Backlog sorted by priority
- Display team velocity (average of last 3 sprints)
- Help the user select tasks for the next sprint:
  1. Show prioritized backlog with story points
  2. Track running total as tasks are added
  3. Warn when approaching velocity limit
  4. Confirm the sprint plan
- Set sprint start and end dates (default: 2-week sprints)
- Move selected tasks from Backlog to Ready
- Create the sprint entry in `board.md`

### /fishi-sprint review
- Summarize the current or most recent sprint:
  - What was completed
  - What was not completed (and why)
  - Actual velocity vs. planned
  - Blockers encountered
  - Lessons learned
- Ask for retrospective notes from the user

### /fishi-sprint velocity
- Show velocity across the last 5 sprints:
  ```
  Sprint Velocity:
    Sprint 1: 18 pts (planned: 20)
    Sprint 2: 22 pts (planned: 22)
    Sprint 3: 15 pts (planned: 24) — in progress
    Average:  20 pts
  ```

### /fishi-sprint close
- Verify all "In Review" tasks are resolved
- Move incomplete tasks back to Backlog (or carry over to next sprint)
- Calculate final velocity
- Archive sprint data
- Prompt: "Would you like to plan the next sprint?"
