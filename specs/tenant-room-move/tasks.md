# Tasks: Tenant Room Move & Assignment History (Issue #105)

## 0. Schema & Migration

- [ ] 0.1 Get user approval for schema changes
  - Present the `RoomAssignment` model and relation additions from design.md
  - Wait for user to apply changes in Supabase
  - Run `npx prisma db pull` then `npx prisma generate`

- [ ] 0.2 Write backfill script (`scripts/backfill-room-assignments.ts`)
  - Find all tenants with `roomId != null` and no existing `RoomAssignment`
  - Create records: `startDate = movedInAt ?? createdAt`, `endDate = movedOutAt ?? null`
  - Run once against the demo database

## 1. Domain Layer

- [ ] 1.1 Zod schemas (`src/domain/schemas/room-assignment.ts`)
  - `RoomAssignmentSchema` — full record shape
  - `MoveTenantInputSchema` — `{ targetRoomId, moveDate, billingDayOfMonth? }`

- [ ] 1.2 Repository interface (`src/domain/interfaces/IRoomAssignmentRepository.ts`)
  - `create`, `closeCurrentAssignment`, `findByTenant`, `findOpenByTenant`

## 2. Repository Layer

- [ ] 2.1 Implement `PrismaRoomAssignmentRepository`
  - `src/lib/repositories/prisma/room-assignment.repository.ts`
  - `create` — insert new record
  - `closeCurrentAssignment(tenantId, endDate)` — set endDate on open record
  - `findByTenant(tenantId)` — include room.roomNumber, order startDate DESC
  - `findOpenByTenant(tenantId)` — record with endDate = null

## 3. Service Layer

- [ ] 3.1 Add `moveTenantToRoom` to `TenantService`
  - Validation: active tenant, belongs to property, different room, capacity check
  - Transaction: close old assignment → create new → update tenant → update room statuses
  - If initial assign (no current roomId): skip close step, may update billingDayOfMonth

- [ ] 3.2 Update `createTenant` in `TenantService`
  - After creating tenant with roomId: also create initial `RoomAssignment` record
  - `startDate = movedInAt ?? now()`

- [ ] 3.3 Write service unit tests (`src/lib/tenant-service.test.ts` additions)
  - Good: initial assign (no prior room), move to new room
  - Bad: same room, full room, inactive tenant, wrong property
  - Edge: last tenant leaves (room → AVAILABLE), multi-tenant room partially vacates

## 4. API Layer

- [ ] 4.1 New route: `POST /api/properties/[propertyId]/tenants/[tenantId]/move/route.ts`
  - Validate input with `MoveTenantInputSchema`
  - Call `tenantService.moveTenantToRoom`
  - Return 200 with updated tenant; 400/403/404/409 on errors

- [ ] 4.2 New route: `GET /api/properties/[propertyId]/tenants/[tenantId]/room-assignments/route.ts`
  - Call `roomAssignmentRepository.findByTenant`
  - Return `{ data: [...] }` ordered newest first

- [ ] 4.3 Delete retired route: `src/app/api/properties/[propertyId]/tenants/[tenantId]/assign-room/route.ts`
  - Also delete `assign-room/route.test.ts` after verifying coverage is moved

- [ ] 4.4 Write API route tests
  - `move/route.test.ts` — success (initial), success (move), same room 400, full room 409, inactive tenant 400, not found 404
  - `room-assignments/route.test.ts` — success, empty list, unauthorized

## 5. UI Layer

- [ ] 5.1 Create `MoveDialog` component (`src/components/tenants/MoveDialog.tsx`)
  - Props: `tenantId`, `propertyId`, `currentRoomId`, `movedInAt`
  - Mode-aware: "Assign Room" vs "Move to Room" label/fields
  - Room selector: fetch available rooms, show slot count, exclude current room in move mode
  - Date picker: defaults per mode (see design.md)
  - Billing day input: shown only in initial assign mode
  - On submit: POST to `/move`; on success invalidate queries

- [ ] 5.2 Update tenant detail page
  - Replace existing "Assign Room" button + old dialog with `MoveDialog`
  - Button label: conditional on `tenant.roomId`

- [ ] 5.3 Add Room History section to tenant detail page
  - New section below current room info
  - Fetch from `GET /room-assignments` via TanStack Query
  - List items: filled/empty circle, room number, date range
  - Loading skeleton + empty state ("No room history yet")

## 6. i18n

- [ ] 6.1 Add keys to `locales/en.json` (see design.md for full list)
- [ ] 6.2 Add keys to `locales/id.json` (Indonesian translations)

## 7. E2E Tests

- [ ] 7.1 `e2e/tenant-room-move/assign-room.spec.ts`
  - Tenant with no room → opens Assign Room dialog → selects room → confirms → history shows entry

- [ ] 7.2 `e2e/tenant-room-move/move-to-room.spec.ts`
  - Tenant with room → opens Move to Room dialog → selects new room → confirms → history shows both entries, old closed

- [ ] 7.3 `e2e/tenant-room-move/capacity-blocked.spec.ts`
  - Room at capacity → does not appear in room selector

## 8. Regression & Close

- [ ] 8.1 Run `npm run test:run` — 0 failures
- [ ] 8.2 Run `npm run lint` — 0 errors
- [ ] 8.3 Verify all DoD criteria from issue #105
- [ ] 8.4 Close issue #105
