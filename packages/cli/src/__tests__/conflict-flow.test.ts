import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectConflicts, createBackup, generateScaffold } from '../../../../packages/core/src/index.js';

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

    // Detect + backup + scaffold with merge
    const conflicts = detectConflicts(dir);
    const allPaths = conflicts.categories.flatMap(c => c.conflicts.map(f => f.path));
    await createBackup(dir, allPaths);

    const resolutions = { categories: {} as Record<string, string>, files: {} as Record<string, string> };
    for (const cat of conflicts.categories) {
      if (cat.conflicts.length > 0) resolutions.categories[cat.name] = 'merge';
    }

    await generateScaffold(dir, {
      projectName: 'test-brownfield',
      projectType: 'brownfield' as const,
      interactive: false,
      costMode: 'balanced' as const,
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
