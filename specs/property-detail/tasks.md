# Property Detail — Tasks
<!-- Traceability: issue #24 -->

## Layer 1: Tests
- [ ] Write Vitest unit test for `PropertyDetailPage` component (render, loading, error, stats display)
- [ ] Write Playwright E2E spec: `e2e/property-detail/view-property-detail.spec.ts`
- [ ] Validate tests through 3 quality gates

## Layer 2: UI — Property Detail Page
- [ ] Create `src/app/(app)/properties/[propertyId]/page.tsx`
  - Property header (name, address, role badge, createdAt)
  - Stats row (totalRooms, tenants, outstandingCount)
  - Quick nav links (Rooms, Tenants, Payments, Finance)
  - Map placeholder card
  - Staff placeholder card

## Layer 3: UI — Entry Points
- [ ] Wire up "View details" link on each card in `/properties/page.tsx`
- [ ] Add "Property info →" link in `/src/app/(app)/page.tsx` dashboard header

## Layer 4: i18n
- [ ] Add `property.detail.*` keys to `locales/en.json`
- [ ] Add `property.detail.*` keys to `locales/id.json`

## Layer 5: Regression
- [ ] `npm run test:run` passes
- [ ] `npm run lint` passes
- [ ] New E2E spec passes locally
