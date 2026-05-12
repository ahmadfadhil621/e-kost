# Design — Export Outstanding Balances to XLSX (Issue #123)

## Domain Layer

### `src/lib/balance-service.ts` (extend)

Add `OutstandingBalanceExportRow` interface:
```ts
export interface OutstandingBalanceExportRow {
  tenantName: string;
  roomNumber: string;
  outstandingBalance: number;
  monthsOverdue: number;
  lastPaymentDate: Date | null;
}
```

Add `ExportRowCapError` class (same pattern as payment/expense services):
```ts
export class ExportRowCapError extends Error { ... }
```

### `src/lib/balance-service.ts` — `IBalanceRepository` (extend)
Add `findForExport` method:
```ts
findForExport(propertyId: string, status?: "paid" | "unpaid"): Promise<OutstandingBalanceExportRow[]>
```

## Repository Layer

### `src/lib/repositories/prisma/prisma-balance-repository.ts` (extend)
Implement `findForExport`:
- Query: active tenants (`movedOutAt: null`, `roomId: { not: null }`) with `room` and `payments` included
- If `status === "unpaid"`: filter to rows where `outstandingBalance > 0`
- Compute per row:
  - `outstandingBalance = max(0, monthlyRent × monthsElapsed(movedInAt) − totalPayments)`
  - `monthsOverdue = monthlyRent > 0 ? ceil(outstandingBalance / monthlyRent) : 0`
  - `lastPaymentDate = max(payments.paymentDate) or null`
- Order: by `outstandingBalance` desc, then `name` asc
- Limit: fetch up to 10,001 rows for over-cap detection at service layer

## Service Layer

### `src/lib/balance-service.ts` (extend)
Add `exportOutstandingBalances(userId, propertyId, status, userTimezone, userLocale)`:
- Call `propertyAccess.validateAccess(userId, propertyId)`
- Call `balanceRepo.findForExport(propertyId, status)` with 10,001 row limit in repo
- If `rows.length > 10_000`: throw `ExportRowCapError`
- Build XLSX buffer using `exceljs` (server-only)
- Return `{ buffer: Buffer; filename: string }`

#### Filename:
```
outstanding-balances-<todayInUserTimezone>.xlsx
```

#### Sheet:
- Column widths: 24, 10, 18, 14, 18
- Headers (EN): Tenant, Room, Amount Owed (IDR), Months Overdue, Last Payment Date
- Headers (ID): Penyewa, Kamar, Tunggakan (IDR), Bulan Tunggak, Pembayaran Terakhir
- Data rows: tenant name, room number, outstandingBalance (numeric), monthsOverdue (numeric), lastPaymentDate formatted or "Never"/"Belum pernah"
- Totals row: `=SUM(C2:C<lastDataRow>)` on Amount Owed column (C)

## API Layer

### New: `src/app/api/properties/[propertyId]/tenants/export/route.ts`
```
GET /api/properties/[propertyId]/tenants/export?status=unpaid
```
- Auth: `withPropertyAccess`
- Parse `status` query param: accept `"unpaid"` or undefined (all)
- Fetch user timezone + language via `userService`
- Call `balanceService.exportOutstandingBalances(userId, propertyId, status, tz, lang)`
- Return binary with:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="<filename>"`
- On `ExportRowCapError`: 400 `{ error: message }`

## UI Layer

### Update: `src/app/(app)/properties/[propertyId]/tenants/page.tsx`
- Import `Download` from `lucide-react`
- Import `Tooltip*` from shadcn
- Add download button to toolbar (alongside "Add tenant" button)
- `href`: `/api/properties/${propertyId}/tenants/export${filter === "missing_rent" ? "?status=unpaid" : ""}`
- Disabled (with tooltip `tenant.export.disabledTooltip`) when `filteredTenants.length === 0`
- On click: `window.location.href = <href>` (browser-native file download)
- Show error toast on non-ok response if needed

## i18n Keys

### `locales/en.json` (under `tenant`)
```json
"export": {
  "button": "Export",
  "disabledTooltip": "No tenants to export",
  "errorToast": "Failed to export",
  "neverPaid": "Never",
  "columns": {
    "tenant": "Tenant",
    "room": "Room",
    "amountOwed": "Amount Owed (IDR)",
    "monthsOverdue": "Months Overdue",
    "lastPaymentDate": "Last Payment Date"
  },
  "rowCapError": "Export limit exceeded: maximum 10,000 rows allowed"
}
```

### `locales/id.json` (under `tenant`)
```json
"export": {
  "button": "Ekspor",
  "disabledTooltip": "Tidak ada penyewa untuk diekspor",
  "errorToast": "Gagal mengekspor",
  "neverPaid": "Belum pernah",
  "columns": {
    "tenant": "Penyewa",
    "room": "Kamar",
    "amountOwed": "Tunggakan (IDR)",
    "monthsOverdue": "Bulan Tunggak",
    "lastPaymentDate": "Pembayaran Terakhir"
  },
  "rowCapError": "Batas ekspor terlampaui: maksimum 10.000 baris diizinkan"
}
```

## Correctness Properties

### Property 1: XLSX row count invariant
Export with N rows always produces exactly N + 2 rows in the worksheet (1 header + N data + 1 totals).

### Property 2: Row cap enforcement
Export with N > 10,000 rows returns HTTP 400; no XLSX is produced.

### Property 3: Status filter parity
`status=unpaid` includes only rows where outstandingBalance > 0; no status param includes all active tenants.

### Property 4: Null last-payment sentinel
When lastPaymentDate is null, the cell contains the locale-specific sentinel ("Never" for EN, "Belum pernah" for ID), never a blank or Date value.

### Property 5: Numeric cells
Amount Owed and Months Overdue cells are always numeric (not strings), enabling spreadsheet calculations.
