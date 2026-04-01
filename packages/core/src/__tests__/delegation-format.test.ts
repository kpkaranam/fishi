import { describe, it, expect } from 'vitest';
import { devLeadTemplate } from '../templates/agents/coordinators/dev-lead';

describe('Delegation Format', () => {
  const ctx = {
    projectName: 'test-project',
    projectDescription: 'A test project',
    projectType: 'greenfield',
    costMode: 'balanced',
    timestamp: new Date().toISOString(),
  };

  // Spec #38: Dev Lead prompt includes all mandatory sections
  it('Dev Lead template includes all mandatory delegation sections', () => {
    const template = devLeadTemplate(ctx);
    expect(template).toContain('[TASK]');
    expect(template).toContain('[OBJECTIVE]');
    expect(template).toContain('[DO NOT]');
    expect(template).toContain('[TOKEN BUDGET]');
    expect(template).toContain('[PRIORITY]');
  });
});
