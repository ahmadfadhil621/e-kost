# Currency Management — Tasks

## Pre-requisite: Schema Changes
- [ ] User applies schema changes in Supabase:
  - New `currency` table with fields: id, code (unique), locale, label, createdAt
  - Seed rows: EUR (en-IE, Euro) and IDR (id-ID, Indonesian Rupiah)
  - Add `currency String @default("EUR")` to `user` table
- [ ] Run `npx prisma db pull` then `npx prisma generate` after confirmation

---

## Layer 1 — Domain
- [ ] Create `src/domain/schemas/currency.ts` — `Currency` type, `createCurrencySchema`, `updateUserCurrencySchema`
- [ ] Create `src/domain/interfaces/currency-repository.ts` — `ICurrencyRepository` interface
- [ ] Extend `src/domain/schemas/user.ts` — add `updateUserCurrencySchema`

## Layer 2 — Repository
- [ ] Create `src/lib/repositories/prisma/prisma-currency-repository.ts` — implements `ICurrencyRepository`

## Layer 3 — Service
- [ ] Create `src/lib/currency-service.ts` — `list`, `add`, `remove` methods with error classes
- [ ] Create `src/lib/currency-service-instance.ts` — singleton
- [ ] Extend `src/lib/user-service.ts` — add `getCurrency`, `updateCurrency` methods

## Layer 4 — API
- [ ] Create `src/app/api/currencies/route.ts` — `GET` (public), `POST` (dev-gated)
- [ ] Create `src/app/api/currencies/[id]/route.ts` — `DELETE` (dev-gated)
- [ ] Create `src/app/api/user/currency/route.ts` — `GET` + `PATCH` (authenticated)

## Layer 5 — Context & Hook
- [ ] Create `src/contexts/currency-context.tsx` — `CurrencyProvider` + `useCurrency` hook
- [ ] Update `src/hooks/use-format-currency.ts` — read from `useCurrency()` instead of i18n
- [ ] Wire `CurrencyProvider` into the app layout (wrap alongside existing providers)

## Layer 6 — UI
- [ ] Create `src/components/settings/CurrencySelector.tsx` — user-facing currency picker
- [ ] Create `src/components/settings/CurrencySection.tsx` — dev-only CRUD component
- [ ] Create `src/app/(app)/settings/currencies/page.tsx` — dev-gated page with server-side redirect
- [ ] Update `src/components/settings/SettingsPage.tsx`:
  - Add `<CurrencySelector />` below `<LanguageSelector />`
  - Add "Currency Management" link in dev section

## Layer 7 — i18n
- [ ] Add currency management keys to `locales/en.json`
- [ ] Add currency management keys to `locales/id.json`

---

## Tests
- [ ] Unit tests: `CurrencyService` (list, add, remove — good/bad/edge)
- [ ] Unit tests: `userService.getCurrency` / `updateCurrency`
- [ ] Integration tests: `GET /api/currencies`, `POST /api/currencies`, `DELETE /api/currencies/[id]`
- [ ] Integration tests: `GET /api/user/currency`, `PATCH /api/user/currency`
- [ ] Component tests: `CurrencySelector`, `CurrencySection`
- [ ] E2E: user changes currency → formatted values update
- [ ] E2E: dev adds/deletes a currency
- [ ] E2E: delete blocked when currency in use

## Regression
- [ ] `npm run test:run` passes with 0 failures
- [ ] `npm run lint` passes with 0 errors
- [ ] E2E regression defers to CI
