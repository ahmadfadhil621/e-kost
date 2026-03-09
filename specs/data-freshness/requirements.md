# Requirements: Data Freshness After Mutations

**Source:** [GitHub Issue #1](https://github.com/ahmadfadhil621/e-kost/issues/1) — UI doesn't refetch after mutations; user must refresh to see changes.

## Context & Problem

When a user performs an action that changes data in the database (create room, edit tenant, record payment, etc.), the app often does not refetch the affected data. Lists and the dashboard stay stale until the user manually refreshes the tab. This leads to confusion, duplicate actions, and a poor experience on mobile where users expect to see updated data immediately after a mutation.

## Goals

- After any successful mutation that changes list, detail, dashboard, or balance data, the UI SHALL refetch and display the new data without a full page refresh.
- All mutation flows that use TanStack Query for reading data SHALL invalidate the relevant query keys after success.
- Dashboard stats SHALL reflect the latest data after any mutation that affects occupancy, payments, or expenses.
- Property list (when using PropertyContext refetch) SHALL stay consistent with create/delete property actions.

## Non-Goals

- Real-time push or WebSocket updates.
- Optimistic UI updates (showing assumed state before server response).
- Changing how PropertyContext or TanStack Query are used structurally; only adding missing invalidations.

## Glossary

- **Mutation**: Any user-triggered action that creates, updates, or deletes data via an API call (e.g. create room, edit tenant, record payment).
- **Invalidation**: Telling TanStack Query that cached data for given query key(s) is stale so it refetches when that data is next used.
- **Query key**: Identifier for a TanStack Query cache entry (e.g. `["rooms", propertyId]`, `["dashboard", propertyId]`).

## Functional Requirements

### Requirement 1: List and Detail Data Refresh After Mutations

**User Story:** As a user, I want lists and detail views to show updated data right after I create or edit something, so that I don’t have to refresh the page.

#### Acceptance Criteria

1. WHEN a user creates a room and navigates to the rooms list, THE System SHALL show the new room without a full page refresh.
2. WHEN a user creates a tenant and navigates to the tenants list, THE System SHALL show the new tenant without a full page refresh.
3. WHEN a user edits a room and navigates back (or stays on the list), THE System SHALL show the updated room data without a full page refresh.
4. WHEN a user edits a tenant, THE System SHALL show the updated tenant data in list and detail without a full page refresh.
5. WHEN a user changes room status, THE System SHALL update the room and rooms list without a full page refresh.

### Requirement 2: Dashboard Data Freshness

**User Story:** As a user, I want the dashboard to show up-to-date occupancy and finance stats after I change anything that affects them, so that I don’t have to refresh.

#### Acceptance Criteria

1. WHEN a user performs any mutation that affects dashboard stats (room create/edit/status, tenant create/edit/assign/move-out, payment create, expense create/edit), THE System SHALL invalidate the dashboard query so that opening or viewing the dashboard shows updated stats without a full page refresh.
2. WHEN a user deletes the currently selected property, THE System SHALL ensure dashboard (and any property-scoped) cache is updated or cleared as appropriate so the UI does not show stale data for the deleted property.

### Requirement 3: Balance and Payment Data Freshness

**User Story:** As a user, I want balance and payment lists to update after I record a payment or move out a tenant, so that I see accurate balances without refreshing.

#### Acceptance Criteria

1. WHEN a user records a payment, THE System SHALL invalidate balance and payment list queries for the affected tenant and property so that balance(s) and payment lists update without a full page refresh.
2. WHEN a user moves out a tenant, THE System SHALL invalidate balance, payment, and tenant-related queries so that lists and balances update without a full page refresh.

### Requirement 4: Consistent Invalidation Strategy

**User Story:** As a developer, I want a clear rule for when to invalidate which queries, so that new mutation pages don’t forget to invalidate and cause stale UI.

#### Acceptance Criteria

1. THE System SHALL document which TanStack Query keys (and PropertyContext refetch) each mutation must invalidate (e.g. in this spec or in cross-cutting constraints).
2. Mutation pages that use `fetch` + `router.push` (or similar) without TanStack Query mutations SHALL call `queryClient.invalidateQueries` for all affected query keys after a successful response.

## Constraints

- Invalidation SHALL happen after a successful mutation response; no invalidation on failure.
- Dashboard query key is `["dashboard", propertyId]`; it SHALL be invalidated by every mutation that affects dashboard stats.
- Property list is updated via PropertyContext `refetch()` for create/delete property; delete property SHALL also invalidate `["dashboard", propertyId]` when the deleted property was the active one.
- All user-facing lists and detail views that rely on TanStack Query SHALL see fresh data after their related mutations without manual refresh.

## Success Criteria

- User creates a room → navigates to rooms list → new room appears without refresh.
- User creates a tenant → navigates to tenants list → new tenant appears without refresh.
- User edits a room → navigates back → updated data is shown without refresh.
- After any of the above (or recording a payment, editing tenant, move-out, expense create/edit, etc.), opening the dashboard shows updated stats without refresh.
- Balance(s) and payment lists update without refresh after recording a payment or moving out a tenant.
