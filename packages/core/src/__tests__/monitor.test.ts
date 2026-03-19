// packages/core/src/__tests__/monitor.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { emitEvent, readMonitorState, getAgentSummary } from '../generators/monitor';

describe('Monitor Data Layer', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-monitor-'));
    mkdirSync(join(tempDir, '.fishi', 'state'), { recursive: true });
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('emitEvent', () => {
    it('creates monitor.json if it does not exist', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'session.started', agent: 'master-orchestrator', data: { phase: 'init' } });
      expect(existsSync(join(dir, '.fishi', 'state', 'monitor.json'))).toBe(true);
    });

    it('appends events to existing monitor.json', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'session.started', agent: 'master-orchestrator', data: {} });
      emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success' } });
      const state = readMonitorState(dir);
      expect(state.events).toHaveLength(2);
    });

    it('adds timestamp to events', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'gate.approved', agent: 'master-orchestrator', data: { phase: 'discovery' } });
      const state = readMonitorState(dir);
      expect(state.events[0].timestamp).toBeDefined();
    });

    it('updates summary counters for agent completions', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success', filesChanged: 3 } });
      emitEvent(dir, { type: 'agent.completed', agent: 'frontend-agent', data: { status: 'success', filesChanged: 5 } });
      const state = readMonitorState(dir);
      expect(state.summary.totalAgentCompletions).toBe(2);
      expect(state.summary.totalFilesChanged).toBe(8);
    });

    it('tracks token usage by model and agent', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'tokens.used', agent: 'backend-agent', data: { inputTokens: 1000, outputTokens: 500, model: 'sonnet' } });
      emitEvent(dir, { type: 'tokens.used', agent: 'frontend-agent', data: { inputTokens: 2000, outputTokens: 800, model: 'opus' } });
      const state = readMonitorState(dir);
      expect(state.summary.totalTokens).toBe(4300);
      expect(state.summary.tokensByModel.sonnet).toBe(1500);
      expect(state.summary.tokensByModel.opus).toBe(2800);
      expect(state.summary.tokensByAgent['backend-agent']).toBe(1500);
    });

    it('tracks tools used', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'tool.used', agent: 'backend-agent', data: { tool: 'mcp:github', action: 'pr_create' } });
      emitEvent(dir, { type: 'tool.used', agent: 'backend-agent', data: { tool: 'mcp:github', action: 'pr_list' } });
      emitEvent(dir, { type: 'tool.used', agent: 'frontend-agent', data: { tool: 'plugin:figma', action: 'get_design' } });
      const state = readMonitorState(dir);
      expect(state.summary.toolsUsed['mcp:github']).toBe(2);
      expect(state.summary.toolsUsed['plugin:figma']).toBe(1);
    });

    it('tracks dynamic agent creation', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'agent.created', agent: 'solidity-agent', data: { dynamic: true, coordinator: 'dev-lead' } });
      const state = readMonitorState(dir);
      expect(state.summary.dynamicAgentsCreated).toBe(1);
      expect(state.dynamicAgents).toContainEqual({ name: 'solidity-agent', coordinator: 'dev-lead' });
    });

    it('caps events at 500 (rolling window)', () => {
      const dir = createTempDir();
      for (let i = 0; i < 510; i++) {
        emitEvent(dir, { type: 'tool.used', agent: 'test', data: { tool: 'test', i } });
      }
      const state = readMonitorState(dir);
      expect(state.events.length).toBeLessThanOrEqual(500);
    });
  });

  describe('readMonitorState', () => {
    it('returns empty state when monitor.json does not exist', () => {
      const dir = createTempDir();
      const state = readMonitorState(dir);
      expect(state.events).toEqual([]);
      expect(state.summary.totalAgentCompletions).toBe(0);
    });
  });

  describe('getAgentSummary', () => {
    it('aggregates per-agent stats from events', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success', filesChanged: 3 } });
      emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success', filesChanged: 2 } });
      emitEvent(dir, { type: 'agent.completed', agent: 'frontend-agent', data: { status: 'failed', filesChanged: 0 } });
      const summary = getAgentSummary(dir);
      expect(summary['backend-agent'].completions).toBe(2);
      expect(summary['backend-agent'].filesChanged).toBe(5);
      expect(summary['frontend-agent'].completions).toBe(1);
      expect(summary['frontend-agent'].failures).toBe(1);
    });
  });
});
