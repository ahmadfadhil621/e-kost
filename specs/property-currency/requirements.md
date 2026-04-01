# Property-Level Currency — Requirements

Issue: #93

## Problem
Currency is stored on `User` as a global preference. A landlord can enter rent as 1,800,000
IDR, switch their preference to EUR, and the app displays €1,800,000. The stored amounts and
the currency they were entered in are fundamentally inseparable.

## Solution
Currency is a **property-level attribute** — set once at creation, locked forever afterwards.
All monetary amounts (rooms, payments, expenses) under a property are implicitly in that currency.

## Functional Requirements

### FR-1: Property creation requires a currency selection
- The Create Property form includes a currency dropdown (all `Currency` table entries).
- Currency is required; no silent default shown to the user (though the schema default is IDR).
- Once created, the currency field is **read-only** — no edit in the UI, no PATCH endpoint.

### FR-2: Currency context is sourced from the active property
- `CurrencyContext` reads `code` + `locale` from whichever property is currently active.
- When the active property switches, the formatted currency throughout the app updates.
- If no property is active (new user, zero properties) `code` and `locale` are null.

### FR-3: Null-currency graceful degradation
- `useFormatCurrency` returns the raw number as a string when currency is null (e.g. `"650"`).
- This is safe because a user with no active property has no financial data to display.

### FR-4: User-level currency preference is removed
- `User.currency` DB column removed.
- `GET /api/user/currency` and `PATCH /api/user/currency` routes deleted.
- `userService.getCurrency` / `userService.updateCurrency` deleted.
- Settings page currency selector (user-level) removed.

### FR-5: Currency deletion guard switches to properties
- `CurrencyService.remove()` currently blocks deletion if any user has that currency.
- After this change it blocks deletion if any **property** uses that currency code.
- Error message updated accordingly.

### FR-6: Demo seed script uses EUR with realistic values
- `scripts/seed-demo.ts` creates `demo@ekost.app` + a property with `currency: "EUR"`.
- Room rents are EUR-realistic (e.g. €450, €650, €800) not IDR-style millions.
- Tenants, payments, and expenses are seeded in EUR scale.

## Out of Scope
- Cross-property aggregations / mixed-currency dashboard summaries.
- Currency conversion.
- Changing currency after property creation.
