# Requirements — Multi-Tenant Rooms (Issue #94)

## Overview
Allow a room to have multiple active tenants simultaneously. Each tenant retains independent rent, payment history, and balance tracking. Replaces the hard single-tenant constraint with a configurable capacity per room.

---

## REQ 1 — Room Capacity Field

**REQ 1.1** The Room model SHALL have a `capacity` field (integer, min 1, default 1).

**REQ 1.2** Capacity SHALL be set at room creation. If omitted, it defaults to 1 (preserving all existing single-tenant rooms).

**REQ 1.3** Capacity SHALL be editable via the update room API (`PUT /api/properties/[propertyId]/rooms/[roomId]`).

**REQ 1.4** Capacity SHALL NOT be reduced below the current active tenant count for that room. If attempted, the system SHALL reject with an error.

**REQ 1.5** Capacity SHALL be displayed on the Room Detail page.

---

## REQ 2 — Room Assignment (Multi-Tenant)

**REQ 2.1** A tenant SHALL be assignable to a room if `activeTenantCount < capacity` AND the room is not archived.

**REQ 2.2** The system SHALL reject assignment when `activeTenantCount >= capacity` (room is full).

**REQ 2.3** The system SHALL reject assignment when the tenant already has an active room assignment (one tenant, one room at a time).

**REQ 2.4** The system SHALL reject assignment when the room is under renovation.

**REQ 2.5** When a tenant is assigned to a room that was `available`, the room status SHALL transition to `occupied`.

**REQ 2.6** When a tenant is assigned to a room already `occupied` (but has capacity), the room status SHALL remain `occupied` (no status change needed).

---

## REQ 3 — Room Status Logic

**REQ 3.1** A room status SHALL be `occupied` as long as `activeTenantCount >= 1`.

**REQ 3.2** A room status SHALL transition to `available` when `activeTenantCount` drops to 0 (i.e. the last tenant moves out).

**REQ 3.3** Manual status changes (via the status update API) SHALL be blocked if there are any active tenants in the room. The error message SHALL instruct the user to move all tenants out first.

**REQ 3.4** Archive and Delete operations SHALL be blocked if there are any active tenants in the room (existing behaviour, now applied to multiple tenants).

---

## REQ 4 — Tenant Move-Out (Multi-Tenant)

**REQ 4.1** When a tenant moves out, their room assignment SHALL be removed and their `movedOutAt` SHALL be set.

**REQ 4.2** When a tenant moves out and they were the last active tenant in the room, the room status SHALL transition to `available`.

**REQ 4.3** When a tenant moves out but other active tenants remain in the room, the room status SHALL remain `occupied`.

---

## REQ 5 — Tenant Assignment Dialog (UI)

**REQ 5.1** The assignment dialog SHALL show all rooms that have available capacity (`activeTenantCount < capacity`), regardless of current status (`available` or `occupied`).

**REQ 5.2** Each room in the dialog SHALL display the room number, room type, monthly rent, and remaining capacity (e.g. "1 slot left" or "2/3 occupied").

**REQ 5.3** Rooms with zero remaining capacity SHALL NOT appear in the assignment dialog.

**REQ 5.4** The dialog SHALL show "No rooms with available capacity" when no slots exist.

---

## REQ 6 — Room Detail UI (Multi-Tenant)

**REQ 6.1** The Room Detail page SHALL display all active tenants as a list (replacing the single `currentTenant` display).

**REQ 6.2** Each tenant in the list SHALL be a link to their individual tenant detail page.

**REQ 6.3** The Room Detail page SHALL display the room capacity and current active tenant count.

**REQ 6.4** The "occupied warning" (shown before archive/delete) SHALL reference "all tenants" rather than "the current tenant".

---

## REQ 7 — i18n

**REQ 7.1** All new UI strings SHALL have keys in `locales/en.json` and `locales/id.json`.

New keys required:
- `room.detail.currentTenants` — label for the tenant list section
- `room.detail.capacity` — label for capacity display (e.g. "Capacity")
- `room.detail.occupancy` — label for current count (e.g. "2 of 3 occupied")
- `room.create.capacity` / `room.edit.capacity` — form field label
- `room.card.slotsLeft` — e.g. "{{count}} slot left" / "{{count}} slots left"
- `room.errors.atCapacity` — "Room is at full capacity"
- `room.errors.capacityBelowActiveCount` — "Cannot reduce capacity below current tenant count"
- `room.occupiedWarning` — updated to reference all tenants
- `tenant.assignRoom.noRoomsWithCapacity` — replaces `noAvailableRooms` for new context
- `tenant.assignRoom.slotsRemaining` — e.g. "{{count}} slot remaining"

---

## Non-Goals
- Shared payment splitting between co-tenants (each tenant tracks independently)
- Changing how `monthlyRent` works (it remains per-room, not per-tenant)
- Access control tightening for capacity/monthlyRent (tracked in issue #95)
