# Design — Finance: Export Payments Register to XLSX (Issue #121)

## Domain Layer

### `src/domain/schemas/payment.ts` (extend)
Add `paymentFilterSchema`:
```ts
export const paymentFilterSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type PaymentFilters = z.infer<typeof paymentFilterSchema>;
```

### `src/domain/interfaces/payment-repository.ts` (extend)
Add `findForExport` method signature:
```ts
findForExport(propertyId: string, filters: PaymentFilters): Promise<PaymentExportRow[]>
```

### New type `PaymentExportRow` in `src/domain/schemas/payment.ts`:
```ts
export interface PaymentExportRow {
  paymentDate: Date;
  tenantName: string;
  roomNumber: string | null;  // from room_assignment at time of payment
  billingCycleYear: number | null;
  billingCycleMonth: number | null;
  amount: number;
  note: string | null;
}
```

## Repository Layer

### `src/lib/repositories/prisma/prisma-payment-repository.ts` (extend)
Implement `findForExport`:
- Joins: `tenant`, `billing_cycle`, `tenant.room_assignment` (find assignment where `startDate <= paymentDate AND (endDate > paymentDate OR endDate IS NULL)`)
- Filter: `dateFrom`/`dateTo` mapped to `paymentDate >= start` and `paymentDate <= end`
- Order: `paymentDate desc`, `createdAt desc`
- Limit: fetch up to 10,001 rows to detect over-cap at the service layer

## Service Layer

### `src/lib/payment-service.ts` (extend)
Add `exportPayments(userId, propertyId, filters, userTimezone, userLocale)`:
- Call `propertyAccess.validateAccess`
- Call `paymentRepo.findForExport(propertyId, filters)` with 10,001 row limit
- If count > 10,000: throw `ExportRowCapError`
- Build XLSX buffer using `exceljs` (server-only import)
- Sheet columns: Date, Tenant, Room, Period, Amount (IDR), Notes
- Date formatted per `userLocale` and `userTimezone`
- Totals row: `=SUM(F2:F<lastDataRow>)` on Amount column (column index 5, 1-based → F)
- Return `{ buffer: Buffer; filename: string }`

#### Filename logic (server-side):
```
if dateFrom && dateTo → `payments-${dateFrom}_to_${dateTo}.xlsx`
else → `payments-${todayInUserTimezone}.xlsx`
```

## API Layer

### New: `src/app/api/properties/[propertyId]/payments/export/route.ts`
```
GET /api/properties/[propertyId]/payments/export?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```
- Auth: `withPropertyAccess`
- Parse query params with `paymentFilterSchema`
- Fetch user timezone via `userService.getTimezone(userId)`
- Fetch user language from session or user preferences
- Call `paymentService.exportPayments(...)`
- Return response with headers:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="<filename>"`
- On `ExportRowCapError`: return `{ error: t("...") }` with status 400
  - Note: translation happens server-side using the user's language preference

### Update: `src/app/api/properties/[propertyId]/payments/route.ts`
- Parse `dateFrom`/`dateTo` query params using `paymentFilterSchema` in `GET` handler
- Pass filters to `paymentService.listPayments(userId, propertyId, filters)`

### Update: `src/lib/payment-service.ts`
- Update `listPayments` signature to accept optional `PaymentFilters`
- Pass filters through to `paymentRepo.findByProperty(propertyId, filters)`

### Update: `src/domain/interfaces/payment-repository.ts`
- Update `findByProperty` to accept optional `PaymentFilters`

### Update: `src/lib/repositories/prisma/prisma-payment-repository.ts`
- Update `findByProperty` to apply date filters when provided

## UI Layer

### Update: `src/app/(app)/properties/[propertyId]/payments/page.tsx`
- Add export download button to the toolbar (top-right, next to "Record Payment")
- Button: `Download` icon (`lucide-react`), icon-only on mobile, with label on desktop
- Disabled with tooltip (`payment.export.disabledTooltip`) when `payments.length === 0`
- On click: `window.location.href = /api/properties/${propertyId}/payments/export` (browser-native file download)
- On error: show toast via `useToast`
- The button doesn't need a mutation — it's a plain GET that the browser handles as a file download

## i18n Keys

### `locales/en.json` (under `payment`)
```json
"export": {
  "button": "Export",
  "disabledTooltip": "No payments to export",
  "errorToast": "Failed to export payments",
  "columns": {
    "date": "Date",
    "tenant": "Tenant",
    "room": "Room",
    "period": "Period",
    "amount": "Amount (IDR)",
    "notes": "Notes"
  },
  "rowCapError": "Export limit exceeded: maximum 10,000 rows allowed"
}
```

### `locales/id.json` (under `payment`)
```json
"export": {
  "button": "Ekspor",
  "disabledTooltip": "Tidak ada pembayaran untuk diekspor",
  "errorToast": "Gagal mengekspor pembayaran",
  "columns": {
    "date": "Tanggal",
    "tenant": "Penyewa",
    "room": "Kamar",
    "period": "Periode",
    "amount": "Jumlah (IDR)",
    "notes": "Catatan"
  },
  "rowCapError": "Batas ekspor terlampaui: maksimum 10.000 baris diizinkan"
}
```

## Correctness Properties

- Export with 0 rows → valid XLSX, headers present, SUM formula evaluates to 0
- Export with N ≤ 10,000 rows → N data rows + 1 header row + 1 totals row
- Export with N > 10,000 rows → HTTP 400, no file download
- Room resolved from `room_assignment` history, not `tenant.roomId`
- exceljs never imported in any client component
- Filename uses dateFrom/dateTo when provided, today's date otherwise
