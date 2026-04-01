/**
 * Sprint Completion Guard Hook Template
 *
 * PreToolUse hook on Agent dispatches that prevents starting Sprint N+1
 * without completing Sprint N tracking (sprint file, tasks, board, epics).
 */
export function getSprintCompletionGuardHook(): string {
  return `#!/usr/bin/env node
// sprint-completion-guard.mjs — FISHI Sprint Completion Guard
// Prevents dispatching new sprint work if current sprint isn't properly closed.
// Checks: sprint file marked COMPLETED, all tasks [x], board updated, epics updated.

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

// Read tool input from stdin
let input = '';
try {
  input = readFileSync(0, 'utf-8').trim();
} catch {
  process.exit(0);
}

// Only check on Agent dispatches
let toolName = '';
let prompt = '';
try {
  const parsed = JSON.parse(input);
  toolName = parsed.tool_name || '';
  const ti = parsed.tool_input || parsed;
  prompt = (ti.prompt || '').toLowerCase();
} catch {
  process.exit(0);
}

if (toolName !== 'Agent') {
  process.exit(0);
}

// Only enforce if prompt mentions a sprint number
const sprintMatch = prompt.match(/sprint\\s+(\\d+)/i);
if (!sprintMatch) {
  process.exit(0); // Not sprint-related — allow
}

const requestedSprint = parseInt(sprintMatch[1], 10);
if (requestedSprint <= 1) {
  process.exit(0); // Sprint 1 has no predecessor to check
}

// Auto-sync sprint-meta with git state before checking
try {
  const wmScript = join(ROOT, '.fishi', 'scripts', 'worktree-manager.mjs');
  if (existsSync(wmScript)) {
    execSync(\`node "\${wmScript}" sync\`, {
      cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000
    });
  }
} catch {}

// Check if previous sprint is properly closed
const prevSprint = requestedSprint - 1;
const sprintsDir = join(ROOT, '.fishi', 'taskboard', 'sprints');
const issues = [];

if (!existsSync(sprintsDir)) {
  process.exit(0); // No sprints dir — skip check
}

// Check 1: Previous sprint file exists and is marked complete
const sprintFiles = existsSync(sprintsDir) ? readdirSync(sprintsDir).filter(f => f.includes(\`sprint-\${prevSprint}\`) || f.includes(\`sprint-0\${prevSprint}\`)) : [];
if (sprintFiles.length === 0) {
  issues.push(\`Sprint \${prevSprint} file not found in \${sprintsDir}\`);
} else {
  const sprintContent = readFileSync(join(sprintsDir, sprintFiles[0]), 'utf-8');

  // Check if marked as completed
  if (!sprintContent.toLowerCase().includes('completed') && !sprintContent.toLowerCase().includes('done') && !sprintContent.toLowerCase().includes('closed')) {
    issues.push(\`Sprint \${prevSprint} file not marked as COMPLETED/DONE\`);
  }

  // Check 2: All tasks are checked off
  const unchecked = (sprintContent.match(/^\\s*-\\s*\\[\\s*\\]/gm) || []).length;
  if (unchecked > 0) {
    issues.push(\`Sprint \${prevSprint} has \${unchecked} unchecked tasks\`);
  }
}

// Check 3: Board file has tasks in Done column
const boardPath = join(ROOT, '.fishi', 'taskboard', 'board.md');
if (existsSync(boardPath)) {
  const board = readFileSync(boardPath, 'utf-8');
  const doneSection = board.split(/^## Done/m)[1];
  if (!doneSection || !doneSection.includes('[x]')) {
    issues.push('Board has no completed tasks in Done column');
  }
}

// Check 4: No active agent worktrees remaining
try {
  const worktreeList = execSync('git worktree list --porcelain', { cwd: ROOT, encoding: 'utf-8' });
  const activeAgentWorktrees = worktreeList.split('\\n').filter(l => l.startsWith('branch refs/heads/agent/')).length;
  if (activeAgentWorktrees > 0) {
    issues.push(\`\${activeAgentWorktrees} agent worktree(s) still active. Run: node .fishi/scripts/worktree-manager.mjs sprint-cleanup --sprint \${prevSprint}\`);
  }
} catch {}

// Check 5: QA approval required
const qaResultPath = join(ROOT, '.fishi', 'state', 'qa-results', \`sprint-\${prevSprint}-full-review.json\`);
if (existsSync(qaResultPath)) {
  try {
    const qaResult = JSON.parse(readFileSync(qaResultPath, 'utf-8'));
    if (qaResult.result !== 'APPROVED') {
      issues.push(\`Sprint \${prevSprint} QA review not approved (result: \${qaResult.result}). Run full QA review before starting Sprint \${requestedSprint}.\`);
    }
  } catch {
    issues.push(\`Sprint \${prevSprint} QA result file is corrupted. Re-run QA review.\`);
  }
} else {
  issues.push(\`Sprint \${prevSprint} QA review not found. Run full QA review before starting Sprint \${requestedSprint}.\`);
}

if (issues.length > 0) {
  console.error(\`[FISHI SPRINT GUARD] Cannot start Sprint \${requestedSprint} — Sprint \${prevSprint} tracking incomplete:\`);
  for (const issue of issues) {
    console.error(\`  - \${issue}\`);
  }
  console.error('');
  console.error('Complete the sprint tracking first:');
  console.error(\`  1. Mark all tasks as [x] in .fishi/taskboard/sprints/sprint-\${prevSprint}.md\`);
  console.error(\`  2. Move completed tasks to Done in .fishi/taskboard/board.md\`);
  console.error(\`  3. Add "Status: COMPLETED" to the sprint file\`);
  process.exit(2); // Block
}

console.log(\`[FISHI] Sprint \${prevSprint} tracking verified — Sprint \${requestedSprint} can proceed\`);
process.exit(0);
`;
}
