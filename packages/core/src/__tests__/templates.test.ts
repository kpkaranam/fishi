import { describe, it, expect } from 'vitest';
import type { TemplateContext } from '../types/templates';
import {
  getMasterOrchestratorTemplate,
  planningLeadTemplate,
  devLeadTemplate,
  qualityLeadTemplate,
  opsLeadTemplate,
  researchAgentTemplate,
  planningAgentTemplate,
  architectAgentTemplate,
  backendAgentTemplate,
  frontendAgentTemplate,
  uiuxAgentTemplate,
  fullstackAgentTemplate,
  devopsAgentTemplate,
  testingAgentTemplate,
  securityAgentTemplate,
  docsAgentTemplate,
  writingAgentTemplate,
  marketingAgentTemplate,
} from '../index';

const ctx: TemplateContext = {
  projectName: 'test-project',
  projectDescription: 'A test project for unit testing',
  projectType: 'greenfield',
  costMode: 'balanced',
  timestamp: new Date().toISOString(),
};

describe('Agent Templates', () => {
  describe('Master Orchestrator', () => {
    it('returns a non-empty string', () => {
      const template = getMasterOrchestratorTemplate();
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(100);
    });

    it('has YAML frontmatter with required fields', () => {
      const template = getMasterOrchestratorTemplate();
      expect(template).toContain('---');
      expect(template).toContain('name: master-orchestrator');
      expect(template).toContain('model: opus');
    });

    it('contains core orchestrator content', () => {
      const template = getMasterOrchestratorTemplate();
      expect(template).toContain('Master Orchestrator');
      expect(template).toContain('Phase');
      expect(template).toContain('Gate');
    });

    it('does not take context parameters (static template)', () => {
      // Master orchestrator is the only agent that takes no arguments
      expect(getMasterOrchestratorTemplate.length).toBe(0);
    });
  });

  describe('Coordinators', () => {
    const coordinators: [string, (ctx: TemplateContext) => string][] = [
      ['planning-lead', planningLeadTemplate],
      ['dev-lead', devLeadTemplate],
      ['quality-lead', qualityLeadTemplate],
      ['ops-lead', opsLeadTemplate],
    ];

    it.each(coordinators)('%s returns a non-empty string', (_name, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(100);
    });

    it.each(coordinators)('%s has YAML frontmatter with coordinator fields', (name, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toContain('---');
      expect(template).toContain(`name: ${name}`);
      expect(template).toContain('role: coordinator');
      expect(template).toContain('reports_to:');
      expect(template).toContain('manages:');
      expect(template).toContain('model:');
    });

    it.each(coordinators)('%s interpolates project name from context', (_, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toContain('test-project');
    });

    it.each(coordinators)('%s reports to master-orchestrator', (_, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toContain('reports_to: master-orchestrator');
    });
  });

  describe('Worker Agents', () => {
    const workers: [string, (ctx: TemplateContext) => string][] = [
      ['research-agent', researchAgentTemplate],
      ['planning-agent', planningAgentTemplate],
      ['architect-agent', architectAgentTemplate],
      ['backend-agent', backendAgentTemplate],
      ['frontend-agent', frontendAgentTemplate],
      ['uiux-agent', uiuxAgentTemplate],
      ['fullstack-agent', fullstackAgentTemplate],
      ['devops-agent', devopsAgentTemplate],
      ['testing-agent', testingAgentTemplate],
      ['security-agent', securityAgentTemplate],
      ['docs-agent', docsAgentTemplate],
      ['writing-agent', writingAgentTemplate],
      ['marketing-agent', marketingAgentTemplate],
    ];

    it.each(workers)('%s returns a non-empty string', (_name, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(50);
    });

    it.each(workers)('%s has YAML frontmatter with worker fields', (name, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toContain('---');
      expect(template).toContain(`name: ${name}`);
      expect(template).toContain('model:');
      expect(template).toContain('reports_to:');
    });

    it.each(workers)('%s interpolates project name from context', (_, templateFn) => {
      const template = templateFn(ctx);
      expect(template).toContain('test-project');
    });

    it('all 13 workers are accounted for', () => {
      expect(workers).toHaveLength(13);
    });
  });

  describe('Total agent count', () => {
    it('there are 18 agent templates (1 master + 4 coordinators + 13 workers)', () => {
      // 1 master (no ctx) + 4 coordinators + 13 workers = 18
      const allTemplateFns = [
        getMasterOrchestratorTemplate,
        planningLeadTemplate,
        devLeadTemplate,
        qualityLeadTemplate,
        opsLeadTemplate,
        researchAgentTemplate,
        planningAgentTemplate,
        architectAgentTemplate,
        backendAgentTemplate,
        frontendAgentTemplate,
        uiuxAgentTemplate,
        fullstackAgentTemplate,
        devopsAgentTemplate,
        testingAgentTemplate,
        securityAgentTemplate,
        docsAgentTemplate,
        writingAgentTemplate,
        marketingAgentTemplate,
      ];
      expect(allTemplateFns).toHaveLength(18);
    });
  });
});
