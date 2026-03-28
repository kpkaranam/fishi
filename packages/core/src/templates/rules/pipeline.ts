export function getPipelineRules(): string {
  return `# Pipeline Rules

Every project follows a 9-phase pipeline. Read .fishi/state/project.yaml to know the current phase.

Phases: init → discovery → prd → architecture → sprint_planning → development → qa_security → deployment → deployed

Rules:
- Do NOT advance to the next phase without user approval at the gate
- Use /fishi-init to start or resume — it will guide you step by step
- Each phase has a gate. Run: node .fishi/scripts/gate-manager.mjs create --phase {phase}
- After user approves: node .fishi/scripts/gate-manager.mjs approve --phase {phase}
- Then advance: node .fishi/scripts/phase-runner.mjs advance

State commands:
- Current phase: node .fishi/scripts/phase-runner.mjs current
- Gate status: node .fishi/scripts/gate-manager.mjs status
- Advance phase: node .fishi/scripts/phase-runner.mjs advance
`;
}
