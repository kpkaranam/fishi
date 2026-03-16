import { describe, it, expect } from 'vitest';
import {
  getAgentFactoryTemplate,
  getCoordinatorFactoryTemplate,
} from '../index';

describe('Factory Templates', () => {
  describe('getAgentFactoryTemplate', () => {
    const template = getAgentFactoryTemplate();

    it('returns a non-empty string', () => {
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(50);
    });

    it('contains {{AGENT_NAME}} placeholder', () => {
      expect(template).toContain('{{AGENT_NAME}}');
    });

    it('has YAML frontmatter', () => {
      expect(template.trimStart()).toMatch(/^---/);
    });

    it('contains name field using placeholder', () => {
      expect(template).toContain('name: {{AGENT_NAME}}');
    });

    it('contains standard tool list', () => {
      expect(template).toContain('Read');
      expect(template).toContain('Write');
    });

    it('contains model field', () => {
      expect(template).toContain('model:');
    });
  });

  describe('getCoordinatorFactoryTemplate', () => {
    const template = getCoordinatorFactoryTemplate();

    it('returns a non-empty string', () => {
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(50);
    });

    it('contains {{COORDINATOR_NAME}} placeholder', () => {
      expect(template).toContain('{{COORDINATOR_NAME}}');
    });

    it('has YAML frontmatter', () => {
      expect(template.trimStart()).toMatch(/^---/);
    });

    it('contains role: coordinator', () => {
      expect(template).toContain('role: coordinator');
    });

    it('reports to master-orchestrator', () => {
      expect(template).toContain('reports_to: master-orchestrator');
    });

    it('contains manages field', () => {
      expect(template).toContain('manages:');
    });
  });

  it('both factory templates are accounted for', () => {
    const factories = [getAgentFactoryTemplate, getCoordinatorFactoryTemplate];
    expect(factories).toHaveLength(2);
  });
});
