# Tasks — Customisable Billing Day per Tenant

## Phase 0: Schema
- [ ] Apply `billingDayOfMonth INT NULL` to Supabase `tenant` table
- [ ] Run `npx prisma db pull && npx prisma generate`

## Phase 1: Tests (TDD)
- [ ] Write Vitest tests for `effectiveBillingDay` and `clampDay` helpers
- [ ] Write Vitest tests for updated `calculateCycleBreakdown` (billing day anchor logic)
- [ ] Write Vitest tests for `assignRoom` service (default billing day = day of assignment)
- [ ] Write Vitest tests for `updateTenant` service (billingDayOfMonth update)
- [ ] Write E2E test: assign room sets billing day, balance section shows it

## Phase 2: Domain
- [ ] Update `Tenant` interface in `src/domain/schemas/tenant.ts`
- [ ] Update `assignRoomSchema` and `updateTenantSchema`

## Phase 3: Repository
- [ ] Update `ITenantRepository` interface
- [ ] Update `prisma-tenant-repository.ts` (toTenant mapper + assignRoom)
- [ ] Update `prisma-balance-repository.ts` getTenantInfo return type

## Phase 4: Services
- [ ] Update `tenant-service.ts` — assignRoom + updateTenant
- [ ] Update `balance-service.ts` — cycle breakdown + getTenantInfo IBalanceRepository interface

## Phase 5: API
- [ ] Update assign-room route to accept `billingDayOfMonth`
- [ ] Update PATCH tenant route to accept `billingDayOfMonth`

## Phase 6: UI
- [ ] Add billing day input to Assign Room dialog
- [ ] Add billing day input to Edit Tenant form
- [ ] Show due day in balance section

## Phase 7: i18n
- [ ] Add i18n keys to `locales/en.json` and `locales/id.json`

## Phase 8: Regression
- [ ] `npm run test:run` passes
