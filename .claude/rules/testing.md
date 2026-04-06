---
description: TDD testing conventions and expectations for E-Kost
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "e2e/**/*.spec.ts"
  - "e2e/**/*.ts"
---

# Testing Standards (TDD)

Tests are written BEFORE implementation. Tests define the specification. Implementation code is written to make tests pass. Tests are the source of truth -- only modify them if genuinely broken.

Testing is part of the issue-driven workflow defined in `CLAUDE.md`. After deriving specs from a GitHub issue, the test-implementation cycle is:

1. **Write Vitest tests** -- domain services, API routes, components. Skill: `/test-author`
2. **Write Playwright E2E tests** -- atomic user actions. Skill: `/e2e-test-author`
3. **Validate test quality** -- 3 gates: structural, fault injection, review checklist. Skill: `/test-validator`
4. **Implement** -- write code to make tests pass
5. **Iterate** -- fix implementation, not tests
6. **Regression** -- `npm run test:run`. E2E runs in CI.

### E2E Form Page Helper Conventions

Helpers that navigate to **form pages** (new/create pages) **must** use `waitUntil: "load"`, not `domcontentloaded`:

```typescript
// CORRECT
await page.goto(`/properties/${propertyId}/rooms/new`, { waitUntil: "load" });

// WRONG — domcontentloaded fires before JS executes; React hasn't hydrated yet
await page.goto(`/properties/${propertyId}/rooms/new`, { waitUntil: "domcontentloaded" });
```

With `domcontentloaded`, server-rendered inputs are visible but uncontrolled. `fill()` writes to the DOM, then React hydration resets inputs to default values. The form submits empty, fails validation silently, and stays on the `/new` URL. This manifests as headless-only failures — headed mode is slower, giving hydration time to complete before `fill()` runs.

URL assertions after form submission must **exclude the source page**. The pattern `[^/]+` matches any path segment including `"new"`:

```typescript
// WRONG — /rooms/new satisfies /rooms\/[^/]+$/ — passes even when creation failed
await expect(page).toHaveURL(/\/rooms\/[^/]+$/)

// RIGHT — explicit exclusion
await page.waitForURL(
  url => /\/rooms\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/rooms/new')
)
```

### Failing E2E Test Workflow

When a failing E2E test is reported, always follow this order:

1. **Reproduce** — run only the impacted spec(s): `npx playwright test e2e/<spec-file>`
2. **Identify** — read the exact error, trace it to the root cause in production code
3. **Resolve** — fix production code first (components, API, locales, etc.)

Rules:
- **Test modification is last resort** — only when the production code is demonstrably correct and cannot be changed (e.g. framework-level behaviour outside our control)
- **Never increase timeouts as the sole fix** — that hides the real problem; address the underlying cause
- When a test must be modified, explain clearly why production code cannot fix it
- **If every new API route returns 500 but Vitest passes** — check dev server freshness before diagnosing code. This pattern (unit tests green, universal 500s in E2E) means the server is running stale code, not that the code is wrong. Restart the dev server first.

### Before Committing UI Changes

Before committing any change to a component, page, or i18n key, grep all E2E specs for affected selectors, routes, and text content:

```bash
grep -r "the-changed-text-or-route" e2e/
```

If any spec references what you changed, verify it still passes before committing. Do not defer this check to CI.

### Regression Failure Rule

If a previously-passing test fails during regression, the new implementation caused a regression. Fix the **implementation**, not the old test.

### Test Quality Gate Failure Rule

If a fault survives Gate 2, ADD or STRENGTHEN test assertions -- never weaken the fault. If Gate 3 finds issues, fix the tests, then re-run all gates from Gate 1.

## Libraries

- **Unit/integration tests**: Vitest
- **Component tests**: React Testing Library + Vitest
- **API mocking**: MSW (Mock Service Worker)
- **Property-based tests**: fast-check (one test per correctness property from `specs/<feature>/design.md`)
- **E2E tests**: Playwright (per feature, starting from Phase 1)

## E2E Test Strategy: Two Tiers

### Tier 1: Atomic User Action Tests (per feature)

Written alongside each feature phase. Each test covers a single, self-contained user action within one feature. Uses Good/Bad/Edge structure just like unit tests.

Examples for auth: "user registers with valid credentials", "user sees error on duplicate email", "user is redirected when session expires"

File location: `e2e/<feature>/` (e.g., `e2e/auth/`, `e2e/properties/`, `e2e/rooms/`)

### Tier 2: Cross-Feature Journey Tests (end of MVP)

Written after all features are complete (post-Phase 8). Each test spans multiple features to validate full user journeys.

Examples: "landlord onboarding: register → create property → add rooms → assign tenant → record payment", "staff workflow: owner invites staff → staff logs in → staff manages rooms"

File location: `e2e/journeys/`

**Only Tier 1 tests are written during feature development. Tier 2 comes at the end.**

## File Naming & Location

- Unit/integration: co-locate next to source as `<module>.test.ts` or `<component>.test.tsx`
- E2E: `e2e/<feature>/<action>.spec.ts` (e.g., `e2e/auth/register.spec.ts`)
- E2E journey: `e2e/journeys/<journey-name>.spec.ts`
- Test fixtures: `src/test/fixtures/` (factory functions for rooms, tenants, payments)
- Test mocks: `src/test/mocks/` (Prisma mock, MSW handlers)

## Test Structure: Good, Bad, Edge

Every test file -- both Vitest and Playwright -- must cover three categories:

```typescript
// Vitest example
describe("RoomService.create", () => {
  describe("good cases", () => {
    it("creates a room with valid data", ...);
  });
  describe("bad cases", () => {
    it("rejects when room number is missing", ...);
    it("rejects when monthly rent is negative", ...);
  });
  describe("edge cases", () => {
    it("handles duplicate room numbers", ...);
    it("handles maximum field lengths", ...);
  });
});
```

```typescript
// Playwright example
test.describe("register", () => {
  test.describe("good cases", () => {
    test("user registers with valid credentials and lands on app", ...);
  });
  test.describe("bad cases", () => {
    test("user sees error when email is already taken", ...);
    test("user sees validation errors for empty fields", ...);
  });
  test.describe("edge cases", () => {
    test("user sees error on network failure", ...);
  });
});
```

## What to Test per Layer

- **Domain/services** (`src/lib/`): business rules, validation, calculations, state transitions
- **API routes** (`src/app/api/`): valid requests (200/201), invalid input (400), not found (404), auth failures (401)
- **Components** (`src/components/`): rendering, user interactions, form validation feedback, empty/loading/error states, mobile layout (320px)
- **Property-based** (fast-check): one test per correctness property listed in each feature's `design.md`, minimum 100 iterations
- **E2E** (`e2e/`): one spec file per key user action, testing the real browser flow against a running dev server

## Conventions

- Arrange-Act-Assert pattern (Vitest) / setup-action-assertion pattern (Playwright)
- Descriptive test names: `it("returns 400 when tenant name is empty")` / `test("user sees error when email is already taken")`
- Mock external dependencies (Prisma, Better Auth, fetch) via MSW and mock modules in Vitest -- **E2E tests never mock, they use a real server**
- Never mock internal business logic modules
- Test accessibility: form labels, ARIA attributes, keyboard navigation
- Use factory functions from `src/test/fixtures/` for test data, not inline objects

## Page Integration Test Locators

Before writing text assertions in page-level integration tests, grep the child component for how it actually renders the relevant field. Do not assume the raw data value is what appears in the DOM.

Example: `RoomCard` renders `{t("room.card.roomLabel")} {room.roomNumber}` → "Room 101", not "101". A locator like `findByText("101")` will fail; use `findByText(/Room 101/i)` instead.

Rule: if the component under test delegates rendering to a child component, read that child component before writing the locator.

## Prisma Mocking Pattern

Always create **one `vi.fn()` per model method** — never share a single mock function across multiple models or methods. This is required for per-call assertion accuracy and FK-safe deletion order tests.

```typescript
// CORRECT — separate mock per model
const mockPaymentDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockTenantDeleteMany = vi.fn().mockResolvedValue({ count: 0 });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { deleteMany: mockPaymentDeleteMany },
    tenant: { deleteMany: mockTenantDeleteMany },
  },
}));
```

To track call order across multiple mocks inside a test, use a `callOrder` array with `mockImplementation` closures — do NOT use `invocationCallOrder` (unreliable after `vi.clearAllMocks()`):

```typescript
const callOrder: string[] = [];
mockPaymentDeleteMany.mockImplementation(async () => { callOrder.push("payment"); return { count: 0 }; });
mockTenantDeleteMany.mockImplementation(async () => { callOrder.push("tenant"); return { count: 0 }; });
```

## Subagent Rule

Test files are the source of truth. Implementation subagents must NOT modify test files. They implement code until all tests pass with 0 failures.
