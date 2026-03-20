import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateScaffold } from '../index';
import type { ScaffoldOptions } from '../generators/scaffold';

describe('generateScaffold', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-test-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const defaultOptions: ScaffoldOptions = {
    projectName: 'test-scaffold-project',
    projectType: 'greenfield',
    interactive: false,
    costMode: 'balanced',
    description: 'A test scaffold project',
  };

  it('returns a ScaffoldResult with correct counts', async () => {
    const dir = createTempDir();
    const result = await generateScaffold(dir, defaultOptions);

    expect(result).toHaveProperty('agentCount');
    expect(result).toHaveProperty('skillCount');
    expect(result).toHaveProperty('commandCount');
    expect(result).toHaveProperty('hookCount');
    expect(result).toHaveProperty('filesCreated');

    expect(result.agentCount).toBe(19);
    expect(result.skillCount).toBe(13);
    expect(result.commandCount).toBe(8);
    expect(result.hookCount).toBe(16);
    expect(result.filesCreated).toBeGreaterThan(0);
  });

  describe('Directory structure', () => {
    it('creates .claude/agents/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.claude', 'agents'))).toBe(true);
    });

    it('creates .claude/agents/coordinators/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.claude', 'agents', 'coordinators'))).toBe(true);
    });

    it('creates .claude/skills/ subdirectories', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const skillDirs = [
        'brainstorming', 'brownfield-analysis', 'taskboard-ops', 'code-gen',
        'debugging', 'api-design', 'testing', 'deployment', 'prd',
        'brownfield-discovery', 'adaptive-taskgraph', 'documentation',
      ];
      for (const skill of skillDirs) {
        expect(existsSync(join(dir, '.claude', 'skills', skill))).toBe(true);
      }
    });

    it('creates .claude/commands/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.claude', 'commands'))).toBe(true);
    });

    it('creates .fishi/ state and plans directories', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.fishi', 'state', 'checkpoints'))).toBe(true);
      expect(existsSync(join(dir, '.fishi', 'plans', 'prd'))).toBe(true);
      expect(existsSync(join(dir, '.fishi', 'plans', 'adrs'))).toBe(true);
    });

    it('creates .fishi/scripts/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.fishi', 'scripts'))).toBe(true);
    });

    it('creates .fishi/taskboard/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.fishi', 'taskboard'))).toBe(true);
    });

    it('creates .fishi/memory/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.fishi', 'memory'))).toBe(true);
      expect(existsSync(join(dir, '.fishi', 'memory', 'agents'))).toBe(true);
    });

    it('creates .fishi/agent-factory/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.fishi', 'agent-factory'))).toBe(true);
    });

    it('creates .trees/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.trees'))).toBe(true);
    });

    it('creates docs/ directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, 'docs'))).toBe(true);
    });
  });

  describe('Agent files', () => {
    it('creates master-orchestrator.md', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.claude', 'agents', 'master-orchestrator.md');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('name: master-orchestrator');
    });

    it('creates all 4 coordinator files', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const coordinators = ['planning-lead', 'dev-lead', 'quality-lead', 'ops-lead'];
      for (const coord of coordinators) {
        const file = join(dir, '.claude', 'agents', 'coordinators', `${coord}.md`);
        expect(existsSync(file)).toBe(true);
        const content = readFileSync(file, 'utf-8');
        expect(content).toContain(`name: ${coord}`);
        expect(content).toContain('role: coordinator');
      }
    });

    it('creates all 13 worker agent files', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const workers = [
        'research-agent', 'planning-agent', 'architect-agent',
        'backend-agent', 'frontend-agent', 'uiux-agent',
        'fullstack-agent', 'devops-agent', 'testing-agent',
        'security-agent', 'docs-agent', 'writing-agent', 'marketing-agent',
      ];
      for (const worker of workers) {
        const file = join(dir, '.claude', 'agents', `${worker}.md`);
        expect(existsSync(file)).toBe(true);
      }
    });
  });

  describe('Skill files', () => {
    it('creates SKILL.md in each skill directory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const skills = [
        'brainstorming', 'brownfield-analysis', 'taskboard-ops', 'code-gen',
        'debugging', 'api-design', 'testing', 'deployment', 'prd',
        'brownfield-discovery', 'adaptive-taskgraph', 'documentation',
      ];
      for (const skill of skills) {
        const file = join(dir, '.claude', 'skills', skill, 'SKILL.md');
        expect(existsSync(file)).toBe(true);
        const content = readFileSync(file, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Hook/script files', () => {
    it('creates all 16 .mjs scripts', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const scripts = [
        'session-start', 'auto-checkpoint', 'agent-complete',
        'post-edit', 'safety-check', 'worktree-setup', 'taskboard-update',
        'worktree-manager', 'gate-manager', 'validate-scaffold',
        'phase-runner', 'todo-manager', 'memory-manager',
        'learnings-manager', 'doc-checker', 'monitor-emitter',
      ];
      for (const script of scripts) {
        const file = join(dir, '.fishi', 'scripts', `${script}.mjs`);
        expect(existsSync(file)).toBe(true);
        const content = readFileSync(file, 'utf-8');
        expect(content).toContain('#!/usr/bin/env node');
      }
    });
  });

  describe('Command files', () => {
    it('creates all 8 command files', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const commands = [
        'fishi-init', 'fishi-status', 'fishi-resume', 'fishi-gate',
        'fishi-board', 'fishi-sprint', 'fishi-reset', 'fishi-prd',
      ];
      for (const cmd of commands) {
        const file = join(dir, '.claude', 'commands', `${cmd}.md`);
        expect(existsSync(file)).toBe(true);
      }
    });
  });

  describe('Config files', () => {
    it('creates fishi.yaml', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'fishi.yaml');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('test-scaffold-project');
    });

    it('creates settings.json with valid JSON', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.claude', 'settings.json');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('creates CLAUDE.md', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.claude', 'CLAUDE.md');
      expect(existsSync(file)).toBe(true);
    });

    it('creates .mcp.json with valid JSON', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.mcp.json');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('creates project.yaml state file', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'state', 'project.yaml');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('phase:');
      expect(content).toContain('sprint:');
    });

    it('creates agent-registry.yaml', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'state', 'agent-registry.yaml');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('master-orchestrator');
    });

    it('creates .gitignore with FISHI additions', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.gitignore');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('.trees/');
    });

    it('creates model-routing.md', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'model-routing.md');
      expect(existsSync(file)).toBe(true);
    });
  });

  describe('Factory template files', () => {
    it('creates agent-template.md in agent-factory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'agent-factory', 'agent-template.md');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('{{AGENT_NAME}}');
    });

    it('creates coordinator-template.md in agent-factory', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'agent-factory', 'coordinator-template.md');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('{{COORDINATOR_NAME}}');
      expect(content).toContain('role: coordinator');
    });
  });

  describe('Memory and state files', () => {
    it('creates project-context.md', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'memory', 'project-context.md');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('test-scaffold-project');
    });

    it('creates master-orchestrator memory file', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'memory', 'agents', 'master-orchestrator.md');
      expect(existsSync(file)).toBe(true);
    });

    it('creates taskboard board.md', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'taskboard', 'board.md');
      expect(existsSync(file)).toBe(true);
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain('TaskBoard');
    });

    it('creates TODO files for key agents', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      expect(existsSync(join(dir, '.fishi', 'todos', 'master-orchestrator.md'))).toBe(true);
      expect(existsSync(join(dir, '.fishi', 'todos', 'coordinators', 'planning-lead.md'))).toBe(true);
    });

    it('creates learnings/shared.md', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, defaultOptions);
      const file = join(dir, '.fishi', 'learnings', 'shared.md');
      expect(existsSync(file)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles brownfield project type', async () => {
      const dir = createTempDir();
      const result = await generateScaffold(dir, {
        ...defaultOptions,
        projectType: 'brownfield',
      });
      expect(result.agentCount).toBe(19);
    });

    it('handles hybrid project type', async () => {
      const dir = createTempDir();
      const result = await generateScaffold(dir, {
        ...defaultOptions,
        projectType: 'hybrid',
      });
      expect(result.agentCount).toBe(19);
    });

    it('handles economy cost mode', async () => {
      const dir = createTempDir();
      const result = await generateScaffold(dir, {
        ...defaultOptions,
        costMode: 'economy',
      });
      expect(result.filesCreated).toBeGreaterThan(0);
    });

    it('handles performance cost mode', async () => {
      const dir = createTempDir();
      const result = await generateScaffold(dir, {
        ...defaultOptions,
        costMode: 'performance',
      });
      expect(result.filesCreated).toBeGreaterThan(0);
    });

    it('includes language and framework in generated files when provided', async () => {
      const dir = createTempDir();
      await generateScaffold(dir, {
        ...defaultOptions,
        language: 'typescript',
        framework: 'nextjs',
      });
      const config = readFileSync(join(dir, '.fishi', 'fishi.yaml'), 'utf-8');
      expect(config).toContain('typescript');
      expect(config).toContain('nextjs');
    });
  });
});

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

  const defaultOptions: ScaffoldOptions = {
    projectName: 'test-brownfield',
    projectType: 'brownfield',
    interactive: false,
    costMode: 'balanced',
    description: 'A test brownfield project',
  };

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

  it('skips agents when resolution is skip', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'agents', 'backend-agent.md'), '# My backend');

    await generateScaffold(dir, {
      ...defaultOptions,
      resolutions: {
        categories: { 'agents': 'skip' },
        files: {},
      },
    });

    // Existing file preserved
    expect(readFileSync(join(dir, '.claude', 'agents', 'backend-agent.md'), 'utf-8')).toBe('# My backend');
    // Other FISHI agents NOT created (all skipped)
    expect(existsSync(join(dir, '.claude', 'agents', 'frontend-agent.md'))).toBe(false);
  });

  it('greenfield path unchanged when no resolutions provided', async () => {
    const dir = createTempDir();
    const result = await generateScaffold(dir, defaultOptions);

    expect(result.agentCount).toBe(19);
    expect(result.skillCount).toBe(13);
    expect(result.commandCount).toBe(8);
    expect(result.filesCreated).toBeGreaterThan(0);
    expect(existsSync(join(dir, '.claude', 'CLAUDE.md'))).toBe(true);
  });

  it('merges into root CLAUDE.md when rootClaudeMdExists is true', async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# My Project\n\nProject instructions here.');

    await generateScaffold(dir, {
      ...defaultOptions,
      rootClaudeMdExists: true,
      resolutions: {
        categories: { 'root-claude-md': 'merge' },
        files: {},
      },
    });

    // Root CLAUDE.md should have FISHI at top + existing content below
    const rootMd = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(rootMd).toContain('### FISHI Framework');
    expect(rootMd).toContain('# My Project');
    expect(rootMd).toContain('Project instructions here.');
    // FISHI should be before existing content
    expect(rootMd.indexOf('FISHI:START')).toBeLessThan(rootMd.indexOf('# My Project'));
    // .claude/CLAUDE.md should NOT be created
    expect(existsSync(join(dir, '.claude', 'CLAUDE.md'))).toBe(false);
  });

  it('skips root CLAUDE.md and .claude/CLAUDE.md when rootClaudeMdExists + skip', async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Original');

    await generateScaffold(dir, {
      ...defaultOptions,
      rootClaudeMdExists: true,
      resolutions: {
        categories: { 'root-claude-md': 'skip' },
        files: {},
      },
    });

    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('# Original');
    expect(existsSync(join(dir, '.claude', 'CLAUDE.md'))).toBe(false);
  });
});
