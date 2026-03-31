# Currency Management — Design

## Schema Changes (applied via Supabase, then `npx prisma db pull`)

### New: `Currency` table
```prisma
model Currency {
  id        String   @id @default(uuid())
  code      String   @unique   // e.g. "IDR", "EUR"
  locale    String             // e.g. "id-ID", "en-IE"
  label     String             // e.g. "Indonesian Rupiah"
  createdAt DateTime @default(now())

  @@map("currency")
}
```

### Updated: `User` model
```
+ currency  String  @default("EUR")
```

Seed data (applied in Supabase or via migration script):
- `{ code: "EUR", locale: "en-IE", label: "Euro" }`
- `{ code: "IDR", locale: "id-ID", label: "Indonesian Rupiah" }`

---

## Domain Layer

### `src/domain/schemas/currency.ts`
```ts
export type Currency = { id: string; code: string; locale: string; label: string; createdAt: Date }

export const createCurrencySchema = z.object({
  code: z.string().min(3).max(3).toUpperCase(),
  locale: z.string().min(2),
  label: z.string().min(1),
})

export const updateUserCurrencySchema = z.object({
  currency: z.string().min(3).max(3),
})
```

### `src/domain/interfaces/currency-repository.ts`
```ts
export interface ICurrencyRepository {
  list(): Promise<Currency[]>
  create(data: CreateCurrencyInput): Promise<Currency>
  findByCode(code: string): Promise<Currency | null>
  delete(id: string): Promise<void>
}
```

---

## Service Layer

### `src/lib/currency-service.ts`
```
CurrencyInUseError    — thrown when deleting a currency with active users
LastCurrencyError     — thrown when deleting the only remaining currency
CurrencyNotFoundError — thrown when deleting a non-existent currency
CurrencyExistsError   — thrown when creating a duplicate code

Methods:
  list()                       → Currency[]
  add(data)                    → Currency
  remove(id, getUserCount)     → void  (getUserCount injected for testability)
```

### `src/lib/user-service.ts` (extended)
```
+ getCurrency(userId)          → string
+ updateCurrency(userId, code) → string
```

---

## Repository Layer

### `src/lib/repositories/prisma/prisma-currency-repository.ts`
Implements `ICurrencyRepository` via Prisma `currency` table.

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/currencies` | authenticated | List all currencies |
| `POST` | `/api/currencies` | dev only | Add a currency |
| `DELETE` | `/api/currencies/[id]` | dev only | Remove a currency |
| `GET`  | `/api/user/currency` | authenticated | Get user's current currency |
| `PATCH` | `/api/user/currency` | authenticated | Update user's currency preference |

Response shape: `{ data: ... }` or `{ error: "..." }`

---

## React Context

### `src/contexts/currency-context.tsx`
```ts
type CurrencyContextValue = {
  code: string
  locale: string
  availableCurrencies: Currency[]
  setCurrency: (code: string) => Promise<void>  // calls PATCH /api/user/currency
  isLoading: boolean
}
```

- Initialized on app load from `GET /api/user/currency` + `GET /api/currencies`
- `useFormatCurrency` reads `code` and `locale` from this context (no i18n dependency)
- `setCurrency` persists to DB, then updates context state

---

## Updated Hook

### `src/hooks/use-format-currency.ts`
Replace i18n reads with context reads:
```ts
const { code, locale } = useCurrency()
```
`currency.code` / `currency.locale` keys in `locales/*.json` become unused — leave in place
for now (no breaking removal until confirmed safe).

---

## UI Components

### `src/components/settings/CurrencySelector.tsx`
- Dropdown populated from `CurrencyProvider.availableCurrencies`
- On change: calls `setCurrency(code)` from context
- Displayed in Settings page alongside `LanguageSelector`
- Available to all authenticated users

### `src/components/settings/CurrencySection.tsx`
- Dev-only page component for `/settings/currencies`
- List of currencies with code, label, locale, delete button
- "Add Currency" button → inline form (code, locale, label)
- Delete blocked server-side (AC-1); client shows error toast on 409

### `src/app/(app)/settings/currencies/page.tsx`
- Server-side redirect if not dev account (mirrors `/settings/invites/page.tsx`)

---

## Settings Page Changes

`SettingsPage.tsx`:
- Add `<CurrencySelector />` below `<LanguageSelector />` with a `<Separator />`
- Add "Currency Management" link in the dev section (alongside Invite Management)

---

## i18n Keys

### `locales/en.json` additions
```json
"settings": {
  "currency": {
    "label": "Currency",
    "description": "Choose how monetary values are displayed",
    "selector": {
      "placeholder": "Select currency"
    }
  },
  "currencyManagement": {
    "title": "Currency Management",
    "description": "Manage available currencies for all users",
    "add": "Add Currency",
    "form": {
      "code": "Currency Code",
      "codePlaceholder": "e.g. USD",
      "locale": "Locale",
      "localePlaceholder": "e.g. en-US",
      "label": "Label",
      "labelPlaceholder": "e.g. US Dollar",
      "submit": "Add",
      "cancel": "Cancel"
    },
    "list": {
      "empty": "No currencies configured",
      "delete": "Delete",
      "deleteConfirm": "Delete this currency?"
    },
    "error": {
      "inUse": "This currency is used by one or more users and cannot be deleted",
      "lastCurrency": "Cannot delete the last remaining currency",
      "alreadyExists": "A currency with this code already exists",
      "createFailed": "Failed to add currency",
      "deleteFailed": "Failed to delete currency"
    }
  },
  "developer": {
    "currencyManagement": "Currency Management",
    "currencyManagementDesc": "Add or remove available currencies"
  }
}
```

### `locales/id.json` additions
Mirror of above in Indonesian.

---

## Correctness Properties

- Switching language never changes active currency
- Switching currency never changes active language
- `useFormatCurrency` always produces output consistent with `CurrencyProvider.code`
- Deleting a currency code that has ≥1 user → 409 Conflict
- Deleting the last currency → 409 Conflict
- Adding a duplicate code → 409 Conflict
