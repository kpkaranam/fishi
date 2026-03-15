export function getBrownfieldDiscoverySkill(): string {
  return `# Brownfield Discovery Skill

## Purpose
Socratic design refinement for **existing codebases**. Unlike greenfield brainstorming
which asks "what do you want to build?", this skill asks "what do you want to change
or add to the existing codebase?" and ensures every proposal works WITH the existing
architecture rather than against it.

## CRITICAL RULE
**NEVER skip this phase for brownfield projects.** Every feature, enhancement, or
refactoring effort in an existing codebase MUST go through brownfield discovery before
implementation starts. The risk of breaking existing functionality is too high to skip.

## Process

### 1. Load Existing System Context
- Read \`.fishi/memory/brownfield-analysis.md\` for the full codebase analysis
- Read \`.fishi/fishi.yaml\` to confirm project type and tech stack
- Review \`.fishi/memory/project-context.md\` for prior decisions
- Summarize the current state of the codebase to the user so they know you understand it

### 2. Understand the Change Request
- Ask: **"What do you want to change or add to the existing codebase?"**
- Do NOT ask "what do you want to build?" — the user already has a codebase
- Identify whether this is:
  - **Enhancement** — adding new functionality to existing modules
  - **Refactoring** — restructuring without changing behavior
  - **Migration** — moving from one technology/pattern to another
  - **Bug fix cluster** — addressing a group of related issues
  - **New module** — adding something new that integrates with existing code

### 3. Show Brownfield Analysis Results
- Present the relevant portions of \`.fishi/memory/brownfield-analysis.md\`
- Highlight:
  - Existing modules that will be affected by the proposed change
  - Current architecture patterns the change must follow
  - Known tech debt in the affected area
  - Existing test coverage for the affected modules

### 4. Identify Affected Modules & Files
- Map the proposed change to specific existing files and modules
- For each affected area, document:
  - **File/module**: path and purpose
  - **Change type**: modify / extend / replace / wrap
  - **Risk level**: high (core logic) / medium (feature code) / low (peripheral)
  - **Existing tests**: what tests cover this area today
- Ask the user: "These are the areas I expect to be affected. Does this match your understanding?"

### 5. Propose Approaches That Work WITH Existing Architecture
- Present 2-3 approaches that respect the existing codebase:
  - **Approach**: Brief description
  - **Fits existing patterns?**: How well this aligns with current architecture
  - **Backward-compatible?**: Whether existing consumers are unaffected
  - **Migration needed?**: Any data or API migration steps
  - **Pros**: Benefits
  - **Cons**: Risks or downsides
  - **Effort**: Rough estimate (small/medium/large)
- NEVER propose "rewrite from scratch" unless the user explicitly asks for it
- Prefer incremental approaches: adapter patterns, feature flags, strangler fig

### 6. Flag Tech Debt Opportunities
- Identify tech debt in the affected modules that should be addressed now
- For each item:
  - **What**: Description of the debt
  - **Why now**: Why it makes sense to fix this alongside the proposed change
  - **Risk of ignoring**: What happens if we leave it
  - **Effort**: Additional effort to address it
- Let the user decide which tech debt items to include in scope

### 7. Identify Backward-Compatibility Requirements
- List all backward-compatibility constraints:
  - API contracts that consumers depend on
  - Database schemas that other services read from
  - Configuration formats that users have deployed
  - CLI interfaces that scripts depend on
  - Event/message formats that downstream systems consume
- For each constraint, classify as:
  - **Must preserve** — breaking this would cause outages
  - **Deprecate-then-remove** — can phase out with notice
  - **Safe to change** — no known consumers

### 8. Get Explicit Approval
- Summarize the agreed-upon change design
- Include: scope, affected modules, approach, backward-compatibility plan, tech debt items
- Ask: "Does this design look good? Should I proceed with planning?"
- Do NOT proceed until you get a clear "yes"

### 9. Save the Discovery Output
- Save the approved design to \`.fishi/plans/discovery/YYYY-MM-DD-<topic>-brownfield-discovery.md\`
- Include:
  - Change description and motivation
  - Affected modules and files (with risk levels)
  - Chosen approach and rationale
  - Backward-compatibility plan
  - Tech debt items included in scope
  - Out of scope items
  - Open questions (if any remain)

## Key Principles

- **Respect what exists** — the existing codebase is not the enemy; it's the foundation
- **Incremental over revolutionary** — prefer small, safe changes over big rewrites
- **Backward compatibility by default** — assume every change must be backward-compatible unless the user explicitly says otherwise
- **Test coverage is non-negotiable** — if existing tests don't cover the affected area, adding tests is part of the work
- **Understand before changing** — read existing code thoroughly before proposing modifications
`;
}
