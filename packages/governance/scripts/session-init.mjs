#!/usr/bin/env node
// session-init.mjs — fishi-governance session initialization
// Zero dependencies: Node.js built-ins only
// Confirms governance is active on session start (NFR11)
import { mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

// Ensure .fishi directory exists
const auditDir = join(process.cwd(), '.fishi');
if (!existsSync(auditDir)) {
  try {
    mkdirSync(auditDir, { recursive: true });
  } catch {
    // Non-fatal: directory may already exist or be created by another hook
  }
}

// Log session start event
const event = {
  ts: new Date().toISOString(),
  event: 'allowed',
  tool: 'SessionStart',
  command: 'session_initialized',
  reason: 'governance_active',
  override: false,
};

try {
  appendFileSync(join(auditDir, 'audit-log.jsonl'), JSON.stringify(event) + '\n');
} catch {
  // Non-fatal
}

// Confirm governance is active (visible in Claude Code session output)
process.stderr.write('[fishi-governance] Active — monitoring PreToolUse events\n');
process.exit(0);
