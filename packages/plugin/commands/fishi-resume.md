---
name: fishi-resume
description: Resume from latest or specific checkpoint
---

# /fishi-resume — Resume from Checkpoint

## Description
Resume work from the latest checkpoint, restoring context and continuing where you left off.

## Usage
```
/fishi-resume              # Resume from latest checkpoint
/fishi-resume --list       # List available checkpoints
/fishi-resume <checkpoint> # Resume from a specific checkpoint
```

## Instructions

When the user runs `/fishi-resume`, follow these steps:

### 1. Find Checkpoints
- Read `.fishi/checkpoints/` directory for saved checkpoints
- Each checkpoint file contains:
  - Timestamp
  - Active task and its state
  - Agent context and conversation summary
  - Files modified since last checkpoint
  - Current sprint state

### 2. List Checkpoints (if --list)
- Display available checkpoints in reverse chronological order:
  ```
  Checkpoints:
    [1] 2025-01-17 14:30 — Working on TASK-041: Add user auth
    [2] 2025-01-17 10:15 — Completed TASK-039: Setup database
    [3] 2025-01-16 16:45 — Design review for EPIC-003
  ```

### 3. Restore Context
- Load the checkpoint data
- Read the current state of:
  - `.fishi/board.md` — task board
  - `.fishi/config.yaml` — project configuration
  - `.fishi/memory/` — project memory files
  - `CLAUDE.md` — project conventions
- Check git status for any uncommitted changes

### 4. Summarize State
- Tell the user:
  - What task was in progress
  - What was completed in the last session
  - What the next steps are
  - Any blockers or pending decisions

### 5. Continue Work
- Ask the user if they want to:
  - Continue the in-progress task
  - Switch to a different task
  - Review the task board first
- Resume execution based on their choice
