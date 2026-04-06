# Property Settings — Tasks

Issue: #104

## Layer 1: Domain

- [ ] `src/domain/schemas/property.ts` — add `staffOnlyFinance: boolean` to `Property` interface; add `updatePropertySettingsSchema` and `UpdatePropertySettings` type
- [ ] `src/domain/interfaces/property-repository.ts` — extend `update()` data param to include `staffOnlyFinance?: boolean`

## Layer 2: Repository

- [ ] `src/lib/repositories/prisma/prisma-property-repository.ts` — update `toProperty()` mapper to include `staffOnlyFinance`; update `update()` to persist `staffOnlyFinance` when provided

## Layer 3: Service & Access

- [ ] `src/lib/property-service.ts` — add `getPropertyByIdUnchecked(propertyId)` and `updatePropertySettings(userId, propertyId, data)` methods
- [ ] `src/lib/property-access.ts` — add `includeProperty?: boolean` option; return `property: Property | null` in success branch

## Layer 4: API

- [ ] `src/app/api/properties/[propertyId]/route.ts` — add `staffOnlyFinance` to GET response
- [ ] `src/app/api/properties/[propertyId]/settings/route.ts` — new PATCH handler (owner-only, updates `staffOnlyFinance`)
- [ ] `src/app/api/properties/[propertyId]/payments/route.ts` — add `staffOnlyFinance` guard to POST
- [ ] `src/app/api/properties/[propertyId]/payments/[paymentId]/route.ts` — add guard to DELETE
- [ ] `src/app/api/properties/[propertyId]/expenses/route.ts` — add guard to POST
- [ ] `src/app/api/properties/[propertyId]/expenses/[expenseId]/route.ts` — add guard to PUT and DELETE

## Layer 5: UI

- [ ] `src/app/(app)/properties/[propertyId]/page.tsx` — add owner-only "Settings" nav link; remove `StaffSection`
- [ ] `src/app/(app)/properties/[propertyId]/settings/page.tsx` — new settings page (Access + Finance sections)
- [ ] Financial action buttons — grep and conditionally hide for owner when `staffOnlyFinance = true`

## Layer 6: i18n

- [ ] `locales/en.json` — add all new keys (nav.settings, settings.page.title, settings.access.title, settings.finance.*)
- [ ] `locales/id.json` — same keys in Indonesian

## Tests

- [ ] Vitest: domain schema, service methods (`updatePropertySettings`, `getPropertyByIdUnchecked`), `withPropertyAccess` extension
- [ ] Vitest: new settings PATCH route handler
- [ ] Vitest: `staffOnlyFinance` guard in all 5 financial mutation handlers
- [ ] E2E: toggle on settings page persists and reflects
- [ ] E2E: owner blocked from recording payment when mode is enabled
- [ ] E2E: staff unaffected when mode is enabled
- [ ] E2E: settings nav link visible to owner, hidden from staff
