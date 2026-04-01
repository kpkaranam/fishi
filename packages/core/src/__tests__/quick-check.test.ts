import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { getWorktreeManagerScript } from '../templates/hooks/worktree-manager';

describe('quick-check command', () => {
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
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-quick-check-'));
    mkdirSync(join(tempDir, '.fishi', 'state'), { recursive: true });
    scriptPath = join(tempDir, 'worktree-manager.mjs');
    writeFileSync(scriptPath, getWorktreeManagerScript(), 'utf-8');

    // Initialize a git repo so git commands don't fail
    execFileSync('git', ['init'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir, stdio: 'pipe' });
    // Create an initial commit so HEAD exists
    writeFileSync(join(tempDir, '.gitkeep'), '', 'utf-8');
    execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'init'], { cwd: tempDir, stdio: 'pipe' });
  });

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('fails without --task flag', () => {
    const { exitCode } = run('quick-check');
    expect(exitCode).not.toBe(0);
  });

  it('skips test check when no test runner detected', () => {
    const result = runJSON('quick-check', '--task', 'test-task', '--diff-content', 'const x = 1;');
    expect(result.result).toBe('passed');
    expect(result.checks.tests.status).toBe('skipped');
  });

  it('skips lint check when no linter config found', () => {
    const result = runJSON('quick-check', '--task', 'lint-task', '--diff-content', 'const x = 1;');
    expect(result.checks.lint.status).toBe('skipped');
  });

  it('skips typecheck when no tsconfig.json found', () => {
    const result = runJSON('quick-check', '--task', 'tc-task', '--diff-content', 'const x = 1;');
    expect(result.checks.typecheck.status).toBe('skipped');
  });

  it('detects hardcoded secrets in diff', () => {
    const result = runJSON(
      'quick-check', '--task', 'secret-task',
      '--diff-content', 'api_key = "sk-1234567890abcdefghijklmnopqr"'
    );
    expect(result.checks.secrets.status).toBe('failed');
    expect(result.result).toBe('failed');
    expect(result.checks.secrets.matches.length).toBeGreaterThan(0);
  });

  it('detects GitHub tokens in diff', () => {
    const result = runJSON(
      'quick-check', '--task', 'ghp-task',
      '--diff-content', 'token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn"'
    );
    expect(result.checks.secrets.status).toBe('failed');
    expect(result.result).toBe('failed');
  });

  it('detects private keys in diff', () => {
    const result = runJSON(
      'quick-check', '--task', 'pk-task',
      '--diff-content', '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...'
    );
    expect(result.checks.secrets.status).toBe('failed');
    expect(result.result).toBe('failed');
  });

  it('passes when diff has no secrets', () => {
    const result = runJSON(
      'quick-check', '--task', 'clean-task',
      '--diff-content', 'const x = 42;'
    );
    expect(result.checks.secrets.status).toBe('passed');
    expect(result.result).toBe('passed');
  });

  it('writes results to qa-results directory', () => {
    runJSON('quick-check', '--task', 'write-test', '--diff-content', 'const x = 1;');
    const resultPath = join(tempDir, '.fishi', 'state', 'qa-results', 'write-test-quick.json');
    expect(existsSync(resultPath)).toBe(true);
    const written = JSON.parse(readFileSync(resultPath, 'utf-8'));
    expect(written.task_id).toBe('write-test');
    expect(written.timestamp).toBeTruthy();
    expect(written.result).toBe('passed');
  });

  it('has correct result structure', () => {
    const result = runJSON('quick-check', '--task', 'structure-task', '--diff-content', 'ok');
    expect(result).toHaveProperty('task_id', 'structure-task');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('checks.tests');
    expect(result).toHaveProperty('checks.lint');
    expect(result).toHaveProperty('checks.typecheck');
    expect(result).toHaveProperty('checks.secrets');
  });

  it('overall result is failed if any check fails', () => {
    // Secret scan will fail here
    const result = runJSON(
      'quick-check', '--task', 'fail-task',
      '--diff-content', 'password = "ABCDEFGHIJKLMNOPabcdefghijklmnop"'
    );
    expect(result.result).toBe('failed');
  });

  it('detects npm test script in package.json', () => {
    // Write a package.json with a test script that exits 0
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      scripts: { test: 'echo "tests passed"' },
    }), 'utf-8');
    const result = runJSON('quick-check', '--task', 'npm-test', '--diff-content', 'clean code');
    // Test should have been detected (not skipped)
    expect(result.checks.tests.status).not.toBe('skipped');
  });
});
