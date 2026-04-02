# Design — Multi-Tenant Rooms (Issue #94)

## Schema Change

Add `capacity` to the `Room` model in `prisma/schema.prisma`:

```prisma
model Room {
  // ... existing fields ...
  capacity    Int        @default(1)
  // ...
}
```

> ⚠️ This change requires user approval before `prisma/schema.prisma` is touched.
> After approval: run `npx prisma db pull` then `npx prisma generate`.

---

## Domain Layer Changes (`src/domain/`)

### `src/domain/schemas/room.ts`
- Add `capacity: number` to `Room` interface (min 1, default 1)
- Add optional `capacity?: number` to `createRoomSchema` (default 1, min 1, integer)
- Add optional `capacity?: number` to `updateRoomSchema` (min 1, integer)
- Add new Zod validation message for capacity errors

### `src/domain/interfaces/room-repository.ts`
- Add `capacity?: number` to `create()` input
- Add `capacity?: number` to `update()` input

---

## Service Layer Changes

### `src/lib/tenant-service.ts` — `assignRoom()`

Replace the `room.status !== "available"` check with a capacity check:

```ts
// Before:
if (room.status !== "available") {
  throw new Error("Room is already occupied by another tenant");
}

// After:
if (room.status === "under_renovation") {
  throw new Error("Room is under renovation");
}
const activeTenants = await this.tenantRepo.findByProperty(propertyId);
const activeInRoom = activeTenants.filter(
  (t) => t.roomId === roomId && !t.movedOutAt
);
if (activeInRoom.length >= room.capacity) {
  throw new Error("Room is at full capacity");
}
```

After assigning:
- If room was `available` → update status to `occupied`
- If room was already `occupied` (has capacity) → no status change needed

### `src/lib/tenant-service.ts` — `moveOut()`

After removing room assignment:
- Count remaining active tenants in that room
- If 0 remaining → update room status to `available`
- If >0 remaining → leave room status as `occupied`

### `src/lib/room-service.ts` — `updateRoomStatus()`

Add guard: if there are any active tenants in the room, block manual status changes away from `occupied`.

### `src/lib/room-service.ts` — `updateRoom()`

Add guard for capacity reduction: if new capacity < current active tenant count, throw error.

### `src/lib/room-service.ts` — `deleteRoom()` / `archiveRoom()`

No change needed — these already query all tenants and block if any active tenant exists. Works correctly with multiple active tenants.

---

## Repository Layer Changes

### `src/lib/repositories/prisma/prisma-room-repository.ts`
- `toRoom()` mapper: include `capacity` field
- `create()`: pass `capacity` to Prisma (default 1)
- `update()`: pass `capacity` if provided

### `src/lib/repositories/prisma/prisma-tenant-repository.ts`
- No changes needed — `findByProperty()` already returns all active tenants, which the service layer uses to count

---

## API Layer Changes

### `GET /api/properties/[propertyId]/rooms` (list)
- Include `capacity` and `activeTenantCount` in each room's response
- Change tenant enrichment: build `tenantsByRoomId: Map<roomId, Tenant[]>` (was single tenant)
- Include `tenants: [{id, name}]` array for occupied rooms instead of `tenantId`/`tenantName`
- Add filtering: replace `?status=available` with a new `?hasCapacity=true` query param for the assignment dialog

### `GET /api/properties/[propertyId]/rooms/[roomId]` (detail)
- Include `capacity`, `activeTenantCount`, and `tenants: [{id, name}]` array

### `PUT /api/properties/[propertyId]/rooms/[roomId]` (update)
- Accept `capacity` field, propagate to service

### `PATCH /api/properties/[propertyId]/rooms/[roomId]/status`
- Return 409 when active tenants block manual status change

---

## UI Layer Changes

### `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx` (Room Detail)

**`RoomDetail` type:** Replace `tenantId?: string; tenantName?: string` with `tenants?: {id: string; name: string}[]; capacity: number; activeTenantCount: number`

**Render:**
- Replace single `currentTenant` link with a list of tenant links
- Add capacity/occupancy display (e.g. "2 of 3 occupied")
- Update `occupiedWarning` text to reference "all tenants"

### `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` (Tenant Detail — assign dialog)

**`RoomSummary` type:** Add `capacity: number; activeTenantCount: number`

**`fetchAvailableRooms()`:** Change query from `?status=available` to `?hasCapacity=true`

**Dialog render:**
- Show each room with remaining capacity (e.g. "Room 101 — 1 slot left")
- Update empty state text to `tenant.assignRoom.noRoomsWithCapacity`

### Room creation/edit forms (if capacity input needed)
- Add a `capacity` number input to the create and edit room forms (min 1, default 1)

---

## i18n Keys

New keys in `locales/en.json` and `locales/id.json` (see requirements.md REQ 7 for full list).

---

## Backwards Compatibility

- All existing single-tenant rooms have `capacity = 1` by default — no behaviour change
- `tenantId`/`tenantName` fields on the room list/detail API responses will be **removed** and replaced by `tenants: [{id, name}]`. The UI must be updated in the same PR.
- No database migration needed for existing data beyond adding the column with a default.
