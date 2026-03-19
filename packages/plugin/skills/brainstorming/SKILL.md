---
name: brainstorming
description: Socratic design refinement before implementation
---

# Brainstorming & Design Refinement Skill

## Purpose
Socratic design refinement before any implementation begins.

## CRITICAL RULE
**NEVER skip this phase.** Every feature, epic, or significant change MUST go through brainstorming before implementation starts. If a user asks to "just build it," push back and insist on design first.

## Process

### 1. Understand the Request
- Read the user's request carefully
- Identify ambiguities, unstated assumptions, and missing requirements
- Review any existing documentation in `docs/product/` for context

### 2. Ask Questions One at a Time
- Do NOT dump a list of 10 questions at once
- Ask the single most important clarifying question first
- Wait for the answer before asking the next question
- Each question should build on previous answers
- Aim for 3-7 questions total depending on complexity

### 3. Explore Alternatives
- After gathering requirements, present 2-3 alternative approaches
- For each alternative, clearly state:
  - **Approach**: Brief description
  - **Pros**: What makes this approach good
  - **Cons**: What are the risks or downsides
  - **Effort**: Rough estimate (small/medium/large)
- Ask the user which direction resonates

### 4. Present Design in Chunks
- Break the design into logical sections
- Present each section and get feedback before moving on
- Sections typically include:
  - Data model / schema
  - API surface / interface
  - User flow / interaction model
  - Edge cases and error handling
  - Testing strategy

### 5. Get Explicit Approval
- Summarize the final agreed-upon design
- Ask: "Does this design look good? Should I proceed with implementation?"
- Do NOT proceed until you get a clear "yes"

### 6. Save the Approved Design
- Save the approved design document to `docs/product/<feature-name>.md`
- Include:
  - Feature description
  - Requirements (functional and non-functional)
  - Agreed design decisions with rationale
  - Out of scope items
  - Open questions (if any remain)

## Output Format
All brainstorming conversations should be structured with clear headers and bullet points for easy scanning.
