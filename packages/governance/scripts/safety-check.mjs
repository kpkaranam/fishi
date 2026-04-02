#!/usr/bin/env node
// safety-check.mjs — fishi-governance destructive command blocker
// Zero dependencies: Node.js built-ins only
// Exit 2 = BLOCK command, Exit 0 = ALLOW command
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

// Read command from Claude Code hook stdin (tool input JSON)
let command = '';
const stdinData = readStdin();
if (stdinData) {
  try {
    const toolInput = JSON.parse(stdinData);
    command = toolInput?.input?.command || toolInput?.command || toolInput?.cmd || '';
  } catch {
    command = stdinData.trim();
  }
}

if (!command) {
  process.exit(0);
}

const normalizedCmd = command.trim();

// ── Destructive patterns ────────────────────────────────────────────
const DANGEROUS_PATTERNS = [
  // Filesystem destruction
  { pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)*-[a-zA-Z]*r[a-zA-Z]*\s+\/(?:\s|$)/, reason: 'Recursive force-delete of root filesystem' },
  { pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+)*-[a-zA-Z]*f[a-zA-Z]*\s+\/(?:\s|$)/, reason: 'Recursive force-delete of root filesystem' },
  { pattern: /rm\s+-rf\s+\/\*/, reason: 'Recursive delete of all root entries' },
  { pattern: /rm\s+-rf\s+~(?:\/|\s|$)/, reason: 'Recursive delete of home directory' },
  { pattern: /rm\s+-rf\s+\*(?:\s|$)/, reason: 'Recursive delete of all files in cwd' },
  { pattern: /rm\s+-rf\s+\.(?:\s|$)/, reason: 'Recursive delete of current directory' },
  { pattern: /rm\s+-rf\s+\.\*(?:\s|$)/, reason: 'Recursive delete of hidden files' },
  { pattern: /rm\s+-rf\s+\.\.(?:\s|$)/, reason: 'Recursive delete of parent directory' },
  { pattern: /--no-preserve-root/, reason: 'Bypassing root deletion safety' },
  { pattern: /\bmkfs\b/, reason: 'Formatting filesystem' },
  { pattern: /\bdd\s+if=/, reason: 'Direct disk write with dd' },
  { pattern: /\bfdisk\b/, reason: 'Disk partitioning tool' },
  { pattern: />\s*\/dev\/[sh]d/, reason: 'Write to raw disk device' },

  // Dangerous git operations
  { pattern: /git\s+push\s+--force\s+(origin\s+)?(main|master)\b/, reason: 'Force push to main/master' },
  { pattern: /git\s+push\s+-f\s+(origin\s+)?(main|master)\b/, reason: 'Force push to main/master' },
  { pattern: /git\s+reset\s+--hard\s*$/, reason: 'Hard reset without target (destroys uncommitted work)' },
  { pattern: /git\s+clean\s+-fd/, reason: 'Clean untracked files and directories' },
  { pattern: /git\s+checkout\s+--\s+\./, reason: 'Discard all working directory changes' },

  // Database destruction
  { pattern: /drop\s+database/i, reason: 'Drop database' },
  { pattern: /drop\s+table/i, reason: 'Drop table' },
  { pattern: /truncate\s+table/i, reason: 'Truncate table' },
  { pattern: /delete\s+from\s+\w+\s*;?\s*$/i, reason: 'Delete all rows (no WHERE clause)' },

  // Fork bombs
  { pattern: /:\(\)\{\s*:\|:&\s*\};:/, reason: 'Fork bomb' },

  // Remote code execution via pipe
  { pattern: /curl\s[^|]*\|\s*(ba)?sh/, reason: 'Piped remote execution: curl to shell' },
  { pattern: /wget\s[^|]*\|\s*(ba)?sh/, reason: 'Piped remote execution: wget to shell' },

  // Privilege escalation
  { pattern: /\bsudo\b/, reason: 'Privilege escalation with sudo' },
  { pattern: /\bsu\s+root\b/, reason: 'Switch to root user' },
  { pattern: /\bsu\s*$/, reason: 'Switch to root user (implicit)' },
  { pattern: /chmod\s+777\b/, reason: 'World-writable permissions' },
  { pattern: /chmod\s+(-[a-zA-Z]*R[a-zA-Z]*\s+)?777\b/, reason: 'Recursive world-writable permissions' },

  // Environment/secrets exposure
  { pattern: />\s*\.env/, reason: 'Overwriting .env file' },
  { pattern: /\benv\s*>\s*/, reason: 'Dumping environment variables to file' },
  { pattern: /\bkill\s+-9\s/, reason: 'Force killing process' },

  // System shutdown
  { pattern: /\bshutdown\b/, reason: 'System shutdown' },
  { pattern: /\breboot\b/, reason: 'System reboot' },
  { pattern: /\bpoweroff\b/, reason: 'System poweroff' },
];

// ── Check command against patterns ──────────────────────────────────
for (const { pattern, reason } of DANGEROUS_PATTERNS) {
  if (pattern.test(normalizedCmd)) {
    // Log the blocked event
    const event = {
      ts: new Date().toISOString(),
      event: 'blocked',
      tool: 'Bash',
      command: normalizedCmd.substring(0, 200),
      reason: reason,
      override: false,
    };

    try {
      const auditDir = join(process.cwd(), '.fishi');
      if (!existsSync(auditDir)) {
        mkdirSync(auditDir, { recursive: true });
      }
      appendFileSync(join(auditDir, 'audit-log.jsonl'), JSON.stringify(event) + '\n');
    } catch {
      // Audit write failure should not prevent blocking
    }

    process.stderr.write(`[fishi-governance] BLOCKED: ${reason}\n`);
    process.stderr.write(`[fishi-governance] Command: ${normalizedCmd}\n`);
    process.exit(2);
  }
}

// ── Command is safe ─────────────────────────────────────────────────
process.exit(0);
