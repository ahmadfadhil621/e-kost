# Property Archive & Delete — Tasks
<!-- Traceability: issue #27 -->

## Pre-Implementation: Schema Change
- [ ] User applies `archivedAt DateTime?` to `Property` model in Supabase
- [ ] Run `npx prisma db pull && npx prisma generate` to sync client

## Layer 0: Tests (TDD)
- [ ] Write Vitest tests for `PropertyService.archiveProperty` (Good/Bad/Edge)
- [ ] Write Vitest tests for `PropertyService.unarchiveProperty` (Good/Bad/Edge)
- [ ] Write Vitest tests for `PropertyService.deleteProperty` (hard delete) (Good/Bad/Edge)
- [ ] Write Vitest API route tests for `POST /archive`, `POST /unarchive`, `DELETE` (hard)
- [ ] Write Playwright E2E spec: `e2e/property-archive-delete/archive-property.spec.ts`
- [ ] Write Playwright E2E spec: `e2e/property-archive-delete/delete-property.spec.ts`
- [ ] Run E2E specs locally (expect fail — implementation not yet written)
- [ ] Validate all tests through 3 quality gates

## Layer 1: Domain
- [ ] Add `archivedAt: Date | null` to `Property` interface in `src/domain/schemas/property.ts`
- [ ] Add `archive`, `unarchive`, `hardDelete` to `IPropertyRepository`

## Layer 2: Repository
- [ ] Implement `archive`, `unarchive`, `hardDelete` in `PrismaPropertyRepository`
- [ ] Update `findByUser` to filter `archivedAt: null` by default
- [ ] Update `toProperty` mapper to include `archivedAt`

## Layer 3: Service
- [ ] Inject `ITenantRepository` into `PropertyService` constructor
- [ ] Implement `archiveProperty(userId, propertyId)`
- [ ] Implement `unarchiveProperty(userId, propertyId)`
- [ ] Modify `deleteProperty` to call `repo.hardDelete` (hard delete, with active tenant guard)
- [ ] Update `property-service-instance.ts` to pass tenant repo

## Layer 4: API
- [ ] Create `src/app/api/properties/[propertyId]/archive/route.ts`
- [ ] Create `src/app/api/properties/[propertyId]/unarchive/route.ts`
- [ ] Update `DELETE` handler in `src/app/api/properties/[propertyId]/route.ts` (409 for active tenants)

## Layer 5: UI
- [ ] Add danger zone section to `src/app/(app)/properties/[propertyId]/page.tsx`
  - Active tenant guard (disable + warning from `stats.occupancy.occupied > 0`)
  - Archive button + confirm dialog
  - Delete button + GitHub-style name confirmation dialog
  - Success: redirect to `/properties` + toast
  - Error: toast with error message

## Layer 6: i18n
- [ ] Add `property.archive.*`, `property.unarchive.*`, `property.delete.*` (extended), `property.dangerZone`, `property.occupiedWarning` to `locales/en.json`
- [ ] Same keys to `locales/id.json`

## Layer 7: Regression
- [ ] `npm run test:run` passes
- [ ] `npm run lint` passes
