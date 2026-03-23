# G-1 — Responsive Layout: Tasks

## Status Legend
- [ ] Pending
- [x] Done

---

## Layer 1: Specs
- [x] Create requirements.md
- [x] Create design.md
- [x] Create tasks.md

## Layer 2: Vitest Tests (written before production code)
- [x] `src/components/layout/app-header.test.tsx`
- [x] `src/components/layout/app-nav.test.tsx` (responsive tests added to existing file)

## Layer 3: E2E Tests (written before production code)
- [x] `e2e/layout/responsive-desktop.spec.ts`

## Layer 4: Test Validation (3 quality gates)
- [x] Gate 1: structural analysis
- [x] Gate 2: fault injection (8/8 faults killed)
- [x] Gate 3: review checklist

## Layer 5: Implementation
- [x] Modify `src/app/(app)/layout.tsx` — add `md:max-w-2xl lg:max-w-3xl` to `<main>`
- [x] Modify `src/components/layout/app-header.tsx` — inner constraining wrapper
- [x] Modify `src/components/layout/app-nav.tsx` — inner constraining wrapper

## Layer 6: Regression
- [x] New E2E spec passes locally (13/13)
- [x] `npm run test:run` passes (731/731)
