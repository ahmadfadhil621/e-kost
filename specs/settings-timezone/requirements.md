# Requirements — Per-User Timezone Setting (issue #120)

## Acceptance Criteria

### Storage
- `User.timezone` is a nullable IANA string (`String?`, no DB default)
- null means "never set" — treated as not-yet-detected
- Persisted timestamps remain UTC; timezone affects display/calculation boundaries only

### Session Exposure
- `user.timezone` is included in the better-auth session payload via `additionalFields` (same pattern as `language`)
- Accessible via `useAuth().user.timezone` on the client

### Auto-detect on First Mount
- On authenticated mount, if `user.timezone === null`, the client detects `Intl.DateTimeFormat().resolvedOptions().timeZone` and PATCHes silently
- Once written (non-null), auto-detect is skipped on subsequent mounts
- Rendering fallback chain: `user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Jakarta"`

### Settings UI
- TZ selector appears in the existing Settings page (same page as language, currency)
- Component: shadcn Combobox (Command) — type-to-filter from curated list; any valid IANA string accepted
- Curated list (~15 entries): Asia/Jakarta, Asia/Singapore, Asia/Tokyo, Asia/Kolkata, Asia/Dubai, UTC, Europe/London, Europe/Berlin, Europe/Paris, America/New_York, America/Chicago, America/Los_Angeles, America/Sao_Paulo, Australia/Sydney, Pacific/Auckland
- On save: PATCH `/api/user/timezone` → updates session → UI re-renders with new TZ
- Unsaved changes show a Save button (same pattern as language selector)

### Cross-cutting Date Rendering
- All date display callsites in the app use the user's resolved timezone
- Affected files (identified): room-card.tsx, tenants/page.tsx, tenants/[tenantId]/page.tsx, finance/cashflow/page.tsx, properties/[propertyId]/page.tsx, app/(app)/page.tsx, finance/expenses/page.tsx, rooms/[roomId]/page.tsx, InviteSection.tsx, month-selector.tsx, note-card.tsx, RecentPaymentsList.tsx
- A shared `useDateFormatter()` hook provides a `formatDate(date, options?)` function bound to the user's TZ — all callsites migrate to use it

### i18n
- New translation keys for TZ selector label and description in `locales/en.json` and `locales/id.json`

## Out of Scope
- Export date filtering (deferred to #28)
- `timezoneSetManually` flag — null is the canonical signal for "never set"
- Server-side date rendering — display is always client-side
