# Room Status Edit — Design

## Overview
Three changes across service, API, and UI layers. No database schema changes.

## 1. Service Layer — Block Manual "occupied"

**File:** `src/lib/room-service.ts` → `updateRoomStatus()`

Add an early guard before the existing tenant-count checks:
```typescript
if (status === "occupied") {
  throw new RoomStatusError("Cannot manually set status to occupied");
}
```
Return HTTP 409 from the API route.

**Allowed manual transitions:**
- `available` → `under_renovation`
- `under_renovation` → `available`

**Blocked manual transitions:**
- Any → `occupied` (rejected with 409)
- `occupied` → any while tenants exist (existing rule, unchanged)

## 2. Room Detail Page — Remove Dropdown

**File:** `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`

Remove:
- The `<span>Change Status</span>` + `<Select>` block (lines ~327–352)
- The `statusMutation` useMutation hook
- The `updateStatus` helper function
- Unused imports: `updateRoomStatusSchema`, `RoomStatus`, Select imports

Keep:
- `<StatusIndicator>` badge (already present elsewhere on the page)

## 3. Room Form — Add Status Field

**File:** `src/components/room/room-form.tsx`

New optional props:
```typescript
interface RoomFormProps {
  // existing...
  currentStatus?: RoomStatus;
  isOccupied?: boolean;  // activeTenantCount > 0
}
```

When `currentStatus` is provided (edit mode):
- If `isOccupied === false`: render a `<Select>` with `available` and `under_renovation` options
- If `isOccupied === true`: render read-only `<StatusIndicator>` + note text

Status is submitted separately via PATCH (not merged into the PUT body), so the form only needs to track it locally and expose `onStatusChange` callback.

## 4. Edit Page — Wire Status

**File:** `src/app/(app)/properties/[propertyId]/rooms/[roomId]/edit/page.tsx`

- Pass `currentStatus={room.status}` and `isOccupied={room.activeTenantCount > 0}` to `<RoomForm>`
- On form submit: if status changed, call `PATCH /status` after `PUT` room data
- Use existing `updateRoomStatus` API function from the query layer

## 5. i18n Keys

New keys needed:

```json
// en.json
"room": {
  "edit": {
    "statusLabel": "Status",
    "statusOccupiedNote": "Move out all tenants before changing status"
  }
}
```

```json
// id.json
"room": {
  "edit": {
    "statusLabel": "Status",
    "statusOccupiedNote": "Pindahkan semua penyewa sebelum mengubah status"
  }
}
```
