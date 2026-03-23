# Finance Summary Card Detail Popup — Tasks

## Status Legend
- [ ] Pending
- [x] Done

---

## Layer 1: Specs
- [x] Create requirements.md
- [x] Create design.md
- [x] Create tasks.md

## Layer 2: Domain
- [ ] Add `categoryBreakdown: CategoryBreakdown[]` to `FinanceSummarySnapshot` in `src/domain/schemas/dashboard.ts`

## Layer 3: Service
- [ ] Update `IFinanceSummarySnapshotSource` return type in `src/lib/dashboard-service.ts`
- [ ] Add `categoryBreakdown` to finance construction in `DashboardService.getDashboardData()`
- [ ] Pass `categoryBreakdown` through in `financeSnapshotSource` adapter in `src/lib/dashboard-service-instance.ts`

## Layer 4: Fixtures
- [ ] Add `categoryBreakdown: []` default in `createFinanceSummarySnapshot` in `src/test/fixtures/dashboard.ts`

## Layer 5: Tests (written before production UI code)
- [ ] Update `src/components/dashboard/FinanceSummaryCard.test.tsx` with dialog Good/Bad/Edge cases
- [ ] Create `e2e/dashboard-overview/finance-summary-dialog.spec.ts`
- [ ] Run test validator (3 quality gates)

## Layer 6: UI Implementation
- [ ] Create `src/components/dashboard/FinanceDetailDialog.tsx`
- [ ] Update `src/components/dashboard/FinanceSummaryCard.tsx` (clickable rows + dialog render)

## Layer 7: i18n
- [ ] Add 4 keys under `dashboard.finance` in `locales/en.json`
- [ ] Add 4 keys under `dashboard.finance` in `locales/id.json`

## Layer 8: Regression
- [ ] `npm run test:run` passes
- [ ] New E2E spec passes locally
