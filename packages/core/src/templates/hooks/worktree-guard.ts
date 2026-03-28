/**
 * Worktree Guard Hook Template
 *
 * PreToolUse hook for the Agent tool that validates worktree-required agents
 * (backend-agent, frontend-agent, fullstack-agent, testing-agent, devops-agent)
 * are dispatched with isolation: "worktree" during development/QA phases.
 *
 * Blocks Agent tool calls that would run code-writing agents on the main branch.
 */
export function getWorktreeGuardHook(): string {
  return `#!/usr/bin/env node
// worktree-guard.mjs — FISHI Worktree Guard Hook
// PreToolUse hook for Agent tool. Validates that code-writing agents
// are dispatched with isolation: "worktree" during development/QA phases.
// Zero dependencies: uses only Node.js built-ins.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();
const stateFile = join(ROOT, '.fishi', 'state', 'project.yaml');

// Agents that MUST run in worktrees (they write application code)
const WORKTREE_REQUIRED_AGENTS = [
  'backend-agent',
  'frontend-agent',
  'fullstack-agent',
  'testing-agent',
  'devops-agent',
];

// Phases where worktree enforcement applies
const ENFORCED_PHASES = ['development', 'qa_security'];

// Read tool input from stdin
let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf-8').trim();
} catch {
  process.exit(0); // No stdin — allow
}

// Parse the Agent tool parameters
let agentType = '';
let hasIsolation = false;
let prompt = '';
try {
  const parsed = JSON.parse(input);
  agentType = parsed.subagent_type || parsed.agent_type || '';
  hasIsolation = parsed.isolation === 'worktree';
  prompt = parsed.prompt || '';
} catch {
  process.exit(0); // Can't parse — allow
}

// Only enforce for worktree-required agents
if (!WORKTREE_REQUIRED_AGENTS.includes(agentType)) {
  process.exit(0);
}

// Check current phase
if (!existsSync(stateFile)) {
  process.exit(0); // No state — allow (might be outside FISHI project)
}

let phase = 'init';
try {
  const content = readFileSync(stateFile, 'utf-8');
  const match = content.match(/^phase:\\s*(.+)$/m);
  if (match) phase = match[1].trim();
} catch {
  process.exit(0);
}

// Only enforce during development/QA phases
if (!ENFORCED_PHASES.includes(phase)) {
  process.exit(0);
}

// ENFORCE: worktree-required agents MUST have isolation: "worktree"
if (!hasIsolation) {
  console.error(\`[FISHI WORKTREE GUARD] BLOCKED: Agent "\${agentType}" requires isolation: "worktree".\`);
  console.error(\`  Current phase: \${phase}\`);
  console.error(\`  Code-writing agents MUST run in isolated worktrees during development.\`);
  console.error(\`  Fix: Add isolation: "worktree" to your Agent tool call.\`);
  console.error(\`  Or create a worktree first:\`);
  console.error(\`  node .fishi/scripts/worktree-manager.mjs create --agent \${agentType} --task {task-slug} --coordinator dev-lead\`);
  process.exit(2); // Exit code 2 = BLOCK the action
}

// Agent has isolation — allow
process.exit(0);
`;
}
