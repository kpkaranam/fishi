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
// Also auto-registers tasks in sprint-meta.yaml when Agent tool bypasses
// worktree-manager.mjs (Claude Code creates worktrees natively).
// Zero dependencies: uses only Node.js built-ins.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

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
  input = readFileSync(0, 'utf-8').trim();
} catch {
  process.exit(0); // No stdin — allow
}

// Parse the Agent tool parameters
// Claude Code sends: { tool_name, tool_input: { subagent_type, isolation, prompt, ... } }
let agentType = '';
let hasIsolation = false;
let prompt = '';
try {
  const parsed = JSON.parse(input);
  const ti = parsed.tool_input || parsed;
  agentType = ti.subagent_type || ti.agent_type || parsed.subagent_type || '';
  hasIsolation = (ti.isolation || parsed.isolation) === 'worktree';
  prompt = ti.prompt || parsed.prompt || '';
} catch {
  process.exit(0); // Can't parse — allow
}

// ── Auto-register task in sprint-meta (runs for ALL agent dispatches) ──
// This runs BEFORE enforcement checks so tasks are tracked even if the
// guard would otherwise exit early (wrong phase, non-code agent, etc.)
if (agentType && prompt) {
  try {
    const agentName = agentType.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Extract task ID from prompt
    let taskId = null;
    const taskPatterns = [
      /\\[TASK\\]\\s*(?:TASK-)?([a-zA-Z0-9][-a-zA-Z0-9]*)/i,
      /TASK-(\\d+)/,
      /--task\\s+(\\S+)/,
      /^(?:implement|build|create|fix|add|update|refactor)\\s+(\\S+)/im
    ];
    for (const pat of taskPatterns) {
      const m = prompt.match(pat);
      if (m) {
        taskId = m[1].toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '');
        break;
      }
    }
    if (!taskId) {
      const words = prompt.replace(/[^a-zA-Z0-9\\s-]/g, '').trim().split(/\\s+/);
      taskId = (words[0] || 'unknown').toLowerCase().slice(0, 30);
    }

    // Extract scope from prompt
    let scope = '';
    const scopeMatch = prompt.match(/\\[(?:SCOPE|FILES)\\]\\s*([^\\[]+?)(?=\\n\\[|$)/is);
    if (scopeMatch) {
      const paths = scopeMatch[1].match(/[\\w./-]+\\.[a-z]{1,5}/g);
      if (paths) scope = paths.join(',');
    }

    // Register if not already tracked
    const metaPath = join(ROOT, '.fishi', 'taskboard', 'sprint-meta.yaml');
    const metaDir = join(ROOT, '.fishi', 'taskboard');
    if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });

    let alreadyRegistered = false;
    if (existsSync(metaPath)) {
      const meta = readFileSync(metaPath, 'utf-8');
      if (meta.includes('id: ' + taskId)) alreadyRegistered = true;
    }

    if (!alreadyRegistered) {
      const wmScript = join(ROOT, '.fishi', 'scripts', 'worktree-manager.mjs');
      const tbScript = join(ROOT, '.fishi', 'scripts', 'taskboard-update.mjs');
      let registered = false;

      if (existsSync(wmScript)) {
        try {
          const scopeArg = scope ? \` --scope "\${scope}"\` : '';
          execSync(\`node "\${wmScript}" auto-register --agent "\${agentName}" --task "\${taskId}" --coordinator "dev-lead"\${scopeArg}\`, {
            cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000
          });
          registered = true;
        } catch {}
      }

      if (!registered && existsSync(tbScript)) {
        try {
          execSync(\`node "\${tbScript}" add-task --id "\${taskId}" --agent "\${agentName}" --worktree "auto-\${agentName}-\${taskId}"\`, {
            cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000
          });
          registered = true;
        } catch {}
      }

      if (registered) {
        process.stderr.write(\`[FISHI] Auto-registered task "\${taskId}" for agent "\${agentName}" in sprint-meta.yaml\\n\`);
      }
    }
  } catch {
    // Auto-registration is best-effort — never block Agent dispatch
  }
}

// ── Enforcement checks (only during development/QA phases) ──────────

// Only enforce isolation for worktree-required agents
if (!WORKTREE_REQUIRED_AGENTS.includes(agentType)) {
  process.exit(0);
}

// Check current phase
if (!existsSync(stateFile)) {
  process.exit(0);
}

let phase = 'init';
try {
  const content = readFileSync(stateFile, 'utf-8');
  const match = content.match(/^phase:\\s*(.+)$/m);
  if (match) phase = match[1].trim();
} catch {
  process.exit(0);
}

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
