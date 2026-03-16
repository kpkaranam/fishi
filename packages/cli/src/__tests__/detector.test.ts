import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { detectProjectType } from '../analyzers/detector.js';

describe('detectProjectType', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'fishi-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('detects greenfield for empty directory', async () => {
    const result = await detectProjectType(testDir);
    expect(result.type).toBe('greenfield');
    expect(result.confidence).toBeGreaterThan(80);
  });

  it('detects brownfield for project with package.json and src', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ dependencies: { express: '4.0.0' } }));
    mkdirSync(join(testDir, 'src'));
    writeFileSync(join(testDir, 'src', 'index.ts'), 'console.log("hello")');
    const result = await detectProjectType(testDir);
    expect(result.type).not.toBe('greenfield');
  });

  it('treats directory with only README.md as greenfield', async () => {
    writeFileSync(join(testDir, 'README.md'), '# My Project');
    const result = await detectProjectType(testDir);
    // README.md alone counts as 1 passed check (documentation), which is <= 1, so greenfield
    expect(result.type).toBe('greenfield');
  });

  it('returns checks array with evidence', async () => {
    const result = await detectProjectType(testDir);
    expect(result.checks).toBeInstanceOf(Array);
    expect(result.checks.length).toBeGreaterThan(0);
    for (const check of result.checks) {
      expect(check).toHaveProperty('check');
      expect(check).toHaveProperty('passed');
    }
  });

  it('returns confidence as a number between 0 and 100', async () => {
    const result = await detectProjectType(testDir);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('detects dependency files as a check', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
    const result = await detectProjectType(testDir);
    const depCheck = result.checks.find((c) => c.check.includes('dependency'));
    expect(depCheck).toBeDefined();
    expect(depCheck!.passed).toBe(true);
    expect(depCheck!.evidence).toContain('package.json');
  });

  it('detects test directories', async () => {
    mkdirSync(join(testDir, 'src'));
    writeFileSync(join(testDir, 'src', 'app.ts'), 'export const x = 1;');
    mkdirSync(join(testDir, '__tests__'));
    writeFileSync(join(testDir, '__tests__', 'app.test.ts'), 'test("x", () => {})');
    const result = await detectProjectType(testDir);
    const testCheck = result.checks.find((c) => c.check.includes('test'));
    expect(testCheck).toBeDefined();
    expect(testCheck!.passed).toBe(true);
  });

  it('detects CI/CD configuration', async () => {
    mkdirSync(join(testDir, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(testDir, '.github', 'workflows', 'ci.yml'), 'name: CI');
    const result = await detectProjectType(testDir);
    const ciCheck = result.checks.find((c) => c.check.includes('CI/CD'));
    expect(ciCheck).toBeDefined();
    expect(ciCheck!.passed).toBe(true);
  });

  it('returns exactly 6 checks', async () => {
    const result = await detectProjectType(testDir);
    expect(result.checks.length).toBe(6);
  });
});
