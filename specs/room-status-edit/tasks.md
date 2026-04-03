# Room Status Edit — Tasks

## Layer Order (bottom-up)

### 1. Service
- [ ] `src/lib/room-service.ts`: add guard in `updateRoomStatus` — reject status `"occupied"` with a meaningful error

### 2. API
- [ ] `src/app/api/properties/[propertyId]/rooms/[roomId]/status/route.ts`: return 409 when service throws the "cannot manually set occupied" error

### 3. UI — Room Form
- [ ] `src/components/room/room-form.tsx`: add `currentStatus` + `isOccupied` props; render status select (available/under_renovation) or read-only indicator

### 4. UI — Edit Page
- [ ] `src/app/(app)/properties/[propertyId]/rooms/[roomId]/edit/page.tsx`: pass status props to RoomForm; on submit PATCH status separately if changed

### 5. UI — Detail Page
- [ ] `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`: remove statusMutation, updateStatus fn, status Select block, and related imports

### 6. i18n
- [ ] `locales/en.json`: add `room.edit.statusLabel`, `room.edit.statusOccupiedNote`
- [ ] `locales/id.json`: same keys in Indonesian

## Tests

### Vitest
- [ ] `src/lib/__tests__/room-service.test.ts` (or existing): add cases for `updateRoomStatus` blocking "occupied"
- [ ] `src/app/api/.../__tests__/room-status-route.test.ts`: 409 for manual occupied

### Playwright E2E
- [ ] `e2e/room-status-edit.spec.ts`: status field visible + functional in edit form for empty room
- [ ] `e2e/room-status-edit.spec.ts`: status field read-only in edit form for occupied room
- [ ] `e2e/room-status-edit.spec.ts`: no status dropdown on room detail page
