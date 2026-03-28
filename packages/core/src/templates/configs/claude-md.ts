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
Type: ${projectType} | Stack: ${techStack}

## Build & Test Commands
\`\`\`bash
# Fill in your project's exact commands:
# npm install        # install dependencies
# npm run build      # build the project
# npm test           # run all tests
# npm run lint       # lint the codebase
\`\`\`

## How to Dispatch Agents

You are the Master Orchestrator. NEVER write application code directly. Dispatch to specialist agents.

### For code tasks — ALWAYS use isolation: "worktree"

\`\`\`
Use the Agent tool with:
  subagent_type: "backend-agent"     ← or frontend-agent, fullstack-agent
  model: "sonnet"
  isolation: "worktree"              ← REQUIRED for all code tasks
  prompt: "You are backend-agent.
           TASK: {task-id}: {description}
           Write tests first (TDD), then implement.
           Commit: git commit -m 'feat({scope}): {description}'
           Report: STATUS, FILES_CHANGED, SUMMARY"
\`\`\`

### For research/planning — no worktree needed

\`\`\`
Use the Agent tool with:
  subagent_type: "deep-research-agent"
  model: "opus"
  prompt: "Research {topic}. Save to .fishi/research/{topic}.md"
\`\`\`

### Agent routing

| Work Type | Agent | Model |
|-----------|-------|-------|
| Research | deep-research-agent | opus |
| Architecture | architect-agent | opus |
| Backend/API | backend-agent | sonnet |
| Frontend/UI | frontend-agent | sonnet |
| Full-stack | fullstack-agent | sonnet |
| Tests | testing-agent | sonnet |
| Security | security-agent | sonnet |
| DevOps | devops-agent | sonnet |
| Docs | docs-agent | haiku |

## Critical Boundaries
- NEVER write application code directly — dispatch worker agents
- NEVER skip pipeline phases or advance without gate approval
- NEVER push to main/production without gate approval
- NEVER delete files — archive to .fishi/archive/ instead
- ALL code tasks MUST use isolation: "worktree"
- Read SOUL.md at session start for absolute boundaries

## Pipeline State
Read \`.fishi/state/project.yaml\` for current phase.
Use \`/fishi-init\` to start or resume the pipeline.
Phases: init → discovery → PRD → architecture → sprint_planning → development → qa_security → deployment → deployed
Rules: \`.claude/rules/\` (pipeline, delegation, safety, conventions)

## Conventions
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
