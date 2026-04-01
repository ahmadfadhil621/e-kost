# RT-7 — Tasks

## Task 1 — Write tests
- [ ] Write Vitest test: tenant detail page renders `BalanceSection` for active tenant
- [ ] Write Vitest test: `BalanceSection` not rendered for moved-out tenant
- [ ] Run test-validator (3 gates)

## Task 2 — Implement
- [ ] Add `BalanceSection` import to tenant detail page
- [ ] Render `<BalanceSection propertyId={propertyId} tenantId={tenantId} />` between tenant info and `RentMissingBanner`

## Task 3 — Regression
- [ ] `npm run test:run` passes
