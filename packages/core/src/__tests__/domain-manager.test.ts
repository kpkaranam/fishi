import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  getAvailableDomains,
  readDomainConfig,
  getDomainConfigYaml,
  DOMAIN_INFO,
} from '../generators/domain-manager';

describe('Domain Manager', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-domain-'));
    mkdirSync(join(tempDir, '.fishi'), { recursive: true });
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getAvailableDomains', () => {
    it('returns 5 domains', () => {
      const domains = getAvailableDomains();
      expect(domains).toHaveLength(5);
    });

    it('includes saas, marketplace, mobile, aiml, general', () => {
      const domains = getAvailableDomains();
      const values = domains.map(d => d.value);
      expect(values).toContain('saas');
      expect(values).toContain('marketplace');
      expect(values).toContain('mobile');
      expect(values).toContain('aiml');
      expect(values).toContain('general');
    });

    it('each domain has a descriptive name', () => {
      const domains = getAvailableDomains();
      for (const d of domains) {
        expect(d.name.length).toBeGreaterThan(10);
      }
    });
  });

  describe('DOMAIN_INFO', () => {
    it('saas has agent', () => {
      expect(DOMAIN_INFO.saas.agent).toBe('saas-architect');
    });

    it('marketplace has agent', () => {
      expect(DOMAIN_INFO.marketplace.agent).toBe('marketplace-architect');
    });

    it('general has no agent', () => {
      expect(DOMAIN_INFO.general.agent).toBeNull();
    });
  });

  describe('readDomainConfig', () => {
    it('returns general when no fishi.yaml', () => {
      const dir = createTempDir();
      const config = readDomainConfig(dir);
      expect(config.domain).toBe('general');
      expect(config.domainAgent).toBeNull();
    });

    it('reads domain from fishi.yaml', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, '.fishi', 'fishi.yaml'), 'domain:\n  type: saas\n  research_enabled: true\n');
      const config = readDomainConfig(dir);
      expect(config.domain).toBe('saas');
      expect(config.domainAgent).toBe('saas-architect');
      expect(config.researchEnabled).toBe(true);
    });
  });

  describe('getDomainConfigYaml', () => {
    it('generates saas config', () => {
      const yaml = getDomainConfigYaml('saas');
      expect(yaml).toContain('type: saas');
      expect(yaml).toContain('saas-architect');
      expect(yaml).toContain('research_enabled: true');
    });

    it('generates general config with no agent', () => {
      const yaml = getDomainConfigYaml('general');
      expect(yaml).toContain('type: general');
      expect(yaml).toContain('specialist_agent: none');
    });
  });
});
