# Requirements: Settings — Currency Management

Traceability: settings-currency-management (Issue #90)

## Functional Requirements

### REQ 1: Currency registry (dev-managed)
- REQ 1.1: Dev accounts can add a new currency (code, locale, label) via `/settings/currencies`
- REQ 1.2: Dev accounts can delete a currency — blocked if any user has that currency as their preference
- REQ 1.3: `GET /api/currencies` is public (all authenticated users); `POST` and `DELETE` are dev-gated
- REQ 1.4: The currency list is seeded with EUR and IDR
- REQ 1.5: `CurrencyService.list()` returns all currencies from the repository
- REQ 1.6: `CurrencyService.add()` creates a currency and throws `CurrencyExistsError` on duplicate code
- REQ 1.7: `CurrencyService.remove()` throws `CurrencyInUseError` when ≥1 user has that currency selected
- REQ 1.8: `CurrencyService.remove()` throws `LastCurrencyError` when it is the only currency in the system
- REQ 1.9: `CurrencyService.remove()` throws `CurrencyNotFoundError` when the id does not exist

### REQ 2: User currency preference
- REQ 2.1: All authenticated users see a currency selector in Settings
- REQ 2.2: Selector is populated from the live `Currency` table (not hardcoded)
- REQ 2.3: Selected currency is persisted to `user.currency` via `PATCH /api/user/currency`
- REQ 2.4: Default currency for new users is `EUR`
- REQ 2.5: `userService.getCurrency(userId)` returns the stored currency code for the user
- REQ 2.6: `userService.updateCurrency(userId, code)` updates and returns the new code

### REQ 3: Formatting is currency-driven, not language-driven
- REQ 3.1: `useFormatCurrency` reads from `CurrencyProvider` context, independent of i18n language
- REQ 3.2: Switching UI language does NOT change the active currency
- REQ 3.3: Switching currency does NOT change the UI language
- REQ 3.4: All existing formatted values continue to display correctly after the change

### REQ 4: Dev section UI
- REQ 4.1: Dev accounts see a "Currency Management" link in the Settings developer section
- REQ 4.2: Non-dev accounts do not see the link or the page (server-side redirect)

### REQ 5: Constraints
- REQ 5.1: Cannot delete the last remaining currency in the system
- REQ 5.2: Cannot delete a currency currently selected by ≥1 user (blocked, not silent fallback)
- REQ 5.3: i18n keys required for all new UI strings

## Correctness Properties

### PROP 1: Code normalization
- Currency codes are always stored in uppercase regardless of input casing

### PROP 2: Currency pass-through
- `getCurrency` returns exactly what the repository returns for any valid currency code

## Out of Scope
- Per-property currency (ruled out — single landlord, single currency)
- Currency exchange rates
- Historical formatting (past records are re-formatted with the new currency on change)
