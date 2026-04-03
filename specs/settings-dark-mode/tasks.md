# Tasks — Dark Mode Toggle (Issue #67)

## Layer 1: Package Install
- [ ] `npm install next-themes`

## Layer 2: Root Layout
- [ ] Update `src/app/layout.tsx` — wrap body content with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>`

## Layer 3: UI Component
- [ ] Create `src/components/settings/AppearanceSection.tsx`
  - 3-button group: Light / Dark / System
  - Uses `useTheme()` hook
  - `aria-pressed` on active button
  - Min 44×44px touch targets
  - Sun / Moon / Monitor icons from lucide-react

## Layer 4: Settings Integration
- [ ] Update `src/components/settings/SettingsPage.tsx`
  - Import and render `<AppearanceSection />` at top of sections

## Layer 5: i18n
- [ ] Add `settings.appearance.*` keys to `locales/en.json`
- [ ] Add `settings.appearance.*` keys to `locales/id.json`

## Layer 6: Tests
- [ ] Write `src/components/settings/AppearanceSection.test.tsx`
- [ ] Update `src/components/settings/SettingsPage.test.tsx` to include Appearance section
- [ ] Write E2E test `e2e/settings-dark-mode.spec.ts`
