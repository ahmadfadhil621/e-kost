# Tasks — Multi-Tenant Rooms (Issue #94)

## Phase 0 — Schema Approval (Blocked until user approves)

- [ ] **T0** — Get user approval to add `capacity Int @default(1)` to Room model, then run `npx prisma db pull && npx prisma generate`

---

## Phase 1 — Domain Layer

- [ ] **T1** — `src/domain/schemas/room.ts`: Add `capacity` to `Room` interface; add `capacity` to `createRoomSchema` (optional, default 1, min 1 integer) and `updateRoomSchema` (optional, min 1 integer); add i18n-ready error message constants
- [ ] **T2** — `src/domain/interfaces/room-repository.ts`: Add `capacity?: number` to `create()` and `update()` input types

---

## Phase 2 — Write Tests (TDD — before implementation)

- [ ] **T3** — Write Vitest tests for updated `TenantService.assignRoom()`: replaces occupied-check with capacity-check, handles multi-tenant assignment, room stays occupied when capacity allows, blocks when at capacity, blocks under_renovation
- [ ] **T4** — Write Vitest tests for updated `TenantService.moveOut()`: room goes available when last tenant leaves, room stays occupied when others remain
- [ ] **T5** — Write Vitest tests for updated `RoomService.updateRoom()`: blocks capacity reduction below active tenant count
- [ ] **T6** — Write Vitest tests for updated `RoomService.updateRoomStatus()`: blocks manual status change when active tenants exist
- [ ] **T7** — Write Vitest tests for updated assign-room API route: 409 when at capacity, 200 when room occupied but has capacity
- [ ] **T8** — Write Vitest tests for room list/detail API responses: `tenants[]` array, `capacity`, `activeTenantCount`, `?hasCapacity=true` filter

---

## Phase 3 — Validate Tests

- [ ] **T9** — Run test-validator skill: structural gate, fault injection gate, review checklist

---

## Phase 4 — Repository Layer

- [ ] **T10** — `prisma-room-repository.ts`: add `capacity` to `toRoom()` mapper, `create()`, `update()`
- [ ] **T11** — `prisma-tenant-repository.ts`: no changes needed (existing `findByProperty` works)

---

## Phase 5 — Service Layer

- [ ] **T12** — `tenant-service.ts` `assignRoom()`: replace `room.status !== "available"` check with capacity check; only update room status to `occupied` if it was previously `available`
- [ ] **T13** — `tenant-service.ts` `moveOut()`: after removing assignment, count remaining active tenants; only update room to `available` if count is 0
- [ ] **T14** — `room-service.ts` `updateRoom()`: add guard — reject if new capacity < current active tenant count
- [ ] **T15** — `room-service.ts` `updateRoomStatus()`: add guard — reject manual status change if active tenants exist

---

## Phase 6 — API Layer

- [ ] **T16** — `GET /rooms` route: include `capacity`, `activeTenantCount`, `tenants: [{id, name}]`; add `?hasCapacity=true` filter; remove `tenantId`/`tenantName` flat fields
- [ ] **T17** — `GET /rooms/[roomId]` route: include `capacity`, `activeTenantCount`, `tenants: [{id, name}]`; remove `tenantId`/`tenantName`
- [ ] **T18** — `PUT /rooms/[roomId]` route: accept `capacity`, propagate to service; return 409 for capacity-below-active-count error
- [ ] **T19** — `PATCH /rooms/[roomId]/status` route: return 409 with clear message when blocked by active tenants

---

## Phase 7 — UI Layer

- [ ] **T20** — i18n: add all new keys to `locales/en.json` and `locales/id.json`
- [ ] **T21** — Room Detail page: update `RoomDetail` type; replace single tenant display with `tenants[]` list; add capacity/occupancy display; update `occupiedWarning` text
- [ ] **T22** — Tenant Detail page (assign dialog): update `RoomSummary` type; change fetch to `?hasCapacity=true`; show slots remaining per room; update empty state text
- [ ] **T23** — Room create form: add `capacity` number input (min 1, default 1)
- [ ] **T24** — Room edit form: add `capacity` number input with same guard display

---

## Phase 8 — E2E Tests

- [ ] **T25** — Write Playwright E2E test: assign second tenant to a room with capacity 2; verify both tenants appear in Room Detail
- [ ] **T26** — Write Playwright E2E test: attempt to assign third tenant to a room at capacity; verify error shown
- [ ] **T27** — Write Playwright E2E test: last tenant moves out; verify room becomes available

---

## Phase 9 — Regression

- [ ] **T28** — Run `npm run test:run` — all Vitest tests pass
- [ ] **T29** — Verify no existing tests were weakened

---

## Dependencies

T3–T8 depend on T1–T2 (domain types must exist first)  
T10–T15 depend on T3–T9 (tests must be written and validated before implementation)  
T16–T19 depend on T10–T15  
T20–T24 depend on T16–T19  
T25–T27 depend on T20–T24  
T28–T29 depend on T25–T27  
Everything depends on T0 (schema approval)
