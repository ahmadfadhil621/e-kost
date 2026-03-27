# Implementation Tasks: Settings — Dev-only Invite Management UI

## Layer 1: Domain / Utility
- [ ] Create `src/lib/dev-emails.ts`

## Layer 2: Tests (TDD — write before implementing)
- [ ] Create `src/lib/dev-emails.test.ts`
- [ ] Create `src/app/api/invites/route.test.ts`
- [ ] Create `src/app/api/dev-status/route.test.ts`
- [ ] Update `src/components/settings/SettingsPage.test.tsx` (add dev section tests)

## Layer 3: API
- [ ] Update `src/app/api/invites/route.ts` (add DEV_EMAILS guard on owner invites)
- [ ] Create `src/app/api/dev-status/route.ts`

## Layer 4: Hook
- [ ] Create `src/hooks/use-dev-status.ts`

## Layer 5: UI
- [ ] Create `src/app/(app)/settings/invites/page.tsx` (server component, redirect guard)
- [ ] Update `src/components/settings/SettingsPage.tsx` (add dev section link)

## Layer 6: i18n
- [ ] Add `settings.developer.*` keys to `locales/en.json`
- [ ] Add `settings.developer.*` keys to `locales/id.json`

## Layer 7: Env
- [ ] Add `DEV_EMAILS` to `.env.example`
