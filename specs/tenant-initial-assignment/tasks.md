# Tenant Initial Assignment — Tasks

> Issue #124

## Layer: Repository / Seed Data (AC-1)

- [x] `src/lib/demo-seed.ts` — Wrap `prisma.tenant.create()` inside `assignTenant()` in an interactive `prisma.$transaction` that also inserts a `room_assignment` row (`startDate = movedInAt`, `endDate = null`)
- [x] `scripts/seed-demo.ts` — Wrap `prisma.tenant.create()` inside the tenant creation block in an interactive `prisma.$transaction` that also inserts a `room_assignment` row (`startDate = movedInAt`, `endDate = null`)

## Layer: Domain Interface (AC-2)

- [x] `src/domain/interfaces/tenant-repository.ts` — Remove `assignRoom(id, roomId, billingDayOfMonth): Promise<Tenant>` from `ITenantRepository`

## Layer: Repository Implementation (AC-2)

- [x] `src/lib/repositories/prisma/prisma-tenant-repository.ts` — Delete `assignRoom()` method

## Layer: Service (AC-2)

- [x] `src/lib/tenant-service.ts` — Delete `assignRoom()` method

## Layer: Tests (AC-2)

- [x] `src/lib/tenant-service.test.ts` — Delete `describe("assignRoom")` block and `assignRoom: vi.fn()` stub
- [x] `src/lib/tenant-service.fault-injection.test.ts` — Delete `assignRoom`-related `it()` blocks and stub
- [x] `src/lib/payment-service.test.ts` — Remove `assignRoom: vi.fn()` from mock (two occurrences)
- [x] `src/lib/payment-service-export.test.ts` — Remove `assignRoom: vi.fn()` from mock
- [x] `src/lib/note-service.test.ts` — Remove `assignRoom: vi.fn()` from mock
- [x] `src/lib/note-service.fault-injection.test.ts` — Remove `assignRoom: vi.fn()` from mock
- [x] `src/lib/room-service.test.ts` — Remove `assignRoom: vi.fn()` from mock
- [x] `src/lib/room-service.fault-injection.test.ts` — Remove `assignRoom: vi.fn()` from mock
- [x] `src/lib/property-service.test.ts` — Remove `assignRoom: vi.fn()` from mock

## Verification

- [x] Run `npm run test:run` — 0 failures
- [x] Run `npm run lint` — 0 errors
- [x] Manually verify seed scripts still run without error
