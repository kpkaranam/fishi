---
name: debugging
description: Systematic debugging with root cause analysis and fix verification
---

# Debugging Skill

## Purpose
Systematically diagnose and fix bugs with a structured approach.

## Process: Reproduce -> Isolate -> Identify -> Fix -> Verify

### 1. Reproduce the Bug
- Understand the reported behavior vs. expected behavior
- Create a minimal reproduction case
- Document the exact steps to reproduce
- Note the environment (OS, runtime version, dependencies)

### 2. Isolate the Problem
- Check logs, error messages, and stack traces
- Identify the component or module where the bug occurs
- Use binary search approach: narrow down the code path
- Add temporary logging if needed to trace execution flow
- Check recent changes (git log, git diff) that might have introduced the bug

### 3. Identify Root Cause
- Read the code carefully around the failure point
- Check for common issues:
  - Off-by-one errors
  - Null/undefined references
  - Race conditions or timing issues
  - Incorrect type coercion
  - Missing error handling
  - Stale cache or state
  - Environment-specific behavior
- Trace the data flow from input to failure point
- Verify assumptions about the data at each step

### 4. Fix the Bug
- Make the minimal change needed to fix the root cause
- Do NOT refactor unrelated code in the same fix
- Ensure the fix handles edge cases
- Consider if the same bug pattern exists elsewhere in the codebase

### 5. Write a Regression Test
- Write a test that specifically reproduces the original bug
- The test should fail without the fix and pass with it
- Include a comment referencing the bug or task ID
- Add edge case tests for related scenarios

### 6. Verify the Fix
- Run the regression test
- Run the full test suite to check for side effects
- Manually verify the fix if possible
- Check that the original reproduction steps no longer trigger the bug

### 7. Document Root Cause
- Add a brief explanation to the commit message:
  - What was the bug?
  - What caused it?
  - How was it fixed?
- Update any relevant documentation if the bug revealed a misunderstanding

## Commit Format
```
fix: <short description of what was fixed>

Root cause: <explanation of why the bug occurred>
Fix: <explanation of the change>
Regression test: <test file and test name>

Closes TASK-XXX
```

## Anti-Patterns to Avoid
- Do NOT apply a fix without understanding the root cause
- Do NOT suppress errors or catch-and-ignore exceptions
- Do NOT fix symptoms instead of causes
- Do NOT skip the regression test
