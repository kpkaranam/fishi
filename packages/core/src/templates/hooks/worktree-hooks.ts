export function getWorktreeHooksScript(): string {
  return `#!/usr/bin/env node
// worktree-hooks.mjs — FISHI Worktree Lifecycle Logger
// Fires on WorktreeCreate and WorktreeRemove events.
// Logs worktree branches to .fishi/state/worktree-log.yaml

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();
const LOG_PATH = join(ROOT, '.fishi', 'state', 'worktree-log.yaml');

// Read event data from stdin
let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf-8').trim();
} catch {
  input = '{}';
}

let event = {};
try {
  event = JSON.parse(input);
} catch {}

const worktreeName = event.worktree?.name || event.name || '';
const worktreeBranch = event.worktree?.branch || event.branch || '';
const worktreePath = event.worktree?.path || event.path || '';
const action = event.event || process.env.CLAUDE_HOOK_EVENT || 'unknown';

if (!worktreeName && !worktreeBranch) {
  process.exit(0); // No worktree info — skip
}

// Read existing log
let yaml = 'worktrees:\\n';
if (existsSync(LOG_PATH)) {
  yaml = readFileSync(LOG_PATH, 'utf-8');
}

const now = new Date().toISOString();

if (action === 'WorktreeCreate' || action === 'worktree_create') {
  yaml += \`  - branch: "\${worktreeBranch || worktreeName}"\\n\`;
  yaml += \`    name: "\${worktreeName}"\\n\`;
  yaml += \`    path: "\${worktreePath}"\\n\`;
  yaml += \`    created: "\${now}"\\n\`;
  yaml += \`    status: "active"\\n\`;
} else if (action === 'WorktreeRemove' || action === 'worktree_remove') {
  // Update existing entry status to 'cleaned'
  yaml = yaml.replace(
    new RegExp(\`(branch: "\${worktreeBranch || worktreeName}"[\\\\s\\\\S]*?status: )"active"\`),
    \`$1"cleaned"\`
  );
}

const dir = dirname(LOG_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
writeFileSync(LOG_PATH, yaml, 'utf-8');

// Also emit monitor event
try {
  const emitterUrl = new URL('./monitor-emitter.mjs', import.meta.url).href;
  const { emitMonitorEvent } = await import(emitterUrl);
  const eventType = action.includes('Create') ? 'worktree.created' : 'worktree.cleaned';
  emitMonitorEvent(ROOT, {
    type: eventType,
    agent: worktreeName || 'system',
    data: { branch: worktreeBranch, path: worktreePath }
  });
} catch {
  try {
    const fallbackUrl = new URL('file:///' + ROOT.replace(/\\\\\\\\/g, '/') + '/.fishi/scripts/monitor-emitter.mjs').href;
    const { emitMonitorEvent } = await import(fallbackUrl);
    emitMonitorEvent(ROOT, {
      type: action.includes('Create') ? 'worktree.created' : 'worktree.cleaned',
      agent: worktreeName || 'system',
      data: { branch: worktreeBranch, path: worktreePath }
    });
  } catch {}
}

process.exit(0);
`;
}
