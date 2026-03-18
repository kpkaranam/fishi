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
