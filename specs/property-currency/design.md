# Property-Level Currency — Technical Design

## Schema Changes

```prisma
// ADD to Property model:
currency  String  @default("IDR")

// REMOVE from User model:
currency  String  @default("EUR")
```

Existing properties get `"IDR"` as the migration default (user-approved).

## Domain Layer

### `src/domain/schemas/property.ts`
- `Property` interface gains `currency: string`
- `createPropertySchema` gains `currency: z.string().min(3).max(3).toUpperCase()`
- `IPropertyRepository.create()` input gains `currency: string`

### `src/domain/schemas/currency.ts`
- Remove `updateUserCurrencySchema` (no longer valid)

## Service Layer

### `src/lib/property-service.ts`
- `createProperty()` passes `currency` through to repository
- Property list response must include `currency` for context consumption

### `src/lib/user-service.ts`
- Remove `getCurrency()` and `updateCurrency()`

### `src/lib/currency-service.ts`
- `remove()` signature changes: `getUserCount` param → `getPropertyCount`
- Implementation checks `prisma.property.count({ where: { currency: code } })`
- Error text: "This currency is used by one or more properties and cannot be deleted"

## Repository Layer

### `src/lib/repositories/prisma/prisma-property-repository.ts`
- `create()` stores `currency` on the record
- `findById()` and `findByUser()` select `currency`

## API Layer

### `src/app/api/properties/route.ts`
- `POST` body: add `currency` (validated, required)
- `GET` list response: include `currency` in each property

### `src/app/api/user/currency/route.ts`
- **Delete** this file (route no longer exists)

## Context Layer

### `src/contexts/currency-context.tsx`
- Remove fetch of `/api/user/currency`; remove PATCH call
- Remove `setCurrency` from public interface
- Read `activePropertyId` + `properties` from `PropertyContext`
- Derive `activeCurrency = properties.find(p => p.id === activePropertyId)?.currency ?? null`
- Match against `availableCurrencies` to get `locale`
- Expose: `{ code: string | null, locale: string | null, availableCurrencies, isLoading }`

### `src/hooks/use-format-currency.ts`
- Guard: if `code === null` return `String(value)`

## UI Layer

### `src/components/property/property-form.tsx`
- Add `CurrencySelect` (reuse `CurrencySelector` component or inline) to creation form
- Field is required; only shown on creation (not on edit)

### `src/components/settings/CurrencySelector.tsx`
- Remove the user-level update logic; keep as a pure display/select component
- Repurpose for property creation form usage

### Settings page
- Remove the `<CurrencySection>` for user preference (the dev-only currency management stays)

## i18n

Add under `property` namespace:
```json
"currency": {
  "label": "Currency",
  "description": "Set once at creation and cannot be changed later",
  "placeholder": "Select a currency"
}
```

Update `settings.currencyManagement.errors.inUse`:
```
"This currency is used by one or more properties and cannot be deleted"
```

Remove top-level `"currency": { "code": "...", "locale": "..." }` key (was the user fallback).

Remove `settings.currency` section (user-level label/description/selector placeholder).

## Demo Seed

`scripts/seed-demo.ts`:
- Creates user `demo@ekost.app` / `Demo@395762@`
- Creates property `"Kost Bunga"` with `currency: "EUR"`
- Seeds 4 rooms (€450 single, €650 double, €800 ensuite, €500 single)
- Seeds 5 tenants each assigned to a room
- Seeds payments (3 months history per tenant)
- Seeds expenses (electricity €60, water €25, internet €40, maintenance €120/mo for 3 months)

## Test Fixtures

Update all monetary defaults to EUR-scale:
- `monthlyRent`: 650 (not 1,500,000)
- `payment.amount`: 650
- `expense.amount`: 80
