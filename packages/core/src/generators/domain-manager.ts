import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export type ProjectDomain = 'saas' | 'marketplace' | 'mobile' | 'aiml' | 'general';

export interface DomainConfig {
  domain: ProjectDomain;
  domainAgent: string | null;
  researchEnabled: boolean;
}

export const DOMAIN_INFO: Record<ProjectDomain, { label: string; description: string; agent: string | null }> = {
  saas: {
    label: 'SaaS',
    description: 'Subscription billing, multi-tenancy, user management (Stripe, Auth0)',
    agent: 'saas-architect',
  },
  marketplace: {
    label: 'Marketplace',
    description: 'Two-sided platform, escrow, disputes, vendor management (Stripe Connect)',
    agent: 'marketplace-architect',
  },
  mobile: {
    label: 'Mobile / PWA',
    description: 'Progressive web app, offline sync, push notifications, responsive design',
    agent: 'mobile-architect',
  },
  aiml: {
    label: 'AI / ML',
    description: 'RAG pipelines, embeddings, fine-tuning, model serving, LLM integration',
    agent: 'aiml-architect',
  },
  general: {
    label: 'General',
    description: 'No domain specialization — use base agents only',
    agent: null,
  },
};

/**
 * Get the list of available domains for selection.
 */
export function getAvailableDomains(): { value: ProjectDomain; name: string }[] {
  return Object.entries(DOMAIN_INFO).map(([key, info]) => ({
    value: key as ProjectDomain,
    name: `${info.label} — ${info.description}`,
  }));
}

/**
 * Read domain config from fishi.yaml.
 */
export function readDomainConfig(projectDir: string): DomainConfig {
  const yamlPath = join(projectDir, '.fishi', 'fishi.yaml');
  if (!existsSync(yamlPath)) {
    return { domain: 'general', domainAgent: null, researchEnabled: false };
  }
  const content = readFileSync(yamlPath, 'utf-8');
  const domainMatch = content.match(/^\s*type:\s*(\w+)/m);
  const researchMatch = content.match(/^\s*research_enabled:\s*(true|false)/m);
  const domain = (domainMatch?.[1] as ProjectDomain) || 'general';
  return {
    domain,
    domainAgent: DOMAIN_INFO[domain]?.agent || null,
    researchEnabled: researchMatch?.[1] === 'true',
  };
}

/**
 * Get the domain config YAML to append to fishi.yaml.
 */
export function getDomainConfigYaml(domain: ProjectDomain): string {
  const info = DOMAIN_INFO[domain];
  return `
domain:
  type: ${domain}
  label: "${info.label}"
  specialist_agent: ${info.agent || 'none'}
  research_enabled: true
`;
}
