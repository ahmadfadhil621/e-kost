# Tenant Initial Assignment — Design

> Issue #124

## Changes Required

### 1. Fix `src/lib/demo-seed.ts` — add room_assignment insert

**Problem:** `assignTenant()` creates a tenant via `prisma.tenant.create()` with `roomId` set but never inserts a `room_assignment` row.

**Fix:** After each `prisma.tenant.create()` call inside `assignTenant()`, insert a matching `room_assignment` row in a single `prisma.$transaction`:

```typescript
async function assignTenant(roomNumber: string, name: string, movedInAt: Date) {
  const [tenant] = await prisma.$transaction([
    prisma.tenant.create({
      data: { propertyId: property.id, roomId: roomMap[roomNumber].id, name, movedInAt },
    }),
    prisma.room_assignment.create({
      data: {
        tenantId: /* need tx approach — see note below */,
        roomId: roomMap[roomNumber].id,
        startDate: movedInAt,
        endDate: null,
      },
    }),
  ]);
  ...
}
```

**Note:** Because `tenantId` in the `room_assignment` row must reference the newly-created tenant's `id` (a generated UUID), the interactive transaction form must be used:

```typescript
const tenant = await prisma.$transaction(async (tx) => {
  const created = await tx.tenant.create({
    data: { propertyId: property.id, roomId: roomMap[roomNumber].id, name, movedInAt },
  });
  await tx.room_assignment.create({
    data: { tenantId: created.id, roomId: roomMap[roomNumber].id, startDate: movedInAt, endDate: null },
  });
  return created;
});
```

The `startDate` must equal `movedInAt` (same value used for `Tenant.movedInAt`). `endDate` must be `null` (open assignment).

---

### 2. Fix `scripts/seed-demo.ts` — add room_assignment insert

**Problem:** Same pattern — `prisma.tenant.create()` sets `roomId` but never inserts a `room_assignment` row.

**Fix:** Same interactive transaction pattern as above, co-located with each `prisma.tenant.create()` call in the loop:

```typescript
tenant = await prisma.$transaction(async (tx) => {
  const created = await tx.tenant.create({
    data: { propertyId: property.id, roomId: room.id, name: t.name, phone: t.phone, email: t.email, movedInAt },
  });
  await tx.room_assignment.create({
    data: { tenantId: created.id, roomId: room.id, startDate: movedInAt, endDate: null },
  });
  return created;
});
```

---

### 3. Remove `assignRoom()` dead code

**Files to change:**

| File | Change |
|------|--------|
| `src/domain/interfaces/tenant-repository.ts` | Remove `assignRoom(id, roomId, billingDayOfMonth): Promise<Tenant>` from interface |
| `src/lib/repositories/prisma/prisma-tenant-repository.ts` | Delete the `assignRoom()` method |
| `src/lib/tenant-service.ts` | Delete the `assignRoom()` method |
| `src/lib/tenant-service.test.ts` | Delete the `describe("assignRoom")` block (~line 668–980) and the `assignRoom: vi.fn()` stub at ~line 55 |
| `src/lib/tenant-service.fault-injection.test.ts` | Delete the two `assignRoom`-related `it()` blocks and the `assignRoom: vi.fn()` stub |
| `src/lib/payment-service.test.ts` | Remove `assignRoom: vi.fn()` from mock (two occurrences) |
| `src/lib/payment-service-export.test.ts` | Remove `assignRoom: vi.fn()` from mock |
| `src/lib/note-service.test.ts` | Remove `assignRoom: vi.fn()` from mock |
| `src/lib/note-service.fault-injection.test.ts` | Remove `assignRoom: vi.fn()` from mock |
| `src/lib/room-service.test.ts` | Remove `assignRoom: vi.fn()` from mock |
| `src/lib/room-service.fault-injection.test.ts` | Remove `assignRoom: vi.fn()` from mock |
| `src/lib/property-service.test.ts` | Remove `assignRoom: vi.fn()` from mock |

**No API route changes needed** — no route ever called `tenantService.assignRoom()`.

**No UI changes needed** — the "Assign Room" dialog already uses the `/move` endpoint.

---

## Correctness Properties

- For every tenant row where `roomId IS NOT NULL` and `movedOutAt IS NULL`, there must be a `room_assignment` row with `tenantId = tenant.id`, `startDate <= now()`, and `endDate IS NULL`. After this fix, all tenants created via seed scripts satisfy this invariant.
- `room_assignment.startDate` must equal `Tenant.movedInAt` for the initial assignment.
- The tenant insert and room_assignment insert must be atomic (same transaction) to prevent partial state.

## i18n Keys

No new i18n keys needed.
