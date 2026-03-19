# Safe Brownfield Initialization — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `fishi init` safe for brownfield projects by detecting conflicts, backing up existing files, and interactively asking users to skip/merge/replace per category.

**Architecture:** Three new pure modules (conflict-detector, backup-manager, merge-strategies) in `packages/core/src/generators/`. The scaffold generator's `write()` function gets a resolution map that controls behavior per-file. The CLI init command orchestrates the flow: detect → backup → prompt → scaffold.

**Tech Stack:** TypeScript, vitest, Node.js fs/promises, inquirer (already a CLI dependency)

**Spec:** `docs/superpowers/specs/2026-03-18-safe-brownfield-init-design.md`

---

## Chunk 1: Core Modules (conflict-detector, backup-manager, merge-strategies)

### Task 1: Conflict Detector

**Files:**
- Create: `packages/core/src/generators/conflict-detector.ts`
- Create: `packages/core/src/__tests__/conflict-detector.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/src/__tests__/conflict-detector.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectConflicts, type ConflictMap, type ConflictCategory } from '../generators/conflict-detector';

describe('detectConflicts', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-conflict-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty conflicts for a fresh directory', () => {
    const dir = createTempDir();
    const result = detectConflicts(dir);
    for (const cat of result.categories) {
      expect(cat.conflicts).toHaveLength(0);
    }
    expect(result.hasConflicts).toBe(false);
  });

  it('detects existing .claude/CLAUDE.md as conflict', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Existing project');
    const result = detectConflicts(dir);
    const claudeMd = result.categories.find(c => c.name === 'claude-md');
    expect(claudeMd!.conflicts).toHaveLength(1);
    expect(claudeMd!.conflicts[0].path).toBe('.claude/CLAUDE.md');
    expect(claudeMd!.conflicts[0].size).toBeGreaterThan(0);
  });

  it('detects existing .claude/settings.json as conflict', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'settings.json'), '{}');
    const result = detectConflicts(dir);
    const settings = result.categories.find(c => c.name === 'settings-json');
    expect(settings!.conflicts).toHaveLength(1);
  });

  it('detects existing .mcp.json as conflict', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{}');
    const result = detectConflicts(dir);
    const mcp = result.categories.find(c => c.name === 'mcp-json');
    expect(mcp!.conflicts).toHaveLength(1);
  });

  it('detects existing agents as conflicts', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'agents', 'my-agent.md'), '# custom');
    const result = detectConflicts(dir);
    const agents = result.categories.find(c => c.name === 'agents');
    // Existing file not in FISHI's list = no conflict
    // Only files FISHI wants to write that already exist are conflicts
    expect(agents!.conflicts).toHaveLength(0);
  });

  it('detects filename collision in agents', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'agents', 'backend-agent.md'), '# my backend');
    const result = detectConflicts(dir);
    const agents = result.categories.find(c => c.name === 'agents');
    expect(agents!.conflicts.length).toBeGreaterThan(0);
    expect(agents!.conflicts.some(c => c.path === '.claude/agents/backend-agent.md')).toBe(true);
  });

  it('detects filename collision in skills', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'skills', 'brainstorming'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'skills', 'brainstorming', 'SKILL.md'), '# my skill');
    const result = detectConflicts(dir);
    const skills = result.categories.find(c => c.name === 'skills');
    expect(skills!.conflicts.some(c => c.path === '.claude/skills/brainstorming/SKILL.md')).toBe(true);
  });

  it('detects filename collision in commands', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'commands'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'commands', 'fishi-init.md'), '# custom init');
    const result = detectConflicts(dir);
    const commands = result.categories.find(c => c.name === 'commands');
    expect(commands!.conflicts.some(c => c.path === '.claude/commands/fishi-init.md')).toBe(true);
  });

  it('detects existing .gitignore as conflict', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.gitignore'), 'node_modules/\n');
    const result = detectConflicts(dir);
    const gitignore = result.categories.find(c => c.name === 'gitignore');
    expect(gitignore!.conflicts).toHaveLength(1);
  });

  it('detects existing docs/README.md', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, 'docs'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'README.md'), '# docs');
    const result = detectConflicts(dir);
    // docs/README.md is special — detected but will be silently skipped
    expect(result.docsReadmeExists).toBe(true);
  });

  it('sets hasConflicts true when any category has conflicts', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{}');
    const result = detectConflicts(dir);
    expect(result.hasConflicts).toBe(true);
  });

  it('reports total conflict count', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# existing');
    writeFileSync(join(dir, '.claude', 'settings.json'), '{}');
    writeFileSync(join(dir, '.mcp.json'), '{}');
    const result = detectConflicts(dir);
    expect(result.totalConflicts).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/conflict-detector.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement conflict-detector**

```typescript
// packages/core/src/generators/conflict-detector.ts
import { existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

export interface FileConflict {
  path: string;      // relative path from project root
  size: number;      // bytes
}

export interface ConflictCategory {
  name: string;
  label: string;     // human-readable label for prompts
  conflicts: FileConflict[];
}

export interface ConflictMap {
  categories: ConflictCategory[];
  hasConflicts: boolean;
  totalConflicts: number;
  docsReadmeExists: boolean;
}

// All files FISHI wants to write, grouped by category
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

  for (const [name, def] of Object.entries(FISHI_FILES)) {
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

  // Check docs/README.md separately (will be silently skipped, not prompted)
  const docsReadmeExists = existsSync(join(targetDir, 'docs', 'README.md'));

  return {
    categories,
    hasConflicts: totalConflicts > 0,
    totalConflicts,
    docsReadmeExists,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/conflict-detector.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/generators/conflict-detector.ts packages/core/src/__tests__/conflict-detector.test.ts
git commit -m "feat: add conflict detector for safe brownfield init"
```

---

### Task 2: Backup Manager

**Files:**
- Create: `packages/core/src/generators/backup-manager.ts`
- Create: `packages/core/src/__tests__/backup-manager.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/src/__tests__/backup-manager.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createBackup, type BackupManifest } from '../generators/backup-manager';

describe('createBackup', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-backup-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates backup directory with timestamp', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# existing');

    const backupPath = await createBackup(dir, ['.claude/CLAUDE.md']);
    expect(existsSync(backupPath)).toBe(true);
    // Timestamp format: YYYY-MM-DDTHH-MM-SS
    const dirName = backupPath.split(/[/\\]/).pop()!;
    expect(dirName).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  it('copies files preserving directory structure', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# project instructions');
    writeFileSync(join(dir, '.claude', 'agents', 'my-agent.md'), '# agent');

    const backupPath = await createBackup(dir, [
      '.claude/CLAUDE.md',
      '.claude/agents/my-agent.md',
    ]);

    expect(readFileSync(join(backupPath, '.claude', 'CLAUDE.md'), 'utf-8')).toBe('# project instructions');
    expect(readFileSync(join(backupPath, '.claude', 'agents', 'my-agent.md'), 'utf-8')).toBe('# agent');
  });

  it('writes manifest.json with file list', async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{"mcpServers":{}}');

    const backupPath = await createBackup(dir, ['.mcp.json']);
    const manifest: BackupManifest = JSON.parse(
      readFileSync(join(backupPath, 'manifest.json'), 'utf-8')
    );

    expect(manifest.timestamp).toBeDefined();
    expect(manifest.fishi_version).toBeDefined();
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].path).toBe('.mcp.json');
    expect(manifest.files[0].size).toBeGreaterThan(0);
  });

  it('backup restores original content byte-for-byte', async () => {
    const dir = createTempDir();
    const original = '{\n  "hooks": {},\n  "permissions": {}\n}';
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'settings.json'), original);

    const backupPath = await createBackup(dir, ['.claude/settings.json']);
    const restored = readFileSync(join(backupPath, '.claude', 'settings.json'), 'utf-8');
    expect(restored).toBe(original);
  });

  it('handles empty file list gracefully', async () => {
    const dir = createTempDir();
    const backupPath = await createBackup(dir, []);
    const manifest: BackupManifest = JSON.parse(
      readFileSync(join(backupPath, 'manifest.json'), 'utf-8')
    );
    expect(manifest.files).toHaveLength(0);
  });

  it('creates backup inside .fishi/backup/', async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{}');
    const backupPath = await createBackup(dir, ['.mcp.json']);
    expect(backupPath.replace(/\\/g, '/')).toContain('.fishi/backup/');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/backup-manager.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement backup-manager**

```typescript
// packages/core/src/generators/backup-manager.ts
import { mkdir, copyFile, writeFile, rename, readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';

export interface BackupManifest {
  timestamp: string;
  fishi_version: string;
  files: { path: string; size: number }[];
}

export async function createBackup(
  targetDir: string,
  conflictingFiles: string[]
): Promise<string> {
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, '');
  const backupDir = join(targetDir, '.fishi', 'backup', timestamp);

  await mkdir(backupDir, { recursive: true });

  const manifestFiles: { path: string; size: number }[] = [];

  for (const relPath of conflictingFiles) {
    const srcPath = join(targetDir, relPath);
    const destPath = join(backupDir, relPath);

    if (existsSync(srcPath)) {
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(srcPath, destPath);
      const stat = statSync(srcPath);
      manifestFiles.push({ path: relPath, size: stat.size });
    }
  }

  // Version is best-effort — callers can pass it, default to unknown
  const fishiVersion = '0.1.0';

  const manifest: BackupManifest = {
    timestamp: now.toISOString(),
    fishi_version: fishiVersion,
    files: manifestFiles,
  };

  // Atomic write: tmp → rename
  const manifestPath = join(backupDir, 'manifest.json');
  const tmpPath = manifestPath + '.tmp';
  await writeFile(tmpPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  await rename(tmpPath, manifestPath);

  return backupDir;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/backup-manager.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/generators/backup-manager.ts packages/core/src/__tests__/backup-manager.test.ts
git commit -m "feat: add backup manager for safe brownfield init"
```

---

### Task 3: Merge Strategies

**Files:**
- Create: `packages/core/src/generators/merge-strategies.ts`
- Create: `packages/core/src/__tests__/merge-strategies.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/src/__tests__/merge-strategies.test.ts
import { describe, it, expect } from 'vitest';
import {
  mergeClaudeMd,
  mergeSettingsJson,
  mergeMcpJson,
  mergeGitignore,
} from '../generators/merge-strategies';

describe('mergeClaudeMd', () => {
  it('appends FISHI section to existing content', () => {
    const existing = '# My Project\n\nExisting instructions here.';
    const fishiContent = 'FISHI orchestration rules...';
    const result = mergeClaudeMd(existing, fishiContent);

    expect(result).toContain('# My Project');
    expect(result).toContain('Existing instructions here.');
    expect(result).toContain('### FISHI Framework');
    expect(result).toContain('<!-- FISHI:START — Auto-generated by FISHI.');
    expect(result).toContain('<!-- FISHI:END -->');
    expect(result).toContain('FISHI orchestration rules...');
  });

  it('is idempotent — replaces existing FISHI section on re-merge', () => {
    const existing = '# My Project\n\n---\n### FISHI Framework\n<!-- FISHI:START — Auto-generated by FISHI. Do not edit between markers. -->\nold content\n<!-- FISHI:END -->';
    const fishiContent = 'new content';
    const result = mergeClaudeMd(existing, fishiContent);

    expect(result).not.toContain('old content');
    expect(result).toContain('new content');
    // Only one FISHI section
    expect(result.match(/FISHI:START/g)).toHaveLength(1);
  });

  it('preserves all content above FISHI section', () => {
    const existing = '# Project\n\n## Section A\nImportant stuff\n\n## Section B\nMore stuff';
    const fishiContent = 'fishi rules';
    const result = mergeClaudeMd(existing, fishiContent);

    expect(result).toContain('## Section A\nImportant stuff');
    expect(result).toContain('## Section B\nMore stuff');
  });
});

describe('mergeSettingsJson', () => {
  it('adds FISHI hooks alongside existing hooks', () => {
    const existing = {
      hooks: {
        PostToolUse: [{ matcher: 'Write|Edit', command: 'prettier --write $FILE' }],
      },
      permissions: { allow: ['Read'], deny: [] },
    };
    const fishi = {
      hooks: {
        SessionStart: [{ matcher: '', command: 'node .fishi/scripts/session-start.mjs' }],
        PostToolUse: [{ matcher: 'Write|Edit', command: 'node .fishi/scripts/post-edit.mjs' }],
      },
      permissions: { allow: ['Read', 'Write', 'Glob'], deny: ['Bash(rm -rf *)'] },
    };
    const result = mergeSettingsJson(existing, fishi);

    // Existing hook preserved
    expect(result.hooks.PostToolUse).toContainEqual({
      matcher: 'Write|Edit', command: 'prettier --write $FILE',
    });
    // FISHI hook added
    expect(result.hooks.PostToolUse).toContainEqual({
      matcher: 'Write|Edit', command: 'node .fishi/scripts/post-edit.mjs',
    });
    // New event added
    expect(result.hooks.SessionStart).toHaveLength(1);
    // Permissions unioned and deduped
    expect(result.permissions.allow).toContain('Read');
    expect(result.permissions.allow).toContain('Write');
    expect(result.permissions.allow).toContain('Glob');
    expect(result.permissions.allow.filter((p: string) => p === 'Read')).toHaveLength(1);
    // Deny merged
    expect(result.permissions.deny).toContain('Bash(rm -rf *)');
  });

  it('preserves existing env and other keys', () => {
    const existing = {
      hooks: {},
      permissions: { allow: [], deny: [] },
      env: { API_KEY: 'secret' },
      enabledPlugins: ['my-plugin'],
      customKey: 'preserved',
    };
    const fishi = {
      hooks: {},
      permissions: { allow: [], deny: [] },
      env: { FISHI_MODE: 'auto' },
      enabledPlugins: ['fishi-plugin'],
    };
    const result = mergeSettingsJson(existing, fishi);

    expect(result.env.API_KEY).toBe('secret');
    expect(result.env.FISHI_MODE).toBe('auto');
    expect(result.enabledPlugins).toContain('my-plugin');
    expect(result.enabledPlugins).toContain('fishi-plugin');
    expect(result.customKey).toBe('preserved');
  });

  it('deduplicates hooks by (eventName, matcher, command) triple', () => {
    const existing = {
      hooks: {
        PreToolUse: [{ matcher: 'Bash', command: 'node safety.mjs' }],
      },
      permissions: { allow: [], deny: [] },
    };
    const fishi = {
      hooks: {
        PreToolUse: [{ matcher: 'Bash', command: 'node safety.mjs' }],
      },
      permissions: { allow: [], deny: [] },
    };
    const result = mergeSettingsJson(existing, fishi);
    expect(result.hooks.PreToolUse).toHaveLength(1);
  });
});

describe('mergeMcpJson', () => {
  it('adds new MCP servers without removing existing', () => {
    const existing = {
      mcpServers: {
        'astro-docs': { type: 'stdio', command: 'npx', args: ['astro-docs'] },
      },
    };
    const fishi = {
      mcpServers: {
        github: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
        'sequential-thinking': { type: 'stdio', command: 'npx', args: ['-y', '@anthropic/sequential-thinking-mcp'] },
      },
    };
    const result = mergeMcpJson(existing, fishi);

    expect(result.mcpServers['astro-docs']).toBeDefined();
    expect(result.mcpServers['github']).toBeDefined();
    expect(result.mcpServers['sequential-thinking']).toBeDefined();
  });

  it('does not overwrite existing server with same name', () => {
    const existing = {
      mcpServers: {
        github: { type: 'stdio', command: 'custom-gh' },
      },
    };
    const fishi = {
      mcpServers: {
        github: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
      },
    };
    const result = mergeMcpJson(existing, fishi);
    expect(result.mcpServers.github.command).toBe('custom-gh');
  });
});

describe('mergeGitignore', () => {
  it('appends FISHI entries to existing gitignore', () => {
    const existing = 'node_modules/\ndist/\n';
    const fishiAdditions = '\n# FISHI framework\n.trees/\n.fishi/logs/\n';
    const result = mergeGitignore(existing, fishiAdditions);

    expect(result).toContain('node_modules/');
    expect(result).toContain('.trees/');
  });

  it('is idempotent — does not append if .trees/ already present', () => {
    const existing = 'node_modules/\n.trees/\n';
    const fishiAdditions = '\n# FISHI framework\n.trees/\n.fishi/logs/\n';
    const result = mergeGitignore(existing, fishiAdditions);

    expect(result).toBe(existing);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/merge-strategies.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement merge-strategies**

```typescript
// packages/core/src/generators/merge-strategies.ts

const FISHI_START = '<!-- FISHI:START — Auto-generated by FISHI. Do not edit between markers. -->';
const FISHI_END = '<!-- FISHI:END -->';

/**
 * Merge FISHI content into an existing CLAUDE.md.
 * Appends a marked section, or replaces existing FISHI section (idempotent).
 */
export function mergeClaudeMd(existing: string, fishiContent: string): string {
  const section = `\n---\n### FISHI Framework\n${FISHI_START}\n${fishiContent}\n${FISHI_END}`;

  const startIdx = existing.indexOf(FISHI_START);
  const endIdx = existing.indexOf(FISHI_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Find the beginning of the FISHI section block (look for --- before ### FISHI Framework)
    let sectionStart = existing.lastIndexOf('\n---\n### FISHI Framework', startIdx);
    if (sectionStart === -1) sectionStart = startIdx;
    const sectionEnd = endIdx + FISHI_END.length;
    const sectionEnd = endIdx + FISHI_END.length;
    return existing.slice(0, sectionStart) + section + existing.slice(sectionEnd);
  }

  return existing + section;
}

interface HookEntry {
  matcher: string;
  command: string;
  [key: string]: unknown;
}

interface SettingsJson {
  hooks?: Record<string, HookEntry[]>;
  permissions?: { allow?: string[]; deny?: string[] };
  env?: Record<string, string>;
  enabledPlugins?: string[];
  [key: string]: unknown;
}

/**
 * Union merge two settings.json objects.
 * Hooks deduped by (eventName, matcher, command) triple.
 * Permissions deduped by exact string. Existing keys preserved.
 */
export function mergeSettingsJson(existing: SettingsJson, fishi: SettingsJson): SettingsJson {
  const result: SettingsJson = { ...existing };

  // Merge hooks
  const mergedHooks: Record<string, HookEntry[]> = { ...existing.hooks };
  if (fishi.hooks) {
    for (const [event, entries] of Object.entries(fishi.hooks)) {
      if (!mergedHooks[event]) {
        mergedHooks[event] = [...entries];
      } else {
        for (const entry of entries) {
          const isDuplicate = mergedHooks[event].some(
            (e) => e.matcher === entry.matcher && e.command === entry.command
          );
          if (!isDuplicate) {
            mergedHooks[event] = [...mergedHooks[event], entry];
          }
        }
      }
    }
  }
  result.hooks = mergedHooks;

  // Merge permissions
  const existingAllow = existing.permissions?.allow || [];
  const fishiAllow = fishi.permissions?.allow || [];
  const existingDeny = existing.permissions?.deny || [];
  const fishiDeny = fishi.permissions?.deny || [];

  result.permissions = {
    allow: [...new Set([...existingAllow, ...fishiAllow])],
    deny: [...new Set([...existingDeny, ...fishiDeny])],
  };

  // Merge env (existing wins on conflicts)
  if (fishi.env) {
    result.env = { ...fishi.env, ...existing.env };
  }

  // Merge enabledPlugins
  if (fishi.enabledPlugins) {
    result.enabledPlugins = [
      ...new Set([...(existing.enabledPlugins || []), ...fishi.enabledPlugins]),
    ];
  }

  return result;
}

interface McpJson {
  mcpServers: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Add FISHI MCP servers that don't already exist. Never removes existing.
 */
export function mergeMcpJson(existing: McpJson, fishi: McpJson): McpJson {
  const merged = { ...existing, mcpServers: { ...existing.mcpServers } };
  for (const [name, config] of Object.entries(fishi.mcpServers)) {
    if (!(name in merged.mcpServers)) {
      merged.mcpServers[name] = config;
    }
  }
  return merged;
}

/**
 * Append FISHI gitignore entries if not already present.
 */
export function mergeGitignore(existing: string, fishiAdditions: string): string {
  if (existing.includes('.trees/')) {
    return existing;
  }
  return existing + fishiAdditions;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/merge-strategies.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/generators/merge-strategies.ts packages/core/src/__tests__/merge-strategies.test.ts
git commit -m "feat: add merge strategies for safe brownfield init"
```

---

### Task 4: Export new modules from core

**Files:**
- Modify: `packages/core/src/generators/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Update generators/index.ts**

Add after existing exports in `packages/core/src/generators/index.ts`:

```typescript
export { detectConflicts } from './conflict-detector';
export type { ConflictMap, ConflictCategory, FileConflict } from './conflict-detector';
export { createBackup } from './backup-manager';
export type { BackupManifest } from './backup-manager';
export { mergeClaudeMd, mergeSettingsJson, mergeMcpJson, mergeGitignore } from './merge-strategies';
```

- [ ] **Step 2: Update core/src/index.ts**

Add after the existing generators export block (after line 130):

```typescript
export { detectConflicts } from './generators/index';
export type { ConflictMap, ConflictCategory, FileConflict } from './generators/index';
export { createBackup } from './generators/index';
export type { BackupManifest } from './generators/index';
export { mergeClaudeMd, mergeSettingsJson, mergeMcpJson, mergeGitignore } from './generators/index';
```

- [ ] **Step 3: Run all core tests to check for regressions**

Run: `cd /d/FISHI && npx vitest run packages/core/`
Expected: All existing 302 tests + new tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/generators/index.ts packages/core/src/index.ts
git commit -m "feat: export conflict-detector, backup-manager, merge-strategies from core"
```

---

## Chunk 2: Scaffold Refactor + CLI Integration

### Task 5: Refactor scaffold.ts to accept resolution map

**Files:**
- Modify: `packages/core/src/generators/scaffold.ts`
- Modify: `packages/core/src/__tests__/scaffold.test.ts`

- [ ] **Step 1: Add resolution types and update ScaffoldOptions**

Add to `packages/core/src/generators/scaffold.ts` after the existing imports (after line 82):

```typescript
export type ConflictResolution = 'skip' | 'merge' | 'replace';

export interface ResolutionMap {
  /** Per-category resolution. Missing categories default to 'replace' (greenfield behavior). */
  [category: string]: ConflictResolution;
  /** Per-file overrides for filename collisions within categories. Key is relative path. */
}

export interface FileResolutionMap {
  categories: Record<string, ConflictResolution>;
  files: Record<string, ConflictResolution>;
}
```

Update `ScaffoldOptions` (line 84-88):

```typescript
export interface ScaffoldOptions extends InitOptions {
  projectName: string;
  projectType: ProjectType;
  brownfieldAnalysis?: BrownfieldAnalysisData;
  resolutions?: FileResolutionMap;
  docsReadmeExists?: boolean;
}
```

- [ ] **Step 2: Refactor the write() function**

Replace the existing `write()` function (lines 104-109) with a resolution-aware version:

```typescript
  // Build lookup: relative path → category name
  const pathToCategory: Record<string, string> = {};
  // (populated below after FISHI_FILES import is added)

  const resolutions = options.resolutions;

  async function write(relativePath: string, content: string, category?: string): Promise<void> {
    if (resolutions) {
      const cat = category || pathToCategory[relativePath];
      // Check per-file override first
      const fileRes = resolutions.files[relativePath];
      const catRes = cat ? resolutions.categories[cat] : undefined;
      const resolution = fileRes || catRes;

      if (resolution === 'skip') return;
      // 'merge' is handled by the caller before calling write()
      // 'replace' falls through to normal write
    }

    const fullPath = join(targetDir, relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
    filesCreated++;
  }
```

- [ ] **Step 3: Add merge handling for config files**

Replace the config file writes section (lines 249-258) with merge-aware logic. Add imports for merge functions at the top:

```typescript
import { mergeClaudeMd, mergeSettingsJson, mergeMcpJson, mergeGitignore } from './merge-strategies.js';
import { readFile as fsReadFile } from 'fs/promises';
```

Then replace the config writes:

```typescript
  // ── Config Files (merge-aware) ──────────────────────────────────
  await write('.fishi/fishi.yaml', getFishiYamlTemplate({
    projectName: options.projectName,
    projectDescription: ctx.projectDescription,
    projectType: options.projectType,
    costMode: options.costMode,
    language: options.language,
    framework: options.framework,
  })); // Always new — in .fishi/

  // settings.json
  const settingsContent = getSettingsJsonTemplate();
  if (resolutions?.categories['settings-json'] === 'merge') {
    const existingRaw = await fsReadFile(join(targetDir, '.claude', 'settings.json'), 'utf-8');
    const merged = mergeSettingsJson(JSON.parse(existingRaw), JSON.parse(settingsContent));
    await write('.claude/settings.json', JSON.stringify(merged, null, 2) + '\n', 'settings-json');
  } else {
    await write('.claude/settings.json', settingsContent, 'settings-json');
  }

  // CLAUDE.md
  const claudeMdContent = getClaudeMdTemplate({
    projectName: options.projectName,
    projectDescription: ctx.projectDescription,
    projectType: options.projectType,
    language: options.language,
    framework: options.framework,
    brownfieldAnalysis: options.brownfieldAnalysis,
  });
  if (resolutions?.categories['claude-md'] === 'merge') {
    const existingMd = await fsReadFile(join(targetDir, '.claude', 'CLAUDE.md'), 'utf-8');
    const merged = mergeClaudeMd(existingMd, claudeMdContent);
    await write('.claude/CLAUDE.md', merged, 'claude-md');
  } else {
    await write('.claude/CLAUDE.md', claudeMdContent, 'claude-md');
  }

  // .mcp.json
  const mcpContent = getMcpJsonTemplate();
  if (resolutions?.categories['mcp-json'] === 'merge') {
    const existingRaw = await fsReadFile(join(targetDir, '.mcp.json'), 'utf-8');
    const merged = mergeMcpJson(JSON.parse(existingRaw), JSON.parse(mcpContent));
    await write('.mcp.json', JSON.stringify(merged, null, 2) + '\n', 'mcp-json');
  } else {
    await write('.mcp.json', mcpContent, 'mcp-json');
  }
```

- [ ] **Step 4: Add category tags to all write() calls**

Update every `write()` call to include its category:

```typescript
// Agents — add 'agents' category
await write('.claude/agents/master-orchestrator.md', getMasterOrchestratorTemplate(), 'agents');
// ... all 18 agent writes get 'agents'

// Skills — add 'skills' category
await write('.claude/skills/brainstorming/SKILL.md', getBrainstormingSkill(), 'skills');
// ... all 12 skill writes get 'skills'

// Commands — add 'commands' category
await write('.claude/commands/fishi-init.md', getInitCommand(), 'commands');
// ... all 8 command writes get 'commands'

// Hooks in .claude/hooks/ — add 'hooks' category (if any exist there)
// Note: FISHI hook scripts go to .fishi/scripts/ — no category needed (always new)
```

- [ ] **Step 5: Handle .gitignore with merge strategy**

Replace the .gitignore section (lines 285-296):

```typescript
  // ── .gitignore additions (merge-aware) ──────────────────────────
  const gitignorePath = join(targetDir, '.gitignore');
  const additions = getGitignoreAdditions();
  if (existsSync(gitignorePath)) {
    if (resolutions?.categories['gitignore'] === 'skip') {
      // Do nothing
    } else {
      // Both 'merge' and 'replace' use merge logic for gitignore (append is safe)
      const existing = await readFile(gitignorePath, 'utf-8');
      const merged = mergeGitignore(existing, '\n' + additions);
      if (merged !== existing) {
        await writeFile(join(targetDir, '.gitignore'), merged, 'utf-8');
      }
    }
  } else {
    await writeFile(gitignorePath, additions, 'utf-8');
    filesCreated++;
  }
```

- [ ] **Step 6: Handle docs/README.md**

Replace line 279:

```typescript
  // ── Docs (skip if exists) ───────────────────────────────────────
  if (!options.docsReadmeExists) {
    await write('docs/README.md', `# ${options.projectName}\n\nDocumentation will be generated as the project progresses.\n`);
  }
```

- [ ] **Step 7: Run existing scaffold tests to check for regressions**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/scaffold.test.ts`
Expected: All existing tests PASS (greenfield path unchanged — resolutions is undefined)

- [ ] **Step 8: Add brownfield scaffold tests**

Add to `packages/core/src/__tests__/scaffold.test.ts`:

```typescript
describe('generateScaffold — brownfield with resolutions', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-bf-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('skips CLAUDE.md when resolution is skip', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Original');

    await generateScaffold(dir, {
      ...defaultOptions,
      resolutions: {
        categories: { 'claude-md': 'skip' },
        files: {},
      },
    });

    expect(readFileSync(join(dir, '.claude', 'CLAUDE.md'), 'utf-8')).toBe('# Original');
  });

  it('merges settings.json when resolution is merge', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    const existing = JSON.stringify({
      hooks: { PostToolUse: [{ matcher: 'Write', command: 'prettier' }] },
      permissions: { allow: ['Read'], deny: [] },
    });
    writeFileSync(join(dir, '.claude', 'settings.json'), existing);

    await generateScaffold(dir, {
      ...defaultOptions,
      resolutions: {
        categories: { 'settings-json': 'merge' },
        files: {},
      },
    });

    const result = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8'));
    // Existing hook preserved
    expect(result.hooks.PostToolUse.some((h: any) => h.command === 'prettier')).toBe(true);
    // FISHI hooks added
    expect(result.hooks.SessionStart).toBeDefined();
  });

  it('skips docs/README.md when docsReadmeExists is true', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, 'docs'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'README.md'), '# My Docs');

    await generateScaffold(dir, {
      ...defaultOptions,
      docsReadmeExists: true,
    });

    expect(readFileSync(join(dir, 'docs', 'README.md'), 'utf-8')).toBe('# My Docs');
  });
});
```

- [ ] **Step 9: Run all tests**

Run: `cd /d/FISHI && npx vitest run packages/core/`
Expected: All PASS

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/generators/scaffold.ts packages/core/src/__tests__/scaffold.test.ts
git commit -m "feat: scaffold respects resolution map for brownfield safety"
```

---

### Task 6: Export resolution types from core package

**Files:**
- Modify: `packages/core/src/generators/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add type exports to generators/index.ts**

Add to `packages/core/src/generators/index.ts`:

```typescript
export type { ConflictResolution, FileResolutionMap } from './scaffold';
```

- [ ] **Step 2: Add type exports to core/src/index.ts**

Add after the existing generators exports in `packages/core/src/index.ts`:

```typescript
export type { ConflictResolution, FileResolutionMap } from './generators/index';
```

- [ ] **Step 3: Build and verify**

Run: `cd /d/FISHI/packages/core && npx tsup src/index.ts --format esm --dts`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/generators/index.ts packages/core/src/index.ts
git commit -m "feat: export conflict resolution types from core"
```

---

### Task 7: Update CLI init command with interactive conflict flow

**Files:**
- Modify: `packages/cli/src/commands/init.ts`
- Create: `packages/cli/src/__tests__/conflict-flow.test.ts`

- [ ] **Step 1: Add imports to init.ts**

Add after existing imports in `packages/cli/src/commands/init.ts`:

```typescript
import { detectConflicts } from '@qlucent/fishi-core';
import { createBackup } from '@qlucent/fishi-core';
import type { FileResolutionMap, ConflictResolution } from '@qlucent/fishi-core';
```

- [ ] **Step 2: Replace the .fishi/ hard exit guard**

Replace lines 32-41 in init.ts:

```typescript
  // Re-init guard: ask instead of hard exit
  if (fs.existsSync(path.join(targetDir, '.fishi'))) {
    if (options.interactive !== false) {
      const { reinit } = await inquirer.prompt([{
        type: 'confirm',
        name: 'reinit',
        message: 'FISHI is already initialized in this directory. Re-initialize?',
        default: false,
      }]);
      if (!reinit) {
        console.log(chalk.gray('  Run `fishi status` to see project state.'));
        return;
      }
    } else {
      console.log(chalk.yellow('  ⚠ FISHI already initialized. Run `fishi status` to see project state.'));
      return;
    }
  }
```

- [ ] **Step 3: Add conflict detection + backup + interactive resolution flow**

Add after brownfield analysis (after the `printBrownfieldSummary` call), before the scaffold call:

```typescript
  // ── Conflict Detection ──────────────────────────────────────────
  const conflictResult = detectConflicts(targetDir);
  let resolutions: FileResolutionMap | undefined;

  if (conflictResult.hasConflicts) {
    console.log('');
    console.log(chalk.yellow(`  ⚠ Found ${conflictResult.totalConflicts} existing file(s) that FISHI wants to create.`));
    console.log('');

    // Always backup first
    const backupSpinner = ora('Backing up existing files...').start();
    const allConflictPaths = conflictResult.categories.flatMap(c => c.conflicts.map(f => f.path));
    const backupPath = await createBackup(targetDir, allConflictPaths);
    backupSpinner.succeed(`Backup created at ${path.relative(targetDir, backupPath)}`);
    console.log('');

    // Interactive resolution
    resolutions = { categories: {}, files: {} };

    if (options.interactive !== false) {
      for (const cat of conflictResult.categories) {
        if (cat.conflicts.length === 0) continue;

        const conflictSummary = cat.conflicts.length === 1
          ? `Found existing ${cat.label} (${cat.conflicts[0].size} bytes)`
          : `Found ${cat.conflicts.length} existing ${cat.label} files`;

        // Agent/skill/command files can't be safely merged (YAML frontmatter + markdown)
        const noMergeCategories = ['agents', 'skills', 'commands'];
        const canMerge = !noMergeCategories.includes(cat.name);

        const choices = canMerge
          ? [
              { name: 'Merge — add FISHI content alongside existing', value: 'merge' },
              { name: 'Skip — leave existing files untouched', value: 'skip' },
              { name: 'Replace — overwrite with FISHI version (backup saved)', value: 'replace' },
            ]
          : [
              { name: 'Skip — leave existing files untouched', value: 'skip' },
              { name: 'Replace — overwrite with FISHI version (backup saved)', value: 'replace' },
            ];

        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: `${conflictSummary}. How should FISHI handle this?`,
          choices,
          default: canMerge ? 'merge' : 'skip',
        }]);

        resolutions.categories[cat.name] = action as ConflictResolution;
      }
    } else {
      // Non-interactive defaults
      const defaultAction = options.mergeAll ? 'merge' : options.replaceAll ? 'replace' : 'skip';
      for (const cat of conflictResult.categories) {
        if (cat.conflicts.length > 0) {
          resolutions.categories[cat.name] = defaultAction as ConflictResolution;
        }
      }
    }
  }
```

- [ ] **Step 4: Pass resolutions and docsReadmeExists to scaffold call**

Update the scaffold call (around line 182):

```typescript
  const result = await scaffold(targetDir, {
    ...initOptions,
    projectName,
    projectType: detection.type,
    brownfieldAnalysis: brownfieldData,
    resolutions,
    docsReadmeExists: conflictResult?.docsReadmeExists,
  });
```

- [ ] **Step 5: Add --merge-all and --replace-all CLI flags**

Edit `packages/cli/src/index.ts` — add two options to the `init` command (after line 33):

```typescript
  .option('--merge-all', 'Merge all conflicting files (non-interactive brownfield)')
  .option('--replace-all', 'Replace all conflicting files (non-interactive brownfield)')
```

Edit `packages/cli/src/commands/init.ts` — update the `InitActionOptions` interface (lines 12-17):

```typescript
interface InitActionOptions {
  language?: string;
  framework?: string;
  costMode: string;
  interactive?: boolean;
  mergeAll?: boolean;
  replaceAll?: boolean;
}
```

- [ ] **Step 6: Write CLI conflict flow tests**

```typescript
// packages/cli/src/__tests__/conflict-flow.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectConflicts } from '@qlucent/fishi-core';
import { createBackup } from '@qlucent/fishi-core';

describe('Brownfield conflict flow (unit)', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-cli-conflict-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects conflicts and creates backup in correct location', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# existing');
    writeFileSync(join(dir, '.claude', 'settings.json'), '{}');

    const conflicts = detectConflicts(dir);
    expect(conflicts.hasConflicts).toBe(true);
    expect(conflicts.totalConflicts).toBe(2);

    const allPaths = conflicts.categories.flatMap(c => c.conflicts.map(f => f.path));
    const backupPath = await createBackup(dir, allPaths);

    expect(existsSync(join(backupPath, '.claude', 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(backupPath, '.claude', 'settings.json'))).toBe(true);
    expect(existsSync(join(backupPath, 'manifest.json'))).toBe(true);
  });

  it('full brownfield init with merge-all preserves existing + adds FISHI', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# My Project\n\nMy instructions.');
    writeFileSync(join(dir, '.claude', 'settings.json'), JSON.stringify({
      hooks: { PostToolUse: [{ matcher: 'Write', command: 'prettier' }] },
      permissions: { allow: ['Read'], deny: [] },
    }));
    writeFileSync(join(dir, '.mcp.json'), JSON.stringify({
      mcpServers: { 'my-server': { type: 'stdio', command: 'my-cmd' } },
    }));

    // Import scaffold
    const { generateScaffold } = await import('@qlucent/fishi-core');

    // Detect + backup + scaffold with merge
    const conflicts = detectConflicts(dir);
    const allPaths = conflicts.categories.flatMap(c => c.conflicts.map(f => f.path));
    await createBackup(dir, allPaths);

    const resolutions = { categories: {} as Record<string, string>, files: {} };
    for (const cat of conflicts.categories) {
      if (cat.conflicts.length > 0) resolutions.categories[cat.name] = 'merge';
    }

    await generateScaffold(dir, {
      projectName: 'test-brownfield',
      projectType: 'brownfield',
      interactive: false,
      costMode: 'balanced',
      description: 'Test brownfield project',
      resolutions: resolutions as any,
    });

    // CLAUDE.md: existing content preserved + FISHI section added
    const claudeMd = readFileSync(join(dir, '.claude', 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('# My Project');
    expect(claudeMd).toContain('My instructions.');
    expect(claudeMd).toContain('### FISHI Framework');

    // settings.json: existing hook preserved + FISHI hooks added
    const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PostToolUse.some((h: any) => h.command === 'prettier')).toBe(true);
    expect(settings.hooks.SessionStart).toBeDefined();

    // .mcp.json: existing server preserved + FISHI servers added
    const mcp = JSON.parse(readFileSync(join(dir, '.mcp.json'), 'utf-8'));
    expect(mcp.mcpServers['my-server']).toBeDefined();
    expect(mcp.mcpServers['github']).toBeDefined();
  });
});
```

- [ ] **Step 7: Run all tests**

Run: `cd /d/FISHI && npx vitest run`
Expected: All existing 360 tests + new tests PASS

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/commands/init.ts packages/cli/src/__tests__/conflict-flow.test.ts
git commit -m "feat: interactive conflict resolution in brownfield init"
```

---

### Task 8: Final integration test + full test run

**Files:**
- All test files

- [ ] **Step 1: Run full test suite**

Run: `cd /d/FISHI && npx vitest run`
Expected: All tests PASS (360 existing + ~30 new = ~390)

- [ ] **Step 2: Build both packages**

Run: `cd /d/FISHI/packages/core && npx tsup src/index.ts --format esm --dts && cd /d/FISHI/packages/cli && npx tsup src/index.ts --format esm`
Expected: Both build successfully

- [ ] **Step 3: Manual dry-run test against FrAIday**

Run (from D:/FrAIday): `cd /d/FrAIday && node /d/FISHI/packages/cli/dist/index.js init --no-interactive`
Expected: Detects conflicts, creates backup, skips all conflicting files (non-interactive default), creates only `.fishi/` namespace files

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test: full integration test for safe brownfield init"
```
