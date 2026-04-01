import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { getSprintCompletionGuardHook } from '../templates/hooks/sprint-completion-guard';

describe('sprint-completion-guard', () => {
  let tempDir: string;
  let scriptPath: string;

  /**
   * Run the sprint-completion-guard script with JSON piped to stdin.
   * Returns exitCode and stderr (where the guard logs issues).
   */
  function runGuard(stdinJSON: object): { exitCode: number; stderr: string; stdout: string } {
    const input = JSON.stringify(stdinJSON);
    try {
      const stdout = execFileSync('node', ['-e', `
        const { execFileSync } = require('child_process');
        try {
          const out = execFileSync('node', ['${scriptPath.replace(/\\/g, '/')}'], {
            cwd: '${tempDir.replace(/\\/g, '/')}',
            env: { ...process.env, FISHI_PROJECT_ROOT: '${tempDir.replace(/\\/g, '/')}' },
            input: ${JSON.stringify(input)},
            encoding: 'utf-8',
            timeout: 30000,
          });
          process.stdout.write(JSON.stringify({ exitCode: 0, stdout: out, stderr: '' }));
        } catch (err) {
          process.stdout.write(JSON.stringify({ exitCode: err.status || 1, stdout: err.stdout || '', stderr: err.stderr || '' }));
        }
      `], {
        encoding: 'utf-8',
        timeout: 30000,
      });
      return JSON.parse(stdout.trim());
    } catch (err: any) {
      return { exitCode: 1, stderr: err.stderr || '', stdout: err.stdout || '' };
    }
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-sprint-guard-'));
    scriptPath = join(tempDir, 'sprint-completion-guard.mjs');
    writeFileSync(scriptPath, getSprintCompletionGuardHook(), 'utf-8');

    // Set up minimal sprint infrastructure so checks 1-4 pass
    const sprintsDir = join(tempDir, '.fishi', 'taskboard', 'sprints');
    mkdirSync(sprintsDir, { recursive: true });

    // Sprint 1 file marked as completed with all tasks checked
    writeFileSync(join(sprintsDir, 'sprint-1.md'), [
      '# Sprint 1',
      'Status: COMPLETED',
      '',
      '- [x] Task A',
      '- [x] Task B',
    ].join('\n'), 'utf-8');

    // Board with Done column
    const boardPath = join(tempDir, '.fishi', 'taskboard', 'board.md');
    writeFileSync(boardPath, [
      '## Done',
      '- [x] Task A',
      '- [x] Task B',
    ].join('\n'), 'utf-8');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('blocks sprint advance when QA approval file is missing', () => {
    // No qa-results file exists — Check 5 should block
    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { prompt: 'Start Sprint 2 implementation' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('QA review not found');
    expect(result.stderr).toContain('Sprint 1');
  });

  it('allows sprint advance with QA APPROVED result', () => {
    // Create the QA approval file
    const qaDir = join(tempDir, '.fishi', 'state', 'qa-results');
    mkdirSync(qaDir, { recursive: true });
    writeFileSync(
      join(qaDir, 'sprint-1-full-review.json'),
      JSON.stringify({ result: 'APPROVED', timestamp: new Date().toISOString() }),
      'utf-8',
    );

    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { prompt: 'Start Sprint 2 implementation' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Sprint 1 tracking verified');
  });

  it('blocks sprint advance when QA result is not APPROVED', () => {
    const qaDir = join(tempDir, '.fishi', 'state', 'qa-results');
    mkdirSync(qaDir, { recursive: true });
    writeFileSync(
      join(qaDir, 'sprint-1-full-review.json'),
      JSON.stringify({ result: 'FAILED', timestamp: new Date().toISOString() }),
      'utf-8',
    );

    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { prompt: 'Start Sprint 2 implementation' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('QA review not approved');
    expect(result.stderr).toContain('result: FAILED');
  });

  it('blocks sprint advance when QA result file is corrupted', () => {
    const qaDir = join(tempDir, '.fishi', 'state', 'qa-results');
    mkdirSync(qaDir, { recursive: true });
    writeFileSync(
      join(qaDir, 'sprint-1-full-review.json'),
      'not valid json{{{',
      'utf-8',
    );

    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { prompt: 'Start Sprint 2 implementation' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('QA result file is corrupted');
  });

  it('allows Sprint 1 without any checks (no predecessor)', () => {
    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { prompt: 'Start Sprint 1 work' },
    });

    expect(result.exitCode).toBe(0);
  });

  it('allows non-Agent tool calls without checks', () => {
    const result = runGuard({
      tool_name: 'Bash',
      tool_input: { command: 'echo hello' },
    });

    expect(result.exitCode).toBe(0);
  });
});
