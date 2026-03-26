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
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const stateFile = join(projectRoot, '.fishi', 'state', 'project.yaml');
const checkpointsDir = join(projectRoot, '.fishi', 'state', 'checkpoints');
const contextFile = join(projectRoot, '.fishi', 'memory', 'project-context.md');
const boardPath = join(projectRoot, '.fishi', 'taskboard', 'board.md');
const treesDir = join(projectRoot, '.trees');

/**
 * Minimal YAML key-value parser. Handles top-level scalar fields only.
 * Supports quoted values (single/double), values containing colons,
 * and extra whitespace. Returns defaults for missing fields.
 */
function parseYamlSimple(content) {
  const result = {};
  for (const line of content.split('\\n')) {
    // Only match top-level keys (no leading whitespace)
    const match = line.match(/^([\\w][\\w.-]*):\\s*(.*)$/);
    if (match) {
      const [, key, rawValue] = match;
      let value = rawValue.trim();
      // Strip matching quotes (single or double)
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

/**
 * Robust field extractor — tries multiple patterns to handle format drift.
 * Works even when project.yaml gets modified with different quoting styles.
 */
function getField(content, key) {
  const patterns = [
    new RegExp('^' + key + ':\\\\s*"([^"]*)"', 'm'),     // key: "value"
    new RegExp('^' + key + ":\\\\s*'([^']*)'", 'm'),      // key: 'value'
    new RegExp('^' + key + ':\\\\s*(.+?)\\\\s*$', 'm'),     // key: value
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m && m[1] && m[1].trim()) return m[1].trim();
  }
  return null;
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
  // Use robust getField for critical fields (survives format drift)
  const projectName = getField(stateContent, 'project') || getField(stateContent, 'name') || state['name'] || state['project'] || 'unknown';
  const phase = getField(stateContent, 'phase') || getField(stateContent, 'current-phase') || state['phase'] || state['current-phase'] || 'unknown';
  const sprint = getField(stateContent, 'sprint') || getField(stateContent, 'current-sprint') || state['sprint'] || state['current-sprint'] || 'none';
  const projectType = getField(stateContent, 'type') || getField(stateContent, 'project-type') || state['type'] || state['project-type'] || 'unknown';

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
    const { emitMonitorEvent } = await import(new URL('./monitor-emitter.mjs', import.meta.url).href);
    emitMonitorEvent(projectRoot, { type: 'session.started', agent: 'master-orchestrator', data: { phase, sprint, projectName, taskCounts } });
  } catch {
    try {
      const { emitMonitorEvent } = await import(new URL('file:///' + projectRoot.replace(/\\\\/g, '/') + '/.fishi/scripts/monitor-emitter.mjs').href);
      emitMonitorEvent(projectRoot, { type: 'session.started', agent: 'master-orchestrator', data: { phase, sprint, projectName, taskCounts } });
    } catch {}
  }

  // ── Log Claude's native worktrees ────────────────────────────────
  try {
    const branches = execSync('git branch', { cwd: projectRoot, encoding: 'utf-8' }).trim().split('\\n');
    const worktreeBranches = branches
      .map(b => b.trim().replace(/^\\*?\\s*/, ''))
      .filter(b => b.startsWith('worktree-agent-'));

    if (worktreeBranches.length > 0) {
      const logPath = join(projectRoot, '.fishi', 'state', 'worktree-log.yaml');
      let existingLog = [];
      if (existsSync(logPath)) {
        const logContent = readFileSync(logPath, 'utf-8');
        const entries = logContent.split('\\n  - branch:').slice(1);
        existingLog = entries.map(e => {
          const m = e.match(/\\s*["']?([^"'\\n]+)/);
          return m ? m[1].trim() : '';
        }).filter(Boolean);
      }

      const newBranches = worktreeBranches.filter(b => !existingLog.includes(b));
      if (newBranches.length > 0) {
        let yaml = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : 'worktrees:\\n';
        for (const branch of newBranches) {
          let commitMsg = '';
          try {
            commitMsg = execSync(\`git log \${branch} -1 --format=%s\`, { cwd: projectRoot, encoding: 'utf-8' }).trim();
          } catch {}
          let merged = false;
          try {
            const mergedBranches = execSync('git branch --merged master', { cwd: projectRoot, encoding: 'utf-8' });
            merged = mergedBranches.includes(branch);
          } catch {
            try {
              const mergedBranches = execSync('git branch --merged main', { cwd: projectRoot, encoding: 'utf-8' });
              merged = mergedBranches.includes(branch);
            } catch {}
          }
          yaml += \`  - branch: "\${branch}"\\n\`;
          yaml += \`    detected: "\${new Date().toISOString()}"\\n\`;
          yaml += \`    status: "\${merged ? 'merged' : 'active'}"\\n\`;
          yaml += \`    commit: "\${commitMsg.replace(/"/g, "'")}"\\n\`;
        }
        mkdirSync(join(projectRoot, '.fishi', 'state'), { recursive: true });
        writeFileSync(logPath, yaml, 'utf-8');
        console.log(\`[FISHI] Worktree branches logged: \${newBranches.length} new, \${existingLog.length} existing\`);
      }

      // Warn about orphaned worktrees (merged but not cleaned)
      const orphaned = worktreeBranches.filter(b => {
        try {
          const merged = execSync('git branch --merged master', { cwd: projectRoot, encoding: 'utf-8' });
          return merged.includes(b);
        } catch {
          try {
            const merged = execSync('git branch --merged main', { cwd: projectRoot, encoding: 'utf-8' });
            return merged.includes(b);
          } catch { return false; }
        }
      });
      if (orphaned.length > 0) {
        console.log(\`[FISHI] Warning: \${orphaned.length} merged worktree branch(es) can be cleaned up:\`);
        for (const b of orphaned.slice(0, 5)) {
          console.log(\`  git branch -d \${b}\`);
        }
        if (orphaned.length > 5) console.log(\`  ... and \${orphaned.length - 5} more\`);
      }
    }
  } catch {}
} catch (err) {
  console.error(\`[FISHI] Session start hook error: \${err.message}\`);
  process.exit(0); // Non-fatal — don't block session
}
`;
}
