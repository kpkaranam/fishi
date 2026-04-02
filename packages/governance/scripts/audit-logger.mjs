#!/usr/bin/env node
// audit-logger.mjs — fishi-governance audit trail logger
// Zero dependencies: Node.js built-ins only
// Logs every PostToolUse event to .fishi/audit-log.jsonl (append-only)
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

const stdinData = readStdin();
if (!stdinData) {
  process.exit(0);
}

let toolName = '';
let command = '';

try {
  const toolInput = JSON.parse(stdinData);
  toolName = toolInput?.tool_name || toolInput?.tool || 'unknown';
  command = toolInput?.input?.command || toolInput?.input?.file_path || toolInput?.input?.content?.substring(0, 100) || '';
} catch {
  process.exit(0);
}

const event = {
  ts: new Date().toISOString(),
  event: 'allowed',
  tool: toolName,
  command: typeof command === 'string' ? command.substring(0, 200) : '',
  reason: '',
  override: false,
};

try {
  const auditDir = join(process.cwd(), '.fishi');
  if (!existsSync(auditDir)) {
    mkdirSync(auditDir, { recursive: true });
  }
  appendFileSync(join(auditDir, 'audit-log.jsonl'), JSON.stringify(event) + '\n');
} catch (err) {
  // Fail-safe: audit write failure should not crash the session
  process.stderr.write(`[fishi-governance] Warning: audit log write failed: ${err.message}\n`);
}

process.exit(0);
