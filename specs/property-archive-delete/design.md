# Property Archive & Delete — Design
<!-- Traceability: issue #27 -->

## Schema Changes

Add to `prisma/schema.prisma` → `Property` model:
```prisma
archivedAt DateTime?
```

> User must apply this in Supabase, then run `npx prisma db pull && npx prisma generate`.

## Domain Layer

### `src/domain/schemas/property.ts`
- Add `archivedAt: Date | null` to the `Property` interface.

### `src/domain/interfaces/property-repository.ts`
Add three methods:
```ts
archive(id: string): Promise<Property>;
unarchive(id: string): Promise<Property>;
hardDelete(id: string): Promise<void>;
```

## Service Layer (`src/lib/property-service.ts`)

### `archiveProperty(userId, propertyId)`
1. `validateAccess` → must be `owner`.
2. `findById` — 404 if not found.
3. Check `archivedAt` — 409 if already archived.
4. Check active tenants via `tenantRepo.findByProperty` — 409 if any `movedOutAt === null`.
5. Call `repo.archive(propertyId)`.

### `unarchiveProperty(userId, propertyId)`
1. `validateAccess` → must be `owner`.
2. `findById` — 404 if not found.
3. Check `archivedAt` — 409 if not archived.
4. Call `repo.unarchive(propertyId)`.

### `deleteProperty(userId, propertyId)` (modified)
Change from soft-delete to hard-delete:
1. `validateAccess` → must be `owner`.
2. `findById` — 404 if not found.
3. Check active tenants — 409 if any `movedOutAt === null`.
4. Call `repo.hardDelete(propertyId)` (cascade handled by Prisma/DB).

> Note: The service needs access to the tenant repository. Inject `ITenantRepository` alongside the property repo.

## Repository Layer (`src/lib/repositories/prisma/prisma-property-repository.ts`)

```ts
async archive(id: string): Promise<Property> {
  const updated = await prisma.property.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  return toProperty(updated);
}

async unarchive(id: string): Promise<Property> {
  const updated = await prisma.property.update({
    where: { id },
    data: { archivedAt: null },
  });
  return toProperty(updated);
}

async hardDelete(id: string): Promise<void> {
  await prisma.property.delete({ where: { id } });
}
```

Update `findByUser` to exclude archived properties by default:
```ts
where: {
  deletedAt: null,
  archivedAt: null,   // NEW — hide archived from default list
  OR: [...]
}
```

## API Layer

### `POST /api/properties/[propertyId]/archive`
File: `src/app/api/properties/[propertyId]/archive/route.ts`
- 200: returns archived property JSON
- 404: property not found
- 409: already archived / has active tenants
- 403: not owner

### `POST /api/properties/[propertyId]/unarchive`
File: `src/app/api/properties/[propertyId]/unarchive/route.ts`
- 200: returns unarchived property JSON
- 404: property not found
- 409: not archived
- 403: not owner

### `DELETE /api/properties/[propertyId]`
File: `src/app/api/properties/[propertyId]/route.ts` (existing — change soft→hard)
- 204: no content
- 404: property not found
- 409: has active tenants
- 403: not owner

## UI Layer

### `src/app/(app)/properties/[propertyId]/page.tsx`

Add at the bottom (G-3 compliance):

```
─────────────────────────────
⚠ Danger Zone
─────────────────────────────
[disabled warning if has active tenants]
[Archive Property]   [Delete Property]
```

**Archive dialog** (simple confirm, same as RT-9):
- Title: "Archive Property"
- Body: "Archive {{name}}? It will be hidden from your property list but can be restored later."
- Buttons: Cancel / Archive

**Delete dialog** (GitHub-style name input):
- Title: "Delete Property"
- Body: "This will permanently delete {{name}} and all its rooms, tenants, payments, and expenses. This action cannot be undone."
- Input: "Type the property name to confirm" → validates exact match before enabling Delete button
- Buttons: Cancel / Delete (destructive, disabled until name matches)

Both:
- On success → redirect to `/properties` + success toast
- On error → error toast

### Active tenant check
Fetch `hasActiveTenants` from a stat or dedicated API call. Use the existing `/api/properties/[propertyId]/dashboard` stats: `stats.occupancy.occupied > 0` means active tenants exist — disable both buttons and show warning.

## i18n Keys

### `locales/en.json` (under `property`)
```json
"archive": {
  "title": "Archive Property",
  "confirmMessage": "Archive {{name}}? It will be hidden from your property list but can be restored later.",
  "confirm": "Archive",
  "cancel": "Cancel",
  "success": "Property archived successfully",
  "errorActiveTenants": "Cannot archive property with active tenants. Move all tenants out first."
},
"unarchive": {
  "title": "Restore Property",
  "confirm": "Restore",
  "success": "Property restored successfully"
},
"delete": {
  "title": "Delete Property",
  "confirmMessage": "This will permanently delete {{name}} and all its rooms, tenants, payments, and expenses. This action cannot be undone.",
  "confirmNameLabel": "Type the property name to confirm",
  "confirmNamePlaceholder": "{{name}}",
  "confirm": "Delete",
  "cancel": "Cancel",
  "success": "Property deleted successfully",
  "errorActiveTenants": "Cannot delete property with active tenants. Move all tenants out first."
},
"dangerZone": "Danger Zone",
"occupiedWarning": "Move all tenants out before archiving or deleting this property."
```

### `locales/id.json` (under `property`)
```json
"archive": {
  "title": "Arsipkan Properti",
  "confirmMessage": "Arsipkan {{name}}? Properti akan disembunyikan dari daftar tetapi dapat dipulihkan nanti.",
  "confirm": "Arsipkan",
  "cancel": "Batal",
  "success": "Properti berhasil diarsipkan",
  "errorActiveTenants": "Tidak dapat mengarsipkan properti dengan penyewa aktif. Pindahkan semua penyewa terlebih dahulu."
},
"unarchive": {
  "title": "Pulihkan Properti",
  "confirm": "Pulihkan",
  "success": "Properti berhasil dipulihkan"
},
"delete": {
  "title": "Hapus Properti",
  "confirmMessage": "Ini akan menghapus {{name}} dan semua kamar, penyewa, pembayaran, serta pengeluaran secara permanen. Tindakan ini tidak dapat dibatalkan.",
  "confirmNameLabel": "Ketik nama properti untuk konfirmasi",
  "confirmNamePlaceholder": "{{name}}",
  "confirm": "Hapus",
  "cancel": "Batal",
  "success": "Properti berhasil dihapus",
  "errorActiveTenants": "Tidak dapat menghapus properti dengan penyewa aktif. Pindahkan semua penyewa terlebih dahulu."
},
"dangerZone": "Zona Berbahaya",
"occupiedWarning": "Pindahkan semua penyewa terlebih dahulu sebelum mengarsipkan atau menghapus properti ini."
```

## Correctness Properties

### Property 1: Owner-Only Enforcement
Archive, unarchive, and delete operations always reject non-owner callers (staff, unauthenticated) with a ForbiddenError — regardless of property state.

### Property 2: Active Tenant Guard
A property with at least one tenant whose `movedOutAt` is null cannot be archived or deleted. Both operations share the same guard logic.

### Property 3: Archive Reversibility
Archive sets `archivedAt` to a timestamp. Unarchive sets it back to null. Hard delete is permanent and has no inverse.

### Property 4: Delete Confirmation Exactness
The delete confirmation dialog enables the destructive button only when the typed input matches the property name exactly (case-sensitive). Partial or case-mismatched inputs keep the button disabled.
