# Tasks — RT-4: Remove Redundant Back Button

## Layer 1: Specs
- [x] requirements.md
- [x] design.md
- [x] tasks.md

## Layer 2: Unit Tests
None required — UI-only removal, no logic to test.

## Layer 3: E2E Test Cleanup
- [x] Remove `"back button returns to expense list"` test from `e2e/finance-expense-tracking/view-expense-detail.spec.ts`
- [x] Remove Back button `.or()` selectors from `goToTenantDetail` in `e2e/helpers/tenant-room-basics.ts`

## Layer 4: Implementation
- [x] Remove Back button from `rooms/[roomId]/page.tsx` (error state)
- [x] Remove Back buttons from `tenants/[tenantId]/page.tsx` (error, moved-out, active states)
- [x] Remove Back buttons from `expenses/[expenseId]/page.tsx` (error + normal view)

## Layer 5: Regression
- [x] `npm run test:run` passes (731 tests)
- [x] Targeted E2E specs pass locally:
  - `e2e/finance-expense-tracking/view-expense-detail.spec.ts`
  - `e2e/finance-expense-tracking/edit-expense.spec.ts`
  - `e2e/room-inventory-management/room-inventory/room-detail.spec.ts`
  - `e2e/room-inventory-management/room-inventory/archive-delete-room.spec.ts`
  - `e2e/room-inventory-management/room-inventory/edit-room.spec.ts`
  - `e2e/tenant-room-basics/move-out.spec.ts`
  - `e2e/tenant-room-basics/edit-tenant.spec.ts`
  - `e2e/tenant-notes/moved-out-tenant-notes.spec.ts`
