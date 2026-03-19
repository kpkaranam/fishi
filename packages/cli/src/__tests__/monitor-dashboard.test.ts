import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateScaffold, emitEvent, readMonitorState, getAgentSummary, getDashboardHtml } from '../../../../packages/core/src/index.js';

describe('Monitor Integration', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-monitor-int-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('scaffold creates monitor.json', async () => {
    const dir = createTempDir();
    await generateScaffold(dir, {
      projectName: 'monitor-test',
      projectType: 'greenfield',
      interactive: false,
      costMode: 'balanced',
      description: 'test',
    });
    expect(existsSync(join(dir, '.fishi', 'state', 'monitor.json'))).toBe(true);
  });

  it('scaffold creates monitor-emitter.mjs', async () => {
    const dir = createTempDir();
    await generateScaffold(dir, {
      projectName: 'monitor-test',
      projectType: 'greenfield',
      interactive: false,
      costMode: 'balanced',
      description: 'test',
    });
    expect(existsSync(join(dir, '.fishi', 'scripts', 'monitor-emitter.mjs'))).toBe(true);
  });

  it('full lifecycle: emit events, read state, get agent summary', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.fishi', 'state'), { recursive: true });

    emitEvent(dir, { type: 'session.started', agent: 'master-orchestrator', data: { phase: 'init' } });
    emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success', filesChanged: 5 } });
    emitEvent(dir, { type: 'agent.completed', agent: 'frontend-agent', data: { status: 'failed', filesChanged: 0 } });
    emitEvent(dir, { type: 'tokens.used', agent: 'backend-agent', data: { inputTokens: 5000, outputTokens: 2000, model: 'sonnet' } });
    emitEvent(dir, { type: 'tool.used', agent: 'backend-agent', data: { tool: 'mcp:github', action: 'create_pr' } });
    emitEvent(dir, { type: 'agent.created', agent: 'solidity-agent', data: { dynamic: true, coordinator: 'dev-lead' } });

    const state = readMonitorState(dir);
    expect(state.events).toHaveLength(6);
    expect(state.summary.totalAgentCompletions).toBe(2);
    expect(state.summary.totalFilesChanged).toBe(5);
    expect(state.summary.totalTokens).toBe(7000);
    expect(state.summary.tokensByModel.sonnet).toBe(7000);
    expect(state.summary.toolsUsed['mcp:github']).toBe(1);
    expect(state.summary.dynamicAgentsCreated).toBe(1);
    expect(state.dynamicAgents[0].name).toBe('solidity-agent');

    const agents = getAgentSummary(dir);
    expect(agents['backend-agent'].completions).toBe(1);
    expect(agents['backend-agent'].filesChanged).toBe(5);
    expect(agents['frontend-agent'].failures).toBe(1);
  });
});

describe('Dashboard HTML', () => {
  it('returns valid HTML with all required sections', () => {
    const html = getDashboardHtml();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('FISHI Agent Dashboard');
    expect(html).toContain('/api/state');
    expect(html).toContain('Agent Completions');
    expect(html).toContain('Tokens by Model');
    expect(html).toContain('Tools Used');
    expect(html).toContain('Gates');
    expect(html).toContain('Recent Events');
    expect(html).toContain('Agent Activity');
  });
});
