# Demo Login — Design

Traceability: issue #78

## Architecture Overview

This feature is a cross-cutting utility. It does not add a new domain entity — it reuses existing models. The implementation lives in 4 places:

1. `src/app/api/auth/demo-login/route.ts` — server-side endpoint
2. `src/lib/demo-seed.ts` — utility function (not a service; uses Prisma directly)
3. `src/components/demo-banner.tsx` — client component
4. `src/components/auth/login-form.tsx` — update existing component

## API Design

### `POST /api/auth/demo-login`

No request body needed. No auth required.

**Flow:**
1. Look up `User` where `email = 'demo@ekost.app'` via `prisma.user.findUnique`
2. If not found → `404 { error: "Demo user not found" }`
3. Delete in FK-safe order:
   ```
   prisma.payment.deleteMany({ where: { tenant: { property: { ownerId: demoUser.id } } } })
   prisma.tenantNote.deleteMany({ where: { tenant: { property: { ownerId: demoUser.id } } } })
   prisma.tenant.deleteMany({ where: { property: { ownerId: demoUser.id } } })
   prisma.expense.deleteMany({ where: { property: { ownerId: demoUser.id } } })
   prisma.room.deleteMany({ where: { property: { ownerId: demoUser.id } } })
   prisma.property.deleteMany({ where: { ownerId: demoUser.id } })
   ```
4. Call `await seedDemoData(demoUser.id)`
5. Sign in via Better Auth:
   ```ts
   const demoPassword = process.env.DEMO_PASSWORD!;
   const signInResponse = await auth.api.signInEmail({
     body: { email: 'demo@ekost.app', password: demoPassword },
     headers: request.headers,
   });
   ```
6. Forward the `set-cookie` header from the Better Auth response
7. Return `302 redirect` to `/`

**Error responses:**
- `404` — demo user not found
- `500` — seed or sign-in failure

### Sign-in mechanics
Better Auth's `auth.api.signInEmail()` is available on the server. It returns a `Response` object whose headers contain the `set-cookie` session token. We extract those headers and include them in the redirect response.

```ts
const signInResponse = await auth.api.signInEmail({ body: { email, password }, headers: request.headers });
const redirectResponse = NextResponse.redirect(new URL("/", request.url));
const cookies = signInResponse.headers.getSetCookie();
for (const cookie of cookies) {
  redirectResponse.headers.append("set-cookie", cookie);
}
return redirectResponse;
```

## Seed Data Design (`src/lib/demo-seed.ts`)

All data is deterministic (no `Math.random()`, no dynamic dates beyond relative offsets from "now").

```
Property: "Demo Kost Merdeka" (1 property)

Rooms (6 total):
  101 — OCCUPIED  — Rp 1,200,000/mo
  102 — OCCUPIED  — Rp 1,200,000/mo
  103 — OCCUPIED  — Rp 1,500,000/mo
  104 — AVAILABLE — Rp 1,500,000/mo
  201 — OCCUPIED  — Rp 1,800,000/mo
  202 — AVAILABLE — Rp 1,800,000/mo

Tenants (4, assigned to occupied rooms):
  Budi Santoso     → room 101, moved in 6 months ago
  Siti Rahayu      → room 102, moved in 5 months ago
  Ahmad Fauzi      → room 103, moved in 8 months ago
  Dewi Lestari     → room 201, moved in 3 months ago

Payment history (per tenant, 3 months back):
  Each tenant has payments for months: -3, -2, -1 relative to today
  Amount = room's monthlyRent
  paymentDate = 5th of each month
```

**`seedDemoData` signature:**
```ts
export async function seedDemoData(ownerId: string): Promise<void>
```

## Demo Banner Design (`src/components/demo-banner.tsx`)

Client component. Uses `useAuth()` to get current user email.

```tsx
export function DemoBanner() {
  const { user } = useAuth();
  if (user?.email !== "demo@ekost.app") return null;

  return (
    <div role="status" aria-label={t("demo.banner.ariaLabel")}
         className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 text-center text-sm py-2 px-4">
      {t("demo.banner.message")}
    </div>
  );
}
```

Placement: inside `AppLayoutContent` in `src/app/(app)/layout.tsx`, before `<AppHeader />`.

## Login Form Changes

Replace `handleDemoOwner` / `handleDemoStaff` with a single `handleDemoLogin`:

```ts
const [isDemoLoading, setIsDemoLoading] = useState(false);

const handleDemoLogin = async () => {
  setIsDemoLoading(true);
  setServerError(null);
  try {
    const res = await fetch("/api/auth/demo-login", { method: "POST" });
    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error ?? t("auth.error.generic"));
    } else {
      window.location.href = "/";
    }
  } catch {
    setServerError(t("auth.error.generic"));
  } finally {
    setIsDemoLoading(false);
  }
};
```

Remove `demoOwnerEmail`, `demoOwnerPassword`, `demoStaffEmail`, `demoStaffPassword` env var reads.

## i18n Keys

### `locales/en.json`

```json
"auth": {
  "login": {
    "demo": "Login with Demo"
  }
}

"demo": {
  "banner": {
    "message": "You're in a demo account — all data resets on next login",
    "ariaLabel": "Demo session indicator"
  }
}
```

### `locales/id.json`

```json
"auth": {
  "login": {
    "demo": "Masuk dengan Demo"
  }
}

"demo": {
  "banner": {
    "message": "Anda sedang di akun demo — semua data direset saat login berikutnya",
    "ariaLabel": "Indikator sesi demo"
  }
}
```

## Correctness Properties

- **PROP 1** — Calling `POST /api/auth/demo-login` N times always produces the same baseline dataset (idempotent by wipe-then-seed)
- **PROP 2** — After a demo login, no data from a prior session persists (full wipe before seed)
- **PROP 3** — The demo banner renders if and only if the current user's email is `demo@ekost.app`
- **PROP 4** — If `DEMO_PASSWORD` is missing, the endpoint fails with 500 before touching any data

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `DEMO_PASSWORD` | Server-only | Password for `demo@ekost.app` Better Auth account |

This variable must be set in `.env.local` (development) and in Vercel/CI environment variables (production/staging).
