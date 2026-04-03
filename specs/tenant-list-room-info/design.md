# Design — Tenant List: Show Room Number & Move-In Date

## Domain Layer

**`src/domain/schemas/tenant.ts`**
- Add `roomNumber: string | null` to the `Tenant` interface

## Repository Layer

**`src/lib/repositories/prisma/prisma-tenant-repository.ts`**
- Update `toTenant()` helper to accept `room: { roomNumber: string } | null` and map to `roomNumber`
- Add `include: { room: { select: { roomNumber: true } } }` to ALL Prisma queries (create, findById, findByProperty, update, assignRoom, removeRoomAssignment, softDelete)

## Service Layer
No changes needed. `listTenants` passes through `Tenant[]` unchanged.

## API Layer
No changes needed. `GET /api/properties/:id/tenants` returns `{ tenants, count }` from `tenantService.listTenants()` — `roomNumber` flows through automatically.

## UI Layer

**`src/app/(app)/properties/[propertyId]/tenants/page.tsx`**
- Add `assignedAt: string | null` and `roomNumber: string | null` to `TenantSummary` type
- In the card `CardContent`, after the email line: if `tenant.roomId !== null`, render:
  - Room line: `t("tenant.detail.room") + " " + tenant.roomNumber` (e.g. "Room 3A")
  - Date line: `t("tenant.detail.since", { date: formatted assignedAt })`

## i18n
Reuse existing keys:
- `tenant.detail.room` → "Room" / "Kamar"
- `tenant.detail.since` → "since {{date}}" / "sejak {{date}}"

No new keys needed.

## Test Fixture
**`src/test/fixtures/tenant.ts`**
- Add `roomNumber: null` to the default `createTenant` fixture
