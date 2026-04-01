/**
 * Sprint Completion Guard Hook Template
 *
 * STATE-BASED PreToolUse hook that blocks code-writing agent dispatches
 * unless QA has approved all completed sprints. Does NOT rely on parsing
 * sprint numbers from prompts — instead checks actual project state.
 */
export function getSprintCompletionGuardHook(): string {
  return `#!/usr/bin/env node
// sprint-completion-guard.mjs — FISHI Sprint Completion Guard
// STATE-BASED enforcement: checks if QA has approved all completed sprints
// before allowing ANY code-writing agent dispatch.
// Does NOT rely on parsing sprint numbers from prompts.

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

// ── Only fire on Agent tool dispatches for code-writing agents ──────
const CODE_AGENTS = ['backend-agent', 'frontend-agent', 'fullstack-agent', 'testing-agent', 'devops-agent'];

let input = '';
try { input = readFileSync(0, 'utf-8').trim(); } catch { process.exit(0); }

let toolName = '';
let agentType = '';
try {
  const parsed = JSON.parse(input);
  toolName = parsed.tool_name || '';
  const ti = parsed.tool_input || parsed;
  agentType = ti.subagent_type || ti.agent_type || '';
} catch { process.exit(0); }

if (toolName !== 'Agent') process.exit(0);
if (!CODE_AGENTS.includes(agentType)) process.exit(0);

// ── Only enforce during development phase ───────────────────────────
const stateFile = join(ROOT, '.fishi', 'state', 'project.yaml');
if (!existsSync(stateFile)) process.exit(0);

let phase = 'init';
try {
  const content = readFileSync(stateFile, 'utf-8');
  const m = content.match(/^phase:\\s*(.+)$/m);
  if (m) phase = m[1].trim();
} catch {}

if (phase !== 'development' && phase !== 'qa_security') process.exit(0);

// ── Auto-sync sprint-meta with git state ────────────────────────────
try {
  const wmScript = join(ROOT, '.fishi', 'scripts', 'worktree-manager.mjs');
  if (existsSync(wmScript)) {
    execSync(\`node "\${wmScript}" sync\`, {
      cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000
    });
  }
} catch {}

// ── Detect completed sprints that need QA approval ──────────────────
const sprintsDir = join(ROOT, '.fishi', 'taskboard', 'sprints');
if (!existsSync(sprintsDir)) process.exit(0);

const sprintFiles = readdirSync(sprintsDir)
  .filter(f => /sprint-\\d+\\.md$/i.test(f))
  .sort();

if (sprintFiles.length === 0) process.exit(0);

// Read board.md Done section
const boardPath = join(ROOT, '.fishi', 'taskboard', 'board.md');
let doneSection = '';
if (existsSync(boardPath)) {
  const board = readFileSync(boardPath, 'utf-8');
  doneSection = board.split(/^## Done/m)[1] || '';
}

const issues = [];
let lastUnapprovedSprint = null;

for (const sf of sprintFiles) {
  const sprintContent = readFileSync(join(sprintsDir, sf), 'utf-8');
  const numMatch = sf.match(/sprint-0*(\\d+)/);
  if (!numMatch) continue;
  const sprintNum = parseInt(numMatch[1], 10);

  // Extract TASK-NNN IDs from this sprint file
  const taskIds = [];
  const taskMatches = sprintContent.matchAll(/TASK-(\\d+)/g);
  for (const tm of taskMatches) taskIds.push('TASK-' + tm[1]);
  if (taskIds.length === 0) continue;

  // Check if ALL tasks from this sprint are in board.md Done section
  const allDone = taskIds.every(tid => doneSection.includes(tid));
  if (!allDone) continue; // Sprint still in progress — skip

  // Sprint is complete (all tasks in Done). Check QA approval.
  const qaPath = join(ROOT, '.fishi', 'state', 'qa-results', \`sprint-\${sprintNum}-full-review.json\`);
  if (existsSync(qaPath)) {
    try {
      const qa = JSON.parse(readFileSync(qaPath, 'utf-8'));
      if (qa.result === 'APPROVED') continue; // QA approved — good
      issues.push(\`Sprint \${sprintNum} QA result: \${qa.result}. Must be APPROVED.\`);
    } catch {
      issues.push(\`Sprint \${sprintNum} QA result file corrupted.\`);
    }
  } else {
    lastUnapprovedSprint = sprintNum;
    issues.push(\`Sprint \${sprintNum} — all tasks Done but QA review not run. Quality Lead must dispatch QA Agent.\`);
  }
}

if (issues.length > 0) {
  process.stderr.write('[FISHI SPRINT GUARD] BLOCKED — QA review required:\\n');
  for (const issue of issues) {
    process.stderr.write('  - ' + issue + '\\n');
  }
  process.stderr.write('\\nTo resolve:\\n');
  process.stderr.write('  1. Quality Lead dispatches QA Agent for sprint review\\n');
  process.stderr.write('  2. QA Agent writes: .fishi/state/qa-results/sprint-{N}-full-review.json\\n');
  process.stderr.write('  3. File must contain: { "result": "APPROVED" }\\n');
  if (lastUnapprovedSprint) {
    process.stderr.write('\\n  Quick manual approve (testing only):\\n');
    process.stderr.write(\`  echo '{"sprint":\${lastUnapprovedSprint},"result":"APPROVED"}' > .fishi/state/qa-results/sprint-\${lastUnapprovedSprint}-full-review.json\\n\`);
  }
  process.exit(2); // BLOCK
}

process.exit(0);
`;
}
