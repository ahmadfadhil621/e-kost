---
name: e2e-test-author
description: Write Playwright E2E test suites for E-Kost features. Use when writing browser-based tests for user actions like registration, login, creating rooms, assigning tenants. Covers atomic user action tests with Good/Bad/Edge structure, mobile viewport, auth state reuse, and test data seeding.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# E2E Test Author (Playwright)

Write Playwright E2E tests as part of the issue-driven TDD workflow. For general testing conventions, see `.claude/rules/testing.md`.

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- UI flows, component structure
   - `specs/<feature>/requirements.md` -- acceptance criteria (become test assertions)
2. Identify key user actions (1 spec file per action)
3. Write Playwright spec files in `e2e/<feature>/`
4. Add traceability comments (same format as unit tests -- see `test-author` skill)
5. Run `npx playwright test e2e/<feature>/ --reporter=list` to verify syntax
6. Hand off to test validation using the `/test-validator` skill

## What to Test

Each feature gets tests for atomic user actions -- the smallest meaningful thing a user does. One spec file per action.

**Examples:**
- `e2e/auth/register.spec.ts` -- fill form, submit, land on app
- `e2e/rooms/create-room.spec.ts` -- fill form, submit, see room in list
- `e2e/rooms/filter-rooms.spec.ts` -- click filter, see filtered list

Do NOT write cross-feature journey tests during feature development. Those go in `e2e/journeys/` after all features are complete.

## Locator Strategy

Use accessible locators in priority order:

1. `page.getByRole('button', { name: /submit/i })` -- ARIA roles
2. `page.getByLabel(/email/i)` -- form labels
3. `page.getByText(/error message/i)` -- visible text
4. `page.getByTestId('room-card')` -- last resort

Never use CSS selectors or XPath.

## Auth State Reuse

For tests requiring authentication, use Playwright's `storageState`:

```typescript
// Tests that need auth:
test.use({ storageState: 'e2e/.auth/user.json' });

// Tests for unauthenticated flows (register, login) must NOT use storageState.
```

Auth setup is in `e2e/setup/auth.setup.ts`.

## Test Data

- Seed via API calls in `test.beforeEach` / `test.beforeAll`
- Use unique identifiers (timestamps, random suffixes) to avoid collisions
- No direct DB access -- interact only through browser and public API

## Hard Constraints

- E2E tests are source of truth -- implementation must not modify them
- Never mock in E2E tests -- they run against a real server
- Accessible locators only
- Good/Bad/Edge structure in every spec file
- Tests must be independent -- no ordering dependencies
- All tests run at mobile viewport (375x667)

## Reference Files

1. `specs/<feature>/design.md` -- integration test flows
2. `specs/<feature>/requirements.md` -- acceptance criteria
3. `.claude/rules/testing.md` -- testing conventions
