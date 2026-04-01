import { describe, it, expect } from 'vitest';
import { qaAgentTemplate } from '../templates/agents/qa-agent';

describe('QA Agent Template', () => {
  const ctx = {
    projectName: 'test-project',
    projectDescription: 'A test project',
    projectType: 'greenfield',
    costMode: 'balanced',
    timestamp: new Date().toISOString(),
  };
  const template = qaAgentTemplate(ctx);

  // Spec #28: QA agent output schema
  it('template contains required output format fields', () => {
    expect(template).toContain('APPROVED');
    expect(template).toContain('ISSUES_FOUND');
    expect(template).toContain('sprint-{N}-full-review.json');
    expect(template).toContain('sprint-{N}-security-report.json');
    expect(template).toContain('fix_tasks');
    expect(template).toContain('owasp_issues');
    expect(template).toContain('soc2_flags');
  });

  it('template has required sections', () => {
    expect(template).toContain('OWASP Top 10');
    expect(template).toContain('Build Verification');
    expect(template).toContain('Test Suite');
    expect(template).toContain('Action Log (MANDATORY)');
  });
});
