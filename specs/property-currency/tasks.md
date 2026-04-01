# Property-Level Currency — Tasks

## Phase 0: Schema (user applies in Supabase)
- [ ] Add `currency String @default("IDR")` to `Property` model
- [ ] Remove `currency` field from `User` model
- [ ] After user confirms: run `npx prisma db pull && npx prisma generate`

## Phase 1: Write Tests (TDD)
- [ ] `src/app/api/properties/route.test.ts` — add currency to create/list tests
- [ ] `src/lib/property-service.test.ts` (if not existing) — currency in createProperty
- [ ] `src/lib/currency-service.test.ts` — switch guard to property count
- [ ] `src/app/api/user/currency/route.test.ts` — remove or mark as deleted
- [ ] `src/lib/user-service-currency.test.ts` — remove currency tests

## Phase 2: Validate Tests
- [ ] Run 3 quality gates (structural, fault injection, review checklist)

## Phase 3: Domain + Repository + Service Layer
- [ ] `src/domain/schemas/property.ts` — add currency
- [ ] `src/domain/schemas/currency.ts` — remove updateUserCurrencySchema
- [ ] `src/domain/interfaces/property-repository.ts` — add currency to create input
- [ ] `src/lib/repositories/prisma/prisma-property-repository.ts` — store + select currency
- [ ] `src/lib/property-service.ts` — pass currency through
- [ ] `src/lib/user-service.ts` — remove getCurrency / updateCurrency
- [ ] `src/lib/currency-service.ts` — switch guard to property count

## Phase 4: API Layer
- [ ] `src/app/api/properties/route.ts` — require currency in POST; include in GET
- [ ] Delete `src/app/api/user/currency/route.ts`

## Phase 5: Context + Hook Layer
- [ ] `src/contexts/currency-context.tsx` — source from active property
- [ ] `src/hooks/use-format-currency.ts` — null guard

## Phase 6: UI Layer
- [ ] `src/components/property/property-form.tsx` — add currency selector
- [ ] `src/components/settings/CurrencySelector.tsx` — remove user-level update
- [ ] Settings page — remove user-level currency section

## Phase 7: i18n
- [ ] `locales/en.json` — add property.currency keys; update inUse error; remove user-level keys
- [ ] `locales/id.json` — same

## Phase 8: Demo Seed + Fixtures
- [ ] Create `scripts/seed-demo.ts` with EUR demo data
- [ ] Update `src/test/fixtures/room.ts` — EUR-scale monthlyRent
- [ ] Update `src/test/fixtures/payment.ts`, `balance.ts`, `expense.ts`, etc.

## Phase 9: Regression
- [ ] `npm run test:run` — all Vitest tests pass
