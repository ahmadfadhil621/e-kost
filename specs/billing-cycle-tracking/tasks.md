# Billing Cycle Tracking — Tasks

## Status Legend
- [ ] Pending
- [~] In progress
- [x] Done

---

## Phase 0: Schema Approval

- [ ] Describe schema changes to user (BillingCycle model + Payment.billingCycleId) and get explicit approval
- [ ] User applies schema changes in Supabase
- [ ] Run `npx prisma db pull` then `npx prisma generate` to sync client

---

## Phase 1: Specs
- [x] Create requirements.md
- [x] Create design.md
- [x] Create tasks.md

---

## Phase 2: Vitest Tests (written before production code)

### Domain
- [ ] `src/domain/schemas/billing-cycle.test.ts` — validate `BillingCycle`, `CycleStatus`, `BillingCycleBreakdown` shapes

### Service
- [ ] `src/lib/billing-cycle-service.test.ts` (or extend balance-service.test.ts) — `calculateCycleBreakdown`
  - Good: tenant with mix of paid/partial/unpaid cycles
  - Bad: tenant not found, no room, invalid access
  - Edge: tenant moved in this month (single cycle), all cycles paid, no payments ever
- [ ] `src/lib/payment-service.test.ts` update — `createPayment` with `billingCycleId`
  - Good: FIFO default cycle assignment, explicit cycle override
  - Bad: billingCycleId belonging to different tenant
  - Edge: payment completes the last unpaid cycle

### Repository
- [ ] `src/lib/repositories/prisma/prisma-billing-cycle-repository.test.ts`
  - `findOrCreate`: creates when missing, returns existing when present
  - `findWithPaymentSums`: correctly aggregates payments per cycle

### API
- [ ] `src/app/api/properties/[propertyId]/tenants/[tenantId]/balance/route.test.ts` update — new response shape
- [ ] `src/app/api/properties/[propertyId]/tenants/[tenantId]/billing-cycles/route.test.ts` — new endpoint

### UI
- [ ] `src/components/balance/balance-section.test.tsx` update — per-cycle breakdown rendering
- [ ] `src/components/payment/payment-form.test.tsx` update — billing period dropdown

---

## Phase 3: E2E Tests (written before production code)

- [x] `e2e/billing-cycle/billing-cycle-breakdown.spec.ts` — tenant detail shows unpaid months
- [x] `e2e/billing-cycle/payment-billing-period.spec.ts` — payment form shows billing period dropdown, FIFO default, override

---

## Phase 4: Test Validation

- [x] Gate 1: structural analysis
- [x] Gate 2: fault injection
- [x] Gate 3: review checklist

---

## Phase 5: Implementation

### Layer 1: Domain
- [ ] Create `src/domain/schemas/billing-cycle.ts`
- [ ] Create `src/domain/interfaces/billing-cycle-repository.ts`
- [ ] Update `src/domain/schemas/payment.ts` — add `billingCycleId` to schema and interface

### Layer 2: Repository
- [ ] Create `src/lib/repositories/prisma/prisma-billing-cycle-repository.ts`
- [ ] Update `src/lib/repositories/prisma/prisma-balance-repository.ts` — add `getTenantInfo`
- [ ] Update `src/lib/repositories/prisma/prisma-payment-repository.ts` — accept `billingCycleId` in `create`

### Layer 3: Service
- [ ] Update `src/lib/balance-service.ts` — add `calculateCycleBreakdown` method, update `IBalanceRepository` interface with `getTenantInfo`
- [ ] Update `src/lib/payment-service.ts` — cycle assignment logic in `createPayment`
- [ ] Update `src/lib/balance-service-instance.ts` — wire up new repo
- [ ] Update `src/lib/payment-service-instance.ts` — wire up `billingCycleRepo`

### Layer 4: API
- [ ] Update `src/app/api/properties/[propertyId]/tenants/[tenantId]/balance/route.ts` — return `BillingCycleBreakdown`
- [ ] Create `src/app/api/properties/[propertyId]/tenants/[tenantId]/billing-cycles/route.ts` — return unpaid cycles list

### Layer 5: UI
- [ ] Update `src/components/balance/balance-section.tsx` — per-cycle breakdown
- [ ] Update `src/components/payment/payment-form.tsx` — billing period dropdown
- [ ] Update `src/app/(app)/properties/[propertyId]/payments/new/page.tsx` — fetch + pass cycles
- [ ] Add i18n keys to `locales/en.json`
- [ ] Add i18n keys to `locales/id.json`

### Layer 6: Demo Data
- [ ] Update `src/lib/demo-seed.ts` — 4 scenarios with billing cycles

---

## Phase 6: Regression
- [ ] `npm run test:run` passes (0 failures)
- [ ] `npm run lint` passes (0 errors)
