export function getAgentsMdTemplate(): string {
  return `# AGENTS.md — FISHI Role-Based Action Gates

> Maps which actions require approval per agent role.
> Read alongside SOUL.md for complete safety configuration.

## Role Hierarchy

\`\`\`
Level 0: Master Orchestrator — strategy only, no code, no file writes
Level 1: Coordinators — task assignment, code review, limited writes
Level 2: Workers — full dev within worktree, no merge, no deploy
\`\`\`

## Action Permissions by Role

### Master Orchestrator (L0)
| Action | Permission |
|--------|-----------|
| Read files | Allowed |
| Write/Edit files | **DENIED** — delegates to coordinators |
| Run shell commands | **DENIED** — delegates to workers |
| Approve gates | Allowed (with human confirmation) |
| Assign tasks | Allowed |
| Create agents | Allowed (dynamic agent factory) |
| Merge branches | **DENIED** — requires human gate approval |
| Deploy | **DENIED** — requires deployment gate |
| Delete files | **DENIED** |

### Coordinators (L1)
| Action | Permission |
|--------|-----------|
| Read files | Allowed |
| Write/Edit files | Allowed (planning docs, task assignments) |
| Run shell commands | Allowed (git status, test runs, non-destructive) |
| Approve worker PRs | Allowed (code review) |
| Create worktrees | Allowed |
| Merge to dev branch | Allowed (after review) |
| Merge to main/production | **DENIED** — requires gate |
| Delete files | **DENIED** — archive instead |
| Install dependencies | Allowed (within sandbox) |
| Modify configs | **REQUIRES CONFIRMATION** |

### Workers (L2)
| Action | Permission |
|--------|-----------|
| Read files | Allowed (within worktree + shared) |
| Write/Edit files | Allowed (within worktree only) |
| Run shell commands | Allowed (within worktree sandbox) |
| Run tests | Allowed |
| Install dev dependencies | Allowed (within sandbox) |
| Commit to worktree branch | Allowed |
| Push to worktree branch | Allowed |
| Merge branches | **DENIED** — submit PR to coordinator |
| Delete files | **DENIED** — request via coordinator |
| Access main branch | **READ ONLY** |
| External API calls | **DENIED** — unless in sandbox allowlist |

## Destructive Action Protocol

### Delete Operations
1. **Files:** Never delete. Move to \`.fishi/archive/\` with timestamp.
2. **Branches:** Only after merge confirmed + worktree cleaned.
3. **Database records:** Never in production. Soft-delete only.
4. **Dependencies:** Remove only via coordinator approval.

### Archive Instead of Delete
\`\`\`
Instead of: rm -rf old-feature/
Do:         mv old-feature/ .fishi/archive/old-feature-{timestamp}/
\`\`\`

### Escalation Path
\`\`\`
Worker encounters destructive need
  → Reports to Coordinator
    → Coordinator evaluates risk
      → If safe: Coordinator executes with logging
      → If risky: Escalate to Master
        → Master requests human confirmation via gate
\`\`\`

## Emergency Stop

If any agent detects behavior outside these boundaries:
1. Log the incident to \`.fishi/logs/safety-incidents.log\`
2. Emit \`safety.violation\` event to monitor
3. Notify master-orchestrator
4. Halt the violating agent's current task
5. Wait for human review before resuming
`;
}
