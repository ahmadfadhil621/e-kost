# Design — Per-User Timezone Setting (issue #120)

## Schema Change

```prisma
model User {
  // ... existing fields
  timezone  String?   // IANA string, null = never set; nullable intentionally (no DB default)
}
```

**Requires explicit user approval before editing `prisma/schema.prisma`.**
After Supabase apply: `npx prisma db pull` → `npx prisma generate` → restart dev server.

## Domain

### `src/domain/schemas/user.ts` (update existing)
```ts
export const CURATED_TIMEZONES = [
  "Asia/Jakarta", "Asia/Singapore", "Asia/Tokyo", "Asia/Kolkata", "Asia/Dubai",
  "UTC",
  "Europe/London", "Europe/Berlin", "Europe/Paris",
  "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Sao_Paulo",
  "Australia/Sydney", "Pacific/Auckland",
] as const;

export const updateTimezoneSchema = z.object({
  timezone: z.string().min(1).refine(tz => {
    try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; }
    catch { return false; }
  }, { message: "Invalid IANA timezone" }),
});
export type UpdateTimezoneInput = z.infer<typeof updateTimezoneSchema>;
```

## API Routes

### PATCH /api/user/timezone
- Auth: `getSession(request)` — 401 if unauthenticated
- Input: `{ timezone: string }` validated via `updateTimezoneSchema`
- Calls `userService.updateTimezone(userId, timezone)`
- Returns `{ data: { timezone: string } }` (200) or `{ error }` (400/401/500)

### GET /api/user/timezone
- Auth: `getSession(request)` — 401 if unauthenticated
- Returns `{ data: { timezone: string | null } }` (200) or `{ error }` (401/500)

## Service Layer

### `src/lib/user-service.ts` (update existing)
```ts
getTimezone(userId: string): Promise<string | null>
updateTimezone(userId: string, timezone: string): Promise<string>
```

## Better-Auth Session

### `src/lib/auth.ts` (update additionalFields)
```ts
user: {
  additionalFields: {
    language: { ... }, // existing
    timezone: {
      type: "string",
      required: false,
      defaultValue: null,
      input: false,
    },
  },
}
```

### `src/lib/auth-client.ts` (update inferAdditionalFields)
Add `timezone: string | null` to the inferred fields.

## Hook — Auto-detect

### `src/hooks/use-timezone-sync.ts` (new)
- `useAuth()` to get current user
- If `user` is non-null and `user.timezone === null`:
  - Detect `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - PATCH `/api/user/timezone` (fire-and-forget, no loading state)
  - On success: `authClient.useSession()` re-fetches automatically (or trigger manual refetch)
- Mount this hook in the root layout or `SettingsPage` — must run on every authenticated page load

## Hook — Date Formatter

### `src/hooks/use-date-formatter.ts` (new)
```ts
export function useDateFormatter() {
  const { user } = useAuth();
  const tz = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Jakarta";

  return {
    format(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
      const d = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat(undefined, { timeZone: tz, ...options }).format(d);
    },
    timezone: tz,
  };
}
```

## UI Changes

### `src/components/settings/TimezoneSelector.tsx` (new)
- shadcn Combobox (Command + Popover) with curated list + free-text IANA input
- Calls `PATCH /api/user/timezone` on save
- Shows current value from `useAuth().user.timezone` (fallback to detected TZ if null)
- Save button appears when value differs from stored

### `src/components/settings/SettingsPage.tsx` (update)
- Add `<TimezoneSection>` / `<TimezoneSelector>` alongside language and currency sections

### Cross-cutting Migration
All callsites listed in requirements.md migrate from direct `Intl.DateTimeFormat` / `toLocaleDateString` calls to `useDateFormatter().format(date, options)`.

Exception: `note-card.tsx` uses `date-fns format()` — migrate to `Intl.DateTimeFormat` via the hook (drop the date-fns dep for this callsite).

## i18n Keys

```json
// locales/en.json
"settings.timezone.label": "Timezone",
"settings.timezone.description": "Dates across the app will display in this timezone.",
"settings.timezone.placeholder": "Search timezone…",
"settings.timezone.save": "Save",
"settings.timezone.saved": "Timezone saved"

// locales/id.json
"settings.timezone.label": "Zona Waktu",
"settings.timezone.description": "Tanggal di seluruh aplikasi akan ditampilkan dalam zona waktu ini.",
"settings.timezone.placeholder": "Cari zona waktu…",
"settings.timezone.save": "Simpan",
"settings.timezone.saved": "Zona waktu disimpan"
```

## Correctness Properties (for property-based tests)
- Any valid IANA string accepted by `Intl.DateTimeFormat` constructor passes validation
- Invalid strings (e.g. `"Foo/Bar"`, empty string) are rejected with 400
- `formatDate` output for the same UTC timestamp differs correctly across timezones
- Auto-detect fires exactly once per null-timezone session (idempotent after write)
