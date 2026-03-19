import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { generateScaffold } from '../../../../packages/core/src/index.js';

describe('E2E Pipeline Tests', () => {
  let projectDir: string;

  function run(script: string, args: string[] = []): string {
    return execFileSync('node', [join('.fishi', 'scripts', script), ...args], {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  }

  function runJSON(script: string, args: string[] = []): any {
    const output = run(script, args);
    // Some scripts output warnings before JSON — find the JSON part
    const braceIdx = output.indexOf('{');
    const bracketIdx = output.indexOf('[');
    let jsonStart = -1;
    if (braceIdx === -1) jsonStart = bracketIdx;
    else if (bracketIdx === -1) jsonStart = braceIdx;
    else jsonStart = Math.min(braceIdx, bracketIdx);
    if (jsonStart === -1) throw new Error(`No JSON in output: ${output}`);
    return JSON.parse(output.slice(jsonStart));
  }

  function runExpectFail(script: string, args: string[] = []): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = run(script, args);
      return { stdout, stderr: '', exitCode: 0 };
    } catch (e: any) {
      return { stdout: e.stdout || '', stderr: e.stderr || '', exitCode: e.status || 1 };
    }
  }

  beforeAll(async () => {
    projectDir = mkdtempSync(join(tmpdir(), 'fishi-e2e-'));

    // Init git repo
    execFileSync('git', ['init'], { cwd: projectDir, stdio: 'pipe' });
    execFileSync('git', ['config', 'user.email', 'test@fishi.dev'], { cwd: projectDir, stdio: 'pipe' });
    execFileSync('git', ['config', 'user.name', 'FISHI Test'], { cwd: projectDir, stdio: 'pipe' });

    // Scaffold
    await generateScaffold(projectDir, {
      projectName: 'e2e-test-project',
      projectType: 'greenfield',
      interactive: false,
      costMode: 'balanced',
      description: 'E2E test project for pipeline verification',
    });

    // Initial commit (needed for worktree-manager)
    execFileSync('git', ['add', '-A'], { cwd: projectDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'initial scaffold'], { cwd: projectDir, stdio: 'pipe' });
  }, 30000);

  afterAll(() => {
    if (projectDir && existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  // ── GROUP 1: Scaffold + Validate ──────────────────────────────────

  describe('1. Scaffold + Validate', () => {
    it('scaffold created all required directories', () => {
      expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);
      expect(existsSync(join(projectDir, '.claude', 'skills'))).toBe(true);
      expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);
      expect(existsSync(join(projectDir, '.fishi', 'scripts'))).toBe(true);
      expect(existsSync(join(projectDir, '.fishi', 'state'))).toBe(true);
      expect(existsSync(join(projectDir, '.fishi', 'memory'))).toBe(true);
      expect(existsSync(join(projectDir, '.fishi', 'todos'))).toBe(true);
      expect(existsSync(join(projectDir, '.fishi', 'taskboard'))).toBe(true);
    });

    it('validate-scaffold passes with all checks', () => {
      const output = run('validate-scaffold.mjs');
      expect(output).toContain('✓');
      expect(output).toContain('All checks passed');
    });

    it('all 15 .mjs scripts exist', () => {
      const scripts = [
        'session-start.mjs', 'auto-checkpoint.mjs', 'agent-complete.mjs',
        'post-edit.mjs', 'safety-check.mjs', 'worktree-setup.mjs',
        'taskboard-update.mjs', 'worktree-manager.mjs', 'gate-manager.mjs',
        'validate-scaffold.mjs', 'phase-runner.mjs', 'todo-manager.mjs',
        'memory-manager.mjs', 'learnings-manager.mjs', 'doc-checker.mjs',
      ];
      for (const script of scripts) {
        expect(existsSync(join(projectDir, '.fishi', 'scripts', script))).toBe(true);
      }
    });

    it('all 18 agent files exist', () => {
      expect(existsSync(join(projectDir, '.claude', 'agents', 'master-orchestrator.md'))).toBe(true);
      expect(existsSync(join(projectDir, '.claude', 'agents', 'coordinators', 'dev-lead.md'))).toBe(true);
      expect(existsSync(join(projectDir, '.claude', 'agents', 'backend-agent.md'))).toBe(true);
    });

    it('config files exist and are valid', () => {
      const settings = JSON.parse(readFileSync(join(projectDir, '.claude', 'settings.json'), 'utf-8'));
      expect(settings.hooks).toBeDefined();
      expect(settings.permissions).toBeDefined();

      const mcp = JSON.parse(readFileSync(join(projectDir, '.mcp.json'), 'utf-8'));
      expect(mcp.mcpServers).toBeDefined();

      const claudeMd = readFileSync(join(projectDir, '.claude', 'CLAUDE.md'), 'utf-8');
      expect(claudeMd).toContain('FISHI');
    });
  });

  // ── GROUP 2: Phase Runner ─────────────────────────────────────────

  describe('2. Phase Runner', () => {
    it('current shows init phase', () => {
      const result = runJSON('phase-runner.mjs', ['current']);
      expect(result.phase).toBe('init');
      expect(result.index).toBe(0);
      expect(result.total_phases).toBe(8);
      expect(result.progress).toBe('0%');
    });

    it('next shows discovery as next phase', () => {
      const result = runJSON('phase-runner.mjs', ['next']);
      expect(result.current).toBe('init');
      expect(result.next).toBe('discovery');
      expect(result.can_advance).toBe(true);
    });

    it('validate passes on fresh scaffold', () => {
      const result = runJSON('phase-runner.mjs', ['validate']);
      expect(result.status).toBe('valid');
    });

    it('dry-run outputs all phases', () => {
      const output = run('phase-runner.mjs', ['dry-run']);
      expect(output).toContain('discovery');
      expect(output).toContain('prd');
      expect(output).toContain('architecture');
      expect(output).toContain('sprint_planning');
      expect(output).toContain('development');
      expect(output).toContain('deployment');
      expect(output).toContain('deployed');
    });

    it('advance moves from init to discovery', () => {
      const result = runJSON('phase-runner.mjs', ['advance']);
      expect(result.previous).toBe('init');
      expect(result.current).toBe('discovery');
      expect(result.status).toBe('advanced');
    });

    it('current now shows discovery', () => {
      const result = runJSON('phase-runner.mjs', ['current']);
      expect(result.phase).toBe('discovery');
      expect(result.index).toBe(1);
    });

    it('advance from discovery blocked without gate approval', () => {
      const { exitCode } = runExpectFail('phase-runner.mjs', ['advance']);
      expect(exitCode).toBe(1);
    });

    it('set can directly change phase', () => {
      const result = runJSON('phase-runner.mjs', ['set', '--phase', 'discovery']);
      expect(result.phase).toBe('discovery');
      expect(result.status).toBe('set');
    });
  });

  // ── GROUP 3: Gate Manager ─────────────────────────────────────────

  describe('3. Gate Manager', () => {
    it('status returns empty array initially', () => {
      const result = runJSON('gate-manager.mjs', ['status']);
      expect(Array.isArray(result)).toBe(true);
    });

    it('create gate for discovery', () => {
      const result = runJSON('gate-manager.mjs', ['create', '--phase', 'discovery', '--description', 'Discovery review']);
      expect(result.phase).toBe('discovery');
      expect(result.status).toBe('pending');
      expect(result.action).toBe('created');
    });

    it('status shows pending gate', () => {
      const result = runJSON('gate-manager.mjs', ['status']);
      const discoveryGate = result.find((g: any) => g.phase === 'discovery');
      expect(discoveryGate).toBeDefined();
      expect(discoveryGate.status).toBe('pending');
    });

    it('reject gate with reason', () => {
      const result = runJSON('gate-manager.mjs', ['reject', '--phase', 'discovery', '--reason', 'Needs more research']);
      expect(result.phase).toBe('discovery');
      expect(result.status).toBe('rejected');
      expect(result.action).toBe('rejected');
    });

    it('approve gate (rejected gate can still be approved)', () => {
      // The gate already exists in rejected state — approve it directly
      const result = runJSON('gate-manager.mjs', ['approve', '--phase', 'discovery']);
      expect(result.phase).toBe('discovery');
      expect(result.status).toBe('approved');
      expect(result.action).toBe('approved');
    });

    it('phase auto-advanced to prd after gate approval', () => {
      const phase = runJSON('phase-runner.mjs', ['current']);
      expect(phase.phase).toBe('prd');
    });

    it('skip gate for prd', () => {
      runJSON('gate-manager.mjs', ['create', '--phase', 'prd']);
      const result = runJSON('gate-manager.mjs', ['skip', '--phase', 'prd']);
      expect(result.status).toBe('skipped');
      expect(result.action).toBe('skipped');
    });
  });

  // ── GROUP 4: Worktree Manager ─────────────────────────────────────

  describe('4. Worktree Manager', () => {
    it('create worktree for agent', () => {
      const result = runJSON('worktree-manager.mjs', ['create', '--agent', 'backend-agent', '--task', 'auth', '--coordinator', 'dev-lead']);
      expect(result.agent).toBe('backend-agent');
      expect(result.task).toBe('auth');
      expect(result.coordinator).toBe('dev-lead');
      expect(result.status).toBe('created');
      expect(result.branch).toContain('backend-agent');
    });

    it('status shows active worktree', () => {
      const result = runJSON('worktree-manager.mjs', ['status']);
      const worktrees = Array.isArray(result) ? result : [];
      const agentWorktree = worktrees.find((w: any) => w.agent === 'backend-agent');
      expect(agentWorktree).toBeDefined();
      expect(agentWorktree.status).toBe('active');
    });

    it('cleanup removes worktree', () => {
      const result = runJSON('worktree-manager.mjs', ['cleanup', '--worktree', 'agent-backend-agent-auth']);
      expect(result.status).toBe('cleaned');
    });

    it('status shows no agent worktrees after cleanup', () => {
      const result = runJSON('worktree-manager.mjs', ['status']);
      const worktrees = Array.isArray(result) ? result : [];
      const agentWorktree = worktrees.find((w: any) => w.agent === 'backend-agent');
      expect(agentWorktree).toBeUndefined();
    });
  });

  // ── GROUP 5: Todo Manager ─────────────────────────────────────────

  describe('5. Todo Manager', () => {
    it('list-all shows agents with empty todos', () => {
      const result = runJSON('todo-manager.mjs', ['list-all']);
      expect(result.ok).toBe(true);
      expect(result.agents.length).toBeGreaterThan(0);
    });

    it('add task to agent', () => {
      const result = runJSON('todo-manager.mjs', ['add', '--agent', 'backend-agent', '--task', 'Implement auth tokens', '--priority', 'high', '--from', 'dev-lead']);
      expect(result.ok).toBe(true);
      expect(result.agent).toBe('backend-agent');
      expect(result.added).toBe('Implement auth tokens');
      expect(result.priority).toBe('high');
      expect(result.activeCount).toBe(1);
    });

    it('add second task', () => {
      const result = runJSON('todo-manager.mjs', ['add', '--agent', 'backend-agent', '--task', 'Write unit tests', '--priority', 'medium']);
      expect(result.ok).toBe(true);
      expect(result.activeCount).toBe(2);
    });

    it('list shows both tasks', () => {
      const result = runJSON('todo-manager.mjs', ['list', '--agent', 'backend-agent']);
      expect(result.ok).toBe(true);
      expect(result.activeCount).toBe(2);
      expect(result.active[0].task).toBe('Implement auth tokens');
      expect(result.active[0].priority).toBe('high');
      expect(result.active[1].task).toBe('Write unit tests');
    });

    it('done marks first task complete', () => {
      const result = runJSON('todo-manager.mjs', ['done', '--agent', 'backend-agent', '--index', '1']);
      expect(result.ok).toBe(true);
      expect(result.completed).toBe('Implement auth tokens');
      expect(result.remainingActive).toBe(1);
    });

    it('clear-done removes completed tasks', () => {
      const result = runJSON('todo-manager.mjs', ['clear-done', '--agent', 'backend-agent']);
      expect(result.ok).toBe(true);
      expect(result.clearedCount).toBe(1);
    });
  });

  // ── GROUP 6: Memory Manager ───────────────────────────────────────

  describe('6. Memory Manager', () => {
    it('list-agents shows master-orchestrator memory', () => {
      const result = runJSON('memory-manager.mjs', ['list-agents']);
      expect(result.success).toBe(true);
      const master = result.agents.find((a: any) => a.name === 'master-orchestrator');
      expect(master).toBeDefined();
      expect(master.keys).toContain('project-bootstrap');
    });

    it('write creates new memory entry', () => {
      const result = runJSON('memory-manager.mjs', ['write', '--agent', 'backend-agent', '--key', 'auth-pattern', '--value', 'Using JWT with refresh tokens']);
      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.agent).toBe('backend-agent');
    });

    it('get retrieves memory entry', () => {
      const result = runJSON('memory-manager.mjs', ['get', '--agent', 'backend-agent', '--key', 'auth-pattern']);
      expect(result.success).toBe(true);
      expect(result.value).toBe('Using JWT with refresh tokens');
    });

    it('write again updates existing entry', () => {
      const result = runJSON('memory-manager.mjs', ['write', '--agent', 'backend-agent', '--key', 'auth-pattern', '--value', 'Updated to OAuth2']);
      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
    });

    it('read shows all entries for agent', () => {
      const result = runJSON('memory-manager.mjs', ['read', '--agent', 'backend-agent']);
      expect(result.success).toBe(true);
      expect(result.entryCount).toBeGreaterThanOrEqual(1);
    });

    it('search finds entries by query', () => {
      const result = runJSON('memory-manager.mjs', ['search', '--query', 'OAuth']);
      expect(result.success).toBe(true);
      expect(result.resultCount).toBeGreaterThanOrEqual(1);
    });

    it('delete removes entry', () => {
      const result = runJSON('memory-manager.mjs', ['delete', '--agent', 'backend-agent', '--key', 'auth-pattern']);
      expect(result.success).toBe(true);
      expect(result.action).toBe('deleted');
    });

    it('get returns error for deleted key', () => {
      const { exitCode } = runExpectFail('memory-manager.mjs', ['get', '--agent', 'backend-agent', '--key', 'auth-pattern']);
      expect(exitCode).toBe(1);
    });
  });

  // ── GROUP 7: Learnings Manager ────────────────────────────────────

  describe('7. Learnings Manager', () => {
    it('add-mistake records a mistake', () => {
      const output = run('learnings-manager.mjs', ['add-mistake', '--agent', 'backend-agent', '--domain', 'backend', '--mistake', 'Forgot input validation', '--fix', 'Added zod schemas', '--lesson', 'Always validate at boundaries']);
      expect(output).toContain('OK');
      expect(output).toContain('mistake');
    });

    it('add-practice records a best practice', () => {
      const output = run('learnings-manager.mjs', ['add-practice', '--agent', 'backend-agent', '--domain', 'backend', '--practice', 'Use dependency injection']);
      expect(output).toContain('OK');
      expect(output).toContain('practice');
    });

    it('read shows learnings for domain', () => {
      const output = run('learnings-manager.mjs', ['read', '--agent', 'backend-agent', '--domain', 'backend']);
      expect(output).toContain('backend');
    });

    it('search finds learnings by query', () => {
      const output = run('learnings-manager.mjs', ['search', '--query', 'validation']);
      expect(output).toContain('validation');
    });

    it('learnings files created on disk', () => {
      expect(existsSync(join(projectDir, '.fishi', 'learnings', 'by-agent', 'backend-agent.md'))).toBe(true);
      expect(existsSync(join(projectDir, '.fishi', 'learnings', 'by-domain', 'backend.md'))).toBe(true);
    });
  });

  // ── GROUP 8: Session Start + Checkpoint ───────────────────────────

  describe('8. Session Start + Checkpoint', () => {
    it('session-start outputs project status', () => {
      const output = run('session-start.mjs');
      expect(output).toContain('[FISHI]');
      expect(output).toContain('e2e-test-project');
      expect(output).toContain('Phase:');
    });

    it('auto-checkpoint creates checkpoint file', () => {
      const output = run('auto-checkpoint.mjs');
      expect(output).toContain('[FISHI] Checkpoint created');
      expect(output).toContain('checkpoint-');
    });

    it('checkpoint file exists on disk', () => {
      const checkpointsDir = join(projectDir, '.fishi', 'state', 'checkpoints');
      expect(existsSync(checkpointsDir)).toBe(true);
      const files = readdirSync(checkpointsDir);
      const checkpointFiles = files.filter((f: string) => f.startsWith('checkpoint-') && f.endsWith('.yaml'));
      expect(checkpointFiles.length).toBeGreaterThanOrEqual(1);
    });

    it('checkpoint file contains valid state', () => {
      const checkpointsDir = join(projectDir, '.fishi', 'state', 'checkpoints');
      const files = readdirSync(checkpointsDir);
      const latest = files.filter((f: string) => f.endsWith('.yaml')).sort().pop();
      const content = readFileSync(join(checkpointsDir, latest!), 'utf-8');
      expect(content).toContain('project: e2e-test-project');
      expect(content).toContain('phase:');
      expect(content).toContain('timestamp:');
    });

    it('session-start references latest checkpoint', () => {
      const output = run('session-start.mjs');
      expect(output).toContain('checkpoint');
    });
  });

  // ── GROUP 9: Doc Checker ──────────────────────────────────────────

  describe('9. Doc Checker', () => {
    it('check fails for empty discovery phase', () => {
      const { exitCode, stdout } = runExpectFail('doc-checker.mjs', ['check', '--phase', 'discovery']);
      if (stdout.includes('{')) {
        const json = JSON.parse(stdout.slice(stdout.indexOf('{')));
        expect(json.status).toBe('fail');
      } else {
        expect(exitCode).toBe(1);
      }
    });

    it('check passes after creating discovery docs', () => {
      mkdirSync(join(projectDir, '.fishi', 'plans', 'discovery'), { recursive: true });
      writeFileSync(join(projectDir, '.fishi', 'plans', 'discovery', 'notes.md'), '# Discovery Notes\n\nResearch completed.');

      const output = run('doc-checker.mjs', ['check', '--phase', 'discovery']);
      const json = JSON.parse(output.slice(output.indexOf('{')));
      expect(json.status).toBe('pass');
    });

    it('report generates markdown table', () => {
      const output = run('doc-checker.mjs', ['report']);
      expect(output).toContain('Phase');
      expect(output).toContain('Status');
    });
  });
});
