# RT-8 — Filter and Search: Tasks

## Status Legend
- [ ] Pending
- [x] Done

---

## Layer 1: Specs
- [x] Create requirements.md
- [x] Create design.md
- [x] Create tasks.md

## Layer 2: Vitest Tests (written before production code)
- [ ] `src/hooks/use-debounce.test.ts`
- [ ] `src/components/common/search-input.test.tsx`
- [ ] `src/components/tenant/tenant-filter-bar.test.tsx`
- [ ] `src/app/(app)/properties/[propertyId]/tenants/page.test.tsx`
- [ ] `src/app/(app)/properties/[propertyId]/rooms/page.test.tsx`

## Layer 3: E2E Tests (written before production code)
- [ ] `e2e/tenants/tenant-list-search-filter.spec.ts`
- [ ] `e2e/rooms/room-list-search.spec.ts`

## Layer 4: Test Validation (3 quality gates)
- [ ] Gate 1: structural analysis
- [ ] Gate 2: fault injection
- [ ] Gate 3: review checklist

## Layer 5: Implementation
- [ ] `src/hooks/use-debounce.ts`
- [ ] `src/components/common/search-input.tsx`
- [ ] `src/components/tenant/tenant-filter-bar.tsx`
- [ ] Modify `src/app/(app)/properties/[propertyId]/tenants/page.tsx`
- [ ] Modify `src/app/(app)/properties/[propertyId]/rooms/page.tsx`
- [ ] Add i18n keys to `locales/en.json`
- [ ] Add i18n keys to `locales/id.json`

## Layer 6: Regression
- [ ] New E2E specs pass locally
- [ ] `npm run test:run` passes
