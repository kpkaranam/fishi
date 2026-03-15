/**
 * Documentation Skill
 *
 * Instructs agents on documentation standards across all FISHI phases.
 * Documentation is mandatory at every stage — no phase gate passes without proper docs.
 */

export function getDocumentationSkill(): string {
  return `---
name: documentation
description: >
  Enforces documentation standards across all FISHI phases. Every phase produces
  required documentation artifacts. No phase gate should be approved without proper
  docs. This skill defines what documentation is expected, when, and in what format.
---

# Documentation Skill

Documentation is mandatory at every stage of a FISHI project. No phase gate passes
without proper docs. This skill defines the documentation requirements, formats, and
enforcement mechanisms for each project phase.

## Phase Documentation Requirements

### Phase 1: Discovery
- **Artifact**: Design document summarizing brainstorming decisions
- **Location**: \`.fishi/plans/discovery/\`
- **Format**: Markdown file capturing problem space, key decisions, and rationale
- **Minimum content**: Problem statement, proposed approach, alternatives considered

### Phase 2: PRD (Product Requirements Document)
- **Artifact**: PRD (handled by prd-creation skill)
- **Location**: \`.fishi/plans/prd/\`
- **Required sections**: Overview, User Stories or Requirements, Success Metrics or Goals
- **Gate check**: \`node .fishi/scripts/doc-checker.mjs check --phase prd\`

### Phase 3: Architecture
- **Artifacts**:
  - System design document
  - Data model documentation
  - API contracts
  - Architecture Decision Records (ADRs)
- **Location**: \`.fishi/plans/architecture/\` and \`.fishi/plans/adrs/\`
- **Required sections**: System Design/Architecture, Data Model or API Contracts
- **Gate check**: \`node .fishi/scripts/doc-checker.mjs check --phase architecture\`

### Phase 4: Sprint Planning
- **Artifacts**:
  - Sprint plan with task descriptions
  - Epic definitions
  - TaskBoard populated with tasks
- **Location**: \`.fishi/taskboard/\`
- **Requirements**: At least 1 task on the board, 1 sprint file, 1 epic file
- **Gate check**: \`node .fishi/scripts/doc-checker.mjs check --phase sprint_planning\`

### Phase 5: Development
- **Artifacts**:
  - Code-level documentation (inline comments for complex logic)
  - API doc comments (JSDoc, docstrings, etc.)
  - Decision log entries
  - Changelog updates
- **Location**: In-code + \`.fishi/memory/decisions.md\` + \`CHANGELOG.md\`
- **Gate check**: \`node .fishi/scripts/doc-checker.mjs check --phase development\`

### Phase 6: Deployment
- **Artifacts**:
  - Runbook (how to deploy, rollback, troubleshoot)
  - Environment setup guide
  - Monitoring and alerting documentation
  - Deployment checklist
- **Location**: \`docs/\` + \`.fishi/plans/\`
- **Gate check**: \`node .fishi/scripts/doc-checker.mjs check --phase deployment\`

## Changelog

The changelog must be updated after every merged PR. Use this format:

\`\`\`markdown
# Changelog

## [Unreleased]

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Removed
- Removed feature description
\`\`\`

## Architecture Decision Records (ADRs)

Record significant architecture decisions using ADRs. Store them in \`.fishi/plans/adrs/\`.

**File naming**: \`ADR-{NNN}-{kebab-case-title}.md\`

**Template**:

\`\`\`markdown
# ADR-{NNN}: {Title}
- **Date**: YYYY-MM-DD
- **Status**: proposed | accepted | deprecated | superseded
- **Context**: What is the issue/decision being addressed?
- **Decision**: What was decided?
- **Consequences**: What are the trade-offs?
- **Alternatives Considered**: What else was evaluated?
\`\`\`

### When to Write an ADR
- Choosing a framework, library, or major dependency
- Selecting a database or storage approach
- Defining API patterns or authentication strategies
- Making trade-offs between performance, complexity, and maintainability
- Any decision that future developers would ask "why did we do it this way?"

## Documentation Quality Standards

### Code-Level Documentation
- **Complex logic**: Add comments explaining WHY, not WHAT
- **Public APIs**: Document all public functions/methods with parameter descriptions and return values
- **Non-obvious behavior**: If code does something surprising, explain it
- **Do NOT**: Add comments for obvious operations (e.g., \`// increment counter\` above \`counter++\`)

### Project-Level Documentation
- Keep docs co-located with the code they describe
- Use relative links between documentation files
- Include examples for any non-trivial API or configuration
- Keep documentation up to date — stale docs are worse than no docs

## Enforcement

Run the doc checker before requesting any gate approval:

\`\`\`bash
# Check a specific phase
node .fishi/scripts/doc-checker.mjs check --phase {phase_name}

# Check all phases
node .fishi/scripts/doc-checker.mjs check-all

# Generate a full status report
node .fishi/scripts/doc-checker.mjs report
\`\`\`

The gate manager automatically runs doc checks during approval. Missing docs produce a
warning but do not block approval (soft enforcement). However, agents should treat
documentation as a first-class deliverable, not an afterthought.
`;
}
