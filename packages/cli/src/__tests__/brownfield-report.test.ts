import { describe, it, expect } from 'vitest';
import { generateBrownfieldReport } from '../analyzers/brownfield-report.js';
import type { BrownfieldAnalysis } from '../analyzers/brownfield.js';

function createMinimalAnalysis(overrides: Partial<BrownfieldAnalysis> = {}): BrownfieldAnalysis {
  return {
    language: null,
    framework: null,
    dependencyCount: 0,
    hasTests: false,
    hasCiCd: false,
    conventions: [],
    techDebt: [],
    structure: '',
    testFramework: null,
    packageManager: null,
    linter: null,
    formatter: null,
    cssFramework: null,
    orm: null,
    database: null,
    authProvider: null,
    apiStyle: null,
    monorepo: false,
    codePatterns: [],
    fileStats: {
      totalFiles: 0,
      codeFiles: 0,
      testFiles: 0,
      configFiles: 0,
      docFiles: 0,
      largestFiles: [],
    },
    existingAgents: [],
    ...overrides,
  };
}

describe('generateBrownfieldReport', () => {
  it('returns a non-empty string', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis());
    expect(report).toBeTruthy();
    expect(report.length).toBeGreaterThan(0);
  });

  it('contains markdown headers', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis());
    expect(report).toContain('# Brownfield Analysis Report');
    expect(report).toContain('## Architecture Overview');
    expect(report).toContain('## Tech Stack Inventory');
    expect(report).toContain('## Tooling Inventory');
    expect(report).toContain('## Code Statistics');
    expect(report).toContain('## Conventions Discovered');
    expect(report).toContain('## Tech Debt Signals');
    expect(report).toContain('## Recommendations for FISHI Integration');
  });

  it('contains tech stack section with language', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({ language: 'typescript', framework: 'nextjs' })
    );
    expect(report).toContain('typescript');
    expect(report).toContain('nextjs');
  });

  it('contains tooling info', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({
        packageManager: 'pnpm',
        linter: 'eslint',
        formatter: 'prettier',
        testFramework: 'vitest',
      })
    );
    expect(report).toContain('pnpm');
    expect(report).toContain('eslint');
    expect(report).toContain('prettier');
    expect(report).toContain('vitest');
  });

  it('contains conventions when present', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({
        conventions: ['ESLint configured', 'Prettier configured', 'ES Modules'],
      })
    );
    expect(report).toContain('ESLint configured');
    expect(report).toContain('Prettier configured');
    expect(report).toContain('ES Modules');
  });

  it('shows no conventions message when empty', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis());
    expect(report).toContain('No specific conventions detected');
  });

  it('contains tech debt items when present', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({
        techDebt: ['moment.js — consider date-fns or dayjs', 'TSLint is deprecated — migrate to ESLint'],
      })
    );
    expect(report).toContain('moment.js');
    expect(report).toContain('TSLint is deprecated');
  });

  it('shows no tech debt message when empty', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis());
    expect(report).toContain('No significant tech debt signals detected');
  });

  it('includes code statistics table', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({
        fileStats: {
          totalFiles: 42,
          codeFiles: 30,
          testFiles: 8,
          configFiles: 3,
          docFiles: 1,
          largestFiles: [{ path: 'src/big-file.ts', lines: 600 }],
        },
        dependencyCount: 25,
      })
    );
    expect(report).toContain('42');
    expect(report).toContain('30');
    expect(report).toContain('big-file.ts');
    expect(report).toContain('600');
  });

  it('includes monorepo indicator when true', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis({ monorepo: true }));
    expect(report).toContain('Monorepo');
    expect(report).toContain('Yes');
  });

  it('includes code patterns when present', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({
        codePatterns: [
          { name: 'barrel-exports', evidence: 'Found 5 index files with re-exports', confidence: 85 },
        ],
      })
    );
    expect(report).toContain('barrel-exports');
    expect(report).toContain('high confidence');
  });

  it('includes recommendations for missing tests', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis({ hasTests: false }));
    expect(report).toContain('test framework');
  });

  it('includes recommendations for missing CI/CD', () => {
    const report = generateBrownfieldReport(createMinimalAnalysis({ hasCiCd: false }));
    expect(report).toContain('CI/CD');
  });

  it('includes recommendation for large files', () => {
    const report = generateBrownfieldReport(
      createMinimalAnalysis({
        fileStats: {
          totalFiles: 10,
          codeFiles: 5,
          testFiles: 0,
          configFiles: 0,
          docFiles: 0,
          largestFiles: [{ path: 'src/monster.ts', lines: 800 }],
        },
      })
    );
    expect(report).toContain('large files');
  });
});
