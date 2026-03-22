/**
 * Monitor Emitter Script
 *
 * Shared helper that other hooks can import to emit agent observability events.
 * Also callable directly via CLI for one-off event emission.
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

export function getMonitorEmitterScript(): string {
  return `#!/usr/bin/env node
// monitor-emitter.mjs — FISHI agent observability event emitter
//
// Usage as a library (ESM import in another .mjs hook):
//   const { emitMonitorEvent } = await import('./.fishi/scripts/monitor-emitter.mjs');
//   await emitMonitorEvent(process.cwd(), { type: 'agent.completed', agent: 'backend-agent', data: { filesChanged: 3 } });
//
// Usage via CLI:
//   node .fishi/scripts/monitor-emitter.mjs '{"type":"agent.completed","agent":"backend-agent","data":{"filesChanged":3}}'

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// ── Constants ────────────────────────────────────────────────────────

const MAX_EVENTS = 500;

// ── State helpers ────────────────────────────────────────────────────

function monitorPath(root) {
  return join(root, '.fishi', 'state', 'monitor.json');
}

function emptySummary() {
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

function emptyState() {
  return {
    events: [],
    summary: emptySummary(),
    dynamicAgents: [],
    lastUpdated: new Date().toISOString(),
  };
}

function readState(root) {
  const p = monitorPath(root);
  if (!existsSync(p)) return emptyState();
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return emptyState();
  }
}

function writeState(root, state) {
  const p = monitorPath(root);
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2) + '\\n', 'utf-8');
}

// ── Summary updater ──────────────────────────────────────────────────

function updateSummary(state, event) {
  switch (event.type) {
    case 'agent.completed': {
      state.summary.totalAgentCompletions++;
      const files = (event.data && typeof event.data.filesChanged === 'number')
        ? event.data.filesChanged
        : 0;
      state.summary.totalFilesChanged += files;
      break;
    }
    case 'tokens.used': {
      const input = (event.data && typeof event.data.inputTokens === 'number')
        ? event.data.inputTokens
        : 0;
      const output = (event.data && typeof event.data.outputTokens === 'number')
        ? event.data.outputTokens
        : 0;
      const total = input + output;
      const model = (event.data && event.data.model) || 'unknown';
      state.summary.totalTokens += total;
      state.summary.tokensByModel[model] = (state.summary.tokensByModel[model] || 0) + total;
      state.summary.tokensByAgent[event.agent] =
        (state.summary.tokensByAgent[event.agent] || 0) + total;
      break;
    }
    case 'tool.used': {
      const tool = event.data && event.data.tool;
      if (tool) {
        state.summary.toolsUsed[tool] = (state.summary.toolsUsed[tool] || 0) + 1;
      }
      break;
    }
    case 'agent.created': {
      if (event.data && event.data.dynamic) {
        state.summary.dynamicAgentsCreated++;
        state.dynamicAgents.push({
          name: event.agent,
          coordinator: (event.data.coordinator) || 'unknown',
        });
      }
      break;
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Emit a monitor event.
 *
 * @param {string} root - Project root directory (where .fishi/ lives)
 * @param {{ type: string, agent: string, data: object, timestamp?: string }} event
 */
export function emitMonitorEvent(root, event) {
  const state = readState(root);

  const timestamped = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  state.events.push(timestamped);
  if (state.events.length > MAX_EVENTS) {
    state.events = state.events.slice(-MAX_EVENTS);
  }

  updateSummary(state, event);

  state.lastUpdated = new Date().toISOString();
  writeState(root, state);
}

// ── CLI entry point ──────────────────────────────────────────────────

const isMain = process.argv[1] &&
  (process.argv[1].endsWith('monitor-emitter.mjs') || process.argv[1].endsWith('monitor-emitter'));

if (isMain) {
  const raw = process.argv[2];
  if (!raw) {
    console.error("[FISHI] Usage: node .fishi/scripts/monitor-emitter.mjs " + JSON.stringify({"type":"...","agent":"...","data":{}}));
    process.exit(1);
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (err) {
    console.error('[FISHI] monitor-emitter: invalid JSON:', err.message);
    process.exit(1);
  }

  if (!event.type || !event.agent) {
    console.error('[FISHI] monitor-emitter: event must have "type" and "agent" fields');
    process.exit(1);
  }

  if (!event.data || typeof event.data !== 'object') {
    event.data = {};
  }

  try {
    emitMonitorEvent(process.cwd(), event);
    console.log('[FISHI] monitor event emitted:', event.type, '/', event.agent);
  } catch (err) {
    console.error('[FISHI] monitor-emitter error:', err.message);
    process.exit(1);
  }
}
`;
}
