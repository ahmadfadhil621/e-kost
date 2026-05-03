# Room Status Edit — Tasks

## Layer Order (bottom-up)

### 1. Service
- [x] `src/lib/room-service.ts`: add guard in `updateRoomStatus` — reject status `"occupied"` with a meaningful error

### 2. API
- [x] `src/app/api/properties/[propertyId]/rooms/[roomId]/status/route.ts`: return 409 when service throws the "cannot manually set occupied" error

### 3. UI — Room Form
- [x] `src/components/room/room-form.tsx`: add `currentStatus` + `isOccupied` props; render status select (available/under_renovation) or read-only indicator

### 4. UI — Edit Page
- [x] `src/app/(app)/properties/[propertyId]/rooms/[roomId]/edit/page.tsx`: pass status props to RoomForm; on submit PATCH status separately if changed

### 5. UI — Detail Page
- [x] `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`: remove statusMutation, updateStatus fn, status Select block, and related imports

### 6. i18n
- [x] `locales/en.json`: add `room.edit.statusLabel`, `room.edit.statusOccupiedNote`
- [x] `locales/id.json`: same keys in Indonesian

## Tests

### Vitest
- [ ] `src/lib/__tests__/room-service.test.ts` (or existing): add cases for `updateRoomStatus` blocking "occupied"
- [ ] `src/app/api/.../__tests__/room-status-route.test.ts`: 409 for manual occupied

### Playwright E2E
- [x] `e2e/room-status-edit/edit-form-status.spec.ts`: status field visible + functional in edit form for empty room; read-only with note for occupied room; `occupied` absent from select; becomes editable after move-out
- [x] `e2e/room-status-edit/detail-no-dropdown.spec.ts`: no status dropdown on room detail page; read-only badge present
- [x] `e2e/room-status-edit/api-occupied-guard.spec.ts`: 409 for manual `occupied`; 409 for under_renovation on occupied room; 200 for valid transition
