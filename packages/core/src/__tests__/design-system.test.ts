import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  detectDesignTokens,
  generateDefaultTokens,
  detectComponentRegistry,
  runBrandGuardian,
  generateDesignSystemConfig,
} from '../generators/design-system';

describe('Design System', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-design-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detectDesignTokens', () => {
    it('returns empty tokens for project without config', () => {
      const dir = createTempDir();
      const tokens = detectDesignTokens(dir);
      expect(Object.keys(tokens.colors).length).toBe(0);
    });

    it('detects colors from CSS custom properties', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'globals.css'), ':root {\n  --color-primary: #0066cc;\n  --color-bg: #ffffff;\n}\n');
      const tokens = detectDesignTokens(dir);
      expect(tokens.colors['color-primary']).toBe('#0066cc');
    });

    it('detects dark mode from CSS', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'globals.css'), '.dark { --bg: #000; }\n');
      const tokens = detectDesignTokens(dir);
      expect(tokens.darkMode).toBe(true);
    });

    it('detects colors from tailwind config', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'tailwind.config.js'), `module.exports = {\n  theme: {\n    colors: {\n      primary: '#3b82f6',\n      secondary: '#10b981',\n    }\n  }\n};\n`);
      const tokens = detectDesignTokens(dir);
      expect(tokens.colors['primary']).toBe('#3b82f6');
    });
  });

  describe('generateDefaultTokens', () => {
    it('returns complete token set', () => {
      const tokens = generateDefaultTokens();
      expect(Object.keys(tokens.colors).length).toBeGreaterThan(10);
      expect(tokens.typography.fontFamilies.length).toBeGreaterThan(0);
      expect(Object.keys(tokens.spacing).length).toBeGreaterThan(5);
      expect(Object.keys(tokens.borderRadius).length).toBeGreaterThan(3);
      expect(tokens.darkMode).toBe(true);
    });

    it('includes brand, gray, and semantic colors', () => {
      const tokens = generateDefaultTokens();
      expect(tokens.colors['brand-500']).toBeDefined();
      expect(tokens.colors['gray-900']).toBeDefined();
      expect(tokens.colors['error']).toBeDefined();
    });
  });

  describe('detectComponentRegistry', () => {
    it('returns empty registry for project without components', () => {
      const dir = createTempDir();
      const registry = detectComponentRegistry(dir);
      expect(registry.components).toHaveLength(0);
      expect(registry.library).toBeNull();
    });

    it('detects shadcn from components.json', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { react: '^18' } }));
      writeFileSync(join(dir, 'components.json'), '{}');
      const registry = detectComponentRegistry(dir);
      expect(registry.library).toBe('shadcn');
      expect(registry.framework).toBe('react');
    });

    it('detects MUI from package.json', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@mui/material': '^5', react: '^18' } }));
      const registry = detectComponentRegistry(dir);
      expect(registry.library).toBe('mui');
    });

    it('scans component files from src/components', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), '{}');
      mkdirSync(join(dir, 'src', 'components'), { recursive: true });
      writeFileSync(join(dir, 'src', 'components', 'Button.tsx'), 'export function Button() {}');
      writeFileSync(join(dir, 'src', 'components', 'Header.tsx'), 'export function Header() {}');
      writeFileSync(join(dir, 'src', 'components', 'LoginForm.tsx'), 'export function LoginForm() {}');
      const registry = detectComponentRegistry(dir);
      expect(registry.components.length).toBe(3);
      expect(registry.components.find(c => c.name === 'Button')?.type).toBe('ui');
      expect(registry.components.find(c => c.name === 'Header')?.type).toBe('layout');
      expect(registry.components.find(c => c.name === 'LoginForm')?.type).toBe('form');
    });

    it('classifies components by type', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), '{}');
      mkdirSync(join(dir, 'src', 'components'), { recursive: true });
      writeFileSync(join(dir, 'src', 'components', 'DataTable.tsx'), '');
      writeFileSync(join(dir, 'src', 'components', 'NavBar.tsx'), '');
      const registry = detectComponentRegistry(dir);
      expect(registry.components.find(c => c.name === 'DataTable')?.type).toBe('data');
      expect(registry.components.find(c => c.name === 'NavBar')?.type).toBe('navigation');
    });
  });

  describe('runBrandGuardian', () => {
    it('passes for clean project', () => {
      const dir = createTempDir();
      const tokens = generateDefaultTokens();
      const report = runBrandGuardian(dir, tokens);
      expect(report.passed).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it('detects hardcoded hex colors', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'App.tsx'), '<div className="bg-[#ff0000]">test</div>\n');
      const report = runBrandGuardian(dir, generateDefaultTokens());
      const colorIssues = report.issues.filter(i => i.rule === 'no-hardcoded-colors');
      expect(colorIssues.length).toBeGreaterThan(0);
    });

    it('detects images without alt text', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'Page.tsx'), '<img src="photo.jpg" />\n');
      const report = runBrandGuardian(dir, generateDefaultTokens());
      const altIssues = report.issues.filter(i => i.rule === 'img-alt-text');
      expect(altIssues.length).toBe(1);
      expect(altIssues[0].severity).toBe('error');
    });

    it('detects click handlers without keyboard support', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'Comp.tsx'), '<div onClick={handleClick}>click me</div>\n');
      const report = runBrandGuardian(dir, generateDefaultTokens());
      const kbIssues = report.issues.filter(i => i.rule === 'keyboard-accessible');
      expect(kbIssues.length).toBe(1);
    });

    it('detects inline px values', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'Box.tsx'), '<div style={{ padding: "16px", margin: "24px" }}>box</div>\n');
      const report = runBrandGuardian(dir, generateDefaultTokens());
      const pxIssues = report.issues.filter(i => i.rule === 'no-inline-px');
      expect(pxIssues.length).toBeGreaterThan(0);
    });

    it('returns proper stats', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'Page.tsx'), '<img src="a.jpg" />\n<div style={{ padding: "10px" }}>test</div>');
      const report = runBrandGuardian(dir, generateDefaultTokens());
      expect(report.stats.filesScanned).toBe(1);
      expect(report.stats.errors).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateDesignSystemConfig', () => {
    it('generates valid JSON config', () => {
      const tokens = generateDefaultTokens();
      const registry = { components: [{ name: 'Button', path: 'src/components/Button.tsx', type: 'ui' as const }], library: 'shadcn' as const, framework: 'react' as const };
      const config = generateDesignSystemConfig(tokens, registry);
      const parsed = JSON.parse(config);
      expect(parsed.version).toBe('1.0');
      expect(parsed.tokens.colors['brand-500']).toBeDefined();
      expect(parsed.components.library).toBe('shadcn');
      expect(parsed.components.count).toBe(1);
    });
  });
});
