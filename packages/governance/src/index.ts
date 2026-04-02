/**
 * fishi-governance — Governance plugin for Claude Code
 *
 * Blocks destructive agent operations and logs audit trails.
 * Works alongside any framework: Ruflo, BMAD, Oh-My-ClaudeCode, or raw Claude Code.
 *
 * This module exports the deny patterns and utilities for testing.
 * The actual hooks are in scripts/ (zero-dependency .mjs files).
 */

export interface DenyPattern {
  pattern: RegExp;
  reason: string;
}

export const DANGEROUS_PATTERNS: DenyPattern[] = [
  { pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)*-[a-zA-Z]*r[a-zA-Z]*\s+\/(?:\s|$)/, reason: 'Recursive force-delete of root filesystem' },
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
  { pattern: /git\s+push\s+--force\s+(origin\s+)?(main|master)\b/, reason: 'Force push to main/master' },
  { pattern: /git\s+push\s+-f\s+(origin\s+)?(main|master)\b/, reason: 'Force push to main/master' },
  { pattern: /git\s+reset\s+--hard\s*$/, reason: 'Hard reset without target' },
  { pattern: /git\s+clean\s+-fd/, reason: 'Clean untracked files and directories' },
  { pattern: /git\s+checkout\s+--\s+\./, reason: 'Discard all working directory changes' },
  { pattern: /drop\s+database/i, reason: 'Drop database' },
  { pattern: /drop\s+table/i, reason: 'Drop table' },
  { pattern: /truncate\s+table/i, reason: 'Truncate table' },
  { pattern: /delete\s+from\s+\w+\s*;?\s*$/i, reason: 'Delete all rows (no WHERE clause)' },
  { pattern: /:\(\)\{\s*:\|:&\s*\};:/, reason: 'Fork bomb' },
  { pattern: /curl\s[^|]*\|\s*(ba)?sh/, reason: 'Piped remote execution' },
  { pattern: /wget\s[^|]*\|\s*(ba)?sh/, reason: 'Piped remote execution' },
  { pattern: /\bsudo\b/, reason: 'Privilege escalation' },
  { pattern: /\bsu\s+root\b/, reason: 'Switch to root user' },
  { pattern: /chmod\s+777\b/, reason: 'World-writable permissions' },
  { pattern: />\s*\.env/, reason: 'Overwriting .env file' },
  { pattern: /\bshutdown\b/, reason: 'System shutdown' },
  { pattern: /\breboot\b/, reason: 'System reboot' },
  { pattern: /\bkill\s+-9\s/, reason: 'Force killing process' },
];

export function checkCommand(command: string): { allowed: boolean; reason: string } {
  const normalized = command.trim();
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason };
    }
  }
  return { allowed: true, reason: '' };
}
