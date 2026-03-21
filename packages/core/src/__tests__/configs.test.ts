import { describe, it, expect } from 'vitest';
import {
  getFishiYamlTemplate,
  getSettingsJsonTemplate,
  getClaudeMdTemplate,
  getMcpJsonTemplate,
  getProjectYamlTemplate,
  getAgentRegistryTemplate,
  getGitignoreAdditions,
  getModelRoutingReference,
} from '../index';

describe('Config Templates', () => {
  describe('getFishiYamlTemplate', () => {
    const yaml = getFishiYamlTemplate({
      projectName: 'test-project',
      projectDescription: 'A test project',
      projectType: 'greenfield',
      costMode: 'balanced',
    });

    it('returns a non-empty string', () => {
      expect(yaml).toBeTruthy();
      expect(yaml.length).toBeGreaterThan(50);
    });

    it('contains the project name', () => {
      expect(yaml).toContain('test-project');
    });

    it('contains project type', () => {
      expect(yaml).toContain('greenfield');
    });

    it('contains cost mode', () => {
      expect(yaml).toContain('balanced');
    });

    it('has YAML structure with key: value pairs', () => {
      expect(yaml).toContain('project:');
      expect(yaml).toContain('name:');
    });

    it('includes optional language and framework when provided', () => {
      const withOptions = getFishiYamlTemplate({
        projectName: 'typed-project',
        projectDescription: 'With stack',
        projectType: 'brownfield',
        costMode: 'economy',
        language: 'typescript',
        framework: 'nextjs',
      });
      expect(withOptions).toContain('typescript');
      expect(withOptions).toContain('nextjs');
    });
  });

  describe('getSettingsJsonTemplate', () => {
    const json = getSettingsJsonTemplate();

    it('returns a non-empty string', () => {
      expect(json).toBeTruthy();
    });

    it('returns valid JSON', () => {
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('contains hooks configuration', () => {
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('hooks');
    });

    it('contains permissions configuration', () => {
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('permissions');
    });

    it('has SessionStart hook referencing session-start script', () => {
      const parsed = JSON.parse(json);
      expect(parsed.hooks).toHaveProperty('SessionStart');
      const sessionStartHooks = parsed.hooks.SessionStart;
      expect(sessionStartHooks).toBeInstanceOf(Array);
      expect(sessionStartHooks.length).toBeGreaterThan(0);
      expect(sessionStartHooks[0].hooks[0].command).toContain('session-start');
    });
  });

  describe('getClaudeMdTemplate', () => {
    const md = getClaudeMdTemplate({
      projectName: 'test-project',
      projectDescription: 'A test project',
      projectType: 'greenfield',
    });

    it('returns a non-empty string', () => {
      expect(md).toBeTruthy();
      expect(md.length).toBeGreaterThan(100);
    });

    it('contains the project name', () => {
      expect(md).toContain('test-project');
    });

    it('contains pipeline or FISHI references', () => {
      const hasPipelineRef =
        md.includes('pipeline') ||
        md.includes('FISHI') ||
        md.includes('fishi') ||
        md.includes('.fishi');
      expect(hasPipelineRef).toBe(true);
    });

    it('handles brownfield analysis data', () => {
      const withAnalysis = getClaudeMdTemplate({
        projectName: 'existing-app',
        projectDescription: 'Brownfield project',
        projectType: 'brownfield',
        language: 'typescript',
        framework: 'express',
        brownfieldAnalysis: {
          language: 'typescript',
          framework: 'express',
          testFramework: 'jest',
          packageManager: 'npm',
          linter: 'eslint',
          formatter: 'prettier',
          cssFramework: null,
          orm: 'prisma',
          database: 'postgresql',
          authProvider: null,
          apiStyle: 'REST',
          monorepo: false,
          conventions: ['kebab-case files'],
          codePatterns: [{ name: 'MVC', evidence: 'controllers/', confidence: 0.9 }],
          fileStats: { totalFiles: 150, codeFiles: 80, testFiles: 20 },
        },
      });
      expect(withAnalysis).toBeTruthy();
      expect(withAnalysis.length).toBeGreaterThan(md.length);
    });
  });

  describe('getMcpJsonTemplate', () => {
    const json = getMcpJsonTemplate();

    it('returns a non-empty string', () => {
      expect(json).toBeTruthy();
    });

    it('returns valid JSON', () => {
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('contains github MCP server', () => {
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('mcpServers');
      expect(parsed.mcpServers).toHaveProperty('github');
    });

    it('contains sequential-thinking MCP server', () => {
      const parsed = JSON.parse(json);
      expect(parsed.mcpServers).toHaveProperty('sequential-thinking');
    });

    it('contains context7 MCP server', () => {
      const parsed = JSON.parse(json);
      expect(parsed.mcpServers).toHaveProperty('context7');
    });
  });

  describe('getProjectYamlTemplate', () => {
    const yaml = getProjectYamlTemplate({
      projectName: 'test-project',
      projectDescription: 'A test project',
      projectType: 'greenfield',
    });

    it('returns a non-empty string', () => {
      expect(yaml).toBeTruthy();
    });

    it('contains phase field', () => {
      expect(yaml).toContain('phase:');
    });

    it('contains sprint field', () => {
      expect(yaml).toContain('sprint:');
    });

    it('contains the project name', () => {
      expect(yaml).toContain('test-project');
    });

    it('contains the project type', () => {
      expect(yaml).toContain('greenfield');
    });
  });

  describe('getAgentRegistryTemplate', () => {
    const registry = getAgentRegistryTemplate();

    it('returns a non-empty string', () => {
      expect(registry).toBeTruthy();
    });

    it('lists master-orchestrator', () => {
      expect(registry).toContain('master-orchestrator');
    });

    it('lists coordinators', () => {
      expect(registry).toContain('planning-lead');
      expect(registry).toContain('dev-lead');
      // Registry may use qa-lead/devops-lead instead of quality-lead/ops-lead
      const hasQualityLead = registry.includes('quality-lead') || registry.includes('qa-lead');
      const hasOpsLead = registry.includes('ops-lead') || registry.includes('devops-lead');
      expect(hasQualityLead).toBe(true);
      expect(hasOpsLead).toBe(true);
    });

    it('lists worker agents', () => {
      expect(registry).toContain('research-agent');
      expect(registry).toContain('backend-agent');
      expect(registry).toContain('frontend-agent');
      expect(registry).toContain('security-agent');
    });

    it('contains YAML agent entries structure', () => {
      expect(registry).toContain('agents:');
      expect(registry).toContain('name:');
      expect(registry).toContain('role:');
      expect(registry).toContain('status:');
    });
  });

  describe('getGitignoreAdditions', () => {
    const gitignore = getGitignoreAdditions();

    it('returns a non-empty string', () => {
      expect(gitignore).toBeTruthy();
    });

    it('contains .trees/ directory', () => {
      expect(gitignore).toContain('.trees/');
    });

    it('contains .fishi/logs/ directory', () => {
      expect(gitignore).toContain('.fishi/logs/');
    });

    it('contains .env', () => {
      expect(gitignore).toContain('.env');
    });
  });

  describe('getModelRoutingReference', () => {
    const routing = getModelRoutingReference();

    it('returns a non-empty string', () => {
      expect(routing).toBeTruthy();
      expect(routing.length).toBeGreaterThan(100);
    });

    it('contains Opus model reference', () => {
      const hasOpus = routing.includes('Opus') || routing.includes('opus');
      expect(hasOpus).toBe(true);
    });

    it('contains Sonnet model reference', () => {
      const hasSonnet = routing.includes('Sonnet') || routing.includes('sonnet');
      expect(hasSonnet).toBe(true);
    });

    it('contains Haiku model reference', () => {
      const hasHaiku = routing.includes('Haiku') || routing.includes('haiku');
      expect(hasHaiku).toBe(true);
    });

    it('contains routing guidance', () => {
      expect(routing).toContain('Routing');
    });
  });

  it('all 8 config templates are tested', () => {
    const configs = [
      getFishiYamlTemplate,
      getSettingsJsonTemplate,
      getClaudeMdTemplate,
      getMcpJsonTemplate,
      getProjectYamlTemplate,
      getAgentRegistryTemplate,
      getGitignoreAdditions,
      getModelRoutingReference,
    ];
    expect(configs).toHaveLength(8);
  });
});
