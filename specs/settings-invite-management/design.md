# Design: Settings — Dev-only Invite Management UI

## Architecture

### New utility: `src/lib/dev-emails.ts`
```ts
export function getDevEmails(): string[]
export function isDevEmail(email: string): boolean
```
Reads `process.env.DEV_EMAILS` (comma-separated). Returns `true` for all emails when env var is absent.

### New API route: `GET /api/dev-status`
- Requires session (401 if missing)
- Returns `{ data: { isDev: boolean } }`
- Uses `isDevEmail(session.user.email)`

### Updated API route: `POST /api/invites`
- After auth check, before creating invite: if `data.role === "owner"` and `!isDevEmail(session.user.email)`, return 403 with `{ error: "Only dev accounts can create owner invites" }`

### New hook: `src/hooks/use-dev-status.ts`
```ts
export function useDevStatus(): { isDev: boolean; isLoading: boolean }
```
Calls `GET /api/dev-status` via TanStack Query.

### New page: `src/app/(app)/settings/invites/page.tsx`
- Server component (async, no "use client")
- Uses `getSession()` + `isDevEmail()` for server-side guard
- Redirects to `/settings` if not dev
- Renders `<InvitesPageClient />` with `InviteSection` (passing `userRole="owner"`)

### Updated component: `src/components/settings/SettingsPage.tsx`
- Uses `useDevStatus()` hook
- When `isDev === true`, renders a "Developer" section with a link to `/settings/invites`

## i18n Keys

### New keys in `locales/en.json`
```json
{
  "settings": {
    "developer": {
      "title": "Developer",
      "inviteManagement": "Invite Management",
      "inviteManagementDesc": "Create and manage owner registration links"
    }
  }
}
```

### Indonesian translation in `locales/id.json`
```json
{
  "settings": {
    "developer": {
      "title": "Developer",
      "inviteManagement": "Manajemen Undangan",
      "inviteManagementDesc": "Buat dan kelola tautan registrasi pemilik"
    }
  }
}
```

## Correctness Properties
- When DEV_EMAILS is not set, all users are treated as devs (backward compatible)
- The server-side redirect on `/settings/invites` is the security gate — client-side hiding is UX only
- The API 403 guard on POST /api/invites prevents non-devs from creating owner invites via direct API calls
