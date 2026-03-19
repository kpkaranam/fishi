#!/usr/bin/env node
// auto-checkpoint.mjs — FISHI auto-checkpoint hook
// Zero dependencies: uses only Node.js built-ins
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

const MAX_CHECKPOINTS = 50;
const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const stateDir = join(projectRoot, '.fishi', 'state');
const checkpointsDir = join(stateDir, 'checkpoints');
const stateFile = join(stateDir, 'project.yaml');
const boardPath = join(projectRoot, '.fishi', 'taskboard', 'board.md');
const treesDir = join(projectRoot, '.trees');

/**
 * Minimal YAML key-value parser for top-level scalar fields.
 */
function parseYamlSimple(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([\w][\w.-]*):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      result[key] = value.replace(/^['"]|['"]$/g, '').trim();
    }
  }
  return result;
}

/**
 * Count tasks per column in a markdown taskboard.
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
  for (const line of content.split('\n')) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      currentColumn = columnMap[heading[1].trim().toLowerCase()] || null;
      continue;
    }
    if (currentColumn && /^\s*-\s+/.test(line)) {
      counts[currentColumn]++;
    }
  }
  return counts;
}

/**
 * List active worktrees with basic metadata from .trees/ directory.
 */
function listWorktrees() {
  if (!existsSync(treesDir)) return [];
  try {
    const entries = readdirSync(treesDir);
    const worktrees = [];
    for (const entry of entries) {
      const entryPath = join(treesDir, entry);
      try {
        const stat = statSync(entryPath);
        if (stat.isDirectory()) {
          // Try to read worktree metadata
          const metaPath = join(entryPath, '.fishi-worktree.yaml');
          let meta = {};
          if (existsSync(metaPath)) {
            try {
              meta = parseYamlSimple(readFileSync(metaPath, 'utf-8'));
            } catch { /* ignore */ }
          }
          worktrees.push({
            path: entryPath,
            branch: meta['branch'] || entry,
            agent: meta['agent'] || 'unknown',
            status: meta['status'] || 'active',
          });
        }
      } catch { /* skip unreadable entries */ }
    }
    return worktrees;
  } catch {
    return [];
  }
}

/**
 * Prune old checkpoints to keep at most MAX_CHECKPOINTS files.
 */
function pruneCheckpoints() {
  try {
    const files = readdirSync(checkpointsDir)
      .filter(f => /^checkpoint-\d+\.yaml$/.test(f))
      .sort();
    const excess = files.length - MAX_CHECKPOINTS;
    if (excess > 0) {
      for (let i = 0; i < excess; i++) {
        try {
          unlinkSync(join(checkpointsDir, files[i]));
        } catch { /* ignore deletion errors */ }
      }
    }
  } catch { /* ignore */ }
}

try {
  mkdirSync(checkpointsDir, { recursive: true });

  // ── Read current project state ─────────────────────────────────────
  let state = {};
  if (existsSync(stateFile)) {
    state = parseYamlSimple(readFileSync(stateFile, 'utf-8'));
  }

  // ── Determine next checkpoint number ───────────────────────────────
  let maxNum = 0;
  try {
    const files = readdirSync(checkpointsDir);
    for (const f of files) {
      const match = f.match(/^checkpoint-(\d+)\.yaml$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  } catch { /* directory may be empty */ }

  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(4, '0');
  const checkpointName = `checkpoint-${paddedNum}.yaml`;
  const checkpointPath = join(checkpointsDir, checkpointName);

  // ── Read taskboard counts ──────────────────────────────────────────
  let taskCounts = { backlog: 0, ready: 0, inProgress: 0, review: 0, done: 0 };
  if (existsSync(boardPath)) {
    try {
      taskCounts = countTasksByColumn(readFileSync(boardPath, 'utf-8'));
    } catch { /* use zeroes */ }
  }

  // ── List active worktrees ──────────────────────────────────────────
  const worktrees = listWorktrees();

  // ── Build checkpoint YAML ──────────────────────────────────────────
  const now = new Date().toISOString();
  const checkpointLines = [
    `checkpoint_id: ${paddedNum}`,
    `timestamp: ${now}`,
    `phase: ${state['phase'] || state['current-phase'] || 'unknown'}`,
    `sprint: ${state['sprint'] || state['current-sprint'] || 'none'}`,
    `project: ${state['name'] || state['project'] || 'unknown'}`,
    '',
    'taskboard_snapshot:',
    `  backlog: ${taskCounts.backlog}`,
    `  ready: ${taskCounts.ready}`,
    `  in_progress: ${taskCounts.inProgress}`,
    `  review: ${taskCounts.review}`,
    `  done: ${taskCounts.done}`,
    '',
  ];

  // Active worktrees section
  if (worktrees.length > 0) {
    checkpointLines.push('active_worktrees:');
    for (const wt of worktrees) {
      checkpointLines.push(`  - path: ${wt.path}`);
      checkpointLines.push(`    branch: ${wt.branch}`);
      checkpointLines.push(`    agent: ${wt.agent}`);
      checkpointLines.push(`    status: ${wt.status}`);
    }
  } else {
    checkpointLines.push('active_worktrees: []');
  }
  checkpointLines.push('');

  // Derive next_action from in-progress tasks or default
  let nextAction = 'Review taskboard and continue current sprint';
  if (taskCounts.review > 0) {
    nextAction = `Review ${taskCounts.review} task(s) awaiting review`;
  } else if (taskCounts.inProgress > 0) {
    nextAction = `Continue ${taskCounts.inProgress} in-progress task(s)`;
  } else if (taskCounts.ready > 0) {
    nextAction = `Pick up next task from ${taskCounts.ready} ready task(s)`;
  }
  checkpointLines.push(`next_action: ${nextAction}`);
  checkpointLines.push('');

  writeFileSync(checkpointPath, checkpointLines.join('\n'), 'utf-8');

  // ── Update project.yaml with latest checkpoint reference ───────────
  let stateContent = '';
  if (existsSync(stateFile)) {
    stateContent = readFileSync(stateFile, 'utf-8');
  }

  if (stateContent.includes('latest-checkpoint:')) {
    stateContent = stateContent.replace(
      /latest-checkpoint:.*$/m,
      `latest-checkpoint: ${checkpointName}`
    );
  } else {
    stateContent += `\nlatest-checkpoint: ${checkpointName}\n`;
  }

  if (stateContent.includes('last-checkpoint-at:')) {
    stateContent = stateContent.replace(
      /last-checkpoint-at:.*$/m,
      `last-checkpoint-at: ${now}`
    );
  } else {
    stateContent += `last-checkpoint-at: ${now}\n`;
  }

  writeFileSync(stateFile, stateContent, 'utf-8');

  // ── Prune old checkpoints ──────────────────────────────────────────
  pruneCheckpoints();

  console.log(`[FISHI] Checkpoint created: ${checkpointName}`);
} catch (err) {
  console.error(`[FISHI] Auto-checkpoint error: ${err.message}`);
  process.exit(0); // Non-fatal
}
