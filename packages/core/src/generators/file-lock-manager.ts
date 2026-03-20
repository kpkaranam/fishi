import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface FileLock {
  file: string;
  agent: string;
  task: string;
  coordinator: string;
  lockedAt: string;
}

export interface LockConflict {
  file: string;
  requestingAgent: string;
  requestingTask: string;
  lockedBy: string;
  lockedTask: string;
  lockedAt: string;
}

export interface LockResult {
  success: boolean;
  locked: string[];
  conflicts: LockConflict[];
}

function lockFilePath(projectDir: string): string {
  return join(projectDir, '.fishi', 'state', 'file-locks.yaml');
}

/**
 * Read all current file locks.
 */
export function readFileLocks(projectDir: string): FileLock[] {
  const p = lockFilePath(projectDir);
  if (!existsSync(p)) return [];
  const content = readFileSync(p, 'utf-8');

  // Simple YAML parsing for our known structure
  const locks: FileLock[] = [];
  const lockBlocks = content.split(/\n\s*-\s+file:\s*/).slice(1);

  for (const block of lockBlocks) {
    const lines = ('file: ' + block).split('\n');
    const lock: Partial<FileLock> = {};
    for (const line of lines) {
      const fileMatch = line.match(/^\s*file:\s*['"]?(.+?)['"]?\s*$/);
      const agentMatch = line.match(/^\s*agent:\s*['"]?(.+?)['"]?\s*$/);
      const taskMatch = line.match(/^\s*task:\s*['"]?(.+?)['"]?\s*$/);
      const coordMatch = line.match(/^\s*coordinator:\s*['"]?(.+?)['"]?\s*$/);
      const timeMatch = line.match(/^\s*locked_at:\s*['"]?(.+?)['"]?\s*$/);
      if (fileMatch) lock.file = fileMatch[1];
      if (agentMatch) lock.agent = agentMatch[1];
      if (taskMatch) lock.task = taskMatch[1];
      if (coordMatch) lock.coordinator = coordMatch[1];
      if (timeMatch) lock.lockedAt = timeMatch[1];
    }
    if (lock.file && lock.agent) {
      locks.push(lock as FileLock);
    }
  }

  return locks;
}

/**
 * Write file locks to disk.
 */
function writeLocks(projectDir: string, locks: FileLock[]): void {
  const dir = dirname(lockFilePath(projectDir));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (locks.length === 0) {
    writeFileSync(lockFilePath(projectDir), 'locks: []\n', 'utf-8');
    return;
  }

  let yaml = 'locks:\n';
  for (const lock of locks) {
    yaml += `  - file: "${lock.file}"\n`;
    yaml += `    agent: "${lock.agent}"\n`;
    yaml += `    task: "${lock.task}"\n`;
    yaml += `    coordinator: "${lock.coordinator}"\n`;
    yaml += `    locked_at: "${lock.lockedAt}"\n`;
  }
  writeFileSync(lockFilePath(projectDir), yaml, 'utf-8');
}

/**
 * Check if files can be locked (no conflicts with existing locks).
 */
export function checkLockConflicts(
  projectDir: string,
  files: string[],
  agent: string,
  task: string
): LockConflict[] {
  const existing = readFileLocks(projectDir);
  const conflicts: LockConflict[] = [];

  for (const file of files) {
    const locked = existing.find(l => l.file === file && l.agent !== agent);
    if (locked) {
      conflicts.push({
        file,
        requestingAgent: agent,
        requestingTask: task,
        lockedBy: locked.agent,
        lockedTask: locked.task,
        lockedAt: locked.lockedAt,
      });
    }
  }

  return conflicts;
}

/**
 * Acquire locks on files for an agent's task.
 * Returns success=true if all locks acquired, or conflicts if any file is already locked.
 */
export function acquireLocks(
  projectDir: string,
  files: string[],
  agent: string,
  task: string,
  coordinator: string
): LockResult {
  const conflicts = checkLockConflicts(projectDir, files, agent, task);

  if (conflicts.length > 0) {
    return { success: false, locked: [], conflicts };
  }

  const existing = readFileLocks(projectDir);
  const now = new Date().toISOString();
  const newLocks: FileLock[] = [];

  for (const file of files) {
    // Skip if already locked by same agent
    if (existing.some(l => l.file === file && l.agent === agent)) continue;
    newLocks.push({ file, agent, task, coordinator, lockedAt: now });
  }

  writeLocks(projectDir, [...existing, ...newLocks]);
  return { success: true, locked: files, conflicts: [] };
}

/**
 * Release all locks held by an agent (after task completion/merge/cleanup).
 */
export function releaseLocks(projectDir: string, agent: string, task?: string): string[] {
  const existing = readFileLocks(projectDir);
  const released: string[] = [];
  const remaining: FileLock[] = [];

  for (const lock of existing) {
    if (lock.agent === agent && (!task || lock.task === task)) {
      released.push(lock.file);
    } else {
      remaining.push(lock);
    }
  }

  writeLocks(projectDir, remaining);
  return released;
}

/**
 * Get all locks for a specific agent.
 */
export function getAgentLocks(projectDir: string, agent: string): FileLock[] {
  return readFileLocks(projectDir).filter(l => l.agent === agent);
}

/**
 * Get lock status summary — how many files locked, by which agents.
 */
export function getLockSummary(projectDir: string): { totalLocked: number; byAgent: Record<string, number> } {
  const locks = readFileLocks(projectDir);
  const byAgent: Record<string, number> = {};
  for (const lock of locks) {
    byAgent[lock.agent] = (byAgent[lock.agent] || 0) + 1;
  }
  return { totalLocked: locks.length, byAgent };
}
