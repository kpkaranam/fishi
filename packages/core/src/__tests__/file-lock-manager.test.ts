import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  readFileLocks,
  checkLockConflicts,
  acquireLocks,
  releaseLocks,
  getAgentLocks,
  getLockSummary,
} from '../generators/file-lock-manager';

describe('File Lock Manager', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-locks-'));
    mkdirSync(join(tempDir, '.fishi', 'state'), { recursive: true });
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('readFileLocks', () => {
    it('returns empty array when no locks file', () => {
      const dir = createTempDir();
      expect(readFileLocks(dir)).toEqual([]);
    });
  });

  describe('acquireLocks', () => {
    it('acquires locks on unlocked files', () => {
      const dir = createTempDir();
      const result = acquireLocks(dir, ['src/auth.ts', 'src/login.tsx'], 'backend-agent', 'auth-feature', 'dev-lead');
      expect(result.success).toBe(true);
      expect(result.locked).toEqual(['src/auth.ts', 'src/login.tsx']);
      expect(result.conflicts).toHaveLength(0);
    });

    it('persists locks to disk', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/app.ts'], 'backend-agent', 'task-1', 'dev-lead');
      const locks = readFileLocks(dir);
      expect(locks).toHaveLength(1);
      expect(locks[0].file).toBe('src/app.ts');
      expect(locks[0].agent).toBe('backend-agent');
      expect(locks[0].task).toBe('task-1');
      expect(locks[0].coordinator).toBe('dev-lead');
      expect(locks[0].lockedAt).toBeTruthy();
    });

    it('fails when file is locked by another agent', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/shared.ts'], 'backend-agent', 'task-1', 'dev-lead');
      const result = acquireLocks(dir, ['src/shared.ts'], 'frontend-agent', 'task-2', 'dev-lead');
      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].file).toBe('src/shared.ts');
      expect(result.conflicts[0].lockedBy).toBe('backend-agent');
      expect(result.conflicts[0].requestingAgent).toBe('frontend-agent');
    });

    it('allows same agent to re-lock same file', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/app.ts'], 'backend-agent', 'task-1', 'dev-lead');
      const result = acquireLocks(dir, ['src/app.ts'], 'backend-agent', 'task-1', 'dev-lead');
      expect(result.success).toBe(true);
      // Should not duplicate the lock
      const locks = readFileLocks(dir);
      expect(locks.filter(l => l.file === 'src/app.ts')).toHaveLength(1);
    });

    it('detects partial conflicts (some files locked, some free)', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts'], 'agent-1', 'task-1', 'dev-lead');
      const result = acquireLocks(dir, ['src/a.ts', 'src/b.ts'], 'agent-2', 'task-2', 'dev-lead');
      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].file).toBe('src/a.ts');
    });

    it('handles multiple agents locking different files', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/auth.ts'], 'backend-agent', 'auth', 'dev-lead');
      const result = acquireLocks(dir, ['src/ui.tsx'], 'frontend-agent', 'ui', 'dev-lead');
      expect(result.success).toBe(true);
      const locks = readFileLocks(dir);
      expect(locks).toHaveLength(2);
    });
  });

  describe('checkLockConflicts', () => {
    it('returns empty for no conflicts', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts'], 'agent-1', 'task-1', 'dev-lead');
      const conflicts = checkLockConflicts(dir, ['src/b.ts'], 'agent-2', 'task-2');
      expect(conflicts).toHaveLength(0);
    });

    it('returns conflicts when files overlap', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/shared.ts'], 'agent-1', 'task-1', 'dev-lead');
      const conflicts = checkLockConflicts(dir, ['src/shared.ts'], 'agent-2', 'task-2');
      expect(conflicts).toHaveLength(1);
    });
  });

  describe('releaseLocks', () => {
    it('releases all locks for an agent', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts', 'src/b.ts'], 'backend-agent', 'task-1', 'dev-lead');
      const released = releaseLocks(dir, 'backend-agent');
      expect(released).toEqual(['src/a.ts', 'src/b.ts']);
      expect(readFileLocks(dir)).toHaveLength(0);
    });

    it('releases only locks for specific task', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts'], 'backend-agent', 'task-1', 'dev-lead');
      acquireLocks(dir, ['src/b.ts'], 'backend-agent', 'task-2', 'dev-lead');
      const released = releaseLocks(dir, 'backend-agent', 'task-1');
      expect(released).toEqual(['src/a.ts']);
      expect(readFileLocks(dir)).toHaveLength(1);
    });

    it('does not affect other agents locks', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts'], 'agent-1', 'task-1', 'dev-lead');
      acquireLocks(dir, ['src/b.ts'], 'agent-2', 'task-2', 'dev-lead');
      releaseLocks(dir, 'agent-1');
      const locks = readFileLocks(dir);
      expect(locks).toHaveLength(1);
      expect(locks[0].agent).toBe('agent-2');
    });
  });

  describe('getAgentLocks', () => {
    it('returns locks for specific agent', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts', 'src/b.ts'], 'backend-agent', 'task-1', 'dev-lead');
      acquireLocks(dir, ['src/c.ts'], 'frontend-agent', 'task-2', 'dev-lead');
      const locks = getAgentLocks(dir, 'backend-agent');
      expect(locks).toHaveLength(2);
    });
  });

  describe('getLockSummary', () => {
    it('returns correct summary', () => {
      const dir = createTempDir();
      acquireLocks(dir, ['src/a.ts', 'src/b.ts'], 'backend-agent', 'task-1', 'dev-lead');
      acquireLocks(dir, ['src/c.ts'], 'frontend-agent', 'task-2', 'dev-lead');
      const summary = getLockSummary(dir);
      expect(summary.totalLocked).toBe(3);
      expect(summary.byAgent['backend-agent']).toBe(2);
      expect(summary.byAgent['frontend-agent']).toBe(1);
    });

    it('returns zero for empty project', () => {
      const dir = createTempDir();
      const summary = getLockSummary(dir);
      expect(summary.totalLocked).toBe(0);
    });
  });
});
