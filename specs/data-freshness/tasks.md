# Tasks: Data Freshness After Mutations

**Source:** [GitHub Issue #1](https://github.com/ahmadfadhil621/e-kost/issues/1). Implementation checklist so UI refetches after mutations without manual refresh.

## 1. Room Mutations

- [x] 1.1 Create room — add invalidation after success
  - **Location**: `app/(app)/properties/[propertyId]/rooms/new/page.tsx`
  - **Description**: After successful `POST .../rooms`, call `queryClient.invalidateQueries` for `["rooms", propertyId]` and `["dashboard", propertyId]`.
  - **Acceptance Criteria**: User creates room → navigates to rooms list → new room appears without refresh; dashboard shows updated stats when opened.
  - **Dependencies**: None
  - **Effort**: S

- [x] 1.2 Edit room — add invalidation after success
  - **Location**: `app/(app)/properties/[propertyId]/rooms/[roomId]/edit/page.tsx`
  - **Description**: After successful `PUT .../rooms/:roomId`, invalidate `["room", propertyId, roomId]`, `["rooms", propertyId]`, and `["dashboard", propertyId]`.
  - **Acceptance Criteria**: User edits room → navigates back → updated data shown without refresh; dashboard reflects changes.
  - **Dependencies**: None
  - **Effort**: S

- [x] 1.3 Change room status — add dashboard invalidation
  - **Location**: `app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`
  - **Description**: Already invalidates room and rooms; add `["dashboard", propertyId]` after successful status update.
  - **Acceptance Criteria**: After changing room status, dashboard shows updated occupancy without refresh.
  - **Dependencies**: None
  - **Effort**: S

## 2. Tenant Mutations

- [x] 2.1 Create tenant — add invalidation after success
  - **Location**: `app/(app)/properties/[propertyId]/tenants/new/page.tsx`
  - **Description**: After successful `POST .../tenants`, invalidate `["tenants", propertyId]`, `["balances", propertyId]`, and `["dashboard", propertyId]`.
  - **Acceptance Criteria**: User creates tenant → navigates to tenants list → new tenant appears without refresh; dashboard and balances update.
  - **Dependencies**: None
  - **Effort**: S

- [x] 2.2 Edit tenant — add dashboard invalidation
  - **Location**: `app/(app)/properties/[propertyId]/tenants/[tenantId]/edit/page.tsx`
  - **Description**: Already invalidates tenant and tenants; add `["dashboard", propertyId]` after success.
  - **Acceptance Criteria**: After editing tenant, dashboard shows updated data without refresh.
  - **Dependencies**: None
  - **Effort**: S

- [x] 2.3 Assign room to tenant — add dashboard invalidation
  - **Location**: `app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` (assign-room flow)
  - **Description**: Already invalidates tenant, tenants, rooms; add `["dashboard", propertyId]`.
  - **Acceptance Criteria**: After assigning room, dashboard shows updated occupancy without refresh.
  - **Dependencies**: None
  - **Effort**: S

- [x] 2.4 Move out tenant — add balance/dashboard/tenant/payments invalidation
  - **Location**: `app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` (move-out flow)
  - **Description**: Already invalidates tenants, rooms; add `["dashboard", propertyId]`, `["balances", propertyId]`, `["tenant", propertyId, tenantId]`, and `["payments", "tenant", tenantId]` (or equivalent keys used for that tenant’s balance and payments).
  - **Acceptance Criteria**: After move-out, dashboard, balance list, and payment list update without refresh.
  - **Dependencies**: None
  - **Effort**: S

## 3. Payment and Finance Mutations

- [x] 3.1 Create payment — add dashboard and balance invalidation
  - **Location**: `app/(app)/properties/[propertyId]/payments/new/page.tsx`
  - **Description**: Already invalidates payments and payments-by-tenant; add `["dashboard", propertyId]`, `["balance", propertyId, tenantId]`, and `["balances", propertyId]`.
  - **Acceptance Criteria**: After recording payment, dashboard and balance(s) update without refresh.
  - **Dependencies**: None
  - **Effort**: S

- [x] 3.2 Create expense — add dashboard invalidation
  - **Location**: `app/(app)/properties/[propertyId]/finance/expenses/new/page.tsx`
  - **Description**: Already invalidates expenses and finance-summary; add `["dashboard", propertyId]`.
  - **Acceptance Criteria**: After creating expense, dashboard shows updated finance stats without refresh.
  - **Dependencies**: None
  - **Effort**: S

- [x] 3.3 Edit expense — add dashboard invalidation
  - **Location**: `app/(app)/properties/[propertyId]/finance/expenses/[expenseId]/edit/page.tsx`
  - **Description**: Already invalidates expenses and finance-summary; add `["dashboard", propertyId]`.
  - **Acceptance Criteria**: After editing expense, dashboard shows updated stats without refresh.
  - **Dependencies**: None
  - **Effort**: S

## 4. Property Mutations

- [x] 4.1 Delete property — add dashboard invalidation when applicable
  - **Location**: `app/(app)/properties/page.tsx`
  - **Description**: After successful delete, if the deleted property was the active/selected one, call `queryClient.invalidateQueries({ queryKey: ["dashboard", deletedPropertyId] })` (or equivalent) so dashboard cache for that property is cleared.
  - **Acceptance Criteria**: After deleting the current property, UI does not show stale dashboard data for the deleted property.
  - **Dependencies**: None
  - **Effort**: S

## 5. Documentation (Optional)

- [x] 5.1 Document invalidation checklist for future mutations
  - **Description**: Add a short checklist or reference in `specs/cross-cutting-constraints.md` or keep this spec (`specs/data-freshness/`) as the canonical list so future mutation pages don’t miss invalidations.
  - **Acceptance Criteria**: New mutation flows have a clear place to check which query keys (and PropertyContext refetch) to invalidate.
  - **Dependencies**: None
  - **Effort**: S

## Progress Note

All tasks are implementation-only (add invalidation calls). No new API or domain logic. Reference: existing invalidation in `tenants/[tenantId]/edit/page.tsx`, `payments/new/page.tsx`, `rooms/[roomId]/page.tsx`, `StaffManagement.tsx`, notes components.
