# E2E Pipeline Tests

**Date:** 2026-03-19
**Status:** Approved
**Scope:** `packages/cli/src/__tests__/e2e-pipeline.test.ts`

## Goal

Comprehensive E2E tests that execute every generated FISHI script against real state files in a temp directory, verifying the full pipeline lifecycle works end-to-end.

## Architecture

Single test file with 9 `describe()` groups sharing a scaffolded project in a temp directory. Scripts executed via `child_process.execFileSync('node', [script, ...args])`. JSON output parsed and asserted. Git repo initialized for worktree tests.

## Test Groups

1. **Greenfield Init + Validate** — scaffold, validate-scaffold.mjs, verify files
2. **Phase Runner** — current, next, advance, set, validate, dry-run
3. **Gate Manager** — create, status, reject, approve, verify auto-advance
4. **Worktree Manager** — create, status, review, merge, cleanup (real git)
5. **Todo Manager** — add, list, done, clear-done, list-all
6. **Memory Manager** — write, read, get, delete, list-agents, search
7. **Learnings Manager** — add-mistake, add-practice, read, search
8. **Session Start + Checkpoint** — session-start output, auto-checkpoint creates file
9. **Doc Checker** — check empty (fail), create docs, check (pass), report
