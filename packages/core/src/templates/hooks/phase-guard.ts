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
import { join } from 'path';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();
const stateFile = join(ROOT, '.fishi', 'state', 'project.yaml');

// Read tool input from stdin
let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf-8').trim();
} catch {
  // No stdin available — allow action
  process.exit(0);
}

// Parse tool name and arguments
let toolName = '';
let filePath = '';
try {
  const parsed = JSON.parse(input);
  toolName = parsed.tool_name || parsed.tool || '';
  filePath = parsed.file_path || parsed.path || '';
} catch {
  // If not JSON, try to extract from env
  toolName = process.env.CLAUDE_TOOL_NAME || '';
  filePath = process.env.CLAUDE_FILE_PATH || '';
}

// Only guard Write and Edit operations
if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
  process.exit(0);
}

// Allow writes to FISHI infrastructure files
const fishiPaths = ['.fishi/', '.claude/', 'SOUL.md', 'AGENTS.md', 'CLAUDE.md', '.mcp.json', '.gitignore'];
if (fishiPaths.some(p => filePath.includes(p))) {
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

// Phase rules
const planningPhases = ['init', 'discovery', 'prd', 'architecture', 'sprint_planning'];
const deployPhases = ['deployment', 'deployed'];

if (planningPhases.includes(phase)) {
  // Block application code writes during planning phases
  // Allow: docs, plans, PRDs, markdown, yaml
  const allowedExtensions = ['.md', '.yaml', '.yml', '.json', '.txt'];
  const hasAllowedExt = allowedExtensions.some(ext => filePath.endsWith(ext));

  if (!hasAllowedExt) {
    console.error(\`[FISHI PHASE GUARD] Blocked: Cannot write application code during "\${phase}" phase.\`);
    console.error(\`  File: \${filePath}\`);
    console.error(\`  Current phase only allows: documentation, plans, and configuration files.\`);
    console.error(\`  To advance: node .fishi/scripts/gate-manager.mjs approve --phase \${phase}\`);
    process.exit(2); // Exit code 2 = block the action
  }
}

if (phase === 'development') {
  // During development, warn if writing outside a worktree
  if (!filePath.includes('.trees/') && !filePath.includes('.trees\\\\')) {
    // Allow package.json, config files at root
    const rootConfigs = ['package.json', 'tsconfig', '.eslintrc', '.prettierrc', 'next.config', 'vite.config', 'astro.config'];
    const isRootConfig = rootConfigs.some(c => filePath.includes(c));

    if (!isRootConfig) {
      console.error(\`[FISHI PHASE GUARD] Warning: Writing code outside a worktree.\`);
      console.error(\`  File: \${filePath}\`);
      console.error(\`  Recommended: Create a worktree first:\`);
      console.error(\`  node .fishi/scripts/worktree-manager.mjs create --agent {agent} --task {task} --coordinator dev-lead\`);
      // Warning only — don't block (exit 0)
    }
  }
}

// Allow everything else
process.exit(0);
`;
}
