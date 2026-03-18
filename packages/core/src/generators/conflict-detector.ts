// packages/core/src/generators/conflict-detector.ts
import { existsSync, statSync } from 'fs';
import { join } from 'path';

export interface FileConflict {
  path: string;
  size: number;
}

export interface ConflictCategory {
  name: string;
  label: string;
  conflicts: FileConflict[];
}

export interface ConflictMap {
  categories: ConflictCategory[];
  hasConflicts: boolean;
  totalConflicts: number;
  docsReadmeExists: boolean;
  rootClaudeMdExists: boolean;
}

const FISHI_FILES: Record<string, { label: string; files: string[] }> = {
  'claude-md': {
    label: '.claude/CLAUDE.md',
    files: ['.claude/CLAUDE.md'],
  },
  'settings-json': {
    label: '.claude/settings.json',
    files: ['.claude/settings.json'],
  },
  'mcp-json': {
    label: '.mcp.json',
    files: ['.mcp.json'],
  },
  'agents': {
    label: 'Agents',
    files: [
      '.claude/agents/master-orchestrator.md',
      '.claude/agents/coordinators/planning-lead.md',
      '.claude/agents/coordinators/dev-lead.md',
      '.claude/agents/coordinators/quality-lead.md',
      '.claude/agents/coordinators/ops-lead.md',
      '.claude/agents/research-agent.md',
      '.claude/agents/planning-agent.md',
      '.claude/agents/architect-agent.md',
      '.claude/agents/backend-agent.md',
      '.claude/agents/frontend-agent.md',
      '.claude/agents/uiux-agent.md',
      '.claude/agents/fullstack-agent.md',
      '.claude/agents/devops-agent.md',
      '.claude/agents/testing-agent.md',
      '.claude/agents/security-agent.md',
      '.claude/agents/docs-agent.md',
      '.claude/agents/writing-agent.md',
      '.claude/agents/marketing-agent.md',
    ],
  },
  'skills': {
    label: 'Skills',
    files: [
      '.claude/skills/brainstorming/SKILL.md',
      '.claude/skills/brownfield-analysis/SKILL.md',
      '.claude/skills/taskboard-ops/SKILL.md',
      '.claude/skills/code-gen/SKILL.md',
      '.claude/skills/debugging/SKILL.md',
      '.claude/skills/api-design/SKILL.md',
      '.claude/skills/testing/SKILL.md',
      '.claude/skills/deployment/SKILL.md',
      '.claude/skills/prd/SKILL.md',
      '.claude/skills/brownfield-discovery/SKILL.md',
      '.claude/skills/adaptive-taskgraph/SKILL.md',
      '.claude/skills/documentation/SKILL.md',
    ],
  },
  'commands': {
    label: 'Commands',
    files: [
      '.claude/commands/fishi-init.md',
      '.claude/commands/fishi-status.md',
      '.claude/commands/fishi-resume.md',
      '.claude/commands/fishi-gate.md',
      '.claude/commands/fishi-board.md',
      '.claude/commands/fishi-sprint.md',
      '.claude/commands/fishi-reset.md',
      '.claude/commands/fishi-prd.md',
    ],
  },
  'gitignore': {
    label: '.gitignore',
    files: ['.gitignore'],
  },
};

export function detectConflicts(targetDir: string): ConflictMap {
  const categories: ConflictCategory[] = [];
  let totalConflicts = 0;

  // Check for root CLAUDE.md first — it takes priority over .claude/CLAUDE.md
  const rootClaudeMdExists = existsSync(join(targetDir, 'CLAUDE.md'));

  for (const [name, def] of Object.entries(FISHI_FILES)) {
    // Suppress .claude/CLAUDE.md category when root CLAUDE.md exists
    if (name === 'claude-md' && rootClaudeMdExists) {
      categories.push({ name, label: def.label, conflicts: [] });
      continue;
    }

    const conflicts: FileConflict[] = [];

    for (const relPath of def.files) {
      const fullPath = join(targetDir, relPath);
      if (existsSync(fullPath)) {
        const stat = statSync(fullPath);
        conflicts.push({ path: relPath, size: stat.size });
      }
    }

    categories.push({ name, label: def.label, conflicts });
    totalConflicts += conflicts.length;
  }

  // Add root-claude-md category if root CLAUDE.md exists
  if (rootClaudeMdExists) {
    const stat = statSync(join(targetDir, 'CLAUDE.md'));
    categories.unshift({
      name: 'root-claude-md',
      label: 'CLAUDE.md (root)',
      conflicts: [{ path: 'CLAUDE.md', size: stat.size }],
    });
    totalConflicts += 1;
  }

  const docsReadmeExists = existsSync(join(targetDir, 'docs', 'README.md'));

  return {
    categories,
    hasConflicts: totalConflicts > 0,
    totalConflicts,
    docsReadmeExists,
    rootClaudeMdExists,
  };
}
