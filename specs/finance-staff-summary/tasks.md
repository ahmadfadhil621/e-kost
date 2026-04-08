# Tasks: Finance Staff Summary (Issue #109)

## Prerequisites (User action required)

- [ ] User applies schema changes in Supabase:
  - Add `actorId String?` + FK to `User` on `payment` table
  - Add `actorId String?` + FK to `User` on `expense` table
- [ ] Run `npx prisma db pull && npx prisma generate`
- [ ] Restart dev server after `prisma generate`

---

## Layer 1: Domain

- [ ] Create `src/domain/schemas/staff-summary.ts`
  - `staffSummaryQuerySchema` (year + month coerce)
  - `StaffSummaryEntry` interface
- [ ] Create `src/domain/interfaces/staff-summary-repository.ts`
  - `IStaffSummaryRepository` with `getSummaryByPeriod`
- [ ] Update `src/domain/interfaces/payment-repository.ts`
  - Add `actorId?: string` to `create` signature
- [ ] Update `src/domain/interfaces/expense-repository.ts`
  - Add `actorId?: string` to `create` signature

## Layer 2: Repository

- [ ] Update `src/lib/repositories/prisma/prisma-payment-repository.ts`
  - Add `actorId?: string` to `create` data, persist it
- [ ] Update `src/lib/repositories/prisma/prisma-expense-repository.ts`
  - Add `actorId?: string` to `create` data, persist it
- [ ] Create `src/lib/repositories/prisma/prisma-staff-summary-repository.ts`
  - GroupBy actorId on payments + expenses for period
  - Merge with User + UserProperty for name/role
  - Exclude null actorId rows

## Layer 3: Service

- [ ] Update `src/lib/payment-service.ts`
  - Pass `userId` as `actorId` when calling `paymentRepo.create`
- [ ] Update `src/lib/expense-service.ts` (if exists) or the relevant service
  - Pass `userId` as `actorId` when calling `expenseRepo.create`
- [ ] Create `src/lib/staff-summary-service.ts`
  - Owner: return all; staff: filter to own row
- [ ] Create `src/lib/staff-summary-service-instance.ts`

## Layer 4: API

- [ ] Create `src/app/api/properties/[propertyId]/finance/staff-summary/route.ts`
  - GET handler with `withPropertyAccess`
  - Validate year/month with `staffSummaryQuerySchema`
  - Return `{ data: StaffSummaryEntry[] }`

## Layer 5: UI

- [ ] Create `src/components/finance/staff-summary-section.tsx`
  - Props: entries, isLoading, formatCurrency
  - Loading, empty state, list of rows
- [ ] Update `src/app/(app)/properties/[propertyId]/finance/page.tsx`
  - Add `fetchStaffSummary` and `useQuery`
  - Render `<StaffSummarySection>` below summary cards

## Layer 6: i18n

- [ ] Add `finance.staffSummary.*` keys to `locales/en.json`
- [ ] Add `finance.staffSummary.*` keys to `locales/id.json`

---

## Regression

- [ ] `npm run test:run` passes (0 failures)
- [ ] `npm run lint` passes (0 errors)
