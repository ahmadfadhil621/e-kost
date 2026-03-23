---
name: implement
description: Orchestrate the full issue-to-commit pipeline. Reads a GitHub issue, derives specs, writes tests (TDD), validates, implements layer-by-layer, runs regression, and pauses at commit checkpoints. Use with an issue number, e.g. /implement 12.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
---

# Implement GitHub Issue

Full issue-driven TDD pipeline. Argument: GitHub issue number (e.g. `/implement 12`).

## Phase 0: Understand the Issue

1. Run `gh issue view <number>` to read the issue
2. Identify: type (bug, enhancement, ux, cleanup), scope, constraints, definition of done
3. Check if specs already exist: `ls specs/` for a matching feature directory
4. Summarize the issue to the user in 2-3 sentences and confirm the approach before proceeding

## Phase 1: Derive Specs

If specs don't exist or need updating:

1. Create `specs/<feature>/requirements.md` — acceptance criteria from the issue
2. Create `specs/<feature>/design.md` — API routes, data models, components, correctness properties, i18n keys
3. Create `specs/<feature>/tasks.md` — implementation tasks broken down by layer

If specs already exist, review them against the issue and update if needed.

**Checkpoint:** Summarize specs to the user. Confirm before moving to tests.

## Phase 2: Write Tests (TDD)

Delegate to the existing test skills:

1. **Unit/Integration tests** — Use the `/test-author` skill
   - Service tests, API route tests, component tests
   - Good/Bad/Edge structure, factory fixtures, property-based tests
2. **E2E tests** — Use the `/e2e-test-author` skill
   - One spec per atomic user action
   - Accessible locators, mobile viewport

Run new E2E specs locally before proceeding: `npx playwright test <spec-file>` (they should fail since implementation doesn't exist yet, but must be syntactically valid).

## Phase 3: Validate Tests

Use the `/test-validator` skill to run all three quality gates:

1. Gate 1: Structural analysis (`npx tsx scripts/validate-tests.ts --feature <name>`)
2. Gate 2: Fault injection
3. Gate 3: Review checklist

Do NOT proceed to implementation until all gates pass.

**Checkpoint:** Report gate results. Ask user to confirm before implementing.

## Phase 4: Implement

Write production code layer by layer. At each layer boundary, pause for a commit checkpoint (see Phase 6).

Order:
1. **Domain** — Zod schemas, repository interfaces in `src/domain/`
2. **Repository** — Prisma implementations in `src/lib/repositories/prisma/`
3. **Service** — Business logic in `src/lib/`
4. **API** — Route handlers in `src/app/api/`
5. **UI** — Components in `src/components/`, pages in `src/app/(app)/`, hooks in `src/hooks/`
6. **i18n** — Translation keys in `locales/en.json` and `locales/id.json`

After each layer, run `npx vitest run` to check progress. Fix implementation until tests pass — never weaken tests.

## Phase 5: Regression

After all tests pass for the feature:

1. Run `npm run test:run` (full Vitest suite) — must pass with 0 failures
2. Run `npm run lint` — must pass with 0 errors
3. Do NOT run the full Playwright suite locally — E2E regression defers to CI

If a previously-passing test fails, fix the implementation — not the old test.

## Phase 6: Commit Checkpoint

Follow the commit checkpoint workflow in `.claude/rules/commit-workflow.md`:

1. Summarize changes (`git diff --stat`, 2-3 bullets)
2. Review if docs need updating (specs/tasks.md, README, etc.)
3. Propose conventional commit message referencing the issue: `type(scope): description (issue #N)`
4. Ask: **"Commit and push?"**
5. Wait for explicit user approval before running any git commands
6. After push, ask: **"Continue to next layer/task?"**

## Phase 7: Close Issue

After all tasks are complete and pushed:

1. Verify all Definition of Done criteria from the issue are met
2. Ask user: **"All DoD criteria met. Close issue #N?"**
3. On approval: `gh issue close <number> --comment "Implemented in <commit-range>"`

## Hard Constraints

- Never skip phases — each phase depends on the previous one
- Tests are the source of truth — never weaken them to make implementation pass
- Always pause at checkpoints for user confirmation
- Never run git commands without explicit approval
- New E2E specs must be run locally before proposing a commit
- Full Playwright regression always defers to CI
- Follow layered architecture — never skip layers
