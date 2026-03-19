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
