export function getFileLockHookScript(): string {
  return `#!/usr/bin/env node
// file-lock-hook.mjs — FISHI File Lock Manager
// Prevents worktree conflicts by locking files before agent assignment.
// Usage:
//   node .fishi/scripts/file-lock-hook.mjs check --files "src/a.ts,src/b.ts" --agent backend-agent --task auth
//   node .fishi/scripts/file-lock-hook.mjs lock --files "src/a.ts" --agent backend-agent --task auth --coordinator dev-lead
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

const { cmd, opts } = parseArgs();

if (cmd === 'check') {
  if (!opts.files || !opts.agent || !opts.task) fail('Usage: check --files "a,b" --agent X --task Y');
  const files = opts.files.split(',').map(f => f.trim());
  const locks = readLocks();
  const conflicts = [];
  for (const file of files) {
    const locked = locks.find(l => l.file === file && l.agent !== opts.agent);
    if (locked) conflicts.push({ file, lockedBy: locked.agent, lockedTask: locked.task, lockedAt: locked.lockedAt });
  }
  out({ conflicts, hasConflicts: conflicts.length > 0 });

} else if (cmd === 'lock') {
  if (!opts.files || !opts.agent || !opts.task) fail('Usage: lock --files "a,b" --agent X --task Y --coordinator Z');
  const files = opts.files.split(',').map(f => f.trim());
  const locks = readLocks();
  // Check conflicts first
  const conflicts = [];
  for (const f of files) {
    const locked = locks.find(l => l.file === f && l.agent !== opts.agent);
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
  fail('Unknown command: ' + cmd + '. Use: check, lock, release, status, agent-locks');
}
`;
}
