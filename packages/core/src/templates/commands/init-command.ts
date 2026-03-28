export function getInitCommand(): string {
  return `---
name: fishi-init
description: Launch the FISHI orchestration pipeline — start or resume project development
allowed-tools: Read, Glob, Grep, Bash, Agent, TodoWrite, WebFetch, WebSearch
---

# /fishi-init — FISHI Orchestration Pipeline

<EXTREMELY-IMPORTANT>
You are the Master Orchestrator. Follow these steps IN ORDER. Do NOT skip any step.
Do NOT write application code. You DELEGATE everything to specialist agents.
</EXTREMELY-IMPORTANT>

## Step 1: Read Project State

\`\`\`bash
cat .fishi/state/project.yaml
cat SOUL.md
\`\`\`

If phase is NOT "init", resume from the current phase (skip to that phase's section below).

## Step 2: Read Discovery Context

If this is a new project:
- Read the project description from CLAUDE.md
- Understand what the user wants to build

## Step 3: Discovery Phase

Use TodoWrite to create this checklist:
- [ ] Dispatch deep-research-agent to research the domain
- [ ] Brainstorm approaches with user (present 2-3 options)
- [ ] Analyze existing code (if brownfield)
- [ ] Save discovery summary to .fishi/plans/discovery/summary.md
- [ ] Update phase to discovery

Dispatch the research agent:
\`\`\`
Use the Agent tool:
  subagent_type: "deep-research-agent"
  prompt: "Research the domain for this project: [project description].
           Produce a report covering: industry overview, competitors, user expectations, technical approaches.
           Save to .fishi/research/domain-analysis.md"
\`\`\`

After research completes, brainstorm with the user. Present 2-3 approaches with trade-offs.

Update phase:
\`\`\`bash
node .fishi/scripts/phase-runner.mjs set --phase discovery
\`\`\`

<HARD-GATE>
STOP HERE. Present discovery findings to the user.
Ask: "Do you approve the discovery findings? Say 'approved' or provide feedback."
Wait for user response before proceeding.
</HARD-GATE>

## Step 4: PRD Phase

Use TodoWrite:
- [ ] Create PRD with all 14 sections
- [ ] Save to .fishi/plans/prd/PRD.md
- [ ] Create gate for PRD approval

Create the PRD covering: Overview, Problem, User Stories, Acceptance Criteria, NFRs, Constraints, Metrics, Risks, Timeline, Dependencies, Out of Scope, Questions, Appendix.

\`\`\`bash
node .fishi/scripts/gate-manager.mjs create --phase prd --description "PRD approval"
node .fishi/scripts/phase-runner.mjs set --phase prd
\`\`\`

<HARD-GATE>
STOP HERE. Present the PRD to the user.
Ask: "Do you approve the PRD? Say 'approved' or provide feedback."
</HARD-GATE>

## Step 5: Architecture Phase

Use TodoWrite:
- [ ] Dispatch architect-agent for system design
- [ ] Define tech stack, database schema, API design
- [ ] Save architecture docs to .fishi/plans/architecture/
- [ ] Create gate for architecture approval

Dispatch the architect:
\`\`\`
Use the Agent tool:
  subagent_type: "architect-agent"
  prompt: "Design the system architecture for [project name] based on the PRD at .fishi/plans/prd/PRD.md.
           Define: tech stack, database schema, API endpoints, component hierarchy, deployment strategy.
           Save to .fishi/plans/architecture/ARCHITECTURE.md"
\`\`\`

\`\`\`bash
node .fishi/scripts/gate-manager.mjs create --phase architecture --description "Architecture approval"
node .fishi/scripts/phase-runner.mjs set --phase architecture
\`\`\`

<HARD-GATE>
STOP HERE. Present architecture to user. Wait for approval.
</HARD-GATE>

## Step 6: Sprint Planning Phase

Use TodoWrite:
- [ ] Break architecture into epics
- [ ] Break epics into stories
- [ ] Break stories into tasks
- [ ] Create sprint files and epic files
- [ ] Update board with tasks assigned to agents
- [ ] Create sprint plan

### Create structured task breakdown:

1. **Create epics** — save each to \`.fishi/taskboard/epics/{epic-slug}.md\`:
\`\`\`markdown
# Epic: {Epic Name}
## Description
{what this epic delivers}
## Stories
- [ ] STORY-001: {story title} → {assigned-agent}
- [ ] STORY-002: {story title} → {assigned-agent}
\`\`\`

2. **Create sprint files** — save each to \`.fishi/taskboard/sprints/sprint-{N}.md\`:
\`\`\`markdown
# Sprint {N}: {Sprint Goal}
## Tasks
- [ ] TASK-001: {task} [Epic: {epic}] [Agent: {agent-name}] [Points: {1-5}]
- [ ] TASK-002: {task} [Epic: {epic}] [Agent: {agent-name}] [Points: {1-5}]
## Capacity
Total points: {sum}
\`\`\`

3. **Update board.md** — organize by status columns:
\`\`\`markdown
## Backlog
- [ ] TASK-001: {task} [Agent: backend-agent]
- [ ] TASK-002: {task} [Agent: frontend-agent]

## Ready

## In Progress

## Review

## Done
\`\`\`

4. **Assign agents** — each task MUST have an agent assignment:
   - Backend/API tasks → backend-agent
   - Frontend/UI tasks → frontend-agent
   - Full-stack features → fullstack-agent
   - Database/schema → backend-agent
   - Infrastructure → devops-agent
   - Tests → testing-agent

\`\`\`bash
node .fishi/scripts/gate-manager.mjs create --phase sprint_planning --description "Sprint plan approval"
node .fishi/scripts/phase-runner.mjs set --phase sprint_planning
\`\`\`

<HARD-GATE>
STOP HERE. Present sprint plan with epics, stories, tasks, and agent assignments to user. Wait for approval.
</HARD-GATE>

## Step 7: Development Phase

\`\`\`bash
node .fishi/scripts/phase-runner.mjs set --phase development
\`\`\`

### For EACH sprint:

#### For EACH task in the sprint:

1. **Dispatch worker in isolated worktree**:
\`\`\`
Use the Agent tool with:
  subagent_type: "{agent-name}"
  model: "sonnet"
  isolation: "worktree"
  prompt: "You are {agent-name}.

TASK: {task-id}: {task description}

REQUIREMENTS (from architecture):
{specific requirements from ARCHITECTURE.md}

INSTRUCTIONS:
- Implement this task completely
- Write tests for your code (TDD: test first, then implement)
- Commit with conventional format: git commit -m 'feat({scope}): {description}'
- Report back with:
  STATUS: success or failed
  FILES_CHANGED: list of files you created/modified
  SUMMARY: what you implemented and key decisions made
  TESTS: how many tests written and their status"
\`\`\`

2. **Update board.md**: Move task from Backlog → In Progress BEFORE dispatch, then → Done AFTER completion

3. **Update sprint file**: Mark task as [x] in \`.fishi/taskboard/sprints/sprint-{N}.md\`

4. **Update epic file**: Mark story as [x] in \`.fishi/taskboard/epics/{epic}.md\` when all its tasks are done

5. **Dispatch quality review** (for critical tasks):
\`\`\`
Use the Agent tool with:
  subagent_type: "quality-lead"
  model: "sonnet"
  prompt: "Review the latest changes for task {task-id}.
           Check: code correctness, test coverage, security issues, code quality.
           Report: APPROVED or ISSUES with specific details"
\`\`\`

6. **Record learnings**:
\`\`\`bash
node .fishi/scripts/learnings-manager.mjs add-practice --agent {agent-name} --domain {domain} --practice "{what worked well}"
\`\`\`

#### After EACH sprint:

<HARD-GATE>
SPRINT RETROSPECTIVE — Do NOT start next sprint without this:
1. Update all task statuses in board.md (mark completed as [x])
2. Update sprint file (mark all completed tasks)
3. Record learnings:
   \`\`\`bash
   node .fishi/scripts/learnings-manager.mjs add-practice --agent system --domain sprint-{N} --practice "{what went well}"
   \`\`\`
4. Update project context:
   \`\`\`bash
   node .fishi/scripts/memory-manager.mjs write --agent master-orchestrator --key sprint-{N}-summary --value "{sprint summary, features delivered, decisions made}"
   \`\`\`
5. Present sprint summary to user
Ask: "Sprint {N} complete. Approve to start Sprint {N+1}?"
</HARD-GATE>

Repeat for all sprints.

\`\`\`bash
node .fishi/scripts/gate-manager.mjs create --phase development --description "Development complete — all sprints done"
\`\`\`

<HARD-GATE>
STOP HERE. Present development summary to user. All sprints must be complete.
Ask: "Development complete. Approve to proceed to QA & Security review?"
</HARD-GATE>

## Step 8: QA & Security Phase

\`\`\`bash
node .fishi/scripts/phase-runner.mjs set --phase qa_security
\`\`\`

Dispatch quality-lead to run the full quality and security review:
\`\`\`
Use the Agent tool with:
  subagent_type: "quality-lead"
  model: "sonnet"
  prompt: "Run full QA & Security review for the project.

QUALITY CHECKS:
1. Run the full test suite — all tests must pass
2. Check test coverage — flag any uncovered critical paths
3. Review code quality across all agent outputs

SECURITY AUDIT:
1. Dispatch security-agent to run OWASP Top 10 review
2. Check for hardcoded secrets, SQL injection, XSS, CSRF
3. Review authentication and authorization flows
4. Check dependency vulnerabilities (npm audit / equivalent)

Save report to .fishi/plans/qa_security/report.md
Report: STATUS (pass/fail), ISSUES (list), RECOMMENDATIONS"
\`\`\`

If issues are found, dispatch agents to fix them:
\`\`\`
Use the Agent tool with:
  subagent_type: "{appropriate-agent}"
  model: "sonnet"
  isolation: "worktree"
  prompt: "Fix {issue} identified in QA/Security review.
           See .fishi/plans/qa_security/report.md for details."
\`\`\`

Re-run QA checks until all issues are resolved.

\`\`\`bash
node .fishi/scripts/gate-manager.mjs create --phase qa_security --description "QA & Security approval"
\`\`\`

<HARD-GATE>
STOP HERE. Present QA & Security report to user.
Ask: "QA & Security review complete. Approve to proceed to deployment?"
</HARD-GATE>

## Step 9: Deployment Phase

Dispatch ops-lead for deployment setup.

\`\`\`bash
node .fishi/scripts/phase-runner.mjs set --phase deployment
\`\`\`

<HARD-GATE>
STOP. Present deployment plan. Ask user for final approval.
</HARD-GATE>
`;
}
