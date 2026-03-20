import { describe, it, expect } from 'vitest';
import { getSaasArchitectTemplate } from '../templates/agents/domains/saas-architect';
import { getMarketplaceArchitectTemplate } from '../templates/agents/domains/marketplace-architect';
import { getMobileArchitectTemplate } from '../templates/agents/domains/mobile-architect';
import { getAimlArchitectTemplate } from '../templates/agents/domains/aiml-architect';
import { getDeepResearchAgentTemplate } from '../templates/agents/domains/deep-research';
import { getDeepResearchSkill } from '../templates/skills/deep-research';

describe('Domain Agent Templates', () => {
  it('saas architect has YAML frontmatter with domain', () => {
    const t = getSaasArchitectTemplate();
    expect(t).toContain('name: saas-architect');
    expect(t).toContain('domain: saas');
    expect(t).toContain('Stripe');
    expect(t).toContain('multi-tenancy');
  });

  it('marketplace architect has YAML frontmatter with domain', () => {
    const t = getMarketplaceArchitectTemplate();
    expect(t).toContain('name: marketplace-architect');
    expect(t).toContain('domain: marketplace');
    expect(t).toContain('escrow');
    expect(t).toContain('Stripe Connect');
  });

  it('mobile architect has YAML frontmatter with domain', () => {
    const t = getMobileArchitectTemplate();
    expect(t).toContain('name: mobile-architect');
    expect(t).toContain('domain: mobile');
    expect(t).toContain('PWA');
    expect(t).toContain('offline');
  });

  it('aiml architect has YAML frontmatter with domain', () => {
    const t = getAimlArchitectTemplate();
    expect(t).toContain('name: aiml-architect');
    expect(t).toContain('domain: aiml');
    expect(t).toContain('RAG');
    expect(t).toContain('embeddings');
  });

  it('deep research agent has proper structure', () => {
    const t = getDeepResearchAgentTemplate();
    expect(t).toContain('name: deep-research-agent');
    expect(t).toContain('Domain Research');
    expect(t).toContain('Competitive Analysis');
    expect(t).toContain('Tech Stack Research');
    expect(t).toContain('Best Practices');
    expect(t).toContain('Security Research');
    expect(t).toContain('.fishi/research/');
  });

  it('deep research skill has workflow steps', () => {
    const s = getDeepResearchSkill();
    expect(s).toContain('name: deep-research');
    expect(s).toContain('Define Research Scope');
    expect(s).toContain('Gather Information');
    expect(s).toContain('Synthesize Findings');
    expect(s).toContain('Produce Report');
  });
});
