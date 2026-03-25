# RT-3 — Edit Button Placement: Design

## Affected Files

| File | Change |
|------|--------|
| `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx` | Move Edit button inline with `h2`; remove from actions section |
| `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` | Move Edit button inline with `h2`; remove from actions section |

No domain, service, API, repository, or i18n changes required. All translation keys already exist (`room.detail.edit`, `tenant.detail.edit`).

## UI Design

### Header Row Pattern

Both detail pages will use the same inline-edit pattern:

```tsx
<div className="flex items-center justify-between gap-2">
  <h2 className="text-lg font-semibold">{t("*.detail.title")}</h2>
  {!isArchived && (
    <Button
      asChild
      size="sm"
      variant="ghost"
      className="min-h-[44px] min-w-[44px] shrink-0"
    >
      <Link href="...edit">
        <Pencil className="h-4 w-4" aria-hidden />
        {t("*.detail.edit")}
      </Link>
    </Button>
  )}
</div>
```

- `size="sm"` — visually compact (shorter height, tighter padding)
- `variant="ghost"` — low visual weight, secondary action appearance
- `min-h-[44px] min-w-[44px]` — enforces 44×44px touch target per constraint
- `shrink-0` — prevents button from collapsing on narrow viewports
- Pencil icon with `aria-hidden` — decorative, does not affect accessible name
- `t("*.detail.edit")` text keeps accessible name as "Edit" — existing E2E locators unaffected

### Room Detail: Archived State

The Edit button is already conditionally excluded when `isArchived`. This conditional is preserved in the new inline location.

### Tenant Detail: Moved-Out State

The moved-out branch renders a simplified read-only view without the actions section. No edit button is shown in that branch — this is preserved.

## Touch Target Strategy

`size="sm"` in shadcn/ui renders a button that is visually smaller (~36px height) but `min-h-[44px]` overrides the height to ensure the clickable area remains 44px. The ghost variant provides ample horizontal padding.

## Existing Test Compatibility

| Test | Locator | Impact |
|------|---------|--------|
| `room-detail.spec.ts:165` | `getByRole("link", { name: /^edit$/i })` | ✅ Accessible name "Edit" preserved |
| `room-detail.spec.ts:189` | same, `not.toBeVisible()` | ✅ Archived branch unchanged |
| `edit-tenant.spec.ts` | navigates directly via URL | ✅ Not affected |
| `edit-tenant.spec.ts:121` | `getByRole("button", { name: /edit\|assign room\|move out/i })` | ✅ Matches "Assign Room" button; Edit is already a link |
