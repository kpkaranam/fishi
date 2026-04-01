export function getWorktreeHooksScript(): string {
  return `#!/usr/bin/env node
// worktree-hooks.mjs — FISHI Worktree Lifecycle Logger
// Fires on WorktreeCreate and WorktreeRemove events.
// Logs worktree branches to .fishi/state/worktree-log.yaml
// Also auto-registers tasks in sprint-meta.yaml when Claude Code
// creates worktrees natively (bypassing worktree-manager.mjs).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();
const LOG_PATH = join(ROOT, '.fishi', 'state', 'worktree-log.yaml');

// Read event data from stdin
let input = '';
try {
  input = readFileSync(0, 'utf-8').trim();
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

  // ── Auto-register in sprint-meta if branch follows agent/* pattern ──
  try {
    const branchStr = worktreeBranch || worktreeName || '';
    const branchParts = branchStr.replace(/^refs\\/heads\\//, '').split('/');
    // Expected: agent/{coordinator}/{agent}/{task}
    if (branchParts[0] === 'agent' && branchParts.length >= 4) {
      const coordinator = branchParts[1];
      const agentName = branchParts[2];
      const taskId = branchParts.slice(3).join('-');

      // Check if already registered in sprint-meta
      const metaPath = join(ROOT, '.fishi', 'taskboard', 'sprint-meta.yaml');
      let alreadyRegistered = false;
      if (existsSync(metaPath)) {
        const metaContent = readFileSync(metaPath, 'utf-8');
        if (metaContent.includes('id: ' + taskId)) {
          alreadyRegistered = true;
        }
      }

      if (!alreadyRegistered) {
        // Try worktree-manager.mjs auto-register
        const wmScript = join(ROOT, '.fishi', 'scripts', 'worktree-manager.mjs');
        const tbScript = join(ROOT, '.fishi', 'scripts', 'taskboard-update.mjs');
        let registered = false;

        if (existsSync(wmScript)) {
          try {
            execSync(\`node "\${wmScript}" auto-register --agent "\${agentName}" --task "\${taskId}" --coordinator "\${coordinator}"\`, {
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
          console.log(\`[FISHI] Auto-registered task "\${taskId}" for agent "\${agentName}" in sprint-meta.yaml\`);
        }
      }

      // Write .env.fishi into the worktree path if available
      if (worktreePath) {
        try {
          const envFishiPath = join(worktreePath, '.env.fishi');
          const envContent = 'FISHI_CURRENT_AGENT=' + agentName + '\\nFISHI_CURRENT_TASK=' + taskId + '\\n';
          writeFileSync(envFishiPath, envContent, 'utf-8');
        } catch {}
      }
    }
  } catch {
    // Auto-registration is best-effort — never block worktree creation
  }
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

// Output success for Claude Code hook system
console.log(\`[FISHI] Worktree \${action}: \${worktreeBranch || worktreeName}\`);

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
