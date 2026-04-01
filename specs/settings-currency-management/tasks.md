# Currency Management — Tasks

## Pre-requisite: Schema Changes
- [x] User applies schema changes in Supabase:
  - New `currency` table with fields: id, code (unique), locale, label, createdAt
  - Seed rows: EUR (en-IE, Euro) and IDR (id-ID, Indonesian Rupiah)
  - Add `currency String @default("EUR")` to `user` table
- [x] Run `npx prisma db pull` then `npx prisma generate` after confirmation

---

## Layer 1 — Domain
- [x] Create `src/domain/schemas/currency.ts` — `Currency` type, `createCurrencySchema`, `updateUserCurrencySchema`
- [x] Create `src/domain/interfaces/currency-repository.ts` — `ICurrencyRepository` interface
- [x] Extend `src/domain/schemas/user.ts` — add `updateUserCurrencySchema` (implemented in `currency.ts` instead)

## Layer 2 — Repository
- [x] Create `src/lib/repositories/prisma/prisma-currency-repository.ts` — implements `ICurrencyRepository`

## Layer 3 — Service
- [x] Create `src/lib/currency-service.ts` — `list`, `add`, `remove` methods with error classes
- [x] Create `src/lib/currency-service-instance.ts` — singleton
- [x] Extend `src/lib/user-service.ts` — add `getCurrency`, `updateCurrency` methods

## Layer 4 — API
- [x] Create `src/app/api/currencies/route.ts` — `GET` (public), `POST` (dev-gated)
- [x] Create `src/app/api/currencies/[id]/route.ts` — `DELETE` (dev-gated)
- [x] Create `src/app/api/user/currency/route.ts` — `GET` + `PATCH` (authenticated)

## Layer 5 — Context & Hook
- [x] Create `src/contexts/currency-context.tsx` — `CurrencyProvider` + `useCurrency` hook
- [x] Update `src/hooks/use-format-currency.ts` — read from `useCurrency()` instead of i18n
- [x] Wire `CurrencyProvider` into the app layout (wrap alongside existing providers)

## Layer 6 — UI
- [x] Create `src/components/settings/CurrencySelector.tsx` — user-facing currency picker
- [x] Create `src/components/settings/CurrencySection.tsx` — dev-only CRUD component
- [x] Create `src/app/(app)/settings/currencies/page.tsx` — dev-gated page with server-side redirect
- [x] Update `src/components/settings/SettingsPage.tsx`:
  - Add `<CurrencySelector />` below `<LanguageSelector />`
  - Add "Currency Management" link in dev section

## Layer 7 — i18n
- [x] Add currency management keys to `locales/en.json`
- [x] Add currency management keys to `locales/id.json`

---

## Tests
- [x] Unit tests: `CurrencyService` (list, add, remove — good/bad/edge)
- [x] Unit tests: `userService.getCurrency` / `updateCurrency`
- [x] Integration tests: `GET /api/currencies`, `POST /api/currencies`, `DELETE /api/currencies/[id]`
- [x] Integration tests: `GET /api/user/currency`, `PATCH /api/user/currency`
- [ ] Component tests: `CurrencySelector`, `CurrencySection`
- [x] E2E: user changes currency → formatted values update
- [x] E2E: dev adds/deletes a currency
- [x] E2E: delete blocked when currency in use

## Regression
- [x] `npm run test:run` passes with 0 failures
- [x] `npm run lint` passes with 0 errors
- [x] E2E regression defers to CI
