export function getSettingsJsonTemplate(): string {
  const settings = {
    hooks: {
      SessionStart: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: "node .fishi/scripts/session-start.mjs",
            },
          ],
        },
      ],
      Stop: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: "node .fishi/scripts/auto-checkpoint.mjs",
            },
          ],
        },
      ],
      SubagentStop: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: "node .fishi/scripts/auto-checkpoint.mjs",
            },
          ],
        },
      ],
      PreToolUse: [
        {
          matcher: "Bash",
          hooks: [
            {
              type: "command",
              command: "node .fishi/scripts/safety-check.mjs",
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: "Write|Edit",
          hooks: [
            {
              type: "command",
              command: "node .fishi/scripts/post-edit.mjs",
            },
          ],
        },
      ],
    },
    permissions: {
      allow: [
        // Core tools — always allowed
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "WebFetch",

        // Agent orchestration
        "Agent",
        "TodoRead",
        "TodoWrite",

        // Package managers
        "Bash(pnpm *)",
        "Bash(npx *)",
        "Bash(node *)",
        "Bash(bun *)",
        "Bash(deno *)",

        // Git operations
        "Bash(git *)",

        // File system (read/navigate)
        "Bash(cat *)",
        "Bash(ls *)",
        "Bash(find *)",
        "Bash(grep *)",
        "Bash(head *)",
        "Bash(tail *)",
        "Bash(wc *)",
        "Bash(echo *)",
        "Bash(mkdir *)",
        "Bash(cp *)",
        "Bash(cd *)",
        "Bash(mv *)",
        "Bash(touch *)",
        "Bash(tree *)",

        // Text processing
        "Bash(sed *)",
        "Bash(awk *)",
        "Bash(sort *)",
        "Bash(uniq *)",
        "Bash(diff *)",
        "Bash(tr *)",
        "Bash(cut *)",
        "Bash(xargs *)",

        // Networking & data
        "Bash(curl *)",
        "Bash(wget *)",
        "Bash(jq *)",

        // System info
        "Bash(date *)",
        "Bash(env *)",
        "Bash(which *)",
        "Bash(type *)",
        "Bash(uname *)",
        "Bash(whoami *)",
        "Bash(pwd *)",
        "Bash(printenv *)",

        // Build tools
        "Bash(tsc *)",
        "Bash(tsup *)",
        "Bash(vitest *)",
        "Bash(eslint *)",
        "Bash(prettier *)",
        "Bash(docker *)",
        "Bash(docker-compose *)",

        // General catch-all for Bash (safety-check.mjs guards dangerous commands)
        "Bash(*)",
      ],
      deny: [
        // Destructive filesystem operations
        "Bash(rm -rf /)",
        "Bash(rm -rf /*)",
        "Bash(rm -rf ~)",
        "Bash(rm -rf ~/*)",
        "Bash(rm -rf .)",

        // Permission escalation
        "Bash(chmod 777 *)",
        "Bash(chmod -R 777 *)",
        "Bash(sudo *)",
        "Bash(su *)",
        "Bash(doas *)",

        // System destruction
        "Bash(shutdown *)",
        "Bash(reboot *)",
        "Bash(halt *)",
        "Bash(poweroff *)",
        "Bash(mkfs *)",
        "Bash(dd if=*)",
        "Bash(> /dev/sda)",
        "Bash(fdisk *)",

        // Package managers without pnpm (enforce pnpm)
        "Bash(npm *)",
        "Bash(yarn *)",

        // Network attacks
        "Bash(nmap *)",
        "Bash(netcat *)",
        "Bash(nc -l *)",
      ],
    },
  };

  return JSON.stringify(settings, null, 2) + '\n';
}
