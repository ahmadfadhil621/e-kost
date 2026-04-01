---
name: fix-tests
description: Diagnose and fix failing tests. Accepts CI log output or a locally-failing test as input. Reproduces, identifies root cause, fixes production code, and verifies. Test modification is last resort.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Fix Failing Tests

Diagnose and fix one or more failing tests. Can start from a CI log (pasted or linked) or a locally-failing test.

## Phase 0: Parse the Failure

Extract what is failing and why from the provided input:

1. **Identify test type**: Vitest (unit/integration) or Playwright (E2E)
2. **Extract**: test file path(s), test name(s), error message(s), relevant stack frames
3. **Summarize** to the user in 2-3 lines: what failed, where, and the apparent symptom

If starting from a GitHub Actions URL, fetch the run with:
```bash
gh run view <run-id> --log-failed
```

If multiple tests are failing, group them by likely root cause. Tackle one group at a time.

## Phase 1: Reproduce Locally

Always reproduce before fixing — never apply a fix based solely on CI output.

**Vitest:**
```bash
npx vitest run <path/to/file.test.ts>
```

**Playwright:**
```bash
npx playwright test e2e/<path/to/spec.ts> --reporter=list
```

If the failure does not reproduce locally, note the discrepancy and investigate environment differences (env vars, DB state, seed data) before proceeding. Do not guess at a fix without reproduction.

## Phase 2: Identify Root Cause

Read only the files directly implicated by the stack trace. Be surgical — no broad exploration.

Priority order:
1. The exact line referenced in the error / stack trace
2. The production code the test is calling into
3. Shared fixtures, mocks, or test helpers — only if test infrastructure looks faulty

State the root cause explicitly before writing any code: "The failure is caused by X in `file:line`."

## Phase 3: Fix

Fix **production code only**. Tests are the source of truth.

- Apply the **minimal** change that makes the test pass
- Do not refactor surrounding code, add features, or make cosmetic changes beyond the fix

**Test modification is last resort.** Only modify a test if:
- The test has a genuine bug (wrong assertion, stale expected value that no longer reflects the spec, broken locator pointing to a renamed element)
- The production code is demonstrably correct and cannot be changed (e.g. framework-level behaviour outside our control)

If a test must be modified, explain clearly why the production code cannot fix it.

**Never increase a timeout as the sole fix.** Timeouts hide real problems — address the underlying cause.

## Phase 4: Verify

Re-run the specific failing test(s) to confirm the fix:

```bash
# Vitest
npx vitest run <path/to/file.test.ts>

# Playwright
npx playwright test e2e/<path/to/spec.ts>
```

If still failing, return to Phase 2. Stay focused on the original failure — do not widen scope.

## Phase 5: Regression

After the targeted test passes, run the full Vitest suite to check for regressions:

```bash
npm run test:run
```

If a previously-passing test now fails, fix the implementation — not the old test.

Do **not** run the full Playwright suite locally — E2E regression defers to CI on push.

## Phase 6: Commit Checkpoint

Follow the commit checkpoint workflow in `.claude/rules/commit-workflow.md`:

1. Summarize changes (`git diff --stat`, 2-3 bullets)
2. Propose a conventional commit message: `fix(scope): description`
3. Ask: **"Commit and push?"**
4. Wait for explicit user approval before running any git commands

## Hard Constraints

- Never modify tests unless they are genuinely broken — fix the implementation
- Never increase timeouts as the sole fix
- Minimal fix only — do not refactor surrounding code
- Always reproduce locally before fixing
- Never run the full Playwright suite locally — E2E regression defers to CI
- Fix one root-cause group at a time — do not bundle unrelated fixes
