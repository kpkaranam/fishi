export function getSandboxPolicyTemplate(): string {
  return `# FISHI Sandbox Policy
# Controls what agents can access inside their sandboxed worktrees

# Network domains agents are allowed to reach
network_allow:
  - registry.npmjs.org
  - localhost
  - 127.0.0.1

# Environment variables passed into the sandbox
# Add secrets your agents need (e.g., DATABASE_URL, API_KEY)
env_passthrough: []

# Maximum time (seconds) a single agent command can run
timeout: 600

# Docker resource limits (only applies in docker mode)
memory: "2g"
cpus: 2
`;
}
