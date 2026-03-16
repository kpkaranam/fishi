import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { runBrownfieldAnalysis } from '../analyzers/brownfield.js';
import type { BrownfieldAnalysis } from '../analyzers/brownfield.js';

describe('runBrownfieldAnalysis', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'fishi-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns default values for empty directory', async () => {
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.language).toBeNull();
    expect(result.framework).toBeNull();
    expect(result.dependencyCount).toBe(0);
    expect(result.hasTests).toBe(false);
    expect(result.hasCiCd).toBe(false);
    expect(result.conventions).toEqual([]);
    expect(result.techDebt).toEqual([]);
    expect(result.testFramework).toBeNull();
    expect(result.packageManager).toBeNull();
    expect(result.linter).toBeNull();
    expect(result.formatter).toBeNull();
    expect(result.orm).toBeNull();
    expect(result.codePatterns).toEqual([]);
    expect(result.existingAgents).toEqual([]);
  });

  it('returns proper FileStats for empty directory', async () => {
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.fileStats).toEqual({
      totalFiles: 0,
      codeFiles: 0,
      testFiles: 0,
      configFiles: 0,
      docFiles: 0,
      largestFiles: [],
    });
  });

  it('detects TypeScript from tsconfig.json', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', dependencies: {} }));
    writeFileSync(join(testDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.language).toBe('typescript');
  });

  it('detects Next.js from package.json dependencies', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { next: '14.0.0', react: '18.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.framework).toBe('nextjs');
  });

  it('detects pnpm from pnpm-lock.yaml', async () => {
    writeFileSync(join(testDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.packageManager).toBe('pnpm');
  });

  it('detects npm from package-lock.json', async () => {
    writeFileSync(join(testDir, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3 }));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.packageManager).toBe('npm');
  });

  it('detects yarn from yarn.lock', async () => {
    writeFileSync(join(testDir, 'yarn.lock'), '# yarn lockfile v1');
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.packageManager).toBe('yarn');
  });

  it('detects ESLint from .eslintrc.json', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    writeFileSync(join(testDir, '.eslintrc.json'), JSON.stringify({ extends: 'eslint:recommended' }));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.linter).toBe('eslint');
  });

  it('detects Biome from biome.json', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    writeFileSync(join(testDir, 'biome.json'), JSON.stringify({}));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.linter).toBe('biome');
    expect(result.formatter).toBe('biome');
  });

  it('detects Prettier from .prettierrc', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    writeFileSync(join(testDir, '.prettierrc'), JSON.stringify({ semi: true }));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.formatter).toBe('prettier');
  });

  it('detects Prisma ORM from @prisma/client in deps', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { '@prisma/client': '5.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.orm).toBe('prisma');
  });

  it('detects Drizzle ORM', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { 'drizzle-orm': '0.30.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.orm).toBe('drizzle');
  });

  it('detects vitest as test framework', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        devDependencies: { vitest: '2.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.testFramework).toBe('vitest');
    expect(result.hasTests).toBe(true);
  });

  it('detects jest as test framework', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        devDependencies: { jest: '29.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.testFramework).toBe('jest');
    expect(result.hasTests).toBe(true);
  });

  it('detects CI/CD from Dockerfile', async () => {
    writeFileSync(join(testDir, 'Dockerfile'), 'FROM node:20');
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.hasCiCd).toBe(true);
  });

  it('detects CI/CD from .github/workflows', async () => {
    mkdirSync(join(testDir, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(testDir, '.github', 'workflows', 'ci.yml'), 'name: CI');
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.hasCiCd).toBe(true);
  });

  it('detects barrel-exports pattern from index.ts files', async () => {
    mkdirSync(join(testDir, 'src'), { recursive: true });
    // Need > 3 index files with at least one containing re-exports
    for (const dir of ['a', 'b', 'c', 'd']) {
      const subdir = join(testDir, 'src', dir);
      mkdirSync(subdir, { recursive: true });
      writeFileSync(join(subdir, 'index.ts'), 'export * from "./module";');
    }
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    const result = await runBrownfieldAnalysis(testDir);
    const barrelPattern = result.codePatterns.find((p) => p.name === 'barrel-exports');
    expect(barrelPattern).toBeDefined();
    expect(barrelPattern!.confidence).toBeGreaterThanOrEqual(80);
  });

  it('detects monorepo from turbo.json', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'mono', dependencies: {} }));
    writeFileSync(join(testDir, 'turbo.json'), JSON.stringify({ pipeline: {} }));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.monorepo).toBe(true);
  });

  it('detects monorepo from pnpm-workspace.yaml', async () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'mono', dependencies: {} }));
    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*');
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.monorepo).toBe(true);
  });

  it('detects tailwind CSS framework', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { tailwindcss: '3.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.cssFramework).toBe('tailwind');
  });

  it('detects postgres database from deps', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { pg: '8.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.database).toBe('postgres');
  });

  it('detects auth provider clerk', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { '@clerk/nextjs': '5.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.authProvider).toBe('clerk');
  });

  it('detects graphql API style', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { graphql: '16.0.0', '@apollo/server': '4.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.apiStyle).toBe('graphql');
  });

  it('detects trpc API style', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { '@trpc/server': '10.0.0', '@trpc/client': '10.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.apiStyle).toBe('trpc');
  });

  it('counts dependencies correctly', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { react: '18.0.0', next: '14.0.0' },
        devDependencies: { typescript: '5.0.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.dependencyCount).toBe(3);
  });

  it('reports tech debt for deprecated packages', async () => {
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: { moment: '2.30.0', request: '2.88.0' },
      })
    );
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.techDebt.some((d) => d.includes('moment'))).toBe(true);
    expect(result.techDebt.some((d) => d.includes('request'))).toBe(true);
  });

  it('computes file stats correctly', async () => {
    mkdirSync(join(testDir, 'src'));
    writeFileSync(join(testDir, 'src', 'app.ts'), 'const x = 1;\nconst y = 2;\n');
    writeFileSync(join(testDir, 'src', 'app.test.ts'), 'test("x", () => {});\n');
    writeFileSync(join(testDir, 'README.md'), '# Test\n');
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.fileStats.totalFiles).toBeGreaterThan(0);
    expect(result.fileStats.codeFiles).toBeGreaterThanOrEqual(1);
  });

  it('generates directory structure string', async () => {
    mkdirSync(join(testDir, 'src'));
    writeFileSync(join(testDir, 'src', 'index.ts'), 'export {};');
    const result = await runBrownfieldAnalysis(testDir);
    expect(result.structure).toContain('src');
  });
});
