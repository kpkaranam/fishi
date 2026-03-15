export function getPrdSkill(): string {
  return `---
name: prd-creation
description: >
  Creates a Product Requirements Document (PRD) from a brainstorming output or user request.
  Use this after brainstorming is complete and before architecture design begins. The PRD is
  the bridge between "what we want to build" and "how we'll build it." Every feature, epic,
  or significant change must have a PRD before implementation starts.
---

# PRD Creation Skill

A Product Requirements Document translates the brainstormed design into structured, actionable
requirements that architects and developers can work from. Without a PRD, agents lack clear
acceptance criteria, scope boundaries, and success metrics — leading to wasted work and rework.

## When to Create a PRD

- After brainstorming produces an approved design
- When the user describes a new feature or project
- Before any architecture or sprint planning begins
- When scope changes require re-planning

## PRD Structure

Every PRD follows this template. Scale each section to the project's complexity — a small
feature might have 1-2 sentences per section, while a full product needs detailed paragraphs.

\`\`\`markdown
# PRD: [Feature/Project Name]

## 1. Overview
What are we building and why? One paragraph that anyone on the team can understand.

## 2. Problem Statement
What problem does this solve? Who has this problem? What happens if we don't solve it?

## 3. Goals & Success Metrics
- Primary goal: [measurable outcome]
- Secondary goals: [list]
- Success metrics: [how we measure if this worked]
- Non-goals: [explicitly out of scope to prevent scope creep]

## 4. User Stories
As a [user type], I want to [action] so that [benefit].
- Include acceptance criteria for each story
- Prioritize: must-have vs nice-to-have vs future

## 5. Functional Requirements
Detailed list of what the system must do. Each requirement should be:
- Testable (you can write an acceptance test for it)
- Unambiguous (one interpretation only)
- Prioritized (P0 = launch blocker, P1 = important, P2 = nice-to-have)

## 6. Non-Functional Requirements
- Performance: response times, throughput, concurrency
- Security: auth, data protection, compliance
- Scalability: expected load, growth projections
- Reliability: uptime targets, error budgets
- Accessibility: WCAG level, screen reader support

## 7. Technical Constraints
- Must integrate with: [existing systems]
- Must use: [required technologies]
- Cannot use: [restricted technologies]
- Budget/timeline constraints

## 7b. Existing System Analysis (Brownfield Only)

> **Detection:** Check \`.fishi/fishi.yaml\` for \`project.type\`. If the value is
> \`brownfield\` or \`hybrid\`, include this section. If \`greenfield\`, skip it entirely.

Read \`.fishi/memory/brownfield-analysis.md\` for the full analysis.

Document:
- **What currently exists and works** — don't rebuild what's already there
- **Existing API surface that must remain backward-compatible** — list endpoints,
  contracts, and consumers that cannot break
- **Database schema that must be migrated carefully** — tables, columns, and
  relationships that existing code depends on
- **Integration points with existing code** — modules, services, and interfaces
  that the new work must connect to
- **Tech debt that should be addressed as part of this work** — if you're already
  touching a module, fix its known issues
- **Test coverage gaps that this work should fill** — untested paths in the
  affected modules
- **Dependencies that need upgrading** — outdated packages in the affected area
  that should be updated while we're here

## 8. Data Requirements
- Data models / entities
- Storage requirements
- Privacy / retention policies
- Migration needs (if brownfield)

## 9. API Contracts (if applicable)
High-level API surface — detailed contracts come during architecture.
- Key endpoints / operations
- Auth model
- Rate limiting expectations

## 10. UI/UX Requirements (if applicable)
- Key screens / flows
- Design system / component library to use
- Responsive requirements
- Accessibility requirements

## 11. Testing Strategy
- What types of tests are needed (unit, integration, E2E)
- Coverage targets
- Performance testing requirements
- Security testing requirements

## 12. Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [risk] | high/med/low | high/med/low | [plan] |

## 13. Timeline & Milestones
- Phase 1: [scope] — [timeframe]
- Phase 2: [scope] — [timeframe]
- MVP definition: what's the smallest thing we can ship?

## 14. Open Questions
List anything that needs clarification before implementation starts.
\`\`\`

## Process

1. **Read the brainstorming output** — check \`docs/product/\` or the approved design from the conversation
2. **Draft the PRD** — fill in all sections, scaling detail to complexity
3. **Flag open questions** — don't guess, list what needs user input
4. **Present to user section by section** — get approval incrementally
5. **Save the PRD** to \`.fishi/plans/prd/YYYY-MM-DD-<topic>-prd.md\`
6. **Create a gate** — PRD must be approved before architecture begins

## Key Principles

- **Be specific, not vague** — "fast" is not a requirement, "< 200ms p95 response time" is
- **Include non-goals** — explicitly stating what's out of scope prevents scope creep
- **Every requirement must be testable** — if you can't write a test for it, it's not a requirement
- **YAGNI** — remove anything the user didn't ask for or that isn't needed for MVP
- **Reference existing code** — for brownfield projects, link to existing implementations that inform the design
`;
}
