# Data Integrity Constraints — Requirements

> Issue #35

## Background

Several business-rule constraints have no E2E test coverage. These are scenarios where the app must reject a user action to preserve data integrity, but no test verifies the user sees the correct error response.

## Acceptance Criteria

### AC-1: Double Move-Out Blocked
- Given a tenant who has already moved out
- When a user (or API caller) attempts to move them out again
- Then the API returns HTTP 409 with a user-visible error message
- And the UI surfaces that error message (not a generic crash/500)

### AC-2: Room Status "Occupied" Blocked Without Tenant
- Given a room with no active tenants
- When a user tries to set its status to "occupied"
- Then the API returns HTTP 409 with a user-visible error message
- And the UI surfaces that error message

### AC-3: Rent Update Does Not Break Balance Display
- Given a tenant assigned to a room with a known monthly rent
- When the landlord edits the room's monthly rent
- Then the balance shown on the tenant detail page reflects the updated rent amount
- And no stale/incorrect balance is cached or displayed

## Out of Scope
- Assigning a tenant to a full-capacity room (covered in `e2e/multi-tenant-rooms/at-capacity.spec.ts`)
- Schema changes
