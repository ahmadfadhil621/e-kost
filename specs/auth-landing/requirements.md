# Requirements: Auth Landing (Server-Side Redirect)

## Context & Problem

When an unauthenticated user visits any protected route (e.g. `/`), they currently see a brief flash of the app shell before being redirected to `/login`. This happens because auth protection is entirely client-side: `ProtectedRoute` renders children while the session check is in-flight to avoid a blank screen. The fix is server-side middleware that redirects before React ever renders.

## Goals

- Redirect unauthenticated users to `/login` at the server level (no client-side flash)
- Redirect authenticated users away from `/login` and `/register` to `/`
- Pass through all other requests without interference

## Non-Goals

- Replacing `ProtectedRoute` (it stays as a client-side safety net)
- Changing the login or register UI
- Modifying session duration or cookie behavior
- Any access control beyond authenticated vs. unauthenticated

## Glossary

- **Protected route**: Any URL that requires authentication (everything except `/login`, `/register`, and system paths)
- **Public route**: `/login` and `/register`
- **Middleware**: Next.js `src/middleware.ts` — runs on the server before any page renders

## Functional Requirements

### Requirement 1: Unauthenticated Redirect

**User Story:** As an unauthenticated user, when I visit any protected route, I am immediately redirected to `/login` without seeing any app content.

#### Acceptance Criteria

1. WHEN an unauthenticated user requests `/`, THE Middleware SHALL redirect to `/login`
2. WHEN an unauthenticated user requests any protected path (e.g. `/settings`, `/rooms`), THE Middleware SHALL redirect to `/login`
3. WHEN an unauthenticated user requests `/login`, THE Middleware SHALL pass through (no redirect loop)
4. WHEN an unauthenticated user requests `/register`, THE Middleware SHALL pass through (no redirect loop)

### Requirement 2: Authenticated Redirect

**User Story:** As an authenticated user, when I visit `/login` or `/register`, I am redirected to `/` so I don't see the auth screens again.

#### Acceptance Criteria

1. WHEN an authenticated user requests `/login`, THE Middleware SHALL redirect to `/`
2. WHEN an authenticated user requests `/register`, THE Middleware SHALL redirect to `/`
3. WHEN an authenticated user requests any other route, THE Middleware SHALL pass through

### Requirement 3: System Path Exclusion

**User Story:** As a developer/framework, API and static asset paths must not be intercepted by auth middleware.

#### Acceptance Criteria

1. THE Middleware matcher SHALL exclude `/api/auth/*` paths
2. THE Middleware matcher SHALL exclude `/_next/static/*` and `/_next/image/*` paths
3. THE Middleware matcher SHALL exclude `/favicon.ico`

## Constraints

- Must use `auth.api.getSession` from `@/lib/auth` for session evaluation
- Must not modify `ProtectedRoute` behavior or its tests
- Session check must be server-side (not client-side)

## Success Criteria

- Visiting `http://localhost:3000/` without auth cookie immediately lands on `/login` (no observable flash)
- All existing E2E auth tests continue to pass
- All Vitest unit tests pass
