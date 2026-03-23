# Design — RT-4: Remove Redundant Back Button

## Decision

Remove the Back buttons entirely. Rely on browser back / OS back gesture / bottom nav for navigation. No replacement element is added.

## Affected Buttons

| File | State | Count |
|------|-------|-------|
| `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx` | Error | 1 |
| `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` | Error | 1 |
| `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` | Moved-out | 1 |
| `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` | Active (normal) | 1 |
| `src/app/(app)/properties/[propertyId]/finance/expenses/[expenseId]/page.tsx` | Error | 1 |
| `src/app/(app)/properties/[propertyId]/finance/expenses/[expenseId]/page.tsx` | Normal view | 1 |

**Total:** 6 removals.

## Accessibility Justification

The bottom navigation (`<nav role="navigation">`) is a persistent, keyboard-accessible landmark on all pages. It provides a focusable path back to list views, making the Back button a duplicate affordance. Removing it simplifies the Tab sequence without degrading navigation.

Page heading structure (`<h2>`, `<h3>`) is unchanged. No ARIA roles are affected. Removing a button cannot introduce a WCAG contrast failure.

In error states, after removal there is no interactive element in the page body — only the bottom nav. This is acceptable: browser back and bottom nav both cover the gap.

## `router` Import

Retained in all three files — `router.push` is still called by mutation `onSuccess` callbacks (delete, archive, move-out).

## i18n

The `common.back` key is preserved in `locales/en.json` and `locales/id.json`. It is used in other parts of the app.

## Impact on Existing E2E Tests

- `e2e/finance-expense-tracking/view-expense-detail.spec.ts` contains `"back button returns to expense list"` — this test clicks the button being removed and must be deleted.
- `e2e/helpers/tenant-room-basics.ts` → `goToTenantDetail` uses the Back button as a fallback ready-state selector — those `.or()` clauses must be removed.
