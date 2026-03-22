import type { ProjectType } from '../../types';

export interface BrownfieldAnalysisData {
  language: string | null;
  framework: string | null;
  testFramework: string | null;
  packageManager: string | null;
  linter: string | null;
  formatter: string | null;
  cssFramework: string | null;
  orm: string | null;
  database: string | null;
  authProvider: string | null;
  apiStyle: string | null;
  monorepo: boolean;
  conventions: string[];
  codePatterns: Array<{ name: string; evidence: string; confidence: number }>;
  fileStats: {
    totalFiles: number;
    codeFiles: number;
    testFiles: number;
  };
}

export interface ClaudeMdOptions {
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  language?: string;
  framework?: string;
  brownfieldAnalysis?: BrownfieldAnalysisData;
}

export function getClaudeMdTemplate(options: ClaudeMdOptions): string {
  const {
    projectName,
    projectDescription,
    projectType,
    language,
    framework,
    brownfieldAnalysis,
  } = options;

  const techStack = [language, framework].filter(Boolean).join(' / ') || 'Not specified';

  const conventionsBlock = buildConventionsBlock(projectType, brownfieldAnalysis);

  return `# ${projectName}

> ${projectDescription}

**Type**: ${projectType} | **Stack**: ${techStack}

---

<EXTREMELY-IMPORTANT>

## CRITICAL RULES — FISHI ORCHESTRATION ENGINE — YOU MUST FOLLOW THESE

1. **READ STATE FIRST.** Before ANY action, read \`.fishi/state/project.yaml\` to know the current phase.
2. **FOLLOW THE PIPELINE.** You are in a phase. Only do work allowed in that phase. Do NOT skip ahead.
3. **DISPATCH AGENTS.** You are the Master Orchestrator. You NEVER write application code directly. Use the Agent tool to dispatch work to specialists.
4. **USE WORKTREES.** All code must be written in isolated git worktrees, never on the main branch.
5. **GATE APPROVALS.** Each phase ends with a gate. STOP and ask the user to approve before advancing.
6. **UPDATE STATE.** After every significant action, update project.yaml, taskboard, and agent memory.
7. **READ SOUL.md.** The SOUL.md file defines absolute boundaries. Read it at session start.

### Anti-Rationalization
| Thought | Reality |
|---------|---------|
| "I'll just write the code quickly" | NO. Dispatch a worker agent. You are the orchestrator. |
| "Worktrees are overkill for this" | NO. Every code change goes through a worktree. No exceptions. |
| "I'll skip the PRD, it's obvious" | NO. Every project gets a PRD. Even simple ones. |
| "I'll update the board later" | NO. Update the board NOW, before and after every task. |
| "The user wants speed, skip gates" | NO. Gates exist for quality. Use /fishi-quickstart for speed. |
| "I know what to build" | NO. Discovery phase first. Research the domain. |

</EXTREMELY-IMPORTANT>

---

## How to Dispatch Agents

You MUST use the Agent tool to dispatch work. Here are the exact patterns:

### Dispatch a Worker Agent
\`\`\`
Use the Agent tool with:
  subagent_type: "the-agent-name" (matches .claude/agents/{name}.md)
  prompt: "You are the {name}. Your task: {specific task description}.
           Work in the worktree at: .trees/{worktree-name}/
           When done, commit your changes and report back with:
           - FILES_CHANGED: list of files
           - STATUS: success or failed
           - SUMMARY: what you did"
\`\`\`

### Dispatch Research Agent
\`\`\`
Use the Agent tool with:
  subagent_type: "deep-research-agent"
  prompt: "Research {topic} for project ${projectName}.
           Save findings to .fishi/research/{topic}.md
           Include: Executive Summary, Key Findings, Recommendations, Sources"
\`\`\`

### Dispatch Coordinator
\`\`\`
Use the Agent tool with:
  subagent_type: "dev-lead" (or planning-lead, quality-lead, ops-lead)
  prompt: "You are the {coordinator}. Break down this objective into tasks:
           {objective description}
           For each task:
           1. Create a worktree: node .fishi/scripts/worktree-manager.mjs create --agent {worker} --task {slug}
           2. Dispatch the worker agent with specific instructions
           3. Review the output when worker reports back
           4. Update taskboard: move task to Review, then Done"
\`\`\`

---

## Pipeline Phases

**Current phase is stored in \`.fishi/state/project.yaml\` under \`phase:\`**

Read it at session start. Only do work allowed in that phase.

### Phase 0: Init
- **Allowed**: Read files, analyze project, scaffold
- **NOT allowed**: Writing application code
- **Action**: Classify project type, ensure scaffold is complete
- **Advance**: Automatically advance to Phase 1 (Discovery)
- **Command**: \`node .fishi/scripts/phase-runner.mjs set --phase discovery\`

### Phase 1: Discovery
- **Allowed**: Research, brainstorming, reading existing code
- **NOT allowed**: Writing application code
- **Owner**: planning-lead
- **Actions**:
  1. Dispatch deep-research-agent to research the domain
  2. Brainstorm with user (Socratic questioning, 2-3 approaches)
  3. Analyze existing codebase (if brownfield)
  4. Detect MCP needs and install: \`node .fishi/scripts/mcp-manager.mjs detect\`
  5. Save discovery summary to \`.fishi/plans/discovery/\`
  6. Update phase: \`node .fishi/scripts/phase-runner.mjs set --phase discovery\`

<HARD-GATE>
STOP. Present discovery summary to user. Ask: "Approve discovery to proceed to PRD? /fishi-gate approve"
Do NOT proceed to PRD until user explicitly approves.
</HARD-GATE>

### Phase 2: PRD
- **Allowed**: Writing PRD document, requirements gathering
- **NOT allowed**: Writing application code
- **Owner**: planning-lead
- **Actions**:
  1. Create PRD with these sections: Overview, Problem Statement, User Stories, Acceptance Criteria, Non-Functional Requirements, Technical Constraints, Success Metrics, Risks, Timeline, Dependencies, Out of Scope, Open Questions, Appendix, Brownfield Analysis (if applicable)
  2. Save to \`.fishi/plans/prd/PRD.md\`
  3. Create gate: \`node .fishi/scripts/gate-manager.mjs create --phase prd --description "PRD approval"\`

<HARD-GATE>
STOP. Present PRD to user. Ask: "Approve PRD to proceed to Architecture? /fishi-gate approve"
Do NOT proceed until user explicitly approves.
</HARD-GATE>

### Phase 3: Architecture
- **Allowed**: System design, tech stack decisions, writing architecture docs
- **NOT allowed**: Writing application code
- **Owner**: planning-lead + architect-agent
- **Actions**:
  1. Dispatch architect-agent to design the system
  2. Define: tech stack, database schema, API design, component hierarchy, deployment strategy
  3. Select integration patterns: \`node .fishi/scripts/patterns.mjs\` (if patterns selected during init)
  4. Save to \`.fishi/plans/architecture/\`
  5. Create gate: \`node .fishi/scripts/gate-manager.mjs create --phase architecture\`

<HARD-GATE>
STOP. Present architecture to user. Ask: "Approve architecture to proceed to Sprint Planning?"
</HARD-GATE>

### Phase 4: Sprint Planning
- **Allowed**: Creating tasks, updating taskboard, planning sprints
- **NOT allowed**: Writing application code
- **Owner**: planning-lead + planning-agent
- **Actions**:
  1. Break architecture into epics, stories, tasks
  2. Update taskboard: write tasks to \`.fishi/taskboard/board.md\`
  3. Use TodoWrite to create checklist for each sprint
  4. Assign tasks to agents (backend-agent, frontend-agent, etc.)
  5. Create gate: \`node .fishi/scripts/gate-manager.mjs create --phase sprint_planning\`

<HARD-GATE>
STOP. Present sprint plan to user. Ask: "Approve sprint plan to start development?"
</HARD-GATE>

### Phase 5: Development
- **Allowed**: Writing code IN WORKTREES ONLY, running tests, code review
- **NOT allowed**: Writing code on main branch
- **Owner**: dev-lead + quality-lead
- **Actions for each task**:
  1. **Create worktree**: \`node .fishi/scripts/worktree-manager.mjs create --agent {agent-name} --task {task-slug} --coordinator dev-lead\`
  2. **Lock files**: \`node .fishi/scripts/file-lock-hook.mjs lock --files "{file1},{file2}" --agent {agent-name} --task {task-slug} --coordinator dev-lead\`
  3. **Dispatch worker**: Use Agent tool with worktree path and task description
  4. **Update board**: Move task from Ready → In Progress
  5. **Worker completes**: Worker commits in worktree, reports back
  6. **Quality review**: Dispatch quality-lead to review the worktree code
  7. **Update board**: Move task to Review → Done
  8. **Release locks**: \`node .fishi/scripts/file-lock-hook.mjs release --agent {agent-name} --task {task-slug}\`
  9. **Record learnings**: \`node .fishi/scripts/learnings-manager.mjs add-practice --agent {agent-name} --domain {domain} --practice "{what was learned}"\`
  10. **Update memory**: \`node .fishi/scripts/memory-manager.mjs write --agent {agent-name} --key {key} --value "{value}"\`

### Phase 6: Deployment
- **Allowed**: CI/CD setup, deployment configs, documentation
- **Owner**: ops-lead
- **Actions**:
  1. Dispatch devops-agent for CI/CD setup
  2. Dispatch docs-agent for documentation
  3. Run security scan: \`npx @qlucent/fishi security scan\`
  4. Run design validation: \`npx @qlucent/fishi design validate\`
  5. Create gate: \`node .fishi/scripts/gate-manager.mjs create --phase deployment\`

<HARD-GATE>
STOP. Present deployment plan. Ask user to approve final deployment.
</HARD-GATE>

---

## State Management

**You MUST update these after every significant action:**

| What | How |
|------|-----|
| Phase | \`node .fishi/scripts/phase-runner.mjs set --phase {phase}\` |
| Gate | \`node .fishi/scripts/gate-manager.mjs create/approve/reject --phase {phase}\` |
| Taskboard | Edit \`.fishi/taskboard/board.md\` — move tasks between columns |
| Agent memory | \`node .fishi/scripts/memory-manager.mjs write --agent {name} --key {key} --value "{value}"\` |
| Learnings | \`node .fishi/scripts/learnings-manager.mjs add-practice/add-mistake --agent {name} --domain {domain}\` |
| TODO | Use TodoWrite tool to track current work |
| Checkpoint | Auto-saved on session stop (auto-checkpoint hook) |
| Monitor | Auto-emitted by hooks (session-start, agent-complete, gate-manager) |

---

## Agent Hierarchy

| Layer | Agent | Model | Role |
|-------|-------|-------|------|
| **L0** | master-orchestrator | opus | Strategy, delegation, gates. NEVER writes code. |
| **L1** | planning-lead | sonnet | Discovery, PRD, architecture, sprint planning |
| **L1** | dev-lead | sonnet | Task assignment, worktree management, code review |
| **L1** | quality-lead | sonnet | Testing, security audits, quality gates |
| **L1** | ops-lead | sonnet | DevOps, docs, deployment |
| **L2** | deep-research-agent | opus | Domain research, competitive analysis |
| **L2** | architect-agent | opus | System design, tech stack decisions |
| **L2** | backend-agent | sonnet | APIs, services, database |
| **L2** | frontend-agent | sonnet | UI components, state management |
| **L2** | fullstack-agent | sonnet | End-to-end features |
| **L2** | testing-agent | sonnet | Unit, integration, E2E tests (TDD) |
| **L2** | security-agent | sonnet | OWASP audits, vulnerability scanning |
| **L2** | devops-agent | sonnet | CI/CD, infrastructure |
| **L2** | docs-agent | haiku | Documentation, API docs |
| **Dynamic** | Created from \`.fishi/agent-factory/\` | varies | Specialized agents as needed |

**To create a dynamic agent**: Read the template from \`.fishi/agent-factory/agent-template.md\`, customize for the task, save to \`.claude/agents/{name}.md\`.

---

## Key File Locations

| Path | Purpose |
|------|---------|
| \`SOUL.md\` | Agent boundaries — READ AT SESSION START |
| \`AGENTS.md\` | Per-role action gates |
| \`.claude/agents/\` | Agent definitions |
| \`.claude/settings.json\` | Hooks + permissions |
| \`.fishi/state/project.yaml\` | Current phase, sprint |
| \`.fishi/state/gates.yaml\` | Gate approvals |
| \`.fishi/state/monitor.json\` | Monitoring events |
| \`.fishi/state/file-locks.yaml\` | File lock registry |
| \`.fishi/taskboard/board.md\` | Kanban board |
| \`.fishi/plans/\` | PRDs, architecture, discovery |
| \`.fishi/research/\` | Deep research reports |
| \`.fishi/scripts/\` | Hook and utility scripts |
| \`.fishi/memory/\` | Agent memory |
| \`.fishi/learnings/\` | Best practices + mistakes |
| \`.fishi/todos/\` | Per-agent TODO lists |
| \`.fishi/agent-factory/\` | Dynamic agent templates |
| \`.trees/\` | Git worktrees for agent work |
| \`.fishi/sandbox-policy.yaml\` | Sandbox access rules |

---

## Coding Conventions

${conventionsBlock}
`;
}

function buildConventionsBlock(
  projectType: ProjectType,
  analysis?: BrownfieldAnalysisData
): string {
  // Greenfield — use generic defaults
  if (projectType !== 'brownfield' && projectType !== 'hybrid') {
    return `- TDD is mandatory: write the test first, then the implementation.
- Conventional commits: \`feat(scope): description\`, \`fix(scope): description\`
- Run the full test suite before marking any task complete.
- Never add dependencies without documenting rationale in the PR description.
- Keep functions small, names descriptive, errors explicit — never swallow exceptions.`;
  }

  // Brownfield / hybrid without analysis data — fallback to the prompt message
  if (!analysis) {
    return `> Run \`/analyze-codebase\` to auto-detect conventions from the existing codebase. Until then, defaults apply.

- Respect existing patterns — do NOT introduce new paradigms without architect approval.
- TDD: write or update tests before changing production code.
- Conventional commits: \`feat(scope): description\`, \`fix(scope): description\`
- Run the full test suite before marking any task complete.
- Never add dependencies without documenting rationale in the PR description.`;
  }

  // Brownfield / hybrid WITH analysis — populate with real conventions
  const lines: string[] = [];

  lines.push('> Conventions auto-detected from brownfield analysis. Respect all existing patterns.');
  lines.push('');

  // Package manager
  if (analysis.packageManager) {
    lines.push(`### Package Manager`);
    lines.push(`- Use **${analysis.packageManager}** for all dependency operations. Do not mix package managers.`);
    lines.push('');
  }

  // Linter & Formatter
  if (analysis.linter || analysis.formatter) {
    lines.push(`### Code Quality`);
    if (analysis.linter) {
      lines.push(`- Linter: **${analysis.linter}** — all code must pass lint before commit.`);
    }
    if (analysis.formatter) {
      lines.push(`- Formatter: **${analysis.formatter}** — format all files before commit.`);
    }
    lines.push('');
  }

  // Testing
  if (analysis.testFramework) {
    lines.push(`### Testing`);
    lines.push(`- Test framework: **${analysis.testFramework}**`);
    lines.push(`- TDD: write or update tests before changing production code.`);

    // Colocated tests?
    const colocated = analysis.codePatterns.find(p => p.name === 'colocated-tests');
    if (colocated) {
      lines.push(`- Tests are colocated alongside source files (e.g., \`foo.ts\` + \`foo.test.ts\`).`);
    } else if (analysis.fileStats.testFiles > 0) {
      lines.push(`- Test files: ${analysis.fileStats.testFiles} detected. Follow the existing test file naming convention.`);
    }

    lines.push(`- Run the full test suite before marking any task complete.`);
    lines.push('');
  } else {
    lines.push(`### Testing`);
    lines.push(`- No test framework detected. Establish testing before making changes.`);
    lines.push('');
  }

  // Import style
  const barrelPattern = analysis.codePatterns.find(p => p.name === 'barrel-exports');
  if (barrelPattern) {
    lines.push(`### Import Style`);
    lines.push(`- **Barrel exports** pattern detected. Import from index files, not from individual modules.`);
    lines.push('');
  }

  // Framework-specific
  if (analysis.framework) {
    lines.push(`### Framework`);
    lines.push(`- Framework: **${analysis.framework}**`);

    const appRouter = analysis.codePatterns.find(p => p.name === 'app-router');
    const fileRouting = analysis.codePatterns.find(p => p.name === 'file-based-routing');
    if (appRouter) {
      lines.push(`- Using App Router pattern. Place pages in \`app/\` directory with \`page.tsx\` / \`layout.tsx\` convention.`);
    } else if (fileRouting) {
      lines.push(`- Using file-based routing via \`pages/\` directory.`);
    }

    if (analysis.cssFramework) {
      lines.push(`- CSS: **${analysis.cssFramework}** — use this for all styling. Do not introduce competing CSS solutions.`);
    }
    lines.push('');
  }

  // Database / ORM
  if (analysis.orm || analysis.database) {
    lines.push(`### Data Layer`);
    if (analysis.orm) {
      lines.push(`- ORM: **${analysis.orm}** — use this for all database operations.`);
    }
    if (analysis.database) {
      lines.push(`- Database: **${analysis.database}**`);
    }
    lines.push('');
  }

  // Auth
  if (analysis.authProvider) {
    lines.push(`### Authentication`);
    lines.push(`- Auth provider: **${analysis.authProvider}** — use existing auth integration. Do not add alternative auth.`);
    lines.push('');
  }

  // API style
  if (analysis.apiStyle) {
    lines.push(`### API Style`);
    lines.push(`- API: **${analysis.apiStyle}** — follow the existing API style for new endpoints.`);
    lines.push('');
  }

  // Architectural patterns
  const archPatterns = analysis.codePatterns.filter(
    p => !['barrel-exports', 'colocated-tests', 'app-router', 'file-based-routing'].includes(p.name)
  );
  if (archPatterns.length > 0) {
    lines.push(`### Architecture Patterns`);
    for (const pattern of archPatterns) {
      lines.push(`- **${pattern.name}**: ${pattern.evidence}`);
    }
    lines.push('');
  }

  // Monorepo
  if (analysis.monorepo) {
    lines.push(`### Monorepo`);
    lines.push(`- This is a monorepo. Respect package boundaries. Changes should be scoped to the relevant package.`);
    lines.push('');
  }

  // General conventions from detection
  if (analysis.conventions.length > 0) {
    const alreadyCovered = new Set(['ESLint configured', 'Prettier configured', 'Biome configured']);
    const remaining = analysis.conventions.filter(c => {
      if (alreadyCovered.has(c)) return false;
      if (c.includes('testing') && analysis.testFramework) return false;
      return true;
    });
    if (remaining.length > 0) {
      lines.push(`### Additional Conventions`);
      for (const conv of remaining) {
        lines.push(`- ${conv}`);
      }
      lines.push('');
    }
  }

  // Always include these baseline rules
  lines.push(`### Baseline Rules`);
  lines.push(`- Respect existing patterns — do NOT introduce new paradigms without architect approval.`);
  lines.push(`- Conventional commits: \`feat(scope): description\`, \`fix(scope): description\``);
  lines.push(`- Never add dependencies without documenting rationale in the PR description.`);

  return lines.join('\n');
}
