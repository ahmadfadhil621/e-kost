# Finance Cashflow — Tasks

## Layer 1: Domain
- [x] Create `src/domain/schemas/cashflow.ts` — `CashflowEntry` interface + `cashflowQuerySchema`
- [x] Create `src/domain/interfaces/cashflow-repository.ts` — `ICashflowRepository` interface

## Layer 2: Repository
- [x] Create `src/lib/repositories/prisma/prisma-cashflow-repository.ts` — fetch payments + expenses for month, merge, sort date desc

## Layer 3: Service
- [x] Create `src/lib/cashflow-service.ts` — `CashflowService` with `getMonthlyCashflow`
- [x] Create `src/lib/cashflow-service-instance.ts` — wire Prisma repo + propertyService

## Layer 4: API
- [x] Create `src/app/api/properties/[propertyId]/finance/cashflow/route.ts` — GET handler

## Layer 5: UI
- [x] Create `src/app/(app)/properties/[propertyId]/finance/cashflow/page.tsx` — cashflow page with MonthSelector + timeline list
- [x] Update `src/app/(app)/properties/[propertyId]/finance/page.tsx` — add `href` to Net Income SummaryCard

## Layer 6: i18n
- [x] Add `finance.cashflow.title` and `finance.cashflow.empty` to `locales/en.json`
- [x] Add `finance.cashflow.title` and `finance.cashflow.empty` to `locales/id.json`

## Tests
- [x] Vitest: `src/lib/cashflow-service.test.ts` — Good/Bad/Edge
- [x] Vitest: `src/lib/cashflow-service.fault-injection.test.ts`
- [x] Vitest: `src/app/api/properties/[propertyId]/finance/cashflow/route.test.ts`
- [x] Playwright: `e2e/finance-cashflow/view-cashflow.spec.ts`
