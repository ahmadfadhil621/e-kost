# Tasks: Room Detail Navigation

## Task 1: Write Vitest Tests
- [ ] Extend `route.test.ts` — test GET returns tenantId/tenantName for occupied rooms
- [ ] New `room-card.test.tsx` — test all card statuses navigate to room detail

## Task 2: Implement i18n Keys
- [ ] Add `room.detail.currentTenant` to `locales/en.json`
- [ ] Add `room.detail.currentTenant` to `locales/id.json`

## Task 3: Implement API Enrichment
- [ ] Import `tenantService` in `rooms/[roomId]/route.ts`
- [ ] Enrich GET response with tenantId/tenantName for occupied rooms

## Task 4: Fix Room Card Navigation
- [ ] Remove `tenantHref` prop from `RoomCardProps`
- [ ] Remove `tenantHref` usage from rooms list page

## Task 5: Add Tenant Name to Room Detail Page
- [ ] Extend `RoomDetail` type with optional tenantId/tenantName
- [ ] Add "Current Tenant" section with link to tenant detail

## Task 6: Regression
- [ ] `npm run test:run` passes
