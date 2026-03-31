import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { getFileLockHookScript } from '../templates/hooks/file-lock-hook';

describe('File Lock Scope (hook script)', () => {
  let tempDir: string;
  let scriptPath: string;

  function run(...args: string[]): { stdout: string; exitCode: number } {
    try {
      const stdout = execFileSync('node', [scriptPath, ...args], {
        cwd: tempDir,
        env: { ...process.env, FISHI_PROJECT_ROOT: tempDir },
        encoding: 'utf-8',
        timeout: 10000,
      });
      return { stdout, exitCode: 0 };
    } catch (err: any) {
      return { stdout: err.stdout || '', exitCode: err.status ?? 1 };
    }
  }

  function runJSON(...args: string[]): { data: any; exitCode: number } {
    const { stdout, exitCode } = run(...args);
    try {
      const data = JSON.parse(stdout.trim());
      return { data, exitCode };
    } catch {
      throw new Error(`Failed to parse JSON from: ${stdout} (exit ${exitCode})`);
    }
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-lock-scope-'));
    mkdirSync(join(tempDir, '.fishi', 'state'), { recursive: true });
    scriptPath = join(tempDir, 'file-lock-hook.mjs');
    writeFileSync(scriptPath, getFileLockHookScript(), 'utf-8');
  });

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  // --- lock-scope command ---

  describe('lock-scope command', () => {
    it('accepts directory scopes ending with /', () => {
      const { data, exitCode } = runJSON(
        'lock-scope', '--agent', 'backend', '--task', 'auth', '--scope', 'src/api/auth/'
      );
      expect(exitCode).toBe(0);
      expect(data.success).toBe(true);
      expect(data.locked).toContain('src/api/auth/');
    });

    it('detects overlapping directory scopes', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      const { data, exitCode } = runJSON(
        'lock-scope', '--agent', 'agent-2', '--task', 'task-2', '--scope', 'src/api/auth/'
      );
      expect(data.status).toBe('conflict');
      expect(data.overlaps.length).toBeGreaterThan(0);
    });

    it('sibling directories do NOT overlap', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/auth/');
      const { data, exitCode } = runJSON(
        'lock-scope', '--agent', 'agent-2', '--task', 'task-2', '--scope', 'src/api/users/'
      );
      expect(exitCode).toBe(0);
      expect(data.success).toBe(true);
    });

    it('detects exact file inside locked directory', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      const { data } = runJSON(
        'lock-scope', '--agent', 'agent-2', '--task', 'task-2', '--scope', 'src/api/handler.ts'
      );
      expect(data.status).toBe('conflict');
    });

    it('detects nested directory scopes (child inside parent)', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/');
      const { data } = runJSON(
        'lock-scope', '--agent', 'agent-2', '--task', 'task-2', '--scope', 'src/api/'
      );
      expect(data.status).toBe('conflict');
    });

    it('allows scope amendment for same task', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/auth/');
      const { data, exitCode } = runJSON(
        'lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/auth/,src/utils/helpers.ts'
      );
      expect(exitCode).toBe(0);
      expect(data.success).toBe(true);
      expect(data.locked).toContain('src/utils/helpers.ts');
    });

    it('scope amendment detects overlap with OTHER tasks', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      runJSON('lock-scope', '--agent', 'agent-2', '--task', 'task-2', '--scope', 'src/utils/');
      const { data } = runJSON(
        'lock-scope', '--agent', 'agent-2', '--task', 'task-2', '--scope', 'src/utils/,src/api/handler.ts'
      );
      expect(data.status).toBe('conflict');
    });
  });

  // --- check command with exempt paths ---

  describe('check command — exempt paths', () => {
    beforeEach(() => {
      // Lock something by agent-1
      runJSON('lock', '--files', 'src/app.ts', '--agent', 'agent-1', '--task', 'task-1', '--coordinator', 'lead');
    });

    it('.fishi/ paths are exempt', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', '.fishi/config.yaml', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('docs/ paths are exempt', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', 'docs/readme.md', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('.claude/ paths are exempt', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', '.claude/settings.json', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('root-level .md files are exempt', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', 'README.md', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('.mcp.json is exempt', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', '.mcp.json', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('package.json is exempt', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', 'package.json', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('non-exempt path blocked by different agent', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', 'src/app.ts', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(2);
      expect(data.status).toBe('blocked');
    });

    it('owning agent is allowed', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', 'src/app.ts', '--agent', 'agent-1'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });

    it('unlocked file is allowed', () => {
      const { data, exitCode } = runJSON(
        'check', '--file', 'src/other.ts', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });
  });

  // --- check command with directory scope locks ---

  describe('check command — directory scope enforcement', () => {
    it('file inside directory scope is blocked for other agent', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      const { data, exitCode } = runJSON(
        'check', '--file', 'src/api/handler.ts', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(2);
      expect(data.status).toBe('blocked');
    });

    it('file outside directory scope is allowed', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      const { data, exitCode } = runJSON(
        'check', '--file', 'src/utils/helper.ts', '--agent', 'agent-2'
      );
      expect(exitCode).toBe(0);
      expect(data.status).toBe('allowed');
    });
  });

  // --- release --task ---

  describe('release --task', () => {
    it('releases all locks for a given task ID with --agent', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/,src/utils/');
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-2', '--scope', 'src/models/');
      const { data, exitCode } = runJSON('release', '--agent', 'agent-1', '--task', 'task-1');
      expect(exitCode).toBe(0);
      expect(data.released).toContain('src/api/');
      expect(data.released).toContain('src/utils/');
      expect(data.released).not.toContain('src/models/');
      expect(data.remaining).toBe(1);
    });

    it('release --task standalone works without --agent', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      runJSON('lock-scope', '--agent', 'agent-2', '--task', 'task-1', '--scope', 'src/other/');
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-2', '--scope', 'src/models/');
      const { data, exitCode } = runJSON('release', '--task', 'task-1');
      expect(exitCode).toBe(0);
      expect(data.released).toContain('src/api/');
      expect(data.released).toContain('src/other/');
      expect(data.released).not.toContain('src/models/');
      expect(data.remaining).toBe(1);
    });
  });

  // --- lock command overlap detection ---

  describe('lock command — overlap with directory scopes', () => {
    it('blocks when adding file that overlaps another tasks scope', () => {
      runJSON('lock-scope', '--agent', 'agent-1', '--task', 'task-1', '--scope', 'src/api/');
      const { data } = runJSON(
        'lock', '--files', 'src/api/handler.ts', '--agent', 'agent-2', '--task', 'task-2', '--coordinator', 'lead'
      );
      expect(data.success).toBe(false);
      expect(data.conflicts.length).toBeGreaterThan(0);
    });
  });
});
