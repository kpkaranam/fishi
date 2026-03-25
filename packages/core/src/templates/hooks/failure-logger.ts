export function getFailureLoggerHook(): string {
  return `#!/usr/bin/env node
// failure-logger.mjs — FISHI Failure Logger
// Fires on PostToolUseFailure event.
// Auto-records failures to learnings.

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

// Read failure data from stdin
let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf-8').trim();
} catch {
  process.exit(0);
}

let event = {};
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const toolName = event.tool_name || event.tool || 'unknown';
const error = event.error || event.stderr || 'unknown error';

// Only log meaningful failures (skip permission denials, timeouts)
if (error.includes('Permission') || error.includes('timeout')) {
  process.exit(0);
}

// Record to learnings
try {
  const { execSync } = await import('child_process');
  const escapedError = error.replace(/"/g, "'").substring(0, 200);
  execSync(
    \`node .fishi/scripts/learnings-manager.mjs add-mistake --agent system --domain \${toolName} --mistake "\${escapedError}" --fix "pending" --lesson "Auto-captured failure"\`,
    { cwd: ROOT, stdio: 'pipe', timeout: 5000 }
  );
} catch {}

// Emit monitor event
try {
  const emitterUrl = new URL('./monitor-emitter.mjs', import.meta.url).href;
  const { emitMonitorEvent } = await import(emitterUrl);
  emitMonitorEvent(ROOT, {
    type: 'tool.failed',
    agent: 'system',
    data: { tool: toolName, error: error.substring(0, 200) }
  });
} catch {}

process.exit(0);
`;
}
