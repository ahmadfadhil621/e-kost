# Tasks — Persist Language Preference at Account Level

## Layer 0: Schema (requires user approval)
- [ ] 0.1 Request user to add `language String @default("en")` to `User` model in Supabase
- [ ] 0.2 After user confirms: `npx prisma db pull` then `npx prisma generate`

## Layer 1: Domain
- [ ] 1.1 Create `src/domain/schemas/user.ts` with `updateLanguageSchema` (validates language in AVAILABLE_LOCALES)

## Layer 2: Service
- [ ] 2.1 Create `src/lib/user-service.ts` with `getLanguage(userId)` and `updateLanguage(userId, language)` methods using Prisma directly

## Layer 3: API
- [ ] 3.1 Create `src/app/api/user/language/route.ts` with GET and PATCH handlers
  - GET: auth check → `userService.getLanguage` → `{ data: { language } }`
  - PATCH: auth check → Zod validate → `userService.updateLanguage` → `{ data: { language } }`

## Layer 4: UI
- [ ] 4.1 Create `src/hooks/use-language-sync.ts` — fetches GET /api/user/language when authenticated, calls `i18n.changeLanguage()`
- [ ] 4.2 Update `src/app/(app)/layout.tsx` — call `useLanguageSync()` in `AppLayoutContent`
- [ ] 4.3 Update `src/components/settings/LanguageSelector.tsx` — fire PATCH /api/user/language after localStorage write (when authenticated)

## Tests
- [ ] T1 Vitest: `src/lib/user-service.test.ts` (Good/Bad/Edge for getLanguage + updateLanguage)
- [ ] T2 Vitest: `src/app/api/user/language/route.test.ts` (GET + PATCH, auth, validation)
- [ ] T3 Vitest: `src/hooks/use-language-sync.test.ts` (syncs on auth, no-op unauthenticated, error-tolerant)
- [ ] T4 Vitest: update `LanguageSelector.test.tsx` (calls PATCH when authenticated, not when unauthenticated)
- [ ] T5 E2E: `tests/e2e/settings-language-persistence.spec.ts` — select language, re-login, verify language persisted
