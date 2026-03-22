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
- [ ] Break architecture into epics and tasks
- [ ] Update taskboard with all tasks
- [ ] Assign agents to tasks
- [ ] Create sprint plan

Update the taskboard (\`.fishi/taskboard/board.md\`) with tasks under the Backlog column.

\`\`\`bash
node .fishi/scripts/gate-manager.mjs create --phase sprint_planning --description "Sprint plan approval"
node .fishi/scripts/phase-runner.mjs set --phase sprint_planning
\`\`\`

<HARD-GATE>
STOP HERE. Present sprint plan to user. Wait for approval.
</HARD-GATE>

## Step 7: Development Phase

\`\`\`bash
node .fishi/scripts/phase-runner.mjs set --phase development
\`\`\`

For EACH task in the sprint:

1. **Create worktree**:
\`\`\`bash
node .fishi/scripts/worktree-manager.mjs create --agent {agent-name} --task {task-slug} --coordinator dev-lead
\`\`\`

2. **Lock files**:
\`\`\`bash
node .fishi/scripts/file-lock-hook.mjs lock --files "{files}" --agent {agent-name} --task {task-slug} --coordinator dev-lead
\`\`\`

3. **Update board**: Move task from Backlog to In Progress in \`.fishi/taskboard/board.md\`

4. **Dispatch worker**:
\`\`\`
Use the Agent tool:
  subagent_type: "{agent-name}"
  prompt: "You are {agent-name}. Your task: {task description}.
           Work ONLY in the worktree at: .trees/agent-{agent-name}-{task-slug}/
           Requirements: {from PRD/architecture}
           When done:
           - Commit your changes with: git add -A && git commit -m 'feat: {description}'
           - Report: FILES_CHANGED, STATUS (success/failed), SUMMARY"
\`\`\`

5. **Review**: Dispatch quality-lead to review
\`\`\`
Use the Agent tool:
  subagent_type: "quality-lead"
  prompt: "Review the code in .trees/agent-{agent-name}-{task-slug}/.
           Check: correctness, tests, security, code quality.
           Report: APPROVED or ISSUES with details"
\`\`\`

6. **Update board**: Move task to Done
7. **Release locks**: \`node .fishi/scripts/file-lock-hook.mjs release --agent {agent-name}\`
8. **Record learnings**: \`node .fishi/scripts/learnings-manager.mjs add-practice --agent {agent-name} --domain {domain} --practice "{learning}"\`

Repeat for all tasks in the sprint.

## Step 8: Deployment Phase

Dispatch ops-lead for deployment setup.

\`\`\`bash
node .fishi/scripts/phase-runner.mjs set --phase deployment
\`\`\`

<HARD-GATE>
STOP. Present deployment plan. Ask user for final approval.
</HARD-GATE>
`;
}
