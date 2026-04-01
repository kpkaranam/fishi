import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { getSprintCompletionGuardHook } from '../templates/hooks/sprint-completion-guard';

describe('sprint-completion-guard (state-based)', () => {
  let tempDir: string;
  let scriptPath: string;

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

    // Set up project state — development phase
    mkdirSync(join(tempDir, '.fishi', 'state'), { recursive: true });
    writeFileSync(join(tempDir, '.fishi', 'state', 'project.yaml'),
      'phase: development\nsprint: 1\n', 'utf-8');

    // Sprint 1 file with tasks
    const sprintsDir = join(tempDir, '.fishi', 'taskboard', 'sprints');
    mkdirSync(sprintsDir, { recursive: true });
    writeFileSync(join(sprintsDir, 'sprint-1.md'),
      '# Sprint 1\n- [ ] TASK-001: Setup [Agent: fullstack-agent]\n- [ ] TASK-002: Engine [Agent: backend-agent]\n',
      'utf-8');

    // Board with tasks in Done (sprint 1 is complete)
    mkdirSync(join(tempDir, '.fishi', 'taskboard'), { recursive: true });
    writeFileSync(join(tempDir, '.fishi', 'taskboard', 'board.md'),
      '## Backlog\n\n## Ready\n\n## In Progress\n\n## Review\n\n## Done\n- [x] TASK-001: Setup [Agent: fullstack-agent]\n- [x] TASK-002: Engine [Agent: backend-agent]\n',
      'utf-8');

    // QA results dir
    mkdirSync(join(tempDir, '.fishi', 'state', 'qa-results'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('blocks code-agent dispatch when sprint tasks Done but no QA', () => {
    // Sprint 1 tasks all in Done, but no QA approval file
    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { subagent_type: 'backend-agent', prompt: 'implement feature X', isolation: 'worktree' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('QA review');
    expect(result.stderr).toContain('Sprint 1');
  });

  it('allows code-agent dispatch after QA APPROVED', () => {
    writeFileSync(
      join(tempDir, '.fishi', 'state', 'qa-results', 'sprint-1-full-review.json'),
      JSON.stringify({ result: 'APPROVED' }),
      'utf-8',
    );

    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { subagent_type: 'backend-agent', prompt: 'implement feature X', isolation: 'worktree' },
    });

    expect(result.exitCode).toBe(0);
  });

  it('blocks when QA result is ISSUES_FOUND', () => {
    writeFileSync(
      join(tempDir, '.fishi', 'state', 'qa-results', 'sprint-1-full-review.json'),
      JSON.stringify({ result: 'ISSUES_FOUND' }),
      'utf-8',
    );

    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { subagent_type: 'frontend-agent', prompt: 'build login page', isolation: 'worktree' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('ISSUES_FOUND');
  });

  it('allows non-code agents without QA check', () => {
    // No QA file, but research-agent is not a code agent
    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { subagent_type: 'research-agent', prompt: 'research APIs' },
    });

    expect(result.exitCode).toBe(0);
  });

  it('allows Bash tool without checks', () => {
    const result = runGuard({
      tool_name: 'Bash',
      tool_input: { command: 'echo hello' },
    });

    expect(result.exitCode).toBe(0);
  });

  it('allows when sprint tasks NOT all Done yet (sprint still in progress)', () => {
    // Board has tasks NOT in Done — sprint still running, don't block
    writeFileSync(join(tempDir, '.fishi', 'taskboard', 'board.md'),
      '## In Progress\n- [ ] TASK-001: Setup\n\n## Done\n- [x] TASK-002: Engine\n',
      'utf-8');

    const result = runGuard({
      tool_name: 'Agent',
      tool_input: { subagent_type: 'backend-agent', prompt: 'continue work', isolation: 'worktree' },
    });

    expect(result.exitCode).toBe(0);
  });
});
