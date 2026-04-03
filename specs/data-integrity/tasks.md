# Data Integrity Constraints — Tasks

> Issue #35

## Layer: Service

- [ ] `src/lib/room-service.ts` — Add constraint in `updateRoomStatus()`: if `status === "occupied"` and no active tenants → throw `"Cannot set room to occupied: no active tenant assigned"`

## Layer: API

- [ ] `src/app/api/properties/[propertyId]/tenants/[tenantId]/move-out/route.ts` — Catch `"Tenant is already moved out"` → 409
- [ ] `src/app/api/properties/[propertyId]/rooms/[roomId]/status/route.ts` — Catch `"Cannot set room to occupied"` → 409

## Layer: Tests (Unit/Integration)

- [ ] `src/app/api/.../move-out/route.test.ts` — Add test: already-moved-out tenant → 409
- [ ] `src/app/api/.../rooms/[roomId]/status/route.test.ts` — Add test: set occupied with no tenant → 409
- [ ] `src/lib/room-service.test.ts` — Add test: updateRoomStatus throws when setting occupied with no tenant

## Layer: E2E

- [ ] `e2e/data-integrity/data-integrity.spec.ts` — Write all 3 scenarios (AC-1 bad, AC-2 bad, AC-3 edge)

## AC-3 Note

Pending investigation of whether a rent-update → balance cache bug exists. If it does, additional fixes will be needed before the E2E test can pass.
