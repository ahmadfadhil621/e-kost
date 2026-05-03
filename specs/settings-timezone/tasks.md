# Tasks — Per-User Timezone Setting (issue #120)

## Pre-flight: Schema Change
- [ ] Present schema diff to user for approval
- [ ] User applies `timezone String?` column to Supabase
- [ ] `npx prisma db pull` → `npx prisma generate` → restart dev server

## Layer 1: Domain
- [ ] Add `updateTimezoneSchema`, `UpdateTimezoneInput`, `CURATED_TIMEZONES` to `src/domain/schemas/user.ts`

## Layer 2: Service
- [ ] Add `getTimezone()` and `updateTimezone()` to `src/lib/user-service.ts`

## Layer 3: API
- [ ] Implement `GET /api/user/timezone` route handler
- [ ] Implement `PATCH /api/user/timezone` route handler

## Layer 4: Session
- [ ] Add `timezone` to better-auth `additionalFields` in `src/lib/auth.ts`
- [ ] Update `src/lib/auth-client.ts` to infer `timezone: string | null`

## Layer 5: Hooks
- [ ] Create `src/hooks/use-timezone-sync.ts` (auto-detect + PATCH on null timezone)
- [ ] Create `src/hooks/use-date-formatter.ts` (TZ-aware `format()` bound to user's TZ)
- [ ] Mount `useTimezoneSync()` in root layout or authenticated shell

## Layer 6: UI — Settings
- [ ] Create `src/components/settings/TimezoneSelector.tsx` (Combobox with curated list)
- [ ] Add timezone section to `src/components/settings/SettingsPage.tsx`

## Layer 7: Cross-cutting Date Rendering
- [ ] Migrate `src/components/finance/month-selector.tsx`
- [ ] Migrate `src/components/room/room-card.tsx`
- [ ] Migrate `src/app/(app)/properties/[propertyId]/tenants/page.tsx`
- [ ] Migrate `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` (2 callsites)
- [ ] Migrate `src/app/(app)/properties/[propertyId]/finance/cashflow/page.tsx`
- [ ] Migrate `src/app/(app)/properties/[propertyId]/page.tsx`
- [ ] Migrate `src/app/(app)/page.tsx`
- [ ] Migrate `src/app/(app)/properties/[propertyId]/finance/expenses/page.tsx`
- [ ] Migrate `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`
- [ ] Migrate `src/components/settings/InviteSection.tsx`
- [ ] Migrate `src/components/notes/note-card.tsx` (date-fns → Intl)
- [ ] Migrate `src/components/dashboard/RecentPaymentsList.tsx`

## Layer 8: i18n
- [ ] Add `settings.timezone.*` keys to `locales/en.json`
- [ ] Add `settings.timezone.*` keys to `locales/id.json`

## Tests
- [ ] Unit/integration tests: domain schema validation, service, API routes (good/bad/edge)
- [ ] Unit tests: `useDateFormatter` hook — same UTC timestamp renders differently per TZ
- [ ] E2E: user opens Settings, changes timezone, date on another page reflects new TZ
- [ ] E2E: new session with null timezone → auto-detect fires → TZ stored

## Regression
- [ ] `npm run test:run` — 0 failures
- [ ] `npm run lint` — 0 errors
- [ ] E2E regression defers to CI on push
