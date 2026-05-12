# Tasks — Export Outstanding Balances to XLSX (Issue #123)

## Layer 0: Tests
- [ ] Write Vitest tests: balance service export (Good/Bad/Edge)
- [ ] Write Vitest tests: API route export
- [ ] Write Playwright E2E test: download button in tenants list
- [ ] Run all three quality gates (structural, fault injection, review checklist)

## Layer 1: Domain
- [ ] Add `OutstandingBalanceExportRow` interface to `src/lib/balance-service.ts`
- [ ] Add `ExportRowCapError` to `src/lib/balance-service.ts`
- [ ] Add `findForExport` signature to `IBalanceRepository` in `src/lib/balance-service.ts`

## Layer 2: Repository
- [ ] Implement `findForExport` in `src/lib/repositories/prisma/prisma-balance-repository.ts`

## Layer 3: Service
- [ ] Add `exportOutstandingBalances` to `BalanceService`

## Layer 4: API
- [ ] Create `src/app/api/properties/[propertyId]/tenants/export/route.ts`

## Layer 5: UI
- [ ] Add download button to `src/app/(app)/properties/[propertyId]/tenants/page.tsx`

## Layer 6: i18n
- [ ] Add `tenant.export.*` keys to `locales/en.json`
- [ ] Add `tenant.export.*` keys to `locales/id.json`

## Regression
- [ ] `npm run test:run` passes with 0 failures
- [ ] `npm run lint` passes with 0 errors
