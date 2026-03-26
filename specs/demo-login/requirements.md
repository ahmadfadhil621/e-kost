# Demo Login — Requirements

Traceability: issue #78

## Functional Requirements

### REQ 1 — Demo Login Endpoint
- **REQ 1.1** — `POST /api/auth/demo-login` must exist and be reachable without authentication
- **REQ 1.2** — The endpoint looks up the user with email `demo@ekost.app`
- **REQ 1.3** — If demo user is not found, the endpoint returns 404
- **REQ 1.4** — The endpoint deletes all demo user data in FK-safe order: payments → tenants → rooms → properties
- **REQ 1.5** — The endpoint calls `seedDemoData(demoUserId)` to insert fresh baseline data
- **REQ 1.6** — The endpoint signs in as the demo user via Better Auth and returns a response that sets the session cookie
- **REQ 1.7** — On success, the response redirects to `/`

### REQ 2 — Demo Seed Data
- **REQ 2.1** — `src/lib/demo-seed.ts` exports a `seedDemoData(ownerId: string)` function
- **REQ 2.2** — Seeds 1 property
- **REQ 2.3** — Seeds 4–6 rooms with a mix of OCCUPIED and AVAILABLE statuses
- **REQ 2.4** — Seeds 3–4 tenants assigned to occupied rooms, each with a `movedInAt` date
- **REQ 2.5** — Seeds 2–3 months of payment history for each tenant
- **REQ 2.6** — All seed data uses deterministic values (no random data) for predictable test assertions
- **REQ 2.7** — The function uses Prisma directly (no repository layer) since it is a utility, not domain logic

### REQ 3 — Demo Banner
- **REQ 3.1** — `src/components/demo-banner.tsx` exists and exports a `DemoBanner` component
- **REQ 3.2** — The banner is only visible when the current user's email is `demo@ekost.app`
- **REQ 3.3** — The banner shows a non-dismissible message (no close button)
- **REQ 3.4** — The banner text uses i18n keys
- **REQ 3.5** — The banner is always visible above main content in the app layout while the demo session is active
- **REQ 3.6** — The banner has an accessible role (`region` or `status`) with an aria-label

### REQ 4 — Login Form
- **REQ 4.1** — The existing "Demo Owner Account" and "Demo Staff Account" buttons are replaced by a single "Login with Demo" button
- **REQ 4.2** — Clicking the "Login with Demo" button calls `POST /api/auth/demo-login` and redirects to `/`
- **REQ 4.3** — While the demo login is in progress, the button is disabled with a loading state
- **REQ 4.4** — If the endpoint returns an error, the form shows a server error message

### REQ 5 — i18n
- **REQ 5.1** — `locales/en.json` must have `auth.login.demo` key
- **REQ 5.2** — `locales/id.json` must have `auth.login.demo` key (Indonesian translation)
- **REQ 5.3** — `locales/en.json` must have `demo.banner` key with the demo session message
- **REQ 5.4** — `locales/id.json` must have `demo.banner` key (Indonesian translation)

## Non-Functional Requirements

- **REQ 6.1** — No schema changes — implementation uses existing Prisma models
- **REQ 6.2** — Demo login endpoint must not require authentication (it IS the login)
- **REQ 6.3** — The demo user email is fixed: `demo@ekost.app`
- **REQ 6.4** — Wipe-then-reseed is idempotent: calling the endpoint N times always results in fresh baseline data
- **REQ 6.5** — Demo user password is stored in env var `DEMO_PASSWORD` (server-only, not exposed to client)

## Acceptance Criteria

1. Clicking "Login with Demo" from the login page results in the user being logged in as the demo account and redirected to `/`
2. Each demo login starts from a clean, predictable baseline dataset
3. A persistent demo banner is visible on all app pages while logged in as the demo user
4. All new UI strings have i18n keys in both `en.json` and `id.json`
5. All Vitest tests pass; all quality gates pass
