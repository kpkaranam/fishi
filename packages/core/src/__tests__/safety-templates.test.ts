import { describe, it, expect } from 'vitest';
import { getSoulMdTemplate } from '../templates/configs/soul-md';
import { getAgentsMdTemplate } from '../templates/configs/agents-md';

describe('Safety Templates', () => {
  describe('SOUL.md', () => {
    it('contains core principles', () => {
      const soul = getSoulMdTemplate();
      expect(soul).toContain('Human authority is final');
      expect(soul).toContain('Reversibility first');
      expect(soul).toContain('Least privilege');
      expect(soul).toContain('Transparency');
    });

    it('defines absolute boundaries', () => {
      const soul = getSoulMdTemplate();
      expect(soul).toContain('Never Do Autonomously');
      expect(soul).toContain('Delete files');
      expect(soul).toContain('Push code to production');
      expect(soul).toContain('Modify environment variables');
    });

    it('defines confirmation requirements', () => {
      const soul = getSoulMdTemplate();
      expect(soul).toContain('Always Require Human Confirmation');
      expect(soul).toContain('Merging branches');
      expect(soul).toContain('Deploying');
    });

    it('references enforcement layers', () => {
      const soul = getSoulMdTemplate();
      expect(soul).toContain('SOUL.md');
      expect(soul).toContain('AGENTS.md');
      expect(soul).toContain('Tool permissions');
    });
  });

  describe('AGENTS.md', () => {
    it('defines role hierarchy', () => {
      const agents = getAgentsMdTemplate();
      expect(agents).toContain('Level 0: Master Orchestrator');
      expect(agents).toContain('Level 1: Coordinators');
      expect(agents).toContain('Level 2: Workers');
    });

    it('master cannot write or edit', () => {
      const agents = getAgentsMdTemplate();
      expect(agents).toContain('Write/Edit files');
      expect(agents).toContain('DENIED');
    });

    it('defines destructive action protocol', () => {
      const agents = getAgentsMdTemplate();
      expect(agents).toContain('Destructive Action Protocol');
      expect(agents).toContain('Never delete');
      expect(agents).toContain('.fishi/archive/');
    });

    it('defines escalation path', () => {
      const agents = getAgentsMdTemplate();
      expect(agents).toContain('Escalation Path');
      expect(agents).toContain('human confirmation');
    });

    it('defines emergency stop', () => {
      const agents = getAgentsMdTemplate();
      expect(agents).toContain('Emergency Stop');
      expect(agents).toContain('safety.violation');
      expect(agents).toContain('safety-incidents.log');
    });
  });
});
