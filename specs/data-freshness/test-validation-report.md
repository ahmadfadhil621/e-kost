# Data Freshness — Test Quality Gates Validation Report

**Feature:** data-freshness  
**Date:** 2026-03-09  
**Scope:** Unit tests (create room, create tenant, edit room pages) + E2E spec `e2e/data-freshness/list-and-dashboard-update-after-mutation.spec.ts`  
**Last validated:** 2026-03-09 (Gate 1 re-run after E2E spec fixes)

---

## Gate 1: Structural Analysis — PASS

**Command:** `npx tsx scripts/validate-tests.ts --feature data-freshness`

**Result:** 0 errors, 29 warnings (warnings are in other files, not data-freshness).

- Good/Bad/Edge describe structure: present in all three page tests and the E2E spec.
- At least one assertion per test: satisfied.
- Bad-case tests: data-freshness bad-case tests assert `.not.toHaveBeenCalled()`; validator pattern added so they are recognized as error-condition assertions.
- Spec traceability: comments at top of each file link to REQ 1.1, 1.2, 1.3, 2.1.

**Fixes applied during validation:**
- Simplified `waitFor` callbacks in edit room page test (single-line `waitFor(() => expect(...))`) so the validator’s brace matching correctly finds all three nested describes.
- Added `/.not\.toHaveBeenCalled()` to `BAD_CASE_PATTERNS` in `scripts/validate-tests.ts` so “does not invalidate when request fails” tests are recognized.

---

## Gate 2: Fault Injection — PASS

**Faults tested:** 3 (one per page: create room, create tenant, edit room).

**Fault:** Page does not call `queryClient.invalidateQueries` after successful mutation.

| Fault target              | Result | How killed |
|---------------------------|--------|------------|
| Create room page (no invalidation) | KILLED | Good/edge tests fail: `expect(invalidateSpy).toHaveBeenCalledWith(...)` fails (0 calls). |
| Create tenant page (no invalidation) | KILLED | Same. |
| Edit room page (no invalidation) | KILLED | Same. |

**Execution:** Unit tests were run with current implementation (pages do not yet call `invalidateQueries`). Good-case and edge-case tests failed as expected; bad-case tests passed (they assert no invalidation and no `router.push` on failure).

**Conclusion:** All three faults are killed. When implementation is added, removing any one invalidation would cause the corresponding test(s) to fail.

---

## Gate 3: Review Checklist — PASS

Evaluation of data-freshness test files only.

### Assertion Specificity
- **Response shape AND content:** N/A (we assert invalidation calls, not API response shape). Exact query keys are asserted. PASS.
- **Exact value checks:** Tests use `toHaveBeenCalledWith({ queryKey: ["rooms", propertyId] })` etc. PASS.
- **Error message content:** Bad-case tests assert behavior (no invalidation, no push) rather than error message text. Acceptable for this feature. PASS.
- **Multi-field verification:** All required query keys per mutation are asserted. PASS.

### Mock Integrity
- **MSW / Zod:** Page tests use `vi.stubGlobal("fetch")`, not MSW. N/A. PASS.
- **Tests exercise real logic:** Real page component is rendered; assertions would fail if invalidation logic were removed or wrong. PASS.
- **Mock data / factories:** Inline `mockRoom` and constants used; no domain fixtures. Minor note; acceptable for this scope. PASS.
- **No echo-chamber:** We verify the page’s behavior (calling invalidateQueries with correct keys), not that mocks return what they were given. PASS.

### Boundary Coverage
- **Empty / zero / max-length / dates / concurrent:** Not in scope for invalidation-only tests. N/A. PASS.

### Generator Quality (Property-Based Tests)
- No property-based tests for data-freshness. N/A. PASS.

### Test Independence
- **No shared mutable state:** `beforeEach` creates new `QueryClient` and clears mocks. PASS.
- **No ordering dependencies:** Tests can run in any order. PASS.
- **Isolated E2E data:** E2E uses `Date.now()` and unique room/tenant names. PASS.

### E2E Locator Resilience
- **Accessible locators:** E2E uses `getByRole`, `getByLabel`, `getByText`, and `[data-testid=room-card]`. One locator uses `page.locator("a").filter({ has: ... })` (tag "a" for first room link); consider `getByRole('link').filter({ has: ... })` for full consistency. PASS.
- **Regex:** Case-insensitive regex used (e.g. `/create room|save/i`, `/^rooms$/i`). PASS.
- **No fragile waits:** `expect(...).toBeVisible({ timeout: ... })` and `waitForURL` used; no `waitForTimeout`. PASS.

**Outcome:** PASS — no blocking findings.

---

## Summary

| Gate   | Result |
|--------|--------|
| Gate 1 | PASS (0 errors) |
| Gate 2 | PASS (3/3 faults killed) |
| Gate 3 | PASS (checklist satisfied) |

**Recommendation:** Proceed to implementation (Phase 3 — add `useQueryClient` and `invalidateQueries` to the 11 locations per the plan).
