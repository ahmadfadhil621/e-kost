# Design: Tenant Room Move & Assignment History (Issue #105)

## Schema Changes (require user approval)

### New model: `RoomAssignment`

```prisma
model RoomAssignment {
  id        String    @id @default(uuid())
  tenantId  String
  roomId    String
  startDate DateTime
  endDate   DateTime?
  createdAt DateTime  @default(now())
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  room      Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([tenantId, endDate])
  @@map("room_assignment")
}
```

### Changes to existing models

```prisma
// Tenant — add relation field
model Tenant {
  // ... existing fields unchanged ...
  roomAssignments RoomAssignment[]
}

// Room — add relation field
model Room {
  // ... existing fields unchanged ...
  roomAssignments RoomAssignment[]
}
```

`Tenant.roomId`, `Tenant.movedInAt`, and `Tenant.movedOutAt` are **kept** and kept in sync.

---

## Domain Layer

### Zod Schemas (`src/domain/schemas/room-assignment.ts`)

```ts
RoomAssignmentSchema          // full record
MoveTenantInputSchema         // { targetRoomId: uuid, moveDate: date-string }
```

### Repository Interface (`src/domain/interfaces/IRoomAssignmentRepository.ts`)

```ts
interface IRoomAssignmentRepository {
  create(data: CreateRoomAssignmentData): Promise<RoomAssignment>
  closeCurrentAssignment(tenantId: string, endDate: Date): Promise<RoomAssignment | null>
  findByTenant(tenantId: string): Promise<RoomAssignmentWithRoom[]>
  findOpenByTenant(tenantId: string): Promise<RoomAssignment | null>
}
```

---

## Service Layer

### New method: `TenantService.moveTenantToRoom`

```
moveTenantToRoom(userId, propertyId, tenantId, { targetRoomId, moveDate, billingDayOfMonth? })
```

Steps:
1. Assert userId has access to propertyId
2. Fetch tenant — must be active (no movedOutAt) and belong to propertyId
3. If `targetRoomId === tenant.roomId` → throw "Cannot move to same room"
4. Fetch target room — must belong to propertyId, must not be archived
5. Count active tenants in target room; if count >= room.capacity → throw "Room is at capacity"
6. In a transaction:
   a. If tenant has current roomId: `closeCurrentAssignment(tenantId, moveDate)`; if old room now has 0 active tenants → set old room status = AVAILABLE
   b. `createRoomAssignment({ tenantId, roomId: targetRoomId, startDate: moveDate })`
   c. Update `Tenant.roomId = targetRoomId`, `Tenant.movedInAt = moveDate`
   d. If billingDayOfMonth provided: update `Tenant.billingDayOfMonth`
   e. Set target room status = OCCUPIED
7. Return updated tenant with new assignment

### Modified: `TenantService.createTenant`

If `roomId` is provided in the create payload:
- After creating the tenant, also create an initial `RoomAssignment` record:
  `{ tenantId, roomId, startDate: movedInAt ?? now() }`

### Backfill script: `scripts/backfill-room-assignments.ts`

- Finds all tenants with `roomId != null` and no existing `RoomAssignment` records
- Creates assignment records: `startDate = movedInAt ?? createdAt`, `endDate = movedOutAt ?? null`

---

## API Layer

### New endpoint: `POST /api/properties/[propertyId]/tenants/[tenantId]/move`

**Request body:**
```json
{
  "targetRoomId": "uuid",
  "moveDate": "2026-03-15",
  "billingDayOfMonth": 15   // optional, only for initial assignment
}
```

**Response (200):**
```json
{
  "data": {
    "id": "...",
    "roomId": "...",
    "movedInAt": "...",
    "billingDayOfMonth": 15
  }
}
```

**Errors:**
- `400` — validation failure (missing fields, same room)
- `403` — no access to property
- `404` — tenant or target room not found
- `409` — room at capacity

### New endpoint: `GET /api/properties/[propertyId]/tenants/[tenantId]/room-assignments`

**Response (200):**
```json
{
  "data": [
    {
      "id": "...",
      "roomId": "...",
      "roomNumber": "101",
      "startDate": "2026-01-15",
      "endDate": null
    },
    ...
  ]
}
```

Returns assignments ordered by `startDate DESC` (most recent first).

### Retired: `POST /api/properties/[propertyId]/tenants/[tenantId]/assign-room`

File is deleted. UI is updated to call `/move` instead.

---

## UI Layer

### Tenant Detail Page — changes

**Unified action button** (replaces existing "Assign Room" button):

```
tenant.roomId === null  →  label: t("tenant.detail.assignRoom")
tenant.roomId !== null  →  label: t("tenant.detail.moveToRoom")
Both states            →  onClick: opens MoveDialog
```

**MoveDialog component** (`src/components/tenants/MoveDialog.tsx`):

```
Props:
  tenantId: string
  propertyId: string
  currentRoomId: string | null   // drives label/mode
  movedInAt: Date | null         // default date for initial assign

Fields shown (initial assign):
  - Room selector (dropdown) — available rooms with slot count
  - Move-in date (date input, default: movedInAt ?? today)
  - Billing day (number input, optional)

Fields shown (move):
  - Room selector (dropdown) — available rooms with slot count, excluding current
  - Move date (date input, default: today)

On submit: POST /api/properties/[propertyId]/tenants/[tenantId]/move
On success: invalidate tenant query + room-assignments query, close dialog
```

**Room Assignment History section** (below current room info):

```
Heading: t("tenant.detail.roomHistory")

List item per assignment (ordered newest first):
  ● [room number]   [startDate] – [endDate | t("tenant.detail.present")]

Current assignment: filled circle
Past assignments: empty circle
```

Uses `GET /api/properties/[propertyId]/tenants/[tenantId]/room-assignments` via TanStack Query.

---

## i18n Keys

### `locales/en.json` additions under `tenant.detail`:

```json
"moveToRoom": "Move to Room",
"moveDate": "Move date",
"assignDate": "Move-in date",
"billingDay": "Billing day",
"roomHistory": "Room History",
"present": "present",
"moveDialog": {
  "titleAssign": "Assign Room",
  "titleMove": "Move to Room",
  "selectRoom": "Select room",
  "slots": "{{filled}}/{{total}} slots filled",
  "confirm": "Confirm",
  "sameRoomError": "Tenant is already in this room",
  "capacityError": "Room is at capacity"
}
```

### `locales/id.json` additions (same keys, Indonesian values)

---

## Correctness Properties

- A tenant cannot have two open assignments (`endDate = null`) at the same time
- `Tenant.roomId` always matches the `roomId` of the open assignment (if any)
- A room's status is `OCCUPIED` if and only if it has at least one active tenant
- Moving to the current room is always rejected at the service layer
- Capacity check is done inside a transaction to prevent race conditions
