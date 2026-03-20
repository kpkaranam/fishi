export function getDeepResearchSkill(): string {
  return `---
name: deep-research
description: Autonomous research workflow — domain analysis, competitive intel, tech stack evaluation, best practices gathering
---

# Deep Research Skill

## Purpose
Conduct structured autonomous research to inform project decisions.
Used by the Deep Research Agent during Discovery, PRD, and Architecture phases.

## Workflow

### Step 1: Define Research Scope
- What domain/topic needs research?
- What specific questions need answers?
- What decisions will this research inform?

### Step 2: Gather Information
- Search web for current information (use MCP tools)
- Read relevant documentation and guides
- Analyze competitor products and patterns
- Check package registries for library options

### Step 3: Synthesize Findings
- Organize by topic with evidence
- Rate confidence: high (multiple sources agree), medium (some evidence), low (limited data)
- Identify gaps where more research is needed

### Step 4: Produce Report
Save to \`.fishi/research/{topic}.md\` with standard format:
- Executive Summary
- Key Findings (numbered, with evidence)
- Recommendations (actionable)
- Sources (with URLs)

### Step 5: Feed to Agents
- Notify planning-lead of completed research
- Update agent memory with key findings
- Reference in PRD and architecture documents

## Research Commands
\`\`\`bash
node .fishi/scripts/phase-runner.mjs current   # Check current phase
node .fishi/scripts/memory-manager.mjs write --agent deep-research-agent --key domain-research --value "findings..."
\`\`\`

## Quality Checklist
- [ ] Multiple sources consulted (not just one)
- [ ] Findings are current (within last 12 months)
- [ ] Recommendations are specific and actionable
- [ ] Confidence levels assigned to each finding
- [ ] Sources are cited with URLs
`;
}
