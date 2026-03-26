# Demo Login — Tasks

Traceability: issue #78

## Layer Breakdown

### Layer 0: Tests (TDD)
- [ ] Write Vitest tests for `POST /api/auth/demo-login` route (Good/Bad/Edge)
- [ ] Write Vitest tests for `DemoBanner` component (Good/Bad/Edge)
- [ ] Write Vitest tests for updated `LoginForm` (demo button behavior)
- [ ] Write Playwright E2E test for demo login flow
- [ ] Run all 3 quality gates (structural, fault injection, review checklist)

### Layer 1: Service Utility
- [ ] Create `src/lib/demo-seed.ts` with `seedDemoData(ownerId)` function
  - 1 property, 6 rooms (4 occupied / 2 available), 4 tenants, 3 months payments each

### Layer 2: API Route
- [ ] Create `src/app/api/auth/demo-login/route.ts`
  - Look up `demo@ekost.app` user
  - Wipe demo data in FK-safe order
  - Call `seedDemoData`
  - Sign in via `auth.api.signInEmail`
  - Return redirect with session cookies

### Layer 3: UI Components
- [ ] Create `src/components/demo-banner.tsx` — conditional banner for demo session
- [ ] Update `src/app/(app)/layout.tsx` — add `<DemoBanner />` before header
- [ ] Update `src/components/auth/login-form.tsx`:
  - Replace two demo buttons with single "Login with Demo" button
  - Wire up `handleDemoLogin` (fetch → redirect)
  - Remove env var credential reads

### Layer 4: i18n
- [ ] Add `auth.login.demo` to `locales/en.json` and `locales/id.json`
- [ ] Add `demo.banner.message` and `demo.banner.ariaLabel` to both locale files

### Layer 5: Docs & SQL
- [ ] Provide one-time setup SQL (not committed) — demo user creation in Better Auth tables

## Commit Checkpoints

1. After Layer 1 (demo-seed utility) + Layer 2 (API route) — `feat(auth): add demo-login endpoint and seed utility (issue #78)`
2. After Layer 3 (UI) + Layer 4 (i18n) — `feat(auth): add demo banner and wire up login form (issue #78)`
