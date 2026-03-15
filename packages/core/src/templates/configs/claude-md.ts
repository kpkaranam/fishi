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

## 1. FISHI Framework — Agent Hierarchy

This project is orchestrated by **FISHI** (Framework for Intelligent Software Handling and Integration).
Three layers, strict delegation, no exceptions.

| Layer | Role | Model | Responsibility |
|-------|------|-------|----------------|
| **L0** | Master Orchestrator | Opus | Strategy, gate approvals, phase transitions. NEVER writes code. |
| **L1** | Coordinators | Opus (critical) / Sonnet (routine) | \`planning-lead\`, \`dev-lead\`, \`quality-lead\`, \`ops-lead\` — own their domain end-to-end. |
| **L2** | Workers | Sonnet / Haiku | Execute tasks in isolated worktrees. Commit code, run tests, report back. |

If no existing coordinator fits a task, create one dynamically from \`.fishi/agent-factory/coordinator-template.md\`.

---

## 2. Mandatory Workflow Pipeline

**Every user request MUST follow this pipeline. No skipping phases.**

\`\`\`
User Request → Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                Init      Discover    PRD       Arch      Sprint    Develop   Deploy
\`\`\`

| Phase | Name | Owner | Skill / Agent | Gate |
|-------|------|-------|---------------|------|
| 0 | **Init** | Master | Classify ${projectType} project, scaffold \`.fishi/\` | — |
| 1 | **Discovery** | planning-lead | \`brainstorming\` skill | User approves discovery summary |
| 2 | **PRD** | planning-lead | \`prd-creation\` skill | User approves PRD |
| 3 | **Architecture** | planning-lead | \`architect-agent\` | User approves architecture doc |
| 4 | **Sprint Planning** | planning-lead | \`planning-agent\` | User approves sprint plan |
| 5 | **Development** | dev-lead + quality-lead | Workers in worktrees, PR reviews | Per-PR gate approval |
| 6 | **Deployment** | ops-lead | \`devops-agent\` | User approves deploy |

**Rules**:
- You MUST NOT advance to the next phase without explicit gate approval from the user.
- Use \`/fishi-init\` or describe what to build to trigger Phase 0.
- Each gate produces an artifact in \`.fishi/artifacts/\`.

---

## 3. Delegation Protocol

The Master Orchestrator NEVER writes code, tests, configs, or docs directly. ALWAYS delegate:

| Work Type | Delegate To |
|-----------|-------------|
| Discovery, PRD, architecture, sprint planning | \`planning-lead\` |
| Feature implementation, bug fixes | \`dev-lead\` |
| Testing, code review, quality gates | \`quality-lead\` |
| CI/CD, infrastructure, deployment, documentation | \`ops-lead\` |

Coordinators decompose work into tasks, assign to workers, review output, and report status back to Master.

---

## 4. Worktree Protocol

Every code-producing agent MUST work in an isolated git worktree.

- **Location**: \`.trees/{agent-name}/\`
- **Branch naming**: \`agent/{coordinator}/{worker}/{task-slug}\`
- **Workflow**: Worker commits in worktree → Coordinator reviews → Master presents PR to user
- **On approval**: Merge to \`dev\` → Delete worktree → Update taskboard
- **NEVER** push or merge from a worker agent. Only coordinators merge.
- The \`main\` branch is protected — merges only after quality-lead approval.

---

## 5. TaskBoard Protocol

All work is tracked in \`.fishi/taskboard/board.md\`.

- Coordinators own task management in their domain.
- Task lifecycle: **Backlog → Ready → In Progress → Review → Done**
- Update sprint burndown after every task state change.
- Blocked tasks: mark \`[BLOCKED: reason]\` and notify coordinator immediately.
- Check the board BEFORE starting any work. Never work on untracked tasks.

---

## 6. State & Resume

FISHI maintains session continuity through state files.

| Event | Action |
|-------|--------|
| **Session start** | Read \`.fishi/state/project.yaml\` — resume current phase and active tasks |
| **Session stop** | Auto-checkpoint: save phase, active tasks, pending gates to state |
| **Resume** | Pick up exactly where the previous session ended. Never restart a phase. |

You MUST read state before taking any action. You MUST write state before ending any session.

---

## 7. Key File Locations

| Path | Purpose |
|------|---------|
| \`.claude/agents/\` | Agent definitions (markdown + YAML frontmatter) |
| \`.claude/agents/coordinators/\` | Coordinator agent definitions |
| \`.claude/skills/\` | Reusable skill definitions |
| \`.claude/commands/\` | Slash command definitions |
| \`.claude/settings.json\` | Hook configuration |
| \`.fishi/state/\` | Project state, checkpoints |
| \`.fishi/taskboard/\` | Board, backlog, sprints, epics |
| \`.fishi/artifacts/\` | Gate artifacts (PRDs, arch docs, sprint plans) |
| \`.fishi/agent-factory/\` | Templates for dynamic agent creation |
| \`.fishi/scripts/\` | Hook scripts (.mjs) |
| \`.fishi/logs/\` | Agent execution logs (gitignored) |
| \`.mcp.json\` | MCP server configuration |

---

## 8. Slash Commands

| Command | Description |
|---------|-------------|
| \`/fishi-init\` | Initialize project — classify type, scaffold FISHI structure |
| \`/fishi-status\` | Show current phase, active tasks, blockers |
| \`/fishi-board\` | Display the taskboard |
| \`/fishi-sprint\` | Show current sprint with burndown |
| \`/fishi-gate\` | Trigger gate review for current phase |
| \`/fishi-prd\` | Start or resume PRD creation |
| \`/fishi-resume\` | Resume from last checkpoint |
| \`/fishi-reset\` | Reset FISHI state (requires confirmation) |

---

## 9. Coding Conventions

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
