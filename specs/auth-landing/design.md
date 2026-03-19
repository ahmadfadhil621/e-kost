# Design: Auth Landing (Server-Side Redirect)

## Approach

Add `src/middleware.ts` — a Next.js middleware that runs on the server edge before any page renders. It calls `auth.api.getSession` to check the session and applies redirect rules.

`ProtectedRoute` remains unchanged as a client-side safety net.

## Middleware Logic

```
Request comes in
  ├─ Path matches exclusion patterns? → pass through (Next.js handles it)
  ├─ session = auth.api.getSession(headers)
  ├─ !session && isPublic → pass through
  ├─ !session && !isPublic → redirect to /login
  ├─ session && isPublic → redirect to /
  └─ session && !isPublic → pass through
```

## Public Routes

```typescript
const PUBLIC_ROUTES = ["/login", "/register"];
const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
```

## Matcher Config

```typescript
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)"],
};
```

This excludes:
- `/api/auth/*` — Better Auth's own endpoints
- `/_next/static/*`, `/_next/image/*` — static assets
- `/favicon.ico`

## Why `auth.api.getSession` (not cookie check)

Using `auth.api.getSession` is the canonical Better Auth approach. It validates the session against the database, not just the presence of a cookie. This is more secure and consistent with how the rest of the app checks auth.

## Relationship to `ProtectedRoute`

| Layer | Role |
|-------|------|
| Middleware | Server-side, eliminates flash, primary redirect |
| `ProtectedRoute` | Client-side safety net for dynamic navigation |

Both can coexist. Middleware fires first. If middleware passes, `ProtectedRoute` is still there for any edge cases missed at the server level.

## Files

| File | Change |
|------|--------|
| `src/middleware.ts` | Create |
| `src/middleware.test.ts` | Create (Vitest unit tests) |
| `e2e/auth/session-redirect.spec.ts` | Extend (add authenticated-user redirect test) |
| `specs/auth-landing/` | This spec |
