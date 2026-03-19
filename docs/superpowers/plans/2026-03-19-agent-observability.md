# Agent Observability Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time observability dashboard (TUI + Web UI) that monitors all FISHI agents, phase progress, token usage, tools used, and dynamic agent creation — sharing a single data layer.

**Architecture:** Event-based: hook scripts emit events to `.fishi/state/monitor.json`. TUI reads the file directly (`fishi monitor`). Web UI serves a local HTTP server with WebSocket push (`fishi dashboard`). All zero external dependencies — Node.js built-in `http` + `ws` protocol over raw sockets.

**Tech Stack:** TypeScript (CLI commands), Node.js built-ins (http, fs, WebSocket), vitest (tests). Zero new npm dependencies.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `packages/core/src/templates/hooks/monitor-emitter.ts` | Hook template: emits events to monitor.json |
| `packages/core/src/templates/dashboard/index-html.ts` | Web UI HTML template (single-page, embedded CSS/JS) |
| `packages/core/src/generators/monitor.ts` | Monitor data types + read/write/aggregate functions |
| `packages/cli/src/commands/monitor.ts` | TUI command (`fishi monitor`) |
| `packages/cli/src/commands/dashboard.ts` | Web server command (`fishi dashboard`) |
| `packages/core/src/__tests__/monitor.test.ts` | Tests for monitor data layer |
| `packages/cli/src/__tests__/monitor-dashboard.test.ts` | Tests for TUI + dashboard |

### Modified Files
| File | Change |
|------|--------|
| `packages/core/src/templates/hooks/index.ts` | Export new monitor-emitter |
| `packages/core/src/templates/hooks/session-start.ts` | Add event emission call |
| `packages/core/src/templates/hooks/auto-checkpoint.ts` | Add event emission call |
| `packages/core/src/templates/hooks/agent-complete.ts` | Add event emission call |
| `packages/core/src/generators/scaffold.ts` | Write monitor-emitter.mjs + monitor.json |
| `packages/core/src/generators/index.ts` | Export monitor types |
| `packages/core/src/index.ts` | Export monitor types |
| `packages/cli/src/index.ts` | Register monitor + dashboard commands |

---

## Chunk 1: Monitor Data Layer + Event Emitter

### Task 1: Monitor Data Types and Read/Write Functions

**Files:**
- Create: `packages/core/src/generators/monitor.ts`
- Create: `packages/core/src/__tests__/monitor.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/monitor.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  emitEvent,
  readMonitorState,
  getAgentSummary,
  type MonitorState,
  type MonitorEvent,
} from '../generators/monitor';

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

    it('updates summary counters', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success', filesChanged: 3 } });
      emitEvent(dir, { type: 'agent.completed', agent: 'frontend-agent', data: { status: 'success', filesChanged: 5 } });
      const state = readMonitorState(dir);
      expect(state.summary.totalAgentCompletions).toBe(2);
      expect(state.summary.totalFilesChanged).toBe(8);
    });

    it('tracks token usage', () => {
      const dir = createTempDir();
      emitEvent(dir, { type: 'tokens.used', agent: 'backend-agent', data: { inputTokens: 1000, outputTokens: 500, model: 'sonnet' } });
      emitEvent(dir, { type: 'tokens.used', agent: 'frontend-agent', data: { inputTokens: 2000, outputTokens: 800, model: 'opus' } });
      const state = readMonitorState(dir);
      expect(state.summary.totalTokens).toBe(4300);
      expect(state.summary.tokensByModel.sonnet).toBe(1500);
      expect(state.summary.tokensByModel.opus).toBe(2800);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/monitor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement monitor data layer**

```typescript
// packages/core/src/generators/monitor.ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface MonitorEvent {
  type: string;
  agent: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

export interface MonitorSummary {
  totalAgentCompletions: number;
  totalFilesChanged: number;
  totalTokens: number;
  tokensByModel: Record<string, number>;
  tokensByAgent: Record<string, number>;
  toolsUsed: Record<string, number>;
  dynamicAgentsCreated: number;
}

export interface DynamicAgent {
  name: string;
  coordinator: string;
}

export interface MonitorState {
  events: (MonitorEvent & { timestamp: string })[];
  summary: MonitorSummary;
  dynamicAgents: DynamicAgent[];
  lastUpdated: string;
}

const MAX_EVENTS = 500;

function monitorPath(projectDir: string): string {
  return join(projectDir, '.fishi', 'state', 'monitor.json');
}

function emptySummary(): MonitorSummary {
  return {
    totalAgentCompletions: 0,
    totalFilesChanged: 0,
    totalTokens: 0,
    tokensByModel: {},
    tokensByAgent: {},
    toolsUsed: {},
    dynamicAgentsCreated: 0,
  };
}

function emptyState(): MonitorState {
  return {
    events: [],
    summary: emptySummary(),
    dynamicAgents: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function readMonitorState(projectDir: string): MonitorState {
  const p = monitorPath(projectDir);
  if (!existsSync(p)) return emptyState();
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return emptyState();
  }
}

export function emitEvent(projectDir: string, event: MonitorEvent): void {
  const state = readMonitorState(projectDir);
  const timestamped = { ...event, timestamp: event.timestamp || new Date().toISOString() };

  state.events.push(timestamped);
  if (state.events.length > MAX_EVENTS) {
    state.events = state.events.slice(-MAX_EVENTS);
  }

  // Update summary based on event type
  switch (event.type) {
    case 'agent.completed': {
      state.summary.totalAgentCompletions++;
      const files = (event.data.filesChanged as number) || 0;
      state.summary.totalFilesChanged += files;
      break;
    }
    case 'tokens.used': {
      const input = (event.data.inputTokens as number) || 0;
      const output = (event.data.outputTokens as number) || 0;
      const total = input + output;
      const model = (event.data.model as string) || 'unknown';
      state.summary.totalTokens += total;
      state.summary.tokensByModel[model] = (state.summary.tokensByModel[model] || 0) + total;
      state.summary.tokensByAgent[event.agent] = (state.summary.tokensByAgent[event.agent] || 0) + total;
      break;
    }
    case 'tool.used': {
      const tool = event.data.tool as string;
      state.summary.toolsUsed[tool] = (state.summary.toolsUsed[tool] || 0) + 1;
      break;
    }
    case 'agent.created': {
      if (event.data.dynamic) {
        state.summary.dynamicAgentsCreated++;
        state.dynamicAgents.push({
          name: event.agent,
          coordinator: (event.data.coordinator as string) || 'unknown',
        });
      }
      break;
    }
  }

  state.lastUpdated = new Date().toISOString();

  const dir = dirname(monitorPath(projectDir));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(monitorPath(projectDir), JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

export function getAgentSummary(projectDir: string): Record<string, { completions: number; failures: number; filesChanged: number }> {
  const state = readMonitorState(projectDir);
  const agents: Record<string, { completions: number; failures: number; filesChanged: number }> = {};

  for (const event of state.events) {
    if (event.type === 'agent.completed') {
      if (!agents[event.agent]) agents[event.agent] = { completions: 0, failures: 0, filesChanged: 0 };
      agents[event.agent].completions++;
      if (event.data.status === 'failed') agents[event.agent].failures++;
      agents[event.agent].filesChanged += (event.data.filesChanged as number) || 0;
    }
  }

  return agents;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /d/FISHI && npx vitest run packages/core/src/__tests__/monitor.test.ts`
Expected: All PASS

- [ ] **Step 5: Export from core**

Add to `packages/core/src/generators/index.ts`:
```typescript
export { emitEvent, readMonitorState, getAgentSummary } from './monitor';
export type { MonitorState, MonitorEvent, MonitorSummary, DynamicAgent } from './monitor';
```

Add to `packages/core/src/index.ts`:
```typescript
export { emitEvent, readMonitorState, getAgentSummary } from './generators/index';
export type { MonitorState, MonitorEvent, MonitorSummary, DynamicAgent } from './generators/index';
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/generators/monitor.ts packages/core/src/__tests__/monitor.test.ts packages/core/src/generators/index.ts packages/core/src/index.ts
git commit -m "feat: monitor data layer — event emitter, state reader, agent summary"
```

---

### Task 2: Monitor Emitter Hook Template

**Files:**
- Create: `packages/core/src/templates/hooks/monitor-emitter.ts`
- Modify: `packages/core/src/templates/hooks/index.ts`
- Modify: `packages/core/src/generators/scaffold.ts`

- [ ] **Step 1: Create monitor-emitter hook template**

This is a utility function that other hooks call to emit events. It writes to `.fishi/state/monitor.json`.

```typescript
// packages/core/src/templates/hooks/monitor-emitter.ts
export function getMonitorEmitterScript(): string {
  return `#!/usr/bin/env node
// monitor-emitter.mjs — FISHI Observability Event Emitter
// Called by other hooks to emit monitoring events.
// Usage: node .fishi/scripts/monitor-emitter.mjs <event-json>
// Or imported as: await emitMonitorEvent(projectRoot, event)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const MAX_EVENTS = 500;

function getMonitorPath(root) {
  return join(root, '.fishi', 'state', 'monitor.json');
}

function readState(root) {
  const p = getMonitorPath(root);
  if (!existsSync(p)) return { events: [], summary: { totalAgentCompletions: 0, totalFilesChanged: 0, totalTokens: 0, tokensByModel: {}, tokensByAgent: {}, toolsUsed: {}, dynamicAgentsCreated: 0 }, dynamicAgents: [], lastUpdated: '' };
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return { events: [], summary: { totalAgentCompletions: 0, totalFilesChanged: 0, totalTokens: 0, tokensByModel: {}, tokensByAgent: {}, toolsUsed: {}, dynamicAgentsCreated: 0 }, dynamicAgents: [], lastUpdated: '' }; }
}

export function emitMonitorEvent(root, event) {
  const state = readState(root);
  const timestamped = { ...event, timestamp: event.timestamp || new Date().toISOString() };
  state.events.push(timestamped);
  if (state.events.length > MAX_EVENTS) state.events = state.events.slice(-MAX_EVENTS);

  const s = state.summary;
  switch (event.type) {
    case 'agent.completed':
      s.totalAgentCompletions++;
      s.totalFilesChanged += (event.data?.filesChanged || 0);
      break;
    case 'tokens.used': {
      const total = (event.data?.inputTokens || 0) + (event.data?.outputTokens || 0);
      const model = event.data?.model || 'unknown';
      s.totalTokens += total;
      s.tokensByModel[model] = (s.tokensByModel[model] || 0) + total;
      s.tokensByAgent[event.agent] = (s.tokensByAgent[event.agent] || 0) + total;
      break;
    }
    case 'tool.used':
      s.toolsUsed[event.data?.tool] = (s.toolsUsed[event.data?.tool] || 0) + 1;
      break;
    case 'agent.created':
      if (event.data?.dynamic) {
        s.dynamicAgentsCreated++;
        state.dynamicAgents.push({ name: event.agent, coordinator: event.data?.coordinator || 'unknown' });
      }
      break;
  }

  state.lastUpdated = new Date().toISOString();
  const dir = dirname(getMonitorPath(root));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getMonitorPath(root), JSON.stringify(state, null, 2) + '\\n', 'utf-8');
}

// CLI mode: node monitor-emitter.mjs '{"type":"...","agent":"...","data":{...}}'
const arg = process.argv[2];
if (arg) {
  try {
    const event = JSON.parse(arg);
    const root = process.env.FISHI_PROJECT_ROOT || process.cwd();
    emitMonitorEvent(root, event);
  } catch (e) {
    console.error('[FISHI MONITOR] Failed to parse event:', e.message);
  }
}
`;
}
```

- [ ] **Step 2: Export from hooks index**

Add to `packages/core/src/templates/hooks/index.ts`:
```typescript
export { getMonitorEmitterScript } from './monitor-emitter';
```

- [ ] **Step 3: Add to scaffold generator**

Add after the existing hook writes in `packages/core/src/generators/scaffold.ts` (after the doc-checker write):
```typescript
await write('.fishi/scripts/monitor-emitter.mjs', getMonitorEmitterScript());
```

Also add import at top:
```typescript
import { getMonitorEmitterScript } from '../templates/hooks/monitor-emitter.js';
```

And initialize empty monitor.json during scaffold:
```typescript
await write('.fishi/state/monitor.json', JSON.stringify({
  events: [], summary: { totalAgentCompletions: 0, totalFilesChanged: 0, totalTokens: 0, tokensByModel: {}, tokensByAgent: {}, toolsUsed: {}, dynamicAgentsCreated: 0 }, dynamicAgents: [], lastUpdated: new Date().toISOString()
}, null, 2) + '\n');
```

- [ ] **Step 4: Add event emission to existing hook templates**

Add to the end of `session-start.ts` template (before the final output):
```javascript
// Emit session start event
try {
  const { emitMonitorEvent } = await import('./monitor-emitter.mjs');
  emitMonitorEvent(root, { type: 'session.started', agent: 'master-orchestrator', data: { phase, sprint, taskCounts } });
} catch {}
```

Add to `auto-checkpoint.ts` template (after checkpoint is written):
```javascript
try {
  const { emitMonitorEvent } = await import('./monitor-emitter.mjs');
  emitMonitorEvent(root, { type: 'checkpoint.created', agent: 'system', data: { checkpointId, phase, taskCounts } });
} catch {}
```

Add to `agent-complete.ts` template (after agent result is parsed):
```javascript
try {
  const { emitMonitorEvent } = await import('./monitor-emitter.mjs');
  emitMonitorEvent(root, { type: 'agent.completed', agent: agentName, data: { status: parsedStatus, filesChanged: filesList.length, summary: parsedSummary, taskId } });
} catch {}
```

- [ ] **Step 5: Run full test suite**

Run: `cd /d/FISHI && npx vitest run`
Expected: All pass (existing + new)

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/templates/hooks/monitor-emitter.ts packages/core/src/templates/hooks/index.ts packages/core/src/generators/scaffold.ts packages/core/src/templates/hooks/session-start.ts packages/core/src/templates/hooks/auto-checkpoint.ts packages/core/src/templates/hooks/agent-complete.ts
git commit -m "feat: monitor event emitter hook + integrate with session-start, checkpoint, agent-complete"
```

---

## Chunk 2: TUI Monitor + Web Dashboard + CLI Registration

### Task 3: TUI Monitor Command (`fishi monitor`)

**Files:**
- Create: `packages/cli/src/commands/monitor.ts`

- [ ] **Step 1: Implement TUI monitor**

```typescript
// packages/cli/src/commands/monitor.ts
import chalk from 'chalk';
import { readMonitorState, getAgentSummary } from '@qlucent/fishi-core';
import fs from 'fs';
import path from 'path';

export async function monitorCommand(options: { watch?: boolean }): Promise<void> {
  const targetDir = process.cwd();
  const stateDir = path.join(targetDir, '.fishi', 'state');

  if (!fs.existsSync(stateDir)) {
    console.log(chalk.yellow('  No FISHI project found. Run `fishi init` first.'));
    return;
  }

  function render(): void {
    const state = readMonitorState(targetDir);
    const agentStats = getAgentSummary(targetDir);

    // Read project state for phase info
    let phase = 'unknown';
    let projectName = 'unknown';
    const projectPath = path.join(stateDir, 'project.yaml');
    if (fs.existsSync(projectPath)) {
      const raw = fs.readFileSync(projectPath, 'utf-8');
      const phaseMatch = raw.match(/^phase:\s*(.+)$/m);
      const nameMatch = raw.match(/^project:\s*(.+)$/m);
      if (phaseMatch) phase = phaseMatch[1].trim();
      if (nameMatch) projectName = nameMatch[1].trim().replace(/"/g, '');
    }

    // Read gates
    let gates: { phase: string; status: string }[] = [];
    const gatesPath = path.join(stateDir, 'gates.yaml');
    if (fs.existsSync(gatesPath)) {
      const raw = fs.readFileSync(gatesPath, 'utf-8');
      const gateMatches = raw.matchAll(/- phase:\s*"?(\w+)"?\s*\n(?:.*\n)*?\s*status:\s*"?(\w+)"?/g);
      for (const m of gateMatches) gates.push({ phase: m[1], status: m[2] });
    }

    // Clear screen
    if (options.watch) process.stdout.write('\x1B[2J\x1B[0;0H');

    console.log('');
    console.log(chalk.cyan.bold('  FISHI Agent Monitor'));
    console.log(chalk.gray(`  Project: ${projectName} | Phase: ${phase} | Updated: ${state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : 'never'}`));
    console.log('');

    // Phase progress
    const phases = ['init', 'discovery', 'prd', 'architecture', 'sprint_planning', 'development', 'deployment', 'deployed'];
    const currentIdx = phases.indexOf(phase);
    const bar = phases.map((p, i) => {
      if (i < currentIdx) return chalk.green(`[${p}]`);
      if (i === currentIdx) return chalk.cyan.bold(`[${p}]`);
      return chalk.gray(`[${p}]`);
    }).join(' ');
    console.log(`  ${bar}`);
    console.log('');

    // Summary stats
    const s = state.summary;
    console.log(chalk.white.bold('  Summary'));
    console.log(chalk.gray(`    Agent completions:  ${s.totalAgentCompletions}`));
    console.log(chalk.gray(`    Files changed:      ${s.totalFilesChanged}`));
    console.log(chalk.gray(`    Total tokens:       ${s.totalTokens.toLocaleString()}`));
    console.log(chalk.gray(`    Dynamic agents:     ${s.dynamicAgentsCreated}`));
    console.log('');

    // Token breakdown by model
    if (Object.keys(s.tokensByModel).length > 0) {
      console.log(chalk.white.bold('  Tokens by Model'));
      for (const [model, count] of Object.entries(s.tokensByModel)) {
        console.log(chalk.gray(`    ${model}: ${(count as number).toLocaleString()}`));
      }
      console.log('');
    }

    // Tools used
    if (Object.keys(s.toolsUsed).length > 0) {
      console.log(chalk.white.bold('  Tools Used'));
      for (const [tool, count] of Object.entries(s.toolsUsed)) {
        console.log(chalk.gray(`    ${tool}: ${count} calls`));
      }
      console.log('');
    }

    // Agent stats
    const agentNames = Object.keys(agentStats);
    if (agentNames.length > 0) {
      console.log(chalk.white.bold('  Agent Activity'));
      for (const name of agentNames) {
        const a = agentStats[name];
        const status = a.failures > 0 ? chalk.red(`${a.failures} failed`) : chalk.green('all ok');
        console.log(chalk.gray(`    ${name}: ${a.completions} runs, ${a.filesChanged} files, ${status}`));
      }
      console.log('');
    }

    // Dynamic agents
    if (state.dynamicAgents.length > 0) {
      console.log(chalk.white.bold('  Dynamic Agents'));
      for (const da of state.dynamicAgents) {
        console.log(chalk.gray(`    ${da.name} (created by ${da.coordinator})`));
      }
      console.log('');
    }

    // Gates
    if (gates.length > 0) {
      console.log(chalk.white.bold('  Gates'));
      for (const g of gates) {
        const icon = g.status === 'approved' ? chalk.green('approved') : g.status === 'rejected' ? chalk.red('rejected') : g.status === 'skipped' ? chalk.yellow('skipped') : chalk.gray('pending');
        console.log(chalk.gray(`    ${g.phase}: ${icon}`));
      }
      console.log('');
    }

    // Recent events (last 10)
    const recent = state.events.slice(-10).reverse();
    if (recent.length > 0) {
      console.log(chalk.white.bold('  Recent Events'));
      for (const e of recent) {
        const time = new Date(e.timestamp).toLocaleTimeString();
        console.log(chalk.gray(`    [${time}] ${e.type} — ${e.agent}`));
      }
      console.log('');
    }

    if (options.watch) {
      console.log(chalk.gray('  Watching for changes... (Ctrl+C to exit)'));
    }
  }

  render();

  if (options.watch) {
    const monitorFile = path.join(stateDir, 'monitor.json');
    let lastMtime = 0;
    setInterval(() => {
      try {
        if (fs.existsSync(monitorFile)) {
          const mtime = fs.statSync(monitorFile).mtimeMs;
          if (mtime > lastMtime) {
            lastMtime = mtime;
            render();
          }
        }
      } catch {}
    }, 1000);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/commands/monitor.ts
git commit -m "feat: TUI monitor command (fishi monitor)"
```

---

### Task 4: Web Dashboard Command (`fishi dashboard`)

**Files:**
- Create: `packages/core/src/templates/dashboard/index-html.ts`
- Create: `packages/cli/src/commands/dashboard.ts`

- [ ] **Step 1: Create dashboard HTML template**

A single self-contained HTML file with embedded CSS and JavaScript. Uses EventSource (SSE) for real-time updates. No external dependencies.

```typescript
// packages/core/src/templates/dashboard/index-html.ts
export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FISHI Agent Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e0e0e0; min-height: 100vh; }
  .header { background: #12121a; padding: 20px 32px; border-bottom: 1px solid #1e1e2e; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 20px; color: #06b6d4; }
  .header .status { font-size: 13px; color: #888; }
  .header .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; padding: 24px 32px; }
  .card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 12px; padding: 20px; }
  .card h2 { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .card .value { font-size: 32px; font-weight: 700; color: #fff; }
  .card .sub { font-size: 12px; color: #666; margin-top: 4px; }
  .main { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; padding: 0 32px 24px; }
  .panel { background: #12121a; border: 1px solid #1e1e2e; border-radius: 12px; padding: 20px; }
  .panel h2 { font-size: 14px; color: #06b6d4; margin-bottom: 16px; }
  .phase-bar { display: flex; gap: 4px; margin-bottom: 20px; padding: 0 32px; }
  .phase { flex: 1; padding: 8px; text-align: center; font-size: 11px; border-radius: 6px; background: #1a1a2e; color: #666; }
  .phase.done { background: #064e3b; color: #6ee7b7; }
  .phase.current { background: #164e63; color: #22d3ee; border: 1px solid #06b6d4; }
  .event-row { padding: 8px 0; border-bottom: 1px solid #1a1a2e; font-size: 13px; display: flex; justify-content: space-between; }
  .event-row .time { color: #555; font-size: 11px; }
  .event-row .type { color: #06b6d4; }
  .event-row .agent { color: #a78bfa; }
  .agent-row { padding: 8px 0; border-bottom: 1px solid #1a1a2e; font-size: 13px; display: flex; justify-content: space-between; }
  .agent-row .name { color: #a78bfa; }
  .agent-row .stats { color: #888; }
  .tool-row { padding: 6px 0; font-size: 13px; display: flex; justify-content: space-between; }
  .tool-row .name { color: #fbbf24; }
  .tool-row .count { color: #888; }
  .gate-row { padding: 6px 0; font-size: 13px; display: flex; justify-content: space-between; }
  .gate-row .approved { color: #22c55e; }
  .gate-row .rejected { color: #ef4444; }
  .gate-row .pending { color: #888; }
  .gate-row .skipped { color: #eab308; }
  .token-row { padding: 6px 0; font-size: 13px; display: flex; justify-content: space-between; }
  .bottom { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; padding: 0 32px 32px; }
</style>
</head>
<body>
<div class="header">
  <h1>FISHI Agent Dashboard</h1>
  <div class="status"><span class="dot"></span>Live — updating every 2s</div>
</div>
<div class="grid" id="stats"></div>
<div class="phase-bar" id="phases"></div>
<div class="main">
  <div class="panel" id="events-panel"><h2>Recent Events</h2><div id="events"></div></div>
  <div class="panel" id="agents-panel"><h2>Agent Activity</h2><div id="agents"></div></div>
</div>
<div class="bottom">
  <div class="panel"><h2>Tokens by Model</h2><div id="tokens"></div></div>
  <div class="panel"><h2>Tools Used</h2><div id="tools"></div></div>
  <div class="panel"><h2>Gates</h2><div id="gates"></div></div>
</div>
<script>
const PHASES = ['init','discovery','prd','architecture','sprint_planning','development','deployment','deployed'];
async function refresh() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();
    renderStats(data);
    renderPhases(data);
    renderEvents(data);
    renderAgents(data);
    renderTokens(data);
    renderTools(data);
    renderGates(data);
  } catch {}
}
function renderStats(d) {
  document.getElementById('stats').innerHTML =
    card('Agent Completions', d.summary.totalAgentCompletions, '') +
    card('Files Changed', d.summary.totalFilesChanged, '') +
    card('Total Tokens', d.summary.totalTokens.toLocaleString(), '') +
    card('Dynamic Agents', d.summary.dynamicAgentsCreated, d.dynamicAgents.map(a=>a.name).join(', '));
}
function card(title, value, sub) {
  return '<div class="card"><h2>'+title+'</h2><div class="value">'+value+'</div>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>';
}
function renderPhases(d) {
  const idx = PHASES.indexOf(d.phase || 'init');
  document.getElementById('phases').innerHTML = PHASES.map((p,i) =>
    '<div class="phase '+(i<idx?'done':i===idx?'current':'')+'">'+p+'</div>'
  ).join('');
}
function renderEvents(d) {
  const evts = (d.events||[]).slice(-15).reverse();
  document.getElementById('events').innerHTML = evts.map(e =>
    '<div class="event-row"><span><span class="type">'+e.type+'</span> <span class="agent">'+e.agent+'</span></span><span class="time">'+new Date(e.timestamp).toLocaleTimeString()+'</span></div>'
  ).join('') || '<div style="color:#555">No events yet</div>';
}
function renderAgents(d) {
  const agents = d.agentSummary || {};
  document.getElementById('agents').innerHTML = Object.entries(agents).map(([n,a]) =>
    '<div class="agent-row"><span class="name">'+n+'</span><span class="stats">'+a.completions+' runs, '+a.filesChanged+' files'+(a.failures?' <span style="color:#ef4444">'+a.failures+' failed</span>':'')+'</span></div>'
  ).join('') || '<div style="color:#555">No agent activity yet</div>';
}
function renderTokens(d) {
  document.getElementById('tokens').innerHTML = Object.entries(d.summary.tokensByModel||{}).map(([m,c]) =>
    '<div class="token-row"><span>'+m+'</span><span>'+Number(c).toLocaleString()+'</span></div>'
  ).join('') || '<div style="color:#555">No token data</div>';
}
function renderTools(d) {
  document.getElementById('tools').innerHTML = Object.entries(d.summary.toolsUsed||{}).map(([t,c]) =>
    '<div class="tool-row"><span class="name">'+t+'</span><span class="count">'+c+' calls</span></div>'
  ).join('') || '<div style="color:#555">No tools used yet</div>';
}
function renderGates(d) {
  document.getElementById('gates').innerHTML = (d.gates||[]).map(g =>
    '<div class="gate-row"><span>'+g.phase+'</span><span class="'+g.status+'">'+g.status+'</span></div>'
  ).join('') || '<div style="color:#555">No gates yet</div>';
}
refresh();
setInterval(refresh, 2000);
</script>
</body>
</html>`;
}
```

- [ ] **Step 2: Create dashboard server command**

```typescript
// packages/cli/src/commands/dashboard.ts
import http from 'http';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { readMonitorState, getAgentSummary } from '@qlucent/fishi-core';
import { getDashboardHtml } from '@qlucent/fishi-core';

export async function dashboardCommand(options: { port?: string }): Promise<void> {
  const targetDir = process.cwd();
  const port = parseInt(options.port || '4269', 10);

  if (!fs.existsSync(path.join(targetDir, '.fishi'))) {
    console.log(chalk.yellow('  No FISHI project found. Run `fishi init` first.'));
    return;
  }

  const html = getDashboardHtml();

  const server = http.createServer((req, res) => {
    if (req.url === '/api/state') {
      const state = readMonitorState(targetDir);
      const agentSummary = getAgentSummary(targetDir);

      // Read phase from project.yaml
      let phase = 'init';
      const projectPath = path.join(targetDir, '.fishi', 'state', 'project.yaml');
      if (fs.existsSync(projectPath)) {
        const raw = fs.readFileSync(projectPath, 'utf-8');
        const m = raw.match(/^phase:\s*(.+)$/m);
        if (m) phase = m[1].trim();
      }

      // Read gates
      let gates: { phase: string; status: string }[] = [];
      const gatesPath = path.join(targetDir, '.fishi', 'state', 'gates.yaml');
      if (fs.existsSync(gatesPath)) {
        const raw = fs.readFileSync(gatesPath, 'utf-8');
        const gateMatches = raw.matchAll(/- phase:\s*"?(\w+)"?\s*\n(?:.*\n)*?\s*status:\s*"?(\w+)"?/g);
        for (const m of gateMatches) gates.push({ phase: m[1], status: m[2] });
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ...state, phase, gates, agentSummary }));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });

  server.listen(port, () => {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Agent Dashboard'));
    console.log(chalk.gray(`  Running at http://localhost:${port}`));
    console.log(chalk.gray('  Press Ctrl+C to stop'));
    console.log('');
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/templates/dashboard/index-html.ts packages/cli/src/commands/dashboard.ts
git commit -m "feat: web dashboard command (fishi dashboard) with real-time UI"
```

---

### Task 5: Register CLI Commands + Export Dashboard HTML

**Files:**
- Modify: `packages/cli/src/index.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/generators/index.ts` (or templates index)

- [ ] **Step 1: Register monitor and dashboard commands in CLI**

Add to `packages/cli/src/index.ts`:

```typescript
import { monitorCommand } from './commands/monitor.js';
import { dashboardCommand } from './commands/dashboard.js';
```

Add command registrations before `program.parse()`:

```typescript
program
  .command('monitor')
  .description('Agent observability — TUI dashboard showing agent activity, tokens, gates')
  .option('-w, --watch', 'Watch mode — auto-refresh on changes')
  .action(monitorCommand);

program
  .command('dashboard')
  .description('Agent observability — web dashboard at http://localhost:4269')
  .option('-p, --port <port>', 'Port number', '4269')
  .action(dashboardCommand);
```

- [ ] **Step 2: Export getDashboardHtml from core**

Add to `packages/core/src/index.ts`:
```typescript
export { getDashboardHtml } from './templates/dashboard/index-html';
```

- [ ] **Step 3: Run all tests**

Run: `cd /d/FISHI && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/index.ts packages/core/src/index.ts
git commit -m "feat: register fishi monitor and fishi dashboard CLI commands"
```

---

### Task 6: Tests for Monitor + Dashboard

**Files:**
- Create: `packages/cli/src/__tests__/monitor-dashboard.test.ts`

- [ ] **Step 1: Write integration tests**

```typescript
// packages/cli/src/__tests__/monitor-dashboard.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateScaffold, emitEvent, readMonitorState, getAgentSummary, getDashboardHtml } from '@qlucent/fishi-core';

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

    // Emit various events
    emitEvent(dir, { type: 'session.started', agent: 'master-orchestrator', data: { phase: 'init' } });
    emitEvent(dir, { type: 'agent.completed', agent: 'backend-agent', data: { status: 'success', filesChanged: 5 } });
    emitEvent(dir, { type: 'agent.completed', agent: 'frontend-agent', data: { status: 'failed', filesChanged: 0 } });
    emitEvent(dir, { type: 'tokens.used', agent: 'backend-agent', data: { inputTokens: 5000, outputTokens: 2000, model: 'sonnet' } });
    emitEvent(dir, { type: 'tool.used', agent: 'backend-agent', data: { tool: 'mcp:github', action: 'create_pr' } });
    emitEvent(dir, { type: 'agent.created', agent: 'solidity-agent', data: { dynamic: true, coordinator: 'dev-lead' } });

    // Read state
    const state = readMonitorState(dir);
    expect(state.events).toHaveLength(6);
    expect(state.summary.totalAgentCompletions).toBe(2);
    expect(state.summary.totalFilesChanged).toBe(5);
    expect(state.summary.totalTokens).toBe(7000);
    expect(state.summary.tokensByModel.sonnet).toBe(7000);
    expect(state.summary.toolsUsed['mcp:github']).toBe(1);
    expect(state.summary.dynamicAgentsCreated).toBe(1);
    expect(state.dynamicAgents[0].name).toBe('solidity-agent');

    // Agent summary
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
```

- [ ] **Step 2: Run all tests**

Run: `cd /d/FISHI && npx vitest run`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/__tests__/monitor-dashboard.test.ts
git commit -m "test: monitor integration tests + dashboard HTML validation"
```

---

### Task 7: Update plugin with monitor files + final verification

**Files:**
- Modify: `packages/plugin/` (add monitor-emitter.mjs)
- Update tests

- [ ] **Step 1: Generate monitor-emitter.mjs for plugin**

Add the monitor-emitter script to the plugin package (same pattern as other scripts).

- [ ] **Step 2: Run full test suite**

Run: `cd /d/FISHI && npx vitest run`
Expected: All pass (456 existing + ~15 new = ~471)

- [ ] **Step 3: Build both packages**

Run: `cd /d/FISHI/packages/core && npx tsup src/index.ts --format esm --dts --clean && cd /d/FISHI/packages/cli && npx tsup src/index.ts --format esm --clean`
Expected: Both build

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete agent observability — monitor + dashboard commands"
```
