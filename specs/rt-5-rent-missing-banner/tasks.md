# Tasks: RT-5 — Rent Missing Banner on Tenant Detail

## Layer: UI (only layer affected)

### Task 1 — Write unit/component tests

- [ ] Write tests for `RentMissingBanner` component (Good/Bad/Edge)
  - Good: renders banner with icon + text + role=alert when status=unpaid
  - Bad: renders null when status=paid, renders null when data=null (no room), renders null while loading
  - Edge: amount formatted as currency; i18n key used (not hardcoded string)
- [ ] Write tests for modified `BalanceSection` (regression)
  - Good: monthly rent and total payments rows still rendered
  - Bad: outstanding balance row NOT rendered
- [ ] Property-based tests per design.md properties 1–4

### Task 2 — Write E2E tests (runs in CI)

- [ ] `e2e/tenants/rent-missing-banner.spec.ts`
  - Good: unpaid tenant → banner visible, contains amount
  - Bad: paid tenant → banner absent
  - Edge: mobile 375×667 viewport, no horizontal scroll

### Task 3 — Validate tests (3 gates)

- [ ] Gate 1: structural analysis (`npx tsx scripts/validate-tests.ts --feature rt-5-rent-missing-banner`)
- [ ] Gate 2: fault injection
- [ ] Gate 3: review checklist

### Task 4 — Implement RentMissingBanner

- [ ] Create `src/components/balance/rent-missing-banner.tsx`
  - Fetch balance using same query key as BalanceSection
  - Return null when loading / paid / no data
  - Render role=alert + AlertTriangle icon + formatted amount text

### Task 5 — Modify BalanceSection

- [ ] Remove outstanding balance row from `src/components/balance/balance-section.tsx`

### Task 6 — Update TenantDetailPage

- [ ] Import and mount `RentMissingBanner` in `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx`
  - Place between tenant info block and action buttons

### Task 7 — i18n

- [ ] Add `balance.rentMissingBanner.message` to `locales/en.json`
- [ ] Add `balance.rentMissingBanner.message` to `locales/id.json`

### Task 8 — Regression

- [ ] `npm run test:run` — all Vitest tests pass
- [ ] Push to trigger CI E2E run
