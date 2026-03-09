---
name: Data freshness full implementation
overview: "Implement data freshness after mutations per specs/data-freshness/: add missing TanStack Query invalidations so lists and dashboard update without refresh. Follow TDD: write unit and E2E tests first, run quality gates, then add invalidation calls to 11 locations."
todos: []
isProject: false
---

# Data Freshness: Full Implementation Plan

## Scope (from specs/data-freshness/tasks.md)

- **11 implementation tasks** across 4 areas: room mutations (3), tenant mutations (4), payment/finance (3), property (1). Optional doc task (5.1) already satisfied by cross-cutting-constraints.md.
- **No new API or domain logic** — only add `queryClient.invalidateQueries(...)` (and where needed `useQueryClient`) after successful mutation responses.
- **Reference implementations**: `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/edit/page.tsx` (lines 61–63), `src/app/(app)/properties/[propertyId]/payments/new/page.tsx` (83–85), `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx` (85–86).

## Query keys (canonical)

- `["dashboard", propertyId]` — `src/app/(app)/page.tsx` line 68
- `["rooms", propertyId]` — rooms list
- `["room", propertyId, roomId]` — room detail/edit
- `["tenants", propertyId]` — tenants list
- `["tenant", propertyId, tenantId]` — tenant detail
- `["balances", propertyId]` — balance list on tenants page
- `["balance", propertyId, tenantId]` — `src/components/balance/balance-section.tsx` line 53
- `["payments", propertyId]` — payments list
- `["payments", "tenant"]` — prefix to invalidate tenant-scoped payment queries
- `["expenses", propertyId]` — expenses list
- `["finance-summary", propertyId]` — finance summary

---

## Phase 1: Tests first (TDD steps 1–2)

### 1.1 Unit / integration tests

**Purpose**: After a successful mutation, `queryClient.invalidateQueries` must be called with the required keys. Test at component/page level with mocked `queryClient`.

**Approach**: For the three pages with **no** invalidation today (create room, create tenant, edit room), add a component test that mocks `fetch` (success), mocks `useQueryClient` (spy on `invalidateQueries`), triggers submit, and asserts the exact keys from the spec.

**Files to add**:

- **Create room**: `src/app/(app)/properties/[propertyId]/rooms/new/page.test.tsx` — mock fetch + queryClient; submit valid room; assert `["rooms", propertyId]` and `["dashboard", propertyId]`.
- **Create tenant**: `src/app/(app)/properties/[propertyId]/tenants/new/page.test.tsx` — same pattern; assert `["tenants", propertyId]`, `["balances", propertyId]`, `["dashboard", propertyId]`.
- **Edit room**: `src/app/(app)/properties/[propertyId]/rooms/[roomId]/edit/page.test.tsx` — mock GET room + PUT success + queryClient; assert `["room", propertyId, roomId]`, `["rooms", propertyId]`, `["dashboard", propertyId]`.

Use React Testing Library, `QueryClientProvider`, mock `next/navigation` (useParams, useRouter) with fixed `propertyId`/`roomId`.

### 1.2 E2E tests

**Purpose**: User-visible behavior — after a mutation, in-app navigation (no `page.reload()`) shows updated list or dashboard.

**Location**: New folder `e2e/data-freshness/` so `npx tsx scripts/validate-tests.ts --feature data-freshness` discovers them.

**Structure**: Good/Bad/Edge. Minimum:

- **Good**: List updates after create room (unique room number → navigate to rooms list → assert room visible); list updates after create tenant; list updates after edit room; (optional) dashboard updates after mutation.
- Use helpers: `e2e/helpers/room-inventory.ts`, `e2e/helpers/tenant-room-basics.ts`, `e2e/helpers/forms.ts`. `storageState: "e2e/.auth/user-with-property.json"`. Auto-wait: `expect(page.getByText(roomNumber)).toBeVisible({ timeout: 15000 })`.
- Traceability comment at top linking to data-freshness REQ (e.g. REQ 1.1, 1.2, 2.1).

**Suggested file**: `e2e/data-freshness/list-and-dashboard-update-after-mutation.spec.ts`.

---

## Phase 2: Test quality gates (TDD step 3)

- **Gate 1**: `npx tsx scripts/validate-tests.ts --feature data-freshness` — zero errors.
- **Gate 2**: e-kost-test-validator skill: faulty stubs (e.g. remove one invalidation), run tests, verify faults are killed by tests.
- **Gate 3**: Walk `.cursor/rules/test-quality-gates.mdc`; address FLAG/FAIL.

---

## Phase 3: Implementation (TDD step 4)

Add invalidation (and `useQueryClient` where missing) **only after success**.

### 3.1 Room mutations

- **1.1 Create room** — `src/app/(app)/properties/[propertyId]/rooms/new/page.tsx`: Import `useQueryClient`. After `res.ok`, before `router.push`: `invalidateQueries(["rooms", propertyId])`, `invalidateQueries(["dashboard", propertyId])`.
- **1.2 Edit room** — `src/app/(app)/properties/[propertyId]/rooms/[roomId]/edit/page.tsx`: Import `useQueryClient`. After successful PUT: invalidate `["room", propertyId, roomId]`, `["rooms", propertyId]`, `["dashboard", propertyId]`.
- **1.3 Room status** — `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`: In `statusMutation.onSuccess`, add `invalidateQueries(["dashboard", propertyId])`.

### 3.2 Tenant mutations

- **2.1 Create tenant** — `src/app/(app)/properties/[propertyId]/tenants/new/page.tsx`: Import `useQueryClient`. After `res.ok`: invalidate `["tenants", propertyId]`, `["balances", propertyId]`, `["dashboard", propertyId]` then toast and router.push.
- **2.2 Edit tenant** — `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/edit/page.tsx`: In `updateMutation.onSuccess`, add `invalidateQueries(["dashboard", propertyId])`.
- **2.3 Assign room** — `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx`: In assign-room `onSuccess`, add `invalidateQueries(["dashboard", propertyId])`.
- **2.4 Move out** — Same file: In move-out `onSuccess`, add `["dashboard", propertyId]`, `["balances", propertyId]`, `["tenant", propertyId, tenantId]`, `invalidateQueries({ queryKey: ["payments", "tenant"] })`.

### 3.3 Payment and finance

- **3.1 Create payment** — `src/app/(app)/properties/[propertyId]/payments/new/page.tsx`: In `onSuccess` add `["dashboard", propertyId]`, `["balance", propertyId, tenantId]`, `["balances", propertyId]`. Use `onSuccess: (_data, variables)` so `variables.tenantId` is available.
- **3.2 Create expense** — `src/app/(app)/properties/[propertyId]/finance/expenses/new/page.tsx`: In `onSuccess`, add `invalidateQueries(["dashboard", propertyId])`.
- **3.3 Edit expense** — `src/app/(app)/properties/[propertyId]/finance/expenses/[expenseId]/edit/page.tsx`: In `onSuccess`, add `invalidateQueries(["dashboard", propertyId])`.

### 3.4 Property

- **4.1 Delete property** — `src/app/(app)/properties/page.tsx`: Import `useQueryClient`. After `refetch()`, if `propertyToDelete.id === activePropertyId`, call `invalidateQueries({ queryKey: ["dashboard", propertyToDelete.id] })`.

---

## Phase 4: Iterate and regression (TDD steps 5–6)

- Run new unit tests and `e2e/data-freshness/*.spec.ts` until all pass.
- Full regression: `npx vitest run` and `npx playwright test`. Fix only implementation if existing tests fail (Regression Failure Rule).

---

## Phase 5: Checkpoint

- Summarize changes; optionally update `specs/data-freshness/tasks.md` checkboxes in same commit.
- Propose conventional commit message; do not run git add/commit.

---

## Order summary

1. Phase 1: Write unit tests (3 pages) + E2E data-freshness specs.
2. Phase 2: Gate 1 → Gate 2 → Gate 3.
3. Phase 3: Add 11 invalidation edits.
4. Phase 4: Green + full regression.
5. Phase 5: Checkpoint and commit message.

No new API or domain code. Task 5.1 (doc) already done via cross-cutting-constraints.
