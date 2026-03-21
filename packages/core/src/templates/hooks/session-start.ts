/**
 * Session Start Hook Template
 *
 * Generates an .mjs hook that fires on SessionStart. It reads project state,
 * the latest checkpoint, project context memory, and the taskboard to output
 * a structured resume context summary to stdout for Claude Code to capture.
 */
export function getSessionStartHook(): string {
  return `#!/usr/bin/env node
// session-start.mjs — FISHI session start hook
// Zero dependencies: uses only Node.js built-ins
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const stateFile = join(projectRoot, '.fishi', 'state', 'project.yaml');
const checkpointsDir = join(projectRoot, '.fishi', 'state', 'checkpoints');
const contextFile = join(projectRoot, '.fishi', 'memory', 'project-context.md');
const boardPath = join(projectRoot, '.fishi', 'taskboard', 'board.md');
const treesDir = join(projectRoot, '.trees');

/**
 * Minimal YAML key-value parser. Handles top-level scalar fields only.
 * Does not handle nested objects, arrays, or multi-line values.
 */
function parseYamlSimple(content) {
  const result = {};
  for (const line of content.split('\\n')) {
    const match = line.match(/^([\\w][\\w.-]*):\\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      result[key] = value.replace(/^['"]|['"]$/g, '').trim();
    }
  }
  return result;
}

/**
 * Count tasks per column in a markdown taskboard.
 * Columns are identified by ## headings. Tasks are lines starting with "- ".
 */
function countTasksByColumn(content) {
  const counts = { backlog: 0, ready: 0, inProgress: 0, review: 0, done: 0 };
  const columnMap = {
    'backlog': 'backlog',
    'ready': 'ready',
    'to do': 'ready',
    'in progress': 'inProgress',
    'in-progress': 'inProgress',
    'review': 'review',
    'in review': 'review',
    'done': 'done',
    'complete': 'done',
    'completed': 'done',
  };

  let currentColumn = null;
  for (const line of content.split('\\n')) {
    const heading = line.match(/^##\\s+(.+)/);
    if (heading) {
      const normalized = heading[1].trim().toLowerCase();
      currentColumn = columnMap[normalized] || null;
      continue;
    }
    if (currentColumn && /^\\s*-\\s+/.test(line)) {
      counts[currentColumn]++;
    }
  }
  return counts;
}

/**
 * Find the latest checkpoint file by sorting checkpoint filenames.
 */
function findLatestCheckpoint() {
  if (!existsSync(checkpointsDir)) return null;
  try {
    const files = readdirSync(checkpointsDir)
      .filter(f => /^checkpoint-\\d+\\.yaml$/.test(f))
      .sort();
    if (files.length === 0) return null;
    const latest = files[files.length - 1];
    return {
      name: latest,
      path: join(checkpointsDir, latest),
    };
  } catch {
    return null;
  }
}

/**
 * List active worktrees from .trees/ directory.
 */
function listWorktrees() {
  if (!existsSync(treesDir)) return [];
  try {
    return readdirSync(treesDir).filter(entry => {
      try {
        const stat = readdirSync(join(treesDir, entry));
        return true; // If we can list it, it's a directory
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

try {
  // ── First-run check ────────────────────────────────────────────────
  if (!existsSync(stateFile)) {
    console.log('[FISHI] No project state found. Starting fresh session.');
    process.exit(0);
  }

  // ── Read project state ─────────────────────────────────────────────
  const stateContent = readFileSync(stateFile, 'utf-8');
  const state = parseYamlSimple(stateContent);
  const projectName = state['name'] || state['project'] || 'unknown';
  const phase = state['phase'] || state['current-phase'] || 'unknown';
  const sprint = state['sprint'] || state['current-sprint'] || 'none';
  const projectType = state['type'] || state['project-type'] || 'unknown';

  // ── Find latest checkpoint ─────────────────────────────────────────
  const checkpoint = findLatestCheckpoint();
  let checkpointData = {};
  if (checkpoint) {
    try {
      checkpointData = parseYamlSimple(readFileSync(checkpoint.path, 'utf-8'));
    } catch {
      // Checkpoint file unreadable — continue without it
    }
  }

  // ── Read project context (compressed memory) ───────────────────────
  let contextSummary = '';
  if (existsSync(contextFile)) {
    try {
      const ctx = readFileSync(contextFile, 'utf-8');
      // Extract first non-empty, non-heading line as a brief summary
      const lines = ctx.split('\\n').filter(l => l.trim() && !l.startsWith('#'));
      if (lines.length > 0) {
        contextSummary = lines[0].trim().substring(0, 200);
      }
    } catch {
      // Context file unreadable — continue without it
    }
  }

  // ── Count taskboard items ──────────────────────────────────────────
  let taskCounts = { backlog: 0, ready: 0, inProgress: 0, review: 0, done: 0 };
  if (existsSync(boardPath)) {
    try {
      taskCounts = countTasksByColumn(readFileSync(boardPath, 'utf-8'));
    } catch {
      // Board unreadable — use zeroes
    }
  }

  // ── List worktrees ─────────────────────────────────────────────────
  const worktrees = listWorktrees();

  // ── Output structured resume context ───────────────────────────────
  console.log(\`[FISHI] Resuming project: \${projectName}\`);
  console.log(\`Phase: \${phase} | Sprint: \${sprint} | Type: \${projectType}\`);
  console.log(\`TaskBoard: \${taskCounts.backlog} backlog, \${taskCounts.ready} ready, \${taskCounts.inProgress} in progress, \${taskCounts.review} in review, \${taskCounts.done} done\`);
  console.log(\`Active worktrees: \${worktrees.length > 0 ? worktrees.join(', ') : 'none'}\`);

  if (checkpoint) {
    const ts = checkpointData['timestamp'] || 'unknown';
    console.log(\`Last checkpoint: \${checkpoint.name} at \${ts}\`);
  } else {
    console.log('Last checkpoint: none');
  }

  const nextAction = checkpointData['next_action'] || checkpointData['next-action'] || 'Review taskboard and continue current sprint';
  console.log(\`Next action: \${nextAction}\`);

  if (contextSummary) {
    console.log(\`Context: \${contextSummary}\`);
  }

  // Emit monitoring event
  try {
    const { emitMonitorEvent } = await import('./monitor-emitter.mjs');
    emitMonitorEvent(projectRoot, { type: 'session.started', agent: 'master-orchestrator', data: { phase, sprint, projectName, taskCounts } });
  } catch {}
} catch (err) {
  console.error(\`[FISHI] Session start hook error: \${err.message}\`);
  process.exit(0); // Non-fatal — don't block session
}
`;
}
