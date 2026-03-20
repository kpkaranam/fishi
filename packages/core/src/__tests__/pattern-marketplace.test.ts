import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  getPatternCategories,
  getPatternsByCategory,
  getPattern,
  searchPatterns,
  saveSelectedPatterns,
  readSelectedPatterns,
  generatePatternGuide,
} from '../generators/pattern-marketplace';

describe('Pattern Marketplace', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-patterns-'));
    mkdirSync(join(tempDir, '.fishi'), { recursive: true });
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getPatternCategories', () => {
    it('returns 21 categories', () => {
      expect(getPatternCategories()).toHaveLength(21);
    });

    it('each category has id, name, description, and patterns', () => {
      for (const cat of getPatternCategories()) {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.patterns.length).toBeGreaterThan(0);
      }
    });

    it('total patterns count is 50+', () => {
      const total = getPatternCategories().reduce((sum, cat) => sum + cat.patterns.length, 0);
      expect(total).toBeGreaterThanOrEqual(50);
    });
  });

  describe('getPatternsByCategory', () => {
    it('returns patterns for authentication category', () => {
      const patterns = getPatternsByCategory('authentication');
      expect(patterns.length).toBeGreaterThanOrEqual(4);
      expect(patterns.some(p => p.name.includes('Auth0'))).toBe(true);
    });

    it('returns empty for unknown category', () => {
      expect(getPatternsByCategory('nonexistent')).toHaveLength(0);
    });
  });

  describe('getPattern', () => {
    it('finds stripe pattern', () => {
      const p = getPattern('stripe');
      expect(p).toBeDefined();
      expect(p!.category).toBe('payments');
      expect(p!.tools).toContain('Stripe');
    });

    it('returns undefined for unknown pattern', () => {
      expect(getPattern('nonexistent')).toBeUndefined();
    });

    it('every pattern has a guide with content', () => {
      for (const cat of getPatternCategories()) {
        for (const p of cat.patterns) {
          expect(p.guide.length).toBeGreaterThan(50);
        }
      }
    });
  });

  describe('searchPatterns', () => {
    it('finds patterns by name', () => {
      const results = searchPatterns('stripe');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('finds patterns by tool name', () => {
      const results = searchPatterns('PostgreSQL');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('finds patterns by category', () => {
      const results = searchPatterns('authentication');
      expect(results.length).toBeGreaterThanOrEqual(4);
    });

    it('returns empty for no match', () => {
      expect(searchPatterns('zzz_nonexistent_zzz')).toHaveLength(0);
    });
  });

  describe('saveSelectedPatterns / readSelectedPatterns', () => {
    it('saves and reads selected patterns', () => {
      const dir = createTempDir();
      saveSelectedPatterns(dir, ['stripe', 'auth0', 'sendgrid']);
      const selected = readSelectedPatterns(dir);
      expect(selected).toEqual(['stripe', 'auth0', 'sendgrid']);
    });

    it('returns empty for project without patterns', () => {
      const dir = createTempDir();
      expect(readSelectedPatterns(dir)).toEqual([]);
    });
  });

  describe('generatePatternGuide', () => {
    it('generates markdown guide for selected patterns', () => {
      const guide = generatePatternGuide(['stripe', 'auth0']);
      expect(guide).toContain('# Integration Patterns');
      expect(guide).toContain('Stripe');
      expect(guide).toContain('Auth0');
    });

    it('includes tools and architecture sections', () => {
      const guide = generatePatternGuide(['stripe']);
      expect(guide).toContain('**Tools:**');
      expect(guide).toContain('Setup');
      expect(guide).toContain('Architecture');
    });

    it('skips unknown pattern IDs gracefully', () => {
      const guide = generatePatternGuide(['stripe', 'nonexistent']);
      expect(guide).toContain('Stripe');
      expect(guide).not.toContain('nonexistent');
    });
  });
});
