import { describe, it, expect } from 'vitest';
import { searchBlueprints, getInfo, selectPattern, listCategories, getContributeTemplate } from '../src/index.js';

describe('fishi-patterns MCP server', () => {
  describe('searchBlueprints', () => {
    it('finds patterns by name keyword', () => {
      const results = searchBlueprints('stripe');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe('payments-stripe');
    });

    it('finds patterns by category keyword', () => {
      const results = searchBlueprints('authentication');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.category === 'authentication')).toBe(true);
    });

    it('filters by category when provided', () => {
      const results = searchBlueprints('stripe', 'email');
      expect(results.length).toBe(0);
    });

    it('returns empty array for no matches', () => {
      const results = searchBlueprints('nonexistent-pattern-xyz');
      expect(results).toEqual([]);
    });

    it('does not include content in search results', () => {
      const results = searchBlueprints('stripe');
      for (const r of results) {
        expect(r).not.toHaveProperty('content');
      }
    });
  });

  describe('getInfo', () => {
    it('returns full blueprint for valid id', () => {
      const info = getInfo('payments-stripe');
      expect(info).not.toBeNull();
      expect(info!.id).toBe('payments-stripe');
      expect(info!.name).toBe('Stripe');
      expect(info!.content.length).toBeGreaterThan(0);
    });

    it('returns null for invalid id', () => {
      const info = getInfo('nonexistent-xyz');
      expect(info).toBeNull();
    });
  });

  describe('selectPattern', () => {
    it('returns content for valid id', () => {
      const content = selectPattern('payments-stripe');
      expect(content).not.toBeNull();
      expect(content!.length).toBeGreaterThan(100);
      expect(content).toContain('Stripe');
    });

    it('returns null for invalid id', () => {
      const content = selectPattern('nonexistent-xyz');
      expect(content).toBeNull();
    });
  });

  describe('listCategories', () => {
    it('returns categories with counts', () => {
      const categories = listCategories();
      expect(categories.length).toBeGreaterThanOrEqual(1);
      for (const cat of categories) {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.count).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('getContributeTemplate', () => {
    it('returns non-empty template', () => {
      const template = getContributeTemplate();
      expect(template.length).toBeGreaterThan(50);
      expect(template).toContain('id:');
      expect(template).toContain('category:');
    });
  });

  describe('blueprint quality', () => {
    it('all blueprints have required frontmatter fields', () => {
      const categories = listCategories();
      for (const cat of categories) {
        const results = searchBlueprints('', cat.id);
        for (const r of results) {
          const info = getInfo(r.id);
          expect(info, `Blueprint ${r.id} should exist`).not.toBeNull();
          expect(info!.id, `Blueprint ${r.id} needs id`).toBeTruthy();
          expect(info!.name, `Blueprint ${r.id} needs name`).toBeTruthy();
          expect(info!.category, `Blueprint ${r.id} needs category`).toBeTruthy();
          expect(info!.description, `Blueprint ${r.id} needs description`).toBeTruthy();
        }
      }
    });

    it('no blueprint contains real credentials', () => {
      const categories = listCategories();
      const credentialPatterns = [/sk-[a-zA-Z0-9]{20,}/, /sk_live_/, /pk_live_/, /AKIA[A-Z0-9]{16}/, /password\s*=\s*["'][^"']+["']/];

      for (const cat of categories) {
        const results = searchBlueprints('', cat.id);
        for (const r of results) {
          const info = getInfo(r.id);
          if (info) {
            for (const pattern of credentialPatterns) {
              expect(pattern.test(info.content), `Blueprint ${r.id} may contain credentials matching ${pattern}`).toBe(false);
            }
          }
        }
      }
    });
  });
});
