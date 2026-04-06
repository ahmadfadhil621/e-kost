# Requirements: Tenant Room Move & Assignment History (Issue #105)

## Context & Problem

Small kost landlords frequently move tenants between rooms (upgrading, downsizing, rebalancing
occupancy). The current model stores only a single `roomId` on `Tenant` — there is no way to
preserve a history of which rooms a tenant occupied and when. Additionally, the "Assign Room"
button remains visible even when a tenant already has a room, which is confusing.

## Goals

- Preserve the full room assignment history for each tenant
- Unify "Assign Room" and "Move to Room" into a single smart action
- Show the assignment timeline on the tenant detail page
- Keep `Tenant.roomId` and `movedInAt` in sync with the new history table (backwards compat)

## Non-Goals

- Billing per room assignment period (future)
- Deprecating `Tenant.roomId` / `movedInAt` (future cleanup)
- Moving tenants across properties

## Glossary

- **RoomAssignment**: A record of a tenant occupying a specific room from `startDate` to `endDate` (null = current)
- **Initial Assignment**: First time a tenant is linked to a room (no prior assignment)
- **Move**: Closing an existing assignment and opening a new one in a different room
- **Capacity**: `Room.capacity` — max number of simultaneously active tenants allowed in that room

## Functional Requirements

### Requirement 1: Room Assignment History

**User Story:** As a property manager, I want to see a full history of which rooms a tenant
has occupied, so that I can track billing periods per room and past arrangements.

#### Acceptance Criteria

1. WHEN a tenant is assigned to a room (initial or move), THE System SHALL create a `RoomAssignment` record with `startDate` and `endDate = null`
2. WHEN a tenant is moved to a new room, THE System SHALL close the current assignment (`endDate = moveDate`) and open a new one (`startDate = moveDate`)
3. WHEN a manager views the tenant detail page, THE System SHALL display a room assignment history list showing all past and current assignments with room number, start date, and end date (or "present")
4. WHEN a tenant is created with a room selected, THE System SHALL also create the initial `RoomAssignment` record using `movedInAt` as `startDate`

### Requirement 2: Unified Room Action Button

**User Story:** As a property manager, I want a single contextual button for room actions,
so that I am not confused by an "Assign Room" button when a room is already assigned.

#### Acceptance Criteria

1. WHEN a tenant has no room assigned, THE System SHALL show an "Assign Room" button on the tenant detail page
2. WHEN a tenant has a room assigned, THE System SHALL show a "Move to Room" button instead
3. WHEN a manager opens either dialog, THE System SHALL show a room selector (only rooms in the same property with available capacity) and a date picker
4. WHEN "Assign Room" is used, the date field SHALL be labelled "Move-in date" and default to `movedInAt` if set, otherwise today
5. WHEN "Move to Room" is used, the date field SHALL be labelled "Move date" and default to today
6. WHEN "Assign Room" is used, THE System SHALL also show the optional billing day input
7. WHEN a manager tries to move a tenant to the same room they already occupy, THE System SHALL reject the action with a validation error

### Requirement 3: Capacity Enforcement

**User Story:** As a property manager, I want the system to prevent assigning a tenant to a
full room, so that I do not accidentally overbook a room.

#### Acceptance Criteria

1. WHEN a manager opens the room selector dialog, THE System SHALL only list rooms that have at least one available slot (active tenants < capacity)
2. WHEN a room is at capacity, THE System SHALL exclude it from the selectable room list
3. IF a move request is submitted for a full room (race condition), THE System SHALL return a 409 error and display a friendly message
4. WHEN displaying rooms in the dropdown, THE System SHALL show current occupancy vs capacity (e.g. "1/2 slots filled")

### Requirement 4: Room Status Maintenance

**User Story:** As a property manager, I want room statuses to update automatically when
tenants move in or out, so that the occupancy view stays accurate.

#### Acceptance Criteria

1. WHEN a tenant is moved into a room, THE System SHALL set that room's status to `OCCUPIED`
2. WHEN a tenant is moved out of a room AND no other active tenants remain, THE System SHALL set that room's status back to `AVAILABLE`
3. WHEN a tenant is moved out of a room AND other active tenants remain, THE System SHALL leave the room status as `OCCUPIED`

### Requirement 5: Data Backfill

**Acceptance Criteria**

1. A one-off backfill script SHALL create `RoomAssignment` records for all tenants that currently have `roomId != null` but have no existing assignment records
2. `startDate` for backfilled records SHALL be the tenant's `movedInAt` value; if `movedInAt` is null, use `createdAt`
3. Tenants who are already moved out (`movedOutAt != null`) SHALL have their backfilled record closed with `endDate = movedOutAt`

## Constraints

- Schema changes require explicit user approval before touching `prisma/schema.prisma`
- `Tenant.roomId` and `movedInAt` must be kept in sync by the service layer
- Room capacity must be enforced — cannot assign a tenant to a full room
- Move/assign is only available for active tenants (no `movedOutAt`)
- All new UI strings must be added to both `locales/en.json` and `locales/id.json`
- The existing `assign-room` API endpoint is retired; the UI is updated to use the new `/move` endpoint
