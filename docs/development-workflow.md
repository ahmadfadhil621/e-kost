# Development Workflow

Issue-driven, test-first development with quality gates and incremental commits.

## Starting Point: GitHub Issue

Every piece of work starts from a GitHub issue. The project uses four issue templates (`.github/ISSUE_TEMPLATE/`):

- **Bug** — Something broken. Fields: priority, area, description, scope, constraints, definition of done.
- **Enhancement** — New feature or improvement. Fields: priority, area, description, scope, approach, constraints, blockers, definition of done.
- **UX** — Visual or interaction improvement. Fields: priority, area, description, scope, constraints, definition of done.
- **Cleanup** — Remove dead code or redundant elements. Fields: priority, area, description, scope, definition of done.

Read the issue thoroughly before starting. Pay attention to scope, constraints, and definition of done.

## Step 1: Derive Specs

From the issue, create specification files in `specs/<feature>/` in this order:

1. **`requirements.md`** — Acceptance criteria derived from the issue description and constraints. Each requirement should be testable.
2. **`design.md`** — Technical design: API routes, data models, component structure, correctness properties, test data generators, i18n keys.
3. **`tasks.md`** — Implementation tasks broken down by layer (domain, service, API, UI, i18n). Each task maps to a commit checkpoint.

If specs already exist for the feature, update them based on the issue.

## Step 2: Write Vitest Tests

Unit and integration tests, written BEFORE implementation. Skill: `/test-author`

- Tests for domain services, API routes, and components
- Co-located as `<module>.test.ts` or `<component>.test.tsx`
- Good/Bad/Edge structure in every file
- Factory fixtures from `src/test/fixtures/`
- Property-based tests (fast-check) for correctness properties from `design.md`

## Step 3: Write Playwright E2E Tests

Browser-based tests for atomic user actions. Skill: `/e2e-test-author`

- One spec file per key user action
- Placed in `e2e/<feature>/<action>.spec.ts`
- Good/Bad/Edge structure
- Accessible locators only (getByRole, getByLabel, getByText)
- Mobile viewport (375x667) by default

## Step 4: Validate Test Quality

Run all three quality gates before writing any implementation code. Skill: `/test-validator`

1. **Gate 1 — Structural**: `npx tsx scripts/validate-tests.ts --feature <name>` — zero errors required.
2. **Gate 2 — Fault Injection**: Create faulty stubs, run tests, verify all faults are killed. If a fault survives, add/strengthen assertions.
3. **Gate 3 — Review Checklist**: Walk the checklist in `.claude/rules/test-quality-gates.md`.

Do NOT proceed to implementation until all three gates pass.

## Step 5: Implement

Write production code to make all tests pass. Follow the layered architecture:

1. Domain layer (schemas, interfaces)
2. Repository layer (Prisma implementations)
3. Service layer (business logic)
4. API layer (route handlers)
5. UI layer (components, hooks)
6. i18n (translation keys)

Pause at each layer boundary for a commit checkpoint (see Step 8).

## Step 6: Iterate

If tests fail, fix the implementation — not the tests. Tests are the source of truth.

Only modify tests if they are genuinely broken or based on incorrect assumptions. This should be rare and requires justification.

## Step 7: Regression

Run the full test suite:

```bash
npm run test:run     # Vitest
npm run test:e2e     # Playwright
```

If a previously-passing test fails, the new code caused a regression. Fix the implementation, not the old test.

## Step 8: Commit Checkpoints

After completing a logical unit of work, pause and:

1. Summarize changes (`git diff --stat`, 2-3 bullet points)
2. Review if any docs need updating (README, specs, etc.)
3. Propose a conventional commit message: `type(scope): description`
4. Ask the user if they want to commit
5. **Never run git commands** — the user handles all git operations

Good checkpoint boundaries: domain layer, service layer, API layer, UI layer, i18n, standalone fix/refactor.

Commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
