# Tasks — In-App Feedback Form (issue #70)

## Layer 1: Domain
- [ ] Create `src/domain/schemas/feedback.ts` with `feedbackSchema` (Zod)

## Layer 2: API
- [ ] Create `src/app/api/feedback/route.ts` (POST handler, fire-and-forget webhook)
- [ ] Add `N8N_WEBHOOK_URL` to `.env.example`

## Layer 3: UI
- [ ] Create `src/components/settings/FeedbackSection.tsx`
- [ ] Add `<FeedbackSection />` to `SettingsPage` (bottom, after StaffSection)

## Layer 4: i18n
- [ ] Add `settings.feedback.*` keys to `locales/en.json`
- [ ] Add `settings.feedback.*` keys to `locales/id.json`

## Tests
- [ ] `src/app/api/feedback/__tests__/route.test.ts` — Vitest unit tests
- [ ] `src/components/settings/__tests__/FeedbackSection.test.tsx` — Vitest component tests
- [ ] `tests/e2e/feedback-form.spec.ts` — Playwright E2E
