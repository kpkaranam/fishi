/**
 * Phase Guard Hook Template
 *
 * PreToolUse hook that checks the current phase before allowing
 * Write/Edit operations. Blocks code writes in planning phases.
 * Warns about writes to main branch during development.
 */
export function getPhaseGuardHook(): string {
  return `#!/usr/bin/env node
// phase-guard.mjs — FISHI Phase Guard Hook
// Runs before Write/Edit to enforce phase-appropriate actions.
// Zero dependencies: uses only Node.js built-ins.

import { readFileSync, existsSync } from 'fs';
import { join, resolve, normalize } from 'path';

const ROOT = normalize(process.env.FISHI_PROJECT_ROOT || process.cwd());
const stateFile = join(ROOT, '.fishi', 'state', 'project.yaml');

// Read tool input from stdin
let input = '';
try {
  input = readFileSync(0, 'utf-8').trim();
} catch {
  // No stdin available — allow action
  process.exit(0);
}

// Parse tool name and arguments
// Claude Code sends: { tool_name, tool_input: { file_path, ... } }
let toolName = '';
let filePath = '';
try {
  const parsed = JSON.parse(input);
  toolName = parsed.tool_name || parsed.tool || '';
  // file_path may be top-level or nested under tool_input
  const ti = parsed.tool_input || {};
  filePath = ti.file_path || ti.path || parsed.file_path || parsed.path || '';
} catch {
  // If not JSON, try to extract from env
  toolName = process.env.CLAUDE_TOOL_NAME || '';
  filePath = process.env.CLAUDE_FILE_PATH || '';
}

// Only guard Write and Edit operations
if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
  process.exit(0);
}

// Issue 1: Empty file_path — fail-open (the Write/Edit tool itself validates paths)
if (!filePath || filePath.trim() === '') {
  process.exit(0);
}

// Normalize path separators for cross-platform matching
const normalizedPath = filePath.replace(/\\\\\\\\/g, '/');

// Issue 2: Paths outside project root (e.g., ~/.claude/projects/ memory files)
const normalizedRoot = ROOT.replace(/\\\\\\\\/g, '/');
if (normalizedPath.startsWith('/') || /^[A-Za-z]:/.test(normalizedPath)) {
  // Absolute path — check if it's inside the project
  if (!normalizedPath.startsWith(normalizedRoot)) {
    process.exit(0); // Outside project — not our concern
  }
}

// Allow writes to FISHI infrastructure files
const infraPatterns = ['.fishi/', '.claude/', 'SOUL.md', 'AGENTS.md', 'CLAUDE.md', '.mcp.json', '.gitignore', '.github/'];
if (infraPatterns.some(p => normalizedPath.includes(p))) {
  process.exit(0);
}

// Allow common build/config files across all languages
const configFiles = [
  'package.json', 'package-lock.json', 'tsconfig', '.eslintrc', '.prettierrc',
  'next.config', 'vite.config', 'astro.config', '.env', 'pnpm-lock', 'yarn.lock', 'bun.lockb',
  'go.mod', 'go.sum', 'Cargo.toml', 'Cargo.lock', 'Makefile', 'Dockerfile',
  'docker-compose', 'pyproject.toml', 'setup.py', 'requirements.txt', 'Gemfile',
  '.goreleaser', '.golangci', 'jest.config', 'vitest.config', 'playwright.config',
];
if (configFiles.some(c => normalizedPath.includes(c))) {
  process.exit(0);
}

// Read current phase
if (!existsSync(stateFile)) {
  process.exit(0); // No state file — allow
}

let phase = 'init';
try {
  const content = readFileSync(stateFile, 'utf-8');
  const match = content.match(/^phase:\\s*(.+)$/m);
  if (match) phase = match[1].trim();
} catch {
  process.exit(0);
}

// Issue 3: Allow merge conflict resolution in any phase
try {
  if (existsSync(filePath) || existsSync(resolve(ROOT, filePath))) {
    const target = existsSync(filePath) ? filePath : resolve(ROOT, filePath);
    const content = readFileSync(target, 'utf-8');
    if (content.includes('<<<<<<<') || content.includes('>>>>>>>')) {
      process.exit(0); // Merge conflict — always allow resolution
    }
  }
} catch {}

// Phase rules
const planningPhases = ['init', 'discovery', 'prd', 'architecture', 'sprint_planning'];

if (planningPhases.includes(phase)) {
  // Block application code writes during planning phases
  // Allow: docs, plans, PRDs, markdown, yaml, json, txt
  const allowedExtensions = ['.md', '.yaml', '.yml', '.json', '.txt', '.toml'];
  const hasAllowedExt = allowedExtensions.some(ext => normalizedPath.endsWith(ext));

  if (!hasAllowedExt) {
    console.error(\`[FISHI PHASE GUARD] Blocked: Cannot write application code during "\${phase}" phase.\`);
    console.error(\`  File: \${filePath}\`);
    console.error(\`  Current phase only allows: documentation, plans, and configuration files.\`);
    console.error(\`  To advance: node .fishi/scripts/gate-manager.mjs approve --phase \${phase}\`);
    process.exit(2);
  }
}

if (phase === 'development' || phase === 'qa_security') {
  // During development/QA, BLOCK code writes outside a worktree
  if (!normalizedPath.includes('.trees/')) {
    // Allow documentation and plan files
    const allowedExtensions = ['.md', '.yaml', '.yml', '.txt', '.toml'];
    const hasAllowedExt = allowedExtensions.some(ext => normalizedPath.endsWith(ext));

    // Allow test result/report files
    const isTestOutput = ['coverage/', 'test-results/', '.fishi/quality/', '__snapshots__/'].some(p => normalizedPath.includes(p));

    if (!hasAllowedExt && !isTestOutput) {
      console.error(\`[FISHI PHASE GUARD] BLOCKED: Cannot write application code outside a worktree during "\${phase}" phase.\`);
      console.error(\`  File: \${filePath}\`);
      console.error(\`  All code changes during development MUST happen in an agent worktree.\`);
      console.error(\`  Create a worktree first:\`);
      console.error(\`  node .fishi/scripts/worktree-manager.mjs create --agent {agent} --task {task} --coordinator dev-lead\`);
      process.exit(2);
    }
  }
}

// Allow everything else
process.exit(0);
`;
}
