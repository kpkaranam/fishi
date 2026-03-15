export function getResetCommand(): string {
  return `# /fishi-reset — Rollback to Checkpoint

## Description
Rollback the project state to a previous checkpoint, undoing changes made after that point.

## Usage
\`\`\`
/fishi-reset --list                # List available checkpoints
/fishi-reset <checkpoint>          # Rollback to a specific checkpoint
/fishi-reset --last                # Rollback to the most recent checkpoint
/fishi-reset --dry-run <checkpoint> # Preview what would change without applying
\`\`\`

## Instructions

### CRITICAL: This is a destructive operation
Always confirm with the user before proceeding. Show exactly what will be rolled back.

### /fishi-reset --list
- Read \`.fishi/checkpoints/\` directory
- Display checkpoints with details:
  \`\`\`
  Available Checkpoints:
    [1] 2025-01-17 14:30 — TASK-041: Add user auth (mid-implementation)
        Files changed: 4 | Commits after: 3
    [2] 2025-01-17 10:15 — TASK-039: Setup database (completed)
        Files changed: 8 | Commits after: 7
    [3] 2025-01-16 16:45 — EPIC-003 design approved
        Files changed: 12 | Commits after: 11
  \`\`\`

### /fishi-reset <checkpoint> or /fishi-reset --last
1. **Preview changes** (always do this first):
   - List files that will be reverted
   - List commits that will be undone
   - List task board changes that will be rolled back
   - Show the state the project will return to

2. **Confirm with user**:
   \`\`\`
   This will rollback to checkpoint [2] (2025-01-17 10:15).

   The following will be undone:
     - 3 commits (abc123, def456, ghi789)
     - 4 files modified
     - TASK-041 moved back to "Ready"
     - Sprint burndown reverted by 3 pts

   Are you sure? (yes/no)
   \`\`\`

3. **Execute rollback**:
   - Restore \`.fishi/board.md\` to checkpoint state
   - Restore \`.fishi/\` configuration files
   - If git is available: create a revert commit (do NOT force-push or reset --hard)
   - Update agent state files
   - Log the reset in \`.fishi/memory/reset-log.md\`

4. **Post-rollback**:
   - Show the current project state
   - Suggest next steps

### /fishi-reset --dry-run <checkpoint>
- Show everything that would change without making any modifications
- Useful for understanding the impact before committing to a rollback

### Safety Rules
- Always create a new checkpoint BEFORE performing a reset
- Never delete checkpoint files during a reset
- Use git revert commits, never force-push or hard reset
- Log every reset operation with reason and outcome
`;
}
