import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { getTaskboardUpdateHook } from '../templates/hooks/taskboard-update';

describe('sprint-meta commands (taskboard-update)', () => {
  let tempDir: string;
  let scriptPath: string;

  function run(...args: string[]): { stdout: string; exitCode: number } {
    try {
      const stdout = execFileSync('node', [scriptPath, ...args], {
        cwd: tempDir,
        env: { ...process.env, FISHI_PROJECT_ROOT: tempDir },
        encoding: 'utf-8',
        timeout: 30000,
      });
      return { stdout, exitCode: 0 };
    } catch (err: any) {
      return { stdout: err.stdout || '', exitCode: err.status ?? 1 };
    }
  }

  function runJSON(...args: string[]): any {
    const { stdout } = run(...args);
    try {
      return JSON.parse(stdout.trim());
    } catch {
      throw new Error(`Failed to parse JSON from: ${stdout}`);
    }
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-sprint-meta-'));
    mkdirSync(join(tempDir, '.fishi', 'taskboard'), { recursive: true });
    scriptPath = join(tempDir, 'taskboard-update.mjs');
    writeFileSync(scriptPath, getTaskboardUpdateHook(), 'utf-8');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reads sprint-meta.yaml correctly', () => {
    const yaml = [
      'sprint: 3',
      'qa_full_retries: 1',
      'tasks:',
      '  - id: T-001',
      '    agent: code-gen',
      '    worktree: feat-auth',
      '    scope: "src/auth"',
      '    depends_on: []',
      '    merge_status: merged',
      '    qa_quick: pass',
      '    qa_retries: 0',
    ].join('\n');
    writeFileSync(join(tempDir, '.fishi', 'taskboard', 'sprint-meta.yaml'), yaml, 'utf-8');

    const result = runJSON('read-meta');
    expect(result.sprint).toBe(3);
    expect(result.qa_full_retries).toBe(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe('T-001');
    expect(result.tasks[0].agent).toBe('code-gen');
    expect(result.tasks[0].merge_status).toBe('merged');
    expect(result.tasks[0].qa_quick).toBe('pass');
  });

  it('returns default when file missing', () => {
    const result = runJSON('read-meta');
    expect(result).toEqual({ sprint: 0, qa_full_retries: 0, tasks: [] });
  });

  it('adds a task to sprint-meta', () => {
    const addResult = runJSON(
      'add-task',
      '--id', 'T-010',
      '--agent', 'code-gen',
      '--worktree', 'feat-login',
      '--scope', 'src/login',
      '--depends-on', 'T-001,T-002',
    );
    expect(addResult).toEqual({ status: 'added' });

    const meta = runJSON('read-meta');
    expect(meta.tasks).toHaveLength(1);
    expect(meta.tasks[0].id).toBe('T-010');
    expect(meta.tasks[0].agent).toBe('code-gen');
    expect(meta.tasks[0].worktree).toBe('feat-login');
    expect(meta.tasks[0].scope).toBe('src/login');
    expect(meta.tasks[0].depends_on).toEqual(['T-001', 'T-002']);
    expect(meta.tasks[0].merge_status).toBe('pending');
    expect(meta.tasks[0].qa_quick).toBeNull();
    expect(meta.tasks[0].qa_retries).toBe(0);
  });

  it('updates task merge status', () => {
    // First add a task
    run('add-task', '--id', 'T-020', '--agent', 'testing');

    // Update its merge_status
    const updateResult = runJSON(
      'update-task',
      '--id', 'T-020',
      '--field', 'merge_status',
      '--value', 'merged',
    );
    expect(updateResult).toEqual({ status: 'updated' });

    // Verify
    const meta = runJSON('read-meta');
    expect(meta.tasks[0].merge_status).toBe('merged');
  });
});
