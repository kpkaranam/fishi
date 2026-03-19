---
name: code-gen
description: Generate code following project conventions and TDD practices
---

# Code Generation Skill

## Purpose
Generate production-quality code following TDD and project conventions.

## CRITICAL RULES
1. **TDD is mandatory** — write tests FIRST, then implementation
2. **Follow project conventions** — read CLAUDE.md and match existing patterns
3. **Commit frequently** — small, focused commits with conventional commit messages
4. **Run tests before marking complete** — all tests must pass

## Process

### 1. Review Context
- Read `CLAUDE.md` for project-specific conventions
- Check `.fishi/memory/brownfield-analysis.md` for codebase patterns
- Review the approved design document in `docs/product/`
- Understand the existing code style and patterns

### 2. Write Tests First (Red Phase)
- Create test file following project naming conventions
- Write test cases covering:
  - Happy path scenarios
  - Edge cases and boundary conditions
  - Error scenarios
  - Integration points
- Run tests to confirm they fail (red)

### 3. Implement Code (Green Phase)
- Write the minimum code needed to pass the tests
- Follow the project's established patterns:
  - File naming conventions
  - Import style
  - Error handling patterns
  - Type definitions
- Run tests to confirm they pass (green)

### 4. Refactor (Refactor Phase)
- Clean up the implementation while keeping tests green
- Extract common patterns
- Improve naming and readability
- Remove duplication

### 5. Commit
- Use conventional commit messages:
  - `feat: add user authentication endpoint`
  - `fix: handle null response in API client`
  - `test: add edge case tests for parser`
  - `refactor: extract validation logic`
  - `docs: update API documentation`
- Each commit should be atomic and focused on a single change
- Include the task ID in the commit body if applicable

### 6. Verify
- Run the full test suite
- Run linters and formatters
- Verify no regressions in existing functionality
- Check that the implementation matches the approved design

## Code Quality Checklist
- [ ] Tests written and passing
- [ ] Follows project conventions from CLAUDE.md
- [ ] Error handling is comprehensive
- [ ] Types are properly defined (for typed languages)
- [ ] No hardcoded values (use config/constants)
- [ ] No console.log or debug statements left in
- [ ] Functions are small and focused
- [ ] Comments explain "why," not "what"
