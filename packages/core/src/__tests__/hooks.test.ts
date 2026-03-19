import { describe, it, expect } from 'vitest';
import {
  getSessionStartHook,
  getAutoCheckpointHook,
  getAgentCompleteHook,
  getPostEditHook,
  getSafetyCheckHook,
  getWorktreeSetupHook,
  getTaskboardUpdateHook,
  getWorktreeManagerScript,
  getGateManagerScript,
  getValidateScaffoldScript,
  getPhaseRunnerScript,
  getTodoManagerScript,
  getMemoryManagerScript,
  getLearningsManagerScript,
  getDocCheckerScript,
  getMonitorEmitterScript,
} from '../index';

describe('Hook / Script Templates', () => {
  const hooks: [string, () => string][] = [
    ['session-start', getSessionStartHook],
    ['auto-checkpoint', getAutoCheckpointHook],
    ['agent-complete', getAgentCompleteHook],
    ['post-edit', getPostEditHook],
    ['safety-check', getSafetyCheckHook],
    ['worktree-setup', getWorktreeSetupHook],
    ['taskboard-update', getTaskboardUpdateHook],
    ['worktree-manager', getWorktreeManagerScript],
    ['gate-manager', getGateManagerScript],
    ['validate-scaffold', getValidateScaffoldScript],
    ['phase-runner', getPhaseRunnerScript],
    ['todo-manager', getTodoManagerScript],
    ['memory-manager', getMemoryManagerScript],
    ['learnings-manager', getLearningsManagerScript],
    ['doc-checker', getDocCheckerScript],
    ['monitor-emitter', getMonitorEmitterScript],
  ];

  it('all 16 hooks are accounted for', () => {
    expect(hooks).toHaveLength(16);
  });

  it.each(hooks)('%s returns a non-empty string', (_name, hookFn) => {
    const content = hookFn();
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(50);
  });

  it.each(hooks)('%s starts with the node shebang', (_name, hookFn) => {
    const content = hookFn();
    expect(content).toContain('#!/usr/bin/env node');
  });

  it.each(hooks)('%s uses ESM imports (not CommonJS require)', (_name, hookFn) => {
    const content = hookFn();
    expect(content).toContain('import ');
    expect(content).not.toMatch(/\brequire\s*\(/);
  });

  it.each(hooks)('%s is zero-dependency (only uses node built-ins)', (_name, hookFn) => {
    const content = hookFn();
    // Extract all import sources
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const source = match[1];
      // Must be a node built-in (no leading . or @scope or bare module name without node: prefix)
      const isNodeBuiltin =
        source.startsWith('node:') ||
        source === 'fs' ||
        source === 'path' ||
        source === 'os' ||
        source === 'child_process' ||
        source === 'url' ||
        source === 'util' ||
        source === 'crypto' ||
        source === 'readline' ||
        source === 'fs/promises';
      expect(isNodeBuiltin).toBe(true);
    }
  });

  describe('Specific hook content checks', () => {
    it('session-start reads project state', () => {
      const content = getSessionStartHook();
      expect(content).toContain('project');
    });

    it('auto-checkpoint creates checkpoint snapshots', () => {
      const content = getAutoCheckpointHook();
      expect(content).toContain('checkpoint');
    });

    it('gate-manager handles gate operations', () => {
      const content = getGateManagerScript();
      expect(content).toContain('gate');
    });

    it('worktree-manager handles git worktrees', () => {
      const content = getWorktreeManagerScript();
      expect(content).toContain('worktree');
    });

    it('todo-manager handles TODO operations', () => {
      const content = getTodoManagerScript();
      expect(content).toContain('todo');
    });

    it('memory-manager handles agent memory', () => {
      const content = getMemoryManagerScript();
      expect(content).toContain('memory');
    });

    it('learnings-manager handles learnings', () => {
      const content = getLearningsManagerScript();
      expect(content).toContain('learning');
    });
  });
});
