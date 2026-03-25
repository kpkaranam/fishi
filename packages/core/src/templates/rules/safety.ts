export function getSafetyRules(): string {
  return `# Safety Rules

Read SOUL.md at session start for absolute boundaries.

Critical rules:
- NEVER delete files without human approval — archive to .fishi/archive/ instead
- NEVER push to main/master/production without gate approval
- NEVER modify environment variables or credentials
- NEVER disable safety hooks or gate requirements
- NEVER skip the pipeline phases

All code changes must go through worktrees:
- Create: the Agent tool handles this automatically with isolation: "worktree"
- NEVER write application code directly on the main branch
- Worktree branches are logged in .fishi/state/worktree-log.yaml

Escalation path: Worker → Coordinator → Master → Human (via gate)
`;
}
