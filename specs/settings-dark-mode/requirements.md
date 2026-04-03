# Requirements — Dark Mode Toggle (Issue #67)

## Acceptance Criteria

### AC-1: ThemeProvider Integration
- `next-themes` package installed
- Root `layout.tsx` wraps `<body>` content with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
- `suppressHydrationWarning` is already present on `<html>` — no FOUC

### AC-2: Appearance Section in Settings
- A new "Appearance" section appears in the Settings page above the Language section
- Section contains a 3-option theme selector: Light / Dark / System
- The currently active theme is visually indicated
- Each option button meets the 44×44px touch target minimum

### AC-3: Theme Persistence
- User's preference persists across page reloads via `next-themes` localStorage default
- System option follows OS preference in real-time

### AC-4: i18n
- Keys added to `locales/en.json` and `locales/id.json` under `settings.appearance`
- Toggle label and all three options are translated

### AC-5: Accessibility
- Toggle region has `aria-label` or `aria-labelledby`
- Active option is indicated with `aria-pressed` or equivalent
- Sun/moon/system icon with accessible text

## Definition of Done
- Vitest tests (Good/Bad/Edge) written and passing
- Playwright E2E test written
- All 3 quality gates pass
- `npm run test:run` passes with 0 failures
- `npm run lint` passes with 0 errors
- i18n keys in both `locales/en.json` and `locales/id.json`
- No existing tests weakened
