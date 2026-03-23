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
- [x] `src/hooks/use-debounce.test.ts`
- [x] `src/components/common/search-input.test.tsx`
- [x] `src/components/tenant/tenant-filter-bar.test.tsx`
- [x] `src/app/(app)/properties/[propertyId]/tenants/page.test.tsx`
- [x] `src/app/(app)/properties/[propertyId]/rooms/page.test.tsx`

## Layer 3: E2E Tests (written before production code)
- [x] `e2e/tenants/tenant-list-search-filter.spec.ts`
- [x] `e2e/rooms/room-list-search.spec.ts`

## Layer 4: Test Validation (3 quality gates)
- [x] Gate 1: structural analysis
- [x] Gate 2: fault injection
- [x] Gate 3: review checklist

## Layer 5: Implementation
- [x] `src/hooks/use-debounce.ts`
- [x] `src/components/common/search-input.tsx`
- [x] `src/components/tenant/tenant-filter-bar.tsx`
- [x] Modify `src/app/(app)/properties/[propertyId]/tenants/page.tsx`
- [x] Modify `src/app/(app)/properties/[propertyId]/rooms/page.tsx`
- [x] Add i18n keys to `locales/en.json`
- [x] Add i18n keys to `locales/id.json`

## Layer 6: Regression
- [x] New E2E specs pass locally
- [x] `npm run test:run` passes
