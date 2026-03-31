export function getFileLockHookScript(): string {
  return `#!/usr/bin/env node
// file-lock-hook.mjs — FISHI File Lock Manager
// Prevents worktree conflicts by locking files/directories before agent assignment.
// Usage:
//   node .fishi/scripts/file-lock-hook.mjs check --files "src/a.ts,src/b.ts" --agent backend-agent --task auth
//   node .fishi/scripts/file-lock-hook.mjs lock --files "src/a.ts" --agent backend-agent --task auth --coordinator dev-lead
//   node .fishi/scripts/file-lock-hook.mjs lock-scope --agent backend-agent --task auth --scope "src/api/,src/utils/"
//   node .fishi/scripts/file-lock-hook.mjs release --agent backend-agent [--task auth]
//   node .fishi/scripts/file-lock-hook.mjs status
//   node .fishi/scripts/file-lock-hook.mjs agent-locks --agent backend-agent

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();
const LOCK_FILE = join(ROOT, '.fishi', 'state', 'file-locks.yaml');

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\\n');
}

function fail(msg) {
  out({ error: msg });
  process.exit(1);
}

function readLocks() {
  if (!existsSync(LOCK_FILE)) return [];
  const content = readFileSync(LOCK_FILE, 'utf-8');
  const locks = [];
  const blocks = content.split(/\\n\\s*-\\s+file:\\s*/).slice(1);
  for (const block of blocks) {
    const lines = ('file: ' + block).split('\\n');
    const lock = {};
    for (const line of lines) {
      const fm = line.match(/^\\s*file:\\s*["']?(.+?)["']?\\s*$/);
      const am = line.match(/^\\s*agent:\\s*["']?(.+?)["']?\\s*$/);
      const tm = line.match(/^\\s*task:\\s*["']?(.+?)["']?\\s*$/);
      const cm = line.match(/^\\s*coordinator:\\s*["']?(.+?)["']?\\s*$/);
      const lm = line.match(/^\\s*locked_at:\\s*["']?(.+?)["']?\\s*$/);
      if (fm) lock.file = fm[1];
      if (am) lock.agent = am[1];
      if (tm) lock.task = tm[1];
      if (cm) lock.coordinator = cm[1];
      if (lm) lock.lockedAt = lm[1];
    }
    if (lock.file && lock.agent) locks.push(lock);
  }
  return locks;
}

function writeLocks(locks) {
  const dir = dirname(LOCK_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (locks.length === 0) { writeFileSync(LOCK_FILE, 'locks: []\\n', 'utf-8'); return; }
  let yaml = 'locks:\\n';
  for (const l of locks) {
    yaml += '  - file: "' + l.file + '"\\n';
    yaml += '    agent: "' + l.agent + '"\\n';
    yaml += '    task: "' + l.task + '"\\n';
    yaml += '    coordinator: "' + (l.coordinator || '') + '"\\n';
    yaml += '    locked_at: "' + l.lockedAt + '"\\n';
  }
  writeFileSync(LOCK_FILE, yaml, 'utf-8');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const opts = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    opts[key] = args[i + 1];
  }
  return { cmd, opts };
}

// Check if a path is exempt from lock enforcement
function isExempt(filePath) {
  if (filePath.startsWith('.fishi/')) return true;
  if (filePath.startsWith('.claude/')) return true;
  if (filePath.startsWith('docs/')) return true;
  if (filePath === '.mcp.json') return true;
  if (filePath === 'package.json') return true;
  // Root-level .md files: no '/' in path and ends with .md
  if (!filePath.includes('/') && filePath.endsWith('.md')) return true;
  return false;
}

// Check overlap between two paths (either can be a file or directory scope)
// Directory scopes end with '/'
function pathsOverlap(a, b) {
  if (a === b) return true;
  const aIsDir = a.endsWith('/');
  const bIsDir = b.endsWith('/');
  // Exact file inside directory scope
  if (aIsDir && !bIsDir && b.startsWith(a)) return true;
  if (bIsDir && !aIsDir && a.startsWith(b)) return true;
  // Nested directory scopes (one is prefix of the other)
  if (aIsDir && bIsDir && (a.startsWith(b) || b.startsWith(a))) return true;
  return false;
}

// Find overlaps between a set of new paths and existing locks from OTHER tasks
function findOverlaps(newPaths, locks, agent, task) {
  const overlaps = [];
  for (const p of newPaths) {
    for (const l of locks) {
      // Skip locks from the same task
      if (l.agent === agent && l.task === task) continue;
      if (pathsOverlap(p, l.file)) {
        overlaps.push({ path: p, conflictsWith: l.file, lockedBy: l.agent, lockedTask: l.task });
      }
    }
  }
  return overlaps;
}

const { cmd, opts } = parseArgs();

if (cmd === 'check') {
  if (!opts.files || !opts.agent || !opts.task) fail('Usage: check --files "a,b" --agent X --task Y');
  const files = opts.files.split(',').map(f => f.trim());
  const locks = readLocks();

  // Check each file — first exempt file wins with allowed
  for (const file of files) {
    if (isExempt(file)) continue;
    // Check exact match and directory scope match
    const locked = locks.find(l => {
      if (l.agent === opts.agent) return false;
      // Exact match
      if (l.file === file) return true;
      // File falls inside a directory scope lock
      if (l.file.endsWith('/') && file.startsWith(l.file)) return true;
      return false;
    });
    if (locked) {
      out({ status: 'blocked', file, lockedBy: locked.agent, lockedTask: locked.task, lockedAt: locked.lockedAt });
      process.exit(2);
    }
  }
  out({ status: 'allowed' });

} else if (cmd === 'lock-scope') {
  if (!opts.agent || !opts.task || !opts.scope) fail('Usage: lock-scope --agent X --task Y --scope "dir/,file.ts"');
  const paths = opts.scope.split(',').map(f => f.trim()).filter(Boolean);
  const locks = readLocks();

  // Find overlaps with other tasks' locks
  const overlaps = findOverlaps(paths, locks, opts.agent, opts.task);
  if (overlaps.length > 0) {
    out({ status: 'conflict', overlaps });
    process.exit(1);
  }

  // Add new paths (skip duplicates for same agent+task)
  const now = new Date().toISOString();
  const added = [];
  for (const p of paths) {
    if (!locks.some(l => l.file === p && l.agent === opts.agent && l.task === opts.task)) {
      locks.push({ file: p, agent: opts.agent, task: opts.task, coordinator: '', lockedAt: now });
      added.push(p);
    }
  }
  writeLocks(locks);
  out({ success: true, locked: added, agent: opts.agent, task: opts.task });

} else if (cmd === 'lock') {
  if (!opts.files || !opts.agent || !opts.task) fail('Usage: lock --files "a,b" --agent X --task Y --coordinator Z');
  const files = opts.files.split(',').map(f => f.trim());
  const locks = readLocks();
  // Check conflicts — exact match AND directory scope overlap with other agents
  const conflicts = [];
  for (const f of files) {
    const locked = locks.find(l => {
      if (l.agent === opts.agent) return false;
      if (l.file === f) return true;
      // File falls inside a directory scope lock from another agent
      if (l.file.endsWith('/') && f.startsWith(l.file)) return true;
      // New file is a dir scope and existing lock is inside it
      if (f.endsWith('/') && l.file.startsWith(f)) return true;
      return false;
    });
    if (locked) conflicts.push({ file: f, lockedBy: locked.agent, lockedTask: locked.task });
  }
  if (conflicts.length > 0) {
    out({ success: false, conflicts });
    process.exit(1);
  }
  const now = new Date().toISOString();
  for (const f of files) {
    if (!locks.some(l => l.file === f && l.agent === opts.agent)) {
      locks.push({ file: f, agent: opts.agent, task: opts.task, coordinator: opts.coordinator || '', lockedAt: now });
    }
  }
  writeLocks(locks);
  out({ success: true, locked: files, agent: opts.agent, task: opts.task });

} else if (cmd === 'release') {
  if (!opts.agent) fail('Usage: release --agent X [--task Y]');
  const locks = readLocks();
  const released = [];
  const remaining = [];
  for (const l of locks) {
    if (l.agent === opts.agent && (!opts.task || l.task === opts.task)) released.push(l.file);
    else remaining.push(l);
  }
  writeLocks(remaining);
  out({ released, agent: opts.agent, remaining: remaining.length });

} else if (cmd === 'status') {
  const locks = readLocks();
  const byAgent = {};
  for (const l of locks) byAgent[l.agent] = (byAgent[l.agent] || 0) + 1;
  out({ totalLocked: locks.length, byAgent, locks });

} else if (cmd === 'agent-locks') {
  if (!opts.agent) fail('Usage: agent-locks --agent X');
  const locks = readLocks().filter(l => l.agent === opts.agent);
  out({ agent: opts.agent, lockCount: locks.length, locks });

} else {
  fail('Unknown command: ' + cmd + '. Use: check, lock, lock-scope, release, status, agent-locks');
}
`;
}
