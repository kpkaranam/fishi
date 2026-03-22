export function getGateCommand(): string {
  return `# /fishi-gate — Gate Management

## Description
Manage quality gates — approve, reject, skip, or list pending gate checks.
Gates are the enforcement mechanism that prevents phases from advancing without explicit user approval.

## Usage
\`\`\`
/fishi-gate approve              # Approve the current pending gate
/fishi-gate reject               # Reject the current gate with feedback
/fishi-gate skip                 # Skip the current gate (logged as tech debt)
/fishi-gate list                 # List all gates and their statuses
/fishi-gate status               # Show the current pending gate details
\`\`\`

## Instructions

### /fishi-gate approve

Run the gate approval script and advance to the next phase:
\`\`\`bash
node .fishi/scripts/gate-manager.mjs approve --phase {current-phase}
\`\`\`

After approval, advance the phase:
\`\`\`bash
node .fishi/scripts/phase-runner.mjs advance
\`\`\`

Read the updated state to confirm:
\`\`\`bash
cat .fishi/state/project.yaml
cat .fishi/state/gates.yaml
\`\`\`

Display confirmation: "Gate approved. Advanced to phase: {next-phase}"

### /fishi-gate reject

Ask the user for feedback on what needs to change, then:
\`\`\`bash
node .fishi/scripts/gate-manager.mjs reject --phase {current-phase} --reason "{user feedback}"
\`\`\`

Do NOT advance the phase. The current phase must be reworked.
Display: "Gate rejected. Rework needed in phase: {current-phase}. Feedback: {reason}"

### /fishi-gate skip

Require a reason for skipping:
\`\`\`bash
node .fishi/scripts/gate-manager.mjs skip --phase {current-phase} --reason "{reason}"
\`\`\`

Advance the phase:
\`\`\`bash
node .fishi/scripts/phase-runner.mjs advance
\`\`\`

Display a warning: "WARNING: Gate skipped for phase {current-phase}. This is logged as tech debt. Reason: {reason}"

### /fishi-gate list

Read all gate data:
\`\`\`bash
cat .fishi/state/gates.yaml
\`\`\`

Display each gate:
\`\`\`
=== Gate History ===

Phase          | Status   | Timestamp           | Notes
---------------|----------|---------------------|------------------
discovery      | approved | 2025-01-15 10:30:00 | —
prd            | approved | 2025-01-16 14:00:00 | —
architecture   | pending  | 2025-01-17 09:00:00 | Awaiting approval
sprint_planning| —        | —                   | Not yet reached
development    | —        | —                   | Not yet reached
deployment     | —        | —                   | Not yet reached

Current pending gate: architecture
\`\`\`

### /fishi-gate status

Read the current gate details:
\`\`\`bash
cat .fishi/state/gates.yaml
cat .fishi/state/project.yaml
\`\`\`

Show the pending gate with its artifacts and what the user needs to review.
`;
}
