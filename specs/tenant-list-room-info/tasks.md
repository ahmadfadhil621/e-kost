# Tasks — Tenant List: Show Room Number & Move-In Date

## T1 — Domain: Add roomNumber to Tenant type
File: `src/domain/schemas/tenant.ts`
- Add `roomNumber: string | null` to `Tenant` interface

## T2 — Fixture: Add roomNumber default
File: `src/test/fixtures/tenant.ts`
- Add `roomNumber: null` to `createTenant` defaults

## T3 — Repository: Join room relation
File: `src/lib/repositories/prisma/prisma-tenant-repository.ts`
- Update `toTenant()` to accept `room: { roomNumber: string } | null`
- Add `include: { room: { select: { roomNumber: true } } }` to all Prisma queries

## T4 — UI: Render room info in tenant card
File: `src/app/(app)/properties/[propertyId]/tenants/page.tsx`
- Add `assignedAt: string | null` and `roomNumber: string | null` to `TenantSummary`
- Render room number and since-date in card (only when roomId is set)

## T5 — Tests: New test cases
Files: `route.test.ts`, `page.test.tsx`
- API: GET returns `roomNumber` in tenant list
- UI: Card shows room number + date when assigned; hidden when not assigned

## Regression
- `npm run test:run` — must pass 0 failures
- `npm run lint` — must pass 0 errors
