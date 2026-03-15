---
name: e-kost-e2e-test-author
description: Write Playwright E2E test suites for E-Kost features (workflow step 2). Use when writing browser-based tests for user actions like registration, login, creating rooms, assigning tenants. Covers atomic user action tests with Good/Bad/Edge structure, mobile viewport, auth state reuse, and test data seeding.
---

# E-Kost E2E Test Author (Playwright -- Workflow Step 2)

This skill covers **step 2** of the feature development workflow: defining small, atomic E2E tests with Playwright. For the full workflow, see `.cursor/rules/testing.mdc`.

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- integration test section, UI flows, component structure
   - `specs/<feature>/requirements.md` -- acceptance criteria (these become test assertions)
   - `.cursor/rules/testing.mdc` -- project testing standards (includes E2E strategy)
2. Identify the key user actions for the feature (1 spec file per action)
3. Write Playwright spec files in `e2e/<feature>/`
4. Add traceability comments to each spec file mapping acceptance criteria to tests (same format as unit tests -- see `e-kost-test-author` skill)
5. Run `npx playwright test e2e/<feature>/ --reporter=list` to verify specs are syntactically correct (they should fail since implementation doesn't exist yet)
6. **Hand off to step 3**: Test quality validation using the `e-kost-test-validator` skill. All three quality gates must pass before implementation begins.

## What to Test

Each feature gets Playwright tests for its **atomic user actions** -- the smallest meaningful thing a user does in the browser. One spec file per action.

**Auth example:**
- `e2e/auth/register.spec.ts` -- fill form, submit, land on app
- `e2e/auth/login.spec.ts` -- fill form, submit, see dashboard
- `e2e/auth/logout.spec.ts` -- click logout, redirected to login
- `e2e/auth/session-redirect.spec.ts` -- visit protected page while logged out, redirected

**Rooms example:**
- `e2e/rooms/create-room.spec.ts` -- fill form, submit, see room in list
- `e2e/rooms/update-status.spec.ts` -- change status, see indicator update
- `e2e/rooms/filter-rooms.spec.ts` -- click filter tab, see filtered list

Do NOT write cross-feature journey tests during feature development. Those go in `e2e/journeys/` after all features are complete (Tier 2).

## Test Structure: Good, Bad, Edge

Every E2E spec file uses the same three-category structure as unit tests:

```typescript
import { test, expect } from '@playwright/test';

test.describe('register', () => {
  test.describe('good cases', () => {
    test('user registers with valid credentials and lands on app', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('SecurePass123');
      await page.getByRole('button', { name: /register/i }).click();

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('bad cases', () => {
    test('user sees validation errors for empty fields', async ({ page }) => {
      await page.goto('/register');
      await page.getByRole('button', { name: /register/i }).click();

      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('user sees error when email is already taken', async ({ page }) => {
      // setup: register a user first, then try same email
      await page.goto('/register');
      await page.getByLabel(/email/i).fill('existing@example.com');
      // ... fill other fields, submit
      await expect(page.getByText(/already/i)).toBeVisible();
    });
  });

  test.describe('edge cases', () => {
    test('user can register with minimum-length password', async ({ page }) => {
      // ...
    });
  });
});
```

## Locator Strategy

Use accessible locators in this priority order:

1. `page.getByRole('button', { name: /submit/i })` -- ARIA roles
2. `page.getByLabel(/email/i)` -- form labels
3. `page.getByText(/error message/i)` -- visible text
4. `page.getByTestId('room-card')` -- last resort, requires `data-testid` attribute

Never use CSS selectors or XPath. Accessible locators make tests resilient and double as accessibility checks.

## Mobile Viewport

All tests run at mobile viewport (375x667) by default via `playwright.config.ts`. Do not override viewport in individual tests unless testing a specific responsive breakpoint.

Touch interactions use standard Playwright actions (`click`, `tap`, `fill`) -- they work the same in mobile viewport.

## Auth State Reuse

For tests that require an authenticated user, use Playwright's `storageState` to avoid repeating login in every test.

Setup project in `playwright.config.ts` handles login once and saves cookies:

```typescript
// e2e/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: authFile });
});
```

Tests that need auth use the saved state:

```typescript
import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('create room', () => {
  // already logged in, no login steps needed
});
```

Tests for unauthenticated flows (register, login, session redirect) must NOT use `storageState`.

## Test Data

E2E tests run against a real dev server and database. Test data strategy:

- **Seeding:** Use API calls in `test.beforeEach` or `test.beforeAll` to create test data via the app's own API endpoints
- **Cleanup:** Tests should be independent. Use unique identifiers (timestamps, random suffixes) to avoid collisions between parallel tests
- **No direct DB access:** E2E tests interact only through the browser and public API -- never import Prisma or access the database directly

```typescript
test.beforeEach(async ({ request }) => {
  // Seed via API if needed
  await request.post('/api/properties', {
    data: { name: 'Test Property', address: '123 Test St' },
  });
});
```

## File Structure

```
e2e/
├── setup/
│   └── auth.setup.ts          # Login once, save storageState
├── .auth/
│   └── user.json              # Saved auth state (gitignored)
├── auth/
│   ├── register.spec.ts
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   └── session-redirect.spec.ts
├── properties/
│   ├── create-property.spec.ts
│   ├── switch-property.spec.ts
│   └── edit-property.spec.ts
├── rooms/
│   ├── create-room.spec.ts
│   ├── update-status.spec.ts
│   └── filter-rooms.spec.ts
├── tenants/
│   └── ...
├── payments/
│   └── ...
└── journeys/                  # Tier 2: written after all features complete
    └── ...
```

## Playwright Config Essentials

The `playwright.config.ts` must include:

- `baseURL`: `http://localhost:3000`
- `testDir`: `./e2e`
- Mobile viewport: `{ width: 375, height: 667 }`
- Setup project for auth state
- `webServer` block to start the dev server automatically
- `retries: 1` in CI for flake tolerance

## Hard Constraints

- E2E tests are the **source of truth** for user-facing behavior. Implementation subagents must NOT modify E2E test files.
- Never mock in E2E tests -- they run against a real server.
- Never use CSS selectors or XPath -- use accessible locators only.
- Every spec file must cover good, bad, and edge cases.
- Tests must be independent -- no ordering dependencies between spec files.
- All tests must pass at mobile viewport (375x667).

## Reference Files

Before writing E2E tests for a feature, always read:
1. `specs/<feature>/design.md` -- Integration Tests section for what flows to cover
2. `specs/<feature>/requirements.md` -- acceptance criteria that become assertions
3. `.cursor/rules/testing.mdc` -- project-wide testing conventions and E2E strategy (6-step workflow)
4. `.cursor/rules/test-quality-gates.mdc` -- quality gate checklist (tests will be validated against this)
