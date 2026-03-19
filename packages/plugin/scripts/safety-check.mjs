#!/usr/bin/env node
// safety-check.mjs — FISHI safety check hook
// Zero dependencies: uses only Node.js built-ins
// Exit code 2 = BLOCK command, exit code 0 = ALLOW command
import { readFileSync } from 'fs';

/**
 * Read all of stdin synchronously (Claude Code pipes tool input JSON here).
 */
function readStdin() {
  try {
    return readFileSync('/dev/stdin', 'utf-8');
  } catch {
    try {
      return readFileSync(0, 'utf-8');
    } catch {
      return '';
    }
  }
}

// ── Read command from stdin (tool input JSON) or fallback ────────────
let command = '';

const stdinData = readStdin();
if (stdinData) {
  try {
    const toolInput = JSON.parse(stdinData);
    // Claude Code hooks pass { input: { command: "..." } }
    command = toolInput?.input?.command || toolInput?.command || toolInput?.cmd || '';
  } catch {
    // stdin wasn't valid JSON — try as raw command string
    command = stdinData.trim();
  }
}

// Fallback: environment variable or CLI argument
if (!command) {
  command = process.env.FISHI_COMMAND || process.argv[2] || '';
}

if (!command) {
  process.exit(0); // No command to check, allow
}

const normalizedCmd = command.trim();

// ── Dangerous patterns ───────────────────────────────────────────────
const DANGEROUS_PATTERNS = [
  // ── Destructive filesystem operations ──────────────────────────────
  { pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)*-[a-zA-Z]*r[a-zA-Z]*\s+\/(?:\s|$)/,  reason: 'Recursive force-delete of root filesystem' },
  { pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+)*-[a-zA-Z]*f[a-zA-Z]*\s+\/(?:\s|$)/,  reason: 'Recursive force-delete of root filesystem' },
  { pattern: /rm\s+-rf\s+\/\*/,                reason: 'Recursive delete of all root entries' },
  { pattern: /rm\s+-rf\s+~(?:\/|\s|$)/,         reason: 'Recursive delete of home directory' },
  { pattern: /rm\s+-rf\s+\*(?:\s|$)/,            reason: 'Recursive delete of all files in cwd' },
  { pattern: /rm\s+-rf\s+\.\*(?:\s|$)/,          reason: 'Recursive delete of hidden files' },
  { pattern: /--no-preserve-root/,               reason: 'Bypassing root deletion safety' },

  // ── Filesystem destruction ─────────────────────────────────────────
  { pattern: /mkfs\b/,                           reason: 'Formatting filesystem' },
  { pattern: /\bdd\s+if=/,                       reason: 'Direct disk write with dd' },
  { pattern: /\bfdisk\b/,                        reason: 'Disk partitioning tool' },
  { pattern: />\s*\/dev\/[sh]d/,                 reason: 'Write to raw disk device' },

  // ── Dangerous git operations ───────────────────────────────────────
  { pattern: /git\s+push\s+--force\s+(origin\s+)?(main|master)\b/, reason: 'Force push to main/master' },
  { pattern: /git\s+push\s+-f\s+(origin\s+)?(main|master)\b/,     reason: 'Force push to main/master' },
  { pattern: /git\s+reset\s+--hard\s*$/,                          reason: 'Hard reset without target (destroys uncommitted work)' },

  // ── Database destruction ───────────────────────────────────────────
  { pattern: /drop\s+database/i,                 reason: 'Drop database' },
  { pattern: /drop\s+table/i,                    reason: 'Drop table' },
  { pattern: /truncate\s+table/i,                reason: 'Truncate table' },
  { pattern: /delete\s+from\s+\w+\s*;?\s*$/i,   reason: 'Delete all rows (no WHERE clause)' },

  // ── Fork bombs ─────────────────────────────────────────────────────
  { pattern: /:\(\)\{\s*:\|:&\s*\};:/,           reason: 'Fork bomb' },
  { pattern: /\bfork\s*bomb/i,                   reason: 'Fork bomb reference' },

  // ── Remote code execution via pipe ─────────────────────────────────
  { pattern: /curl\s[^|]*\|\s*(ba)?sh/,          reason: 'Piped remote execution: curl to shell' },
  { pattern: /curl\s[^|]*\|\s*zsh/,              reason: 'Piped remote execution: curl to zsh' },
  { pattern: /wget\s[^|]*\|\s*(ba)?sh/,          reason: 'Piped remote execution: wget to shell' },
  { pattern: /wget\s[^|]*\|\s*zsh/,              reason: 'Piped remote execution: wget to zsh' },
  { pattern: /curl\s.*-o\s*-\s*\|/,              reason: 'Piped remote execution via curl stdout' },

  // ── Permission/privilege escalation ────────────────────────────────
  { pattern: /\bsudo\b/,                         reason: 'Privilege escalation with sudo' },
  { pattern: /\bsu\s+root\b/,                    reason: 'Switch to root user' },
  { pattern: /\bsu\s*$/,                          reason: 'Switch to root user (implicit)' },
  { pattern: /chmod\s+777\b/,                    reason: 'World-writable permissions (chmod 777)' },
  { pattern: /chmod\s+(-[a-zA-Z]*R[a-zA-Z]*\s+)?777\b/, reason: 'Recursive world-writable permissions' },
  { pattern: /chmod\s+-R\s+777\b/,               reason: 'Recursive chmod 777' },
  { pattern: /chown\s+-R\s+.*\/(?:\s|$)/,        reason: 'Recursive chown on root' },

  // ── Environment/secrets exposure ───────────────────────────────────
  { pattern: /\benv\s*>\s*/,                     reason: 'Dumping environment variables to file' },
  { pattern: /printenv\s*>\s*/,                   reason: 'Dumping environment variables to file' },
];

for (const { pattern, reason } of DANGEROUS_PATTERNS) {
  if (pattern.test(normalizedCmd)) {
    process.stderr.write(`[FISHI SAFETY] BLOCKED: ${reason}\n`);
    process.stderr.write(`[FISHI SAFETY] Command: ${normalizedCmd}\n`);
    process.exit(2); // Exit 2 = block the command
  }
}

// Command is safe — exit 0 silently
process.exit(0);
