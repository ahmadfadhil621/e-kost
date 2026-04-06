# Property Settings — Design

Issue: #104

---

## Domain Layer

### `src/domain/schemas/property.ts`

Add `staffOnlyFinance: boolean` to the `Property` interface.

Add a new Zod schema for the settings update:

```typescript
export const updatePropertySettingsSchema = z.object({
  staffOnlyFinance: z.boolean(),
});
export type UpdatePropertySettings = z.infer<typeof updatePropertySettingsSchema>;
```

### `src/domain/interfaces/property-repository.ts`

Extend `update()` to accept `staffOnlyFinance`:

```typescript
update(
  id: string,
  data: Partial<{ name: string; address: string; staffOnlyFinance: boolean }>
): Promise<Property>;
```

---

## Repository Layer

### `src/lib/repositories/prisma/prisma-property-repository.ts`

- `toProperty()` mapper: add `staffOnlyFinance: p.staffOnlyFinance` field
- `update()`: include `staffOnlyFinance` in the Prisma update data when provided

---

## Service Layer

### `src/lib/property-service.ts`

Add two methods:

**`getPropertyByIdUnchecked(propertyId: string): Promise<Property | null>`**
- Calls `this.repository.findById(propertyId)` directly — no access check.
- Only for use by callers that have already validated access (e.g. `withPropertyAccess`).

**`updatePropertySettings(userId: string, propertyId: string, data: UpdatePropertySettings): Promise<Property>`**
- Validates owner role via `this.validateAccess`.
- Calls `this.repository.update(propertyId, data)`.
- Returns updated property.

### `src/lib/property-access.ts`

Extend `withPropertyAccess` options with `includeProperty?: boolean`.

When `includeProperty: true`, after successful access validation, also call
`propertyService.getPropertyByIdUnchecked(propertyId)` and include it in the
success return value.

```typescript
// Updated return (success branch):
{ userId: string; role: PropertyRole; property: Property | null; errorResponse: null }
```

`property` is `null` when `includeProperty` is not set or when the fetch fails.

---

## API Layer

### `GET /api/properties/[propertyId]` (existing)

Add `staffOnlyFinance` to the JSON response shape.

### `PATCH /api/properties/[propertyId]/settings` (new)

**File:** `src/app/api/properties/[propertyId]/settings/route.ts`

- `requireOwner: true`
- Body schema: `updatePropertySettingsSchema`
- Calls `propertyService.updatePropertySettings(userId, propertyId, data)`
- Response: `{ staffOnlyFinance: boolean }` — 200

### Financial mutation handlers (5 existing routes)

After `withPropertyAccess({ request, includeProperty: true })`:

```
if (access.role === "owner" && access.property?.staffOnlyFinance) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

Affected:
- `POST /api/properties/[propertyId]/payments` (route.ts)
- `DELETE /api/properties/[propertyId]/payments/[paymentId]` (route.ts)
- `POST /api/properties/[propertyId]/expenses` (route.ts)
- `PUT /api/properties/[propertyId]/expenses/[expenseId]` (route.ts)
- `DELETE /api/properties/[propertyId]/expenses/[expenseId]` (route.ts)

---

## UI Layer

### `src/app/(app)/properties/[propertyId]/page.tsx`

- Add `"Settings"` entry to the quick-nav grid — conditionally rendered when `property.role === "owner"`.
- Remove `<StaffSection>` import and usage.

### `src/app/(app)/properties/[propertyId]/settings/page.tsx` (new)

- Fetches property from `GET /api/properties/[propertyId]`.
- If `property.role !== "owner"`, renders a forbidden state (not a redirect — avoids flash).
- Two sections:
  - **Access** → `<StaffSection propertyId={...} propertyName={...} userRole="owner" />`
  - **Finance** → toggle switch bound to `staffOnlyFinance`
- Toggle sends `PATCH /api/properties/[propertyId]/settings` via TanStack Query mutation.
- On success: invalidate `['property', propertyId]` query; show toast.

### Financial action buttons (UI hiding)

Components rendering payment/expense mutation buttons need to check
`staffOnlyFinance` and `role` from the property query. Hide buttons when
`role === "owner" && staffOnlyFinance === true`.

Files to update (to be confirmed by grep during implementation):
- Payment pages / components
- Expense pages / components

---

## i18n Keys

### `locales/en.json`

```json
"property": {
  "detail": {
    "nav": {
      "settings": "Settings"
    }
  }
},
"settings": {
  "page": {
    "title": "Property Settings"
  },
  "access": {
    "title": "Access"
  },
  "finance": {
    "title": "Finance",
    "staffOnlyMode": {
      "label": "Staff-only finance mode",
      "description": "When enabled, only staff can record, edit, or delete payments and expenses. You can still view all finance data.",
      "enabled": "Staff-only finance mode enabled",
      "disabled": "Staff-only finance mode disabled"
    }
  }
}
```

---

## Correctness Properties (for property-based tests)

### Property 1: Finance mutations unrestricted when flag is off
`staffOnlyFinance = false` → mutation endpoints accept both owner and staff requests (behavior unchanged)

### Property 2: Staff unaffected by flag
`staffOnlyFinance = true` → staff mutation requests always succeed (role unaffected by flag)

### Property 3: Owner blocked when flag is on
`staffOnlyFinance = true` → owner mutation requests return 403 on all 5 endpoints

### Property 4: Owner never locked out of toggle
The settings PATCH endpoint always succeeds for owner regardless of current `staffOnlyFinance` value (owner never locked out)

### Property 5: Read endpoints never restricted
GET (read) endpoints for payments and expenses are never restricted by `staffOnlyFinance`

### Property 6: Default is false
Newly created properties have `staffOnlyFinance = false` by default
