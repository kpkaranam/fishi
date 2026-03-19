---
name: adaptive-taskgraph
description: Build dynamic task dependency graphs that adapt to project state
---

# Adaptive Task Graph Skill

## Purpose
Creates implementation task graphs that are aware of existing code. Instead of only
"Create file X" tasks, this skill produces tasks that distinguish between modifying
existing files, creating new files, and reading existing files for context — critical
for brownfield and hybrid projects where most work touches existing code.

## When to Use
- During Phase 4 (Sprint Planning) for brownfield or hybrid projects
- When breaking down approved architecture into implementable tasks
- When re-planning after scope changes in an existing codebase

## Task Types

Every task in the graph must be one of these types:

### MODIFY — Change an Existing File
```yaml
- id: TASK-001
  type: modify
  target: src/api/users.ts
  description: "Add email verification endpoint to existing users API"
  context_reads:
    - src/api/users.ts           # Understand current API surface
    - src/models/user.model.ts   # Understand current data model
    - tests/api/users.test.ts    # Understand existing test coverage
  acceptance_criteria:
    - "Existing /users endpoints continue to work unchanged"
    - "New POST /users/verify-email endpoint returns 200 on success"
    - "Existing tests still pass"
    - "New endpoint has test coverage >= 80%"
  risk: medium
  rollback: "Revert changes to src/api/users.ts; no migration needed"
```

### CREATE — Add a New File
```yaml
- id: TASK-002
  type: create
  target: src/services/email-verification.service.ts
  description: "Create email verification service"
  context_reads:
    - src/services/auth.service.ts    # Follow existing service patterns
    - src/config/email.config.ts      # Understand email configuration
  acceptance_criteria:
    - "Service follows existing service patterns (dependency injection, error handling)"
    - "Unit tests cover happy path and error cases"
    - "Integrates with existing email configuration"
  risk: low
  rollback: "Delete the new file; no dependencies exist yet"
```

### MIGRATE — Change Data or Schema
```yaml
- id: TASK-003
  type: migrate
  target: migrations/20240115-add-email-verified-column.sql
  description: "Add email_verified column to users table"
  context_reads:
    - migrations/                     # Understand migration conventions
    - src/models/user.model.ts        # Current schema definition
  acceptance_criteria:
    - "Migration is reversible (has up and down)"
    - "Default value preserves existing behavior (email_verified = false)"
    - "Migration runs without locking the table for > 5 seconds"
  risk: high
  rollback: "Run down migration to remove column; existing data preserved"
  rollback_steps:
    - "Run: npm run migrate:down 20240115-add-email-verified-column"
    - "Verify users table schema matches pre-migration state"
    - "Verify no data loss in users table"
```

### REFACTOR — Restructure Without Changing Behavior
```yaml
- id: TASK-004
  type: refactor
  target: src/api/users.ts
  description: "Extract validation logic into separate middleware"
  context_reads:
    - src/api/users.ts
    - src/middleware/                  # Understand existing middleware patterns
    - tests/api/users.test.ts
  acceptance_criteria:
    - "ALL existing tests pass without modification"
    - "No behavior change — same inputs produce same outputs"
    - "Extracted middleware follows existing middleware conventions"
    - "Code coverage does not decrease"
  risk: medium
  rollback: "Revert to pre-refactor state; no behavior was changed"
  keep_tests_passing: true
```

## Task Graph Construction Rules

### 1. Context Reads Are Dependencies
Every task that modifies or creates a file MUST list `context_reads` — existing files
that the agent must read before starting work. These are soft dependencies: they don't
block the task, but the agent must read them for context.

### 2. Risk-Based Prioritization
Order tasks by risk, with lower-risk tasks first:

| Risk Level | Definition                                          | Priority |
|------------|-----------------------------------------------------|----------|
| low        | New files, peripheral code, no existing consumers   | Do first — build confidence |
| medium     | Feature code, has tests, moderate consumer count     | Do second — manageable risk |
| high       | Core logic, database schema, many consumers          | Do last — maximum context   |

Within the same risk level, order by dependency graph (upstream before downstream).

### 3. Every Modify/Refactor Task Needs Rollback
For tasks that touch existing code, always specify:
- **rollback**: One-line description of how to undo the change
- **rollback_steps**: (for high-risk tasks) Step-by-step rollback procedure

### 4. Refactor Tasks Must Keep Existing Tests Passing
Any task with `type: refactor` MUST include:
- `keep_tests_passing: true` flag
- Acceptance criterion: "ALL existing tests pass without modification"
- If tests need updating, that's a separate task with its own justification

### 5. Migration Tasks Need Special Care
For `type: migrate` tasks:
- Always include reversible migration (up + down)
- Specify maximum acceptable downtime/lock time
- Include data preservation guarantees
- Add a verification step after migration

### 6. Dependency Graph
Encode dependencies explicitly:
```yaml
dependencies:
  TASK-002: []                    # No dependencies, can start immediately
  TASK-003: []                    # No dependencies, can start immediately
  TASK-001: [TASK-002, TASK-003]  # Needs service and migration first
  TASK-004: [TASK-001]            # Refactor after new feature is in place
```

### 7. Complexity Estimation
Estimate complexity for sprint planning:

| Complexity | Definition                                     | Typical Duration |
|------------|------------------------------------------------|------------------|
| trivial    | Config change, one-line fix                    | < 1 hour         |
| small      | Single file change, clear scope                | 1-4 hours        |
| medium     | Multiple files, some design decisions          | 4-8 hours        |
| large      | Cross-module change, needs careful testing     | 1-2 days         |
| epic       | Architectural change, multiple sprints         | Break it down    |

If a task is `epic`, it MUST be broken into smaller tasks.

## Output Format

Save the task graph to `.fishi/state/task-graph.yaml`:

```yaml
task_graph:
  generated: YYYY-MM-DDTHH:MM:SSZ
  project_type: brownfield
  total_tasks: N
  risk_summary:
    high: N
    medium: N
    low: N
  tasks:
    - id: TASK-001
      type: modify | create | migrate | refactor
      target: path/to/file
      description: "..."
      context_reads: [...]
      acceptance_criteria: [...]
      risk: high | medium | low
      complexity: trivial | small | medium | large
      rollback: "..."
      rollback_steps: [...]  # for high-risk only
      keep_tests_passing: true  # for refactor only
  dependencies:
    TASK-001: [TASK-002, TASK-003]
    TASK-002: []
```

## Key Principles

- **Read before write** — every task that changes existing code must first read it
- **Rollback is not optional** — if you can't describe how to undo it, you don't understand it well enough
- **Risk-aware ordering** — build confidence with low-risk tasks before touching core logic
- **Tests are the safety net** — never remove or weaken existing tests as part of a change
- **Small tasks over big tasks** — a 2-hour task that's easy to review beats an 8-hour task that's hard to review
