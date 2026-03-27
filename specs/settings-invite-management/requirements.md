# Requirements: Settings — Dev-only Invite Management UI

Traceability: settings-invite-management (Issue #84)

## Functional Requirements

### REQ 1: DEV_EMAILS utility
- REQ 1.1: `isDevEmail(email)` returns `true` when `DEV_EMAILS` env var is not set (backward compat)
- REQ 1.2: `isDevEmail(email)` returns `true` when the email appears in `DEV_EMAILS` (comma-separated)
- REQ 1.3: `isDevEmail(email)` returns `false` when `DEV_EMAILS` is set and email is NOT in the list
- REQ 1.4: Email matching is case-insensitive
- REQ 1.5: Whitespace around emails in `DEV_EMAILS` is trimmed

### REQ 2: API guard on POST /api/invites
- REQ 2.1: Requests creating `role: "owner"` invites are rejected with 403 when the caller's email is NOT in `DEV_EMAILS`
- REQ 2.2: Requests creating `role: "owner"` invites are accepted when `DEV_EMAILS` is not set
- REQ 2.3: Requests creating `role: "staff"` invites are always accepted (no DEV_EMAILS check)
- REQ 2.4: Returns 201 for allowed invite creation

### REQ 3: GET /api/dev-status endpoint
- REQ 3.1: Returns `{ data: { isDev: true } }` when session user email is in `DEV_EMAILS`
- REQ 3.2: Returns `{ data: { isDev: false } }` when session user email is NOT in `DEV_EMAILS`
- REQ 3.3: Returns `{ data: { isDev: true } }` when `DEV_EMAILS` is not set
- REQ 3.4: Returns 401 when not authenticated

### REQ 4: /settings/invites page
- REQ 4.1: Server-side redirect to `/settings` when user's email is NOT in `DEV_EMAILS`
- REQ 4.2: Server-side redirect to `/settings` when user is not authenticated
- REQ 4.3: Renders invite management UI for dev users
- REQ 4.4: Shows all invites (pending and used)

### REQ 5: Settings page dev section
- REQ 5.1: Dev-only "Invite Management" link/section is visible when user is a dev
- REQ 5.2: Dev-only section is invisible to non-dev users
- REQ 5.3: Link navigates to `/settings/invites`

## Non-functional Requirements
- NFR 1: `DEV_EMAILS` defaults to "no restriction" when not set (backward-compatible)
- NFR 2: Mobile-first, touch targets ≥ 44px
- NFR 3: i18n keys for en + id
- NFR 4: No schema changes needed
