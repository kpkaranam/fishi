import fs from 'fs';
import path from 'path';

export interface CodePattern {
  name: string;
  evidence: string;
  confidence: number;
}

export interface FileStats {
  totalFiles: number;
  codeFiles: number;
  testFiles: number;
  configFiles: number;
  docFiles: number;
  largestFiles: Array<{ path: string; lines: number }>;
}

export interface BrownfieldAnalysis {
  language: string | null;
  framework: string | null;
  dependencyCount: number;
  hasTests: boolean;
  hasCiCd: boolean;
  conventions: string[];
  techDebt: string[];
  structure: string;
  testFramework: string | null;
  packageManager: string | null;
  linter: string | null;
  formatter: string | null;
  cssFramework: string | null;
  orm: string | null;
  database: string | null;
  authProvider: string | null;
  apiStyle: string | null;
  monorepo: boolean;
  codePatterns: CodePattern[];
  fileStats: FileStats;
  existingAgents: string[];
}

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  '__pycache__', '.git', '.trees', 'coverage', '.turbo', '.cache',
  '.output', 'target', 'vendor', '.venv', 'venv', 'env',
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.kt', '.rb',
  '.vue', '.svelte', '.astro', '.php', '.cs', '.cpp', '.c', '.h',
]);

const TEST_PATTERNS = [
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /test_.*\.py$/,
  /.*_test\.py$/,
  /.*_test\.go$/,
  /Test\.java$/,
];

const CONFIG_EXTENSIONS = new Set([
  '.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.config.js',
  '.config.ts', '.config.mjs', '.config.cjs',
]);

const DOC_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.rst', '.adoc']);

export async function runBrownfieldAnalysis(
  targetDir: string
): Promise<BrownfieldAnalysis> {
  const analysis: BrownfieldAnalysis = {
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
  };

  // Collect all files for stats
  const allFiles = collectFiles(targetDir, 5);

  // Compute file stats
  analysis.fileStats = computeFileStats(targetDir, allFiles);

  // Detect package manager
  analysis.packageManager = detectPackageManager(targetDir);

  // Detect language and framework from package.json
  const packageJsonPath = path.join(targetDir, 'package.json');
  let pkg: Record<string, unknown> | null = null;
  let allDeps: Record<string, string> = {};

  if (fs.existsSync(packageJsonPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      allDeps = {
        ...(pkg?.dependencies as Record<string, string> || {}),
        ...(pkg?.devDependencies as Record<string, string> || {}),
      };
      analysis.dependencyCount = Object.keys(allDeps).length;

      // Detect language
      if (allDeps.typescript || allDeps['ts-node'] || fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
        analysis.language = 'typescript';
      } else {
        analysis.language = 'javascript';
      }

      // Detect framework
      if (allDeps.next) analysis.framework = 'nextjs';
      else if (allDeps.nuxt) analysis.framework = 'nuxt';
      else if (allDeps['@sveltejs/kit']) analysis.framework = 'sveltekit';
      else if (allDeps.svelte) analysis.framework = 'svelte';
      else if (allDeps.astro || allDeps['@astrojs/node']) analysis.framework = 'astro';
      else if (allDeps.react) analysis.framework = 'react';
      else if (allDeps.vue) analysis.framework = 'vue';
      else if (allDeps.express) analysis.framework = 'express';
      else if (allDeps.fastify) analysis.framework = 'fastify';
      else if (allDeps.hono) analysis.framework = 'hono';
      else if (allDeps['@nestjs/core']) analysis.framework = 'nestjs';
      else if (allDeps.remix || allDeps['@remix-run/node']) analysis.framework = 'remix';

      // Detect test framework
      if (allDeps.vitest) {
        analysis.testFramework = 'vitest';
        analysis.hasTests = true;
      } else if (allDeps.jest || allDeps['@jest/core']) {
        analysis.testFramework = 'jest';
        analysis.hasTests = true;
      } else if (allDeps.mocha) {
        analysis.testFramework = 'mocha';
        analysis.hasTests = true;
      } else if (allDeps['@playwright/test']) {
        analysis.testFramework = 'playwright';
        analysis.hasTests = true;
      } else if (allDeps.cypress) {
        analysis.testFramework = 'cypress';
        analysis.hasTests = true;
      }

      // Detect linter
      analysis.linter = detectLinter(targetDir, allDeps);

      // Detect formatter
      analysis.formatter = detectFormatter(targetDir, allDeps);

      // Detect CSS framework
      analysis.cssFramework = detectCssFramework(allDeps);

      // Detect ORM
      analysis.orm = detectOrm(allDeps);

      // Detect database
      analysis.database = detectDatabase(targetDir, allDeps);

      // Detect auth provider
      analysis.authProvider = detectAuthProvider(allDeps);

      // Detect API style
      analysis.apiStyle = detectApiStyle(targetDir, allDeps);

      // Detect monorepo
      analysis.monorepo = detectMonorepo(targetDir, pkg);

      // Detect conventions
      if (allDeps.eslint || analysis.linter === 'eslint') analysis.conventions.push('ESLint configured');
      if (allDeps.prettier || analysis.formatter === 'prettier') analysis.conventions.push('Prettier configured');
      if (analysis.linter === 'biome' || analysis.formatter === 'biome') analysis.conventions.push('Biome configured');
      if (allDeps.husky) analysis.conventions.push('Husky git hooks');
      if (allDeps['lint-staged']) analysis.conventions.push('Lint-staged configured');
      if ((pkg as Record<string, unknown>)?.type === 'module') analysis.conventions.push('ES Modules');
      if (allDeps['@commitlint/cli'] || allDeps['commitlint']) analysis.conventions.push('Commitlint configured');
      if (allDeps['semantic-release']) analysis.conventions.push('Semantic release configured');
      if (allDeps.changesets || allDeps['@changesets/cli']) analysis.conventions.push('Changesets configured');
      if (analysis.testFramework) analysis.conventions.push(`${capitalize(analysis.testFramework)} testing`);

      // Tech debt signals
      const nodeEngines = (pkg as Record<string, unknown>)?.engines as Record<string, string> | undefined;
      if (nodeEngines?.node) {
        const version = parseInt(nodeEngines.node.replace(/[^0-9]/g, ''));
        if (version < 18) {
          analysis.techDebt.push('Node.js version below 18');
        }
      }
      if (allDeps.tslint) analysis.techDebt.push('TSLint is deprecated — migrate to ESLint');
      if (allDeps.moment) analysis.techDebt.push('moment.js — consider date-fns or dayjs');
      if (allDeps.request) analysis.techDebt.push('request is deprecated — use fetch or undici');
      if (allDeps.lodash && !allDeps['lodash-es']) analysis.techDebt.push('Full lodash bundle — consider lodash-es or individual imports');
      if (analysis.dependencyCount > 100) analysis.techDebt.push(`High dependency count (${analysis.dependencyCount})`);

    } catch {
      // Invalid JSON
    }
  }

  // Detect Python project
  const requirementsPath = path.join(targetDir, 'requirements.txt');
  const pyprojectPath = path.join(targetDir, 'pyproject.toml');
  if (fs.existsSync(requirementsPath) || fs.existsSync(pyprojectPath)) {
    analysis.language = analysis.language || 'python';

    if (fs.existsSync(pyprojectPath)) {
      const pyproject = fs.readFileSync(pyprojectPath, 'utf-8');
      if (pyproject.includes('pytest')) {
        analysis.testFramework = 'pytest';
        analysis.hasTests = true;
      }
      if (pyproject.includes('ruff')) analysis.linter = 'ruff';
      else if (pyproject.includes('flake8')) analysis.linter = 'flake8';
      if (pyproject.includes('black')) analysis.formatter = 'black';
      else if (pyproject.includes('ruff')) analysis.formatter = analysis.formatter || 'ruff';
      if (pyproject.includes('poetry')) analysis.packageManager = 'poetry';
      else if (pyproject.includes('pdm')) analysis.packageManager = 'pdm';
      if (pyproject.includes('sqlalchemy')) analysis.orm = 'sqlalchemy';
      else if (pyproject.includes('django')) analysis.orm = 'django-orm';
      if (pyproject.includes('django')) analysis.framework = 'django';
      else if (pyproject.includes('fastapi')) analysis.framework = 'fastapi';
      else if (pyproject.includes('flask')) analysis.framework = 'flask';
    }

    if (fs.existsSync(requirementsPath)) {
      const reqs = fs.readFileSync(requirementsPath, 'utf-8');
      analysis.dependencyCount = reqs.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
      if (reqs.includes('django')) analysis.framework = analysis.framework || 'django';
      else if (reqs.includes('fastapi')) analysis.framework = analysis.framework || 'fastapi';
      else if (reqs.includes('flask')) analysis.framework = analysis.framework || 'flask';
      if (reqs.includes('pytest')) {
        analysis.testFramework = 'pytest';
        analysis.hasTests = true;
      }
      if (reqs.includes('sqlalchemy')) analysis.orm = analysis.orm || 'sqlalchemy';
    }
  }

  // Detect Go project
  if (fs.existsSync(path.join(targetDir, 'go.mod'))) {
    analysis.language = analysis.language || 'go';
  }

  // Detect Rust project
  if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) {
    analysis.language = analysis.language || 'rust';
  }

  // Check for CI/CD
  analysis.hasCiCd =
    fs.existsSync(path.join(targetDir, '.github', 'workflows')) ||
    fs.existsSync(path.join(targetDir, '.gitlab-ci.yml')) ||
    fs.existsSync(path.join(targetDir, '.circleci')) ||
    fs.existsSync(path.join(targetDir, 'Jenkinsfile')) ||
    fs.existsSync(path.join(targetDir, 'Dockerfile'));

  // Check for tests (if not already detected)
  if (!analysis.hasTests) {
    const testDirs = ['tests', 'test', '__tests__', 'spec'];
    analysis.hasTests = testDirs.some((d) => fs.existsSync(path.join(targetDir, d)));
  }

  // Detect code patterns
  analysis.codePatterns = detectCodePatterns(targetDir, allFiles);

  // Detect existing agents
  analysis.existingAgents = detectExistingAgents(targetDir);

  // Map directory structure
  analysis.structure = mapDirectoryStructure(targetDir, 3);

  return analysis;
}

function detectPackageManager(targetDir: string): string | null {
  if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(targetDir, 'bun.lockb')) || fs.existsSync(path.join(targetDir, 'bun.lock'))) return 'bun';
  if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(targetDir, 'package-lock.json'))) return 'npm';
  // Check packageManager field in package.json
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.packageManager) {
        if (pkg.packageManager.startsWith('pnpm')) return 'pnpm';
        if (pkg.packageManager.startsWith('yarn')) return 'yarn';
        if (pkg.packageManager.startsWith('bun')) return 'bun';
        if (pkg.packageManager.startsWith('npm')) return 'npm';
      }
    } catch { /* ignore */ }
  }
  return null;
}

function detectLinter(targetDir: string, deps: Record<string, string>): string | null {
  if (deps['@biomejs/biome'] || deps.biome || fs.existsSync(path.join(targetDir, 'biome.json')) || fs.existsSync(path.join(targetDir, 'biome.jsonc'))) {
    return 'biome';
  }
  if (
    deps.eslint ||
    fs.existsSync(path.join(targetDir, '.eslintrc.json')) ||
    fs.existsSync(path.join(targetDir, '.eslintrc.js')) ||
    fs.existsSync(path.join(targetDir, '.eslintrc.cjs')) ||
    fs.existsSync(path.join(targetDir, '.eslintrc.yml')) ||
    fs.existsSync(path.join(targetDir, '.eslintrc.yaml')) ||
    fs.existsSync(path.join(targetDir, '.eslintrc')) ||
    fs.existsSync(path.join(targetDir, 'eslint.config.js')) ||
    fs.existsSync(path.join(targetDir, 'eslint.config.mjs')) ||
    fs.existsSync(path.join(targetDir, 'eslint.config.ts'))
  ) {
    return 'eslint';
  }
  return null;
}

function detectFormatter(targetDir: string, deps: Record<string, string>): string | null {
  // Biome also serves as a formatter
  if (deps['@biomejs/biome'] || deps.biome || fs.existsSync(path.join(targetDir, 'biome.json')) || fs.existsSync(path.join(targetDir, 'biome.jsonc'))) {
    return 'biome';
  }
  if (
    deps.prettier ||
    fs.existsSync(path.join(targetDir, '.prettierrc')) ||
    fs.existsSync(path.join(targetDir, '.prettierrc.json')) ||
    fs.existsSync(path.join(targetDir, '.prettierrc.js')) ||
    fs.existsSync(path.join(targetDir, '.prettierrc.cjs')) ||
    fs.existsSync(path.join(targetDir, '.prettierrc.yaml')) ||
    fs.existsSync(path.join(targetDir, '.prettierrc.yml')) ||
    fs.existsSync(path.join(targetDir, '.prettierrc.toml')) ||
    fs.existsSync(path.join(targetDir, 'prettier.config.js')) ||
    fs.existsSync(path.join(targetDir, 'prettier.config.cjs')) ||
    fs.existsSync(path.join(targetDir, 'prettier.config.mjs'))
  ) {
    return 'prettier';
  }
  if (deps.dprint || fs.existsSync(path.join(targetDir, 'dprint.json'))) {
    return 'dprint';
  }
  return null;
}

function detectCssFramework(deps: Record<string, string>): string | null {
  if (deps.tailwindcss) return 'tailwind';
  if (deps['styled-components']) return 'styled-components';
  if (deps['@emotion/styled'] || deps['@emotion/react']) return 'emotion';
  if (deps['@chakra-ui/react']) return 'chakra-ui';
  if (deps['@mantine/core']) return 'mantine';
  if (deps['@mui/material'] || deps['@material-ui/core']) return 'material-ui';
  if (deps.sass || deps['node-sass']) return 'sass';
  if (deps['@vanilla-extract/css']) return 'vanilla-extract';
  return null;
}

function detectOrm(deps: Record<string, string>): string | null {
  if (deps['@prisma/client'] || deps.prisma) return 'prisma';
  if (deps['drizzle-orm']) return 'drizzle';
  if (deps.sequelize) return 'sequelize';
  if (deps.typeorm) return 'typeorm';
  if (deps.mongoose) return 'mongoose';
  if (deps.knex) return 'knex';
  if (deps.kysely) return 'kysely';
  return null;
}

function detectDatabase(targetDir: string, deps: Record<string, string>): string | null {
  // Check Prisma schema for database provider
  const prismaSchemaPath = path.join(targetDir, 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchemaPath)) {
    try {
      const schema = fs.readFileSync(prismaSchemaPath, 'utf-8');
      if (schema.includes('provider = "postgresql"') || schema.includes('provider = "postgres"')) return 'postgres';
      if (schema.includes('provider = "mysql"')) return 'mysql';
      if (schema.includes('provider = "sqlite"')) return 'sqlite';
      if (schema.includes('provider = "mongodb"')) return 'mongodb';
      if (schema.includes('provider = "sqlserver"')) return 'sqlserver';
    } catch { /* ignore */ }
  }

  // Check .env for DATABASE_URL hints
  const envFiles = ['.env', '.env.local', '.env.development'];
  for (const envFile of envFiles) {
    const envPath = path.join(targetDir, envFile);
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('postgres://') || envContent.includes('postgresql://')) return 'postgres';
        if (envContent.includes('mysql://')) return 'mysql';
        if (envContent.includes('mongodb://') || envContent.includes('mongodb+srv://')) return 'mongodb';
      } catch { /* ignore */ }
    }
  }

  // Check deps
  if (deps.pg || deps['@neondatabase/serverless'] || deps['postgres']) return 'postgres';
  if (deps.mysql2 || deps.mysql) return 'mysql';
  if (deps.mongodb) return 'mongodb';
  if (deps['better-sqlite3'] || deps.sqlite3) return 'sqlite';
  if (deps.redis || deps.ioredis) return 'redis';

  return null;
}

function detectAuthProvider(deps: Record<string, string>): string | null {
  const depKeys = Object.keys(deps);
  if (depKeys.some(k => k.startsWith('@clerk/'))) return 'clerk';
  if (deps['next-auth'] || deps['@auth/core']) return 'next-auth';
  if (depKeys.some(k => k.startsWith('@auth0/'))) return 'auth0';
  if (deps['@supabase/auth-helpers-nextjs'] || deps['@supabase/supabase-js']) return 'supabase-auth';
  if (deps.passport) return 'passport';
  if (deps['firebase-admin'] || deps.firebase) return 'firebase-auth';
  if (depKeys.some(k => k.startsWith('@lucia-auth/'))) return 'lucia';
  if (deps['better-auth']) return 'better-auth';
  return null;
}

function detectApiStyle(targetDir: string, deps: Record<string, string>): string | null {
  const depKeys = Object.keys(deps);
  if (deps.graphql || deps['@apollo/server'] || deps['@apollo/client'] || deps['graphql-yoga'] || deps.urql) {
    return 'graphql';
  }
  if (depKeys.some(k => k.startsWith('@trpc/'))) return 'trpc';
  if (
    fs.existsSync(path.join(targetDir, 'swagger.json')) ||
    fs.existsSync(path.join(targetDir, 'openapi.json')) ||
    fs.existsSync(path.join(targetDir, 'openapi.yaml')) ||
    fs.existsSync(path.join(targetDir, 'openapi.yml')) ||
    deps['swagger-ui-express'] ||
    deps['@nestjs/swagger']
  ) {
    return 'rest';
  }
  if (deps['@grpc/grpc-js'] || deps['@grpc/proto-loader']) return 'grpc';
  // Default: if express/fastify/hono detected, likely REST
  if (deps.express || deps.fastify || deps.hono) return 'rest';
  return null;
}

function detectMonorepo(targetDir: string, pkg: Record<string, unknown> | null): boolean {
  if (fs.existsSync(path.join(targetDir, 'turbo.json'))) return true;
  if (fs.existsSync(path.join(targetDir, 'nx.json'))) return true;
  if (fs.existsSync(path.join(targetDir, 'lerna.json'))) return true;
  if (fs.existsSync(path.join(targetDir, 'pnpm-workspace.yaml'))) return true;
  if (pkg?.workspaces) return true;
  return false;
}

function collectFiles(dir: string, maxDepth: number, depth = 0): string[] {
  if (depth >= maxDepth) return [];

  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && depth === 0 && entry.name !== '.env') continue;
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectFiles(fullPath, maxDepth, depth + 1));
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    // Permission error
  }
  return files;
}

function computeFileStats(targetDir: string, allFiles: string[]): FileStats {
  const stats: FileStats = {
    totalFiles: allFiles.length,
    codeFiles: 0,
    testFiles: 0,
    configFiles: 0,
    docFiles: 0,
    largestFiles: [],
  };

  const codeFileSizes: Array<{ path: string; lines: number }> = [];

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    const relativePath = path.relative(targetDir, filePath);

    const isTest = TEST_PATTERNS.some(p => p.test(basename));
    const isCode = CODE_EXTENSIONS.has(ext);
    const isConfig = CONFIG_EXTENSIONS.has(ext) || basename.includes('.config.');
    const isDoc = DOC_EXTENSIONS.has(ext);

    if (isTest) {
      stats.testFiles++;
      stats.codeFiles++; // tests are also code
    } else if (isCode) {
      stats.codeFiles++;
    }

    if (isConfig) stats.configFiles++;
    if (isDoc) stats.docFiles++;

    // Track largest code files
    if (isCode) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lineCount = content.split('\n').length;
        codeFileSizes.push({ path: relativePath, lines: lineCount });
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Sort and take top 5 largest
  codeFileSizes.sort((a, b) => b.lines - a.lines);
  stats.largestFiles = codeFileSizes.slice(0, 5);

  return stats;
}

function detectCodePatterns(targetDir: string, allFiles: string[]): CodePattern[] {
  const patterns: CodePattern[] = [];

  // Check for barrel exports (index.ts files that re-export)
  const indexFiles = allFiles.filter(f => {
    const base = path.basename(f);
    return base === 'index.ts' || base === 'index.js' || base === 'index.tsx' || base === 'index.jsx';
  });
  if (indexFiles.length > 3) {
    // Verify at least one contains export statements
    let hasBarrel = false;
    for (const indexFile of indexFiles.slice(0, 5)) {
      try {
        const content = fs.readFileSync(indexFile, 'utf-8');
        if (content.includes('export {') || content.includes('export *') || content.includes('export { default')) {
          hasBarrel = true;
          break;
        }
      } catch { /* ignore */ }
    }
    if (hasBarrel) {
      patterns.push({
        name: 'barrel-exports',
        evidence: `Found ${indexFiles.length} index files with re-exports`,
        confidence: 85,
      });
    }
  }

  // Check for feature folders pattern
  const srcDir = path.join(targetDir, 'src');
  if (fs.existsSync(srcDir)) {
    try {
      const srcEntries = fs.readdirSync(srcDir, { withFileTypes: true });
      const featureDirs = srcEntries
        .filter(e => e.isDirectory())
        .map(e => e.name);

      if (featureDirs.includes('features') || featureDirs.includes('modules')) {
        patterns.push({
          name: 'feature-folders',
          evidence: `src/ contains feature-based directory structure`,
          confidence: 90,
        });
      }
    } catch { /* ignore */ }
  }

  // Check for MVC pattern
  const mvcIndicators = ['controllers', 'models', 'views', 'services', 'routes'];
  const foundMvc = mvcIndicators.filter(dir => {
    return fs.existsSync(path.join(targetDir, 'src', dir)) || fs.existsSync(path.join(targetDir, dir));
  });
  if (foundMvc.length >= 3) {
    patterns.push({
      name: 'mvc',
      evidence: `Found directories: ${foundMvc.join(', ')}`,
      confidence: 80,
    });
  }

  // Check for clean/hexagonal architecture
  const cleanIndicators = ['domain', 'application', 'infrastructure', 'ports', 'adapters'];
  const foundClean = cleanIndicators.filter(dir => {
    return fs.existsSync(path.join(targetDir, 'src', dir));
  });
  if (foundClean.length >= 2) {
    patterns.push({
      name: 'clean-architecture',
      evidence: `Found directories: ${foundClean.join(', ')}`,
      confidence: 75,
    });
  }

  // Check for colocation pattern (tests alongside source files)
  const testFilesInSrc = allFiles.filter(f => {
    const rel = path.relative(targetDir, f);
    return (rel.startsWith('src') || rel.startsWith('app')) && TEST_PATTERNS.some(p => p.test(path.basename(f)));
  });
  if (testFilesInSrc.length > 2) {
    patterns.push({
      name: 'colocated-tests',
      evidence: `Found ${testFilesInSrc.length} test files alongside source files`,
      confidence: 85,
    });
  }

  // Check for component-driven (if React/Vue/Svelte)
  const componentDirs = allFiles.filter(f => {
    const rel = path.relative(targetDir, f);
    return rel.includes('components') && CODE_EXTENSIONS.has(path.extname(f));
  });
  if (componentDirs.length > 5) {
    patterns.push({
      name: 'component-driven',
      evidence: `Found ${componentDirs.length} files in component directories`,
      confidence: 80,
    });
  }

  // Check for app directory (Next.js app router)
  if (fs.existsSync(path.join(targetDir, 'app')) || fs.existsSync(path.join(targetDir, 'src', 'app'))) {
    const appDir = fs.existsSync(path.join(targetDir, 'src', 'app'))
      ? path.join(targetDir, 'src', 'app')
      : path.join(targetDir, 'app');
    try {
      const entries = fs.readdirSync(appDir);
      if (entries.some(e => e.startsWith('page.') || e.startsWith('layout.'))) {
        patterns.push({
          name: 'app-router',
          evidence: 'Next.js App Router pattern detected',
          confidence: 95,
        });
      }
    } catch { /* ignore */ }
  }

  // Check for pages directory (file-based routing)
  if (fs.existsSync(path.join(targetDir, 'pages')) || fs.existsSync(path.join(targetDir, 'src', 'pages'))) {
    patterns.push({
      name: 'file-based-routing',
      evidence: 'pages/ directory detected',
      confidence: 80,
    });
  }

  return patterns;
}

function detectExistingAgents(targetDir: string): string[] {
  const agentsDir = path.join(targetDir, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) return [];

  const agents: string[] = [];
  try {
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.md')) {
          agents.push(path.relative(agentsDir, path.join(dir, entry.name)));
        }
      }
    };
    walk(agentsDir);
  } catch { /* ignore */ }

  return agents;
}

function mapDirectoryStructure(dir: string, maxDepth: number, depth = 0): string {
  if (depth >= maxDepth) return '';

  const indent = '  '.repeat(depth);
  let result = '';

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const filtered = entries.filter(
      (e) =>
        !e.name.startsWith('.') &&
        !IGNORED_DIRS.has(e.name)
    );

    for (const entry of filtered.slice(0, 25)) {
      if (entry.isDirectory()) {
        result += `${indent}${entry.name}/\n`;
        result += mapDirectoryStructure(path.join(dir, entry.name), maxDepth, depth + 1);
      } else {
        result += `${indent}${entry.name}\n`;
      }
    }

    if (filtered.length > 25) {
      result += `${indent}... and ${filtered.length - 25} more\n`;
    }
  } catch {
    // Permission error
  }

  return result;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
