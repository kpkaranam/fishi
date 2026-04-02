# fishi-governance

**Governance plugin for Claude Code** — blocks destructive agent operations and logs an audit trail.

Works alongside **any framework**: Ruflo, BMAD, Oh-My-ClaudeCode, or raw Claude Code.

## Why?

AI agents are deleting production files, force-pushing to main, and overwriting `.env` files — right now, today. This plugin stops that.

**Before fishi-governance:**
```
Agent: "Let me clean up the project..."
> rm -rf migrations/    ← your database migrations, gone
> git push --force origin main    ← your team's work, overwritten
```

**After fishi-governance:**
```
Agent: "Let me clean up the project..."
> rm -rf migrations/
[fishi-governance] BLOCKED: Recursive delete of all files in cwd
> git push --force origin main
[fishi-governance] BLOCKED: Force push to main/master
```

## Quick Start (2 minutes)

```bash
# 1. Install the plugin
claude install fishi-governance

# 2. That's it. Start a Claude Code session.
# Destructive operations are now blocked. Audit trail is logging.
```

Zero configuration required. Works immediately.

## What It Blocks

| Category | Examples |
|----------|---------|
| Filesystem destruction | `rm -rf /`, `rm -rf *`, `mkfs`, `dd if=` |
| Dangerous git operations | `git push --force main`, `git reset --hard`, `git clean -fd` |
| Database destruction | `DROP TABLE`, `TRUNCATE TABLE`, `DELETE FROM` (no WHERE) |
| Privilege escalation | `sudo`, `su root`, `chmod 777` |
| Remote code execution | `curl ... \| bash`, `wget ... \| sh` |
| Environment exposure | `.env` file overwrites, `env >` dumps |
| System commands | `shutdown`, `reboot`, `kill -9` |

## Audit Trail

Every agent action is logged to `.fishi/audit-log.jsonl`:

```json
{"ts":"2026-04-02T12:00:00Z","event":"blocked","tool":"Bash","command":"rm -rf migrations/","reason":"Recursive delete of all files in cwd","override":false}
{"ts":"2026-04-02T12:00:01Z","event":"allowed","tool":"Write","command":"src/index.ts","reason":"","override":false}
```

- Append-only — existing entries can never be modified
- Persists across sessions
- Structured JSONL — easy to parse and review

## Works With

- **Ruflo** — governance hooks layer on top, no conflicts
- **BMAD Method** — complementary: BMAD plans, FISHI governs
- **Oh-My-ClaudeCode** — additive hooks, independent operation
- **Raw Claude Code** — standalone protection for any project
- **Full FISHI framework** — coexists with v0.20.6+

## How It Works

Three Claude Code hooks, zero dependencies:

1. **SessionStart** — confirms governance is active, creates `.fishi/` directory
2. **PreToolUse (Bash)** — checks commands against 30+ destructive patterns, blocks matches
3. **PostToolUse (Bash|Write|Edit)** — logs every action to audit trail

All processing is local. Zero network calls. Zero telemetry. Zero tracking.

## License

MIT
