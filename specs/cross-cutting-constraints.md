# Cross-Cutting Constraints

These constraints apply to **all MVP features** and must be considered in every requirement, design, and implementation task.

## 1. Mobile Responsiveness

**Applies to**: All UI screens and interactions

- All screens must render correctly on mobile devices with screen widths from 320px to 480px
- Single-column layout required (no horizontal scrolling)
- All interactive elements (buttons, links, form fields) must have minimum 44x44 pixel touch targets
- No pinch-to-zoom required for readability or usability
- Font sizes and contrast must ensure readability without magnification

**Rationale**: E-Kost targets property managers using smartphones on-site. Mobile-first is non-negotiable for usability.

---

## 2. Internationalization (i18n) - Language & Currency Agnostic

**Applies to**: All UI text, form labels, validation messages, confirmation dialogs, error messages, currency formatting

- All user-facing text must be externalized from code (no hardcoded strings)
- Language strings must be stored in a single JSON file per language (e.g., `en.json`, `id.json`, `es.json`)
- Changing the language JSON file must change the entire webapp language without code changes
- Language selection must be available in user settings or device locale detection
- All form validation messages, error messages, and confirmation dialogs must be translatable
- Date and number formatting must respect locale (e.g., date format, decimal separators, currency symbols)
- All success/confirmation messages must be translatable
- Currency is a locale-level i18n setting: each locale JSON defines its currency code (e.g., `EUR`, `IDR`)
- Default currency is EUR; changing locale can change the displayed currency
- Currency symbols must never be hardcoded in components — always use `Intl.NumberFormat` with the currency code from i18n config
- All monetary amounts are stored as plain decimals in the database; currency formatting is a display concern only

**Rationale**: E-Kost is inspired by Indonesian property management context but should support any language and currency. A single JSON file per language enables rapid localization without code deployment. Currency as an i18n setting allows the same codebase to serve markets with different currencies.

**Implementation Approach**:
- Use i18n library (e.g., i18next, react-i18next, Vue I18n) with JSON file-based translations
- Store translations in `locales/` directory: `locales/en.json`, `locales/id.json`, etc.
- Each JSON file contains flat or nested key-value pairs for all UI strings
- Each JSON file includes a `currency` section with `code` (ISO 4217) and `locale` (BCP 47) for formatting
- Language switching updates the active locale and re-renders UI
- No hardcoded strings or currency symbols in components—all text references translation keys
- Locale-aware formatting for dates, numbers, and currency via `Intl.NumberFormat` and i18n library

**Example Structure**:
```
locales/
├── en.json
├── id.json
└── es.json

en.json:
{
  "currency": {
    "code": "EUR",
    "locale": "en-IE"
  },
  "tenant.create.title": "Add Tenant",
  "tenant.create.name": "Full Name",
  "tenant.create.phone": "Phone Number",
  "validation.required": "This field is required",
  "validation.email": "Invalid email address"
}
```

---

## 3. Data Persistence & Integrity

**Applies to**: All data operations (create, read, update, delete)

- All data must be persisted to database immediately upon creation or modification
- All timestamps must be recorded in UTC timezone
- Soft delete pattern required for tenant move-out (preserve historical data)
- Database must support at least: 1,000 tenant records, 500 room records, 10,000 payment records
- No data loss during any CRUD operation
- Unique identifiers must be auto-generated and immutable after creation

**Rationale**: Property managers rely on E-Kost as single source of truth. Data loss is unacceptable. UTC timestamps ensure consistency across timezones.

---

## 4. Accessibility & Inclusive Design

**Applies to**: All UI components, forms, and interactions

- Color-coded status indicators must use both color and text/icon (not color alone)
- All form fields must have associated labels
- All interactive elements must be keyboard accessible
- Sufficient color contrast for readability (WCAG AA minimum)
- Error messages must be clear and actionable

**Rationale**: Property managers may have varying abilities. Inclusive design ensures usability for all.

---

## 5. Performance & Responsiveness

**Applies to**: All operations and UI interactions

- Status updates must be reflected within 2 seconds
- Balance calculations must update within 2 seconds after payment or room assignment change
- Form submission must complete within 5 seconds
- List views must remain responsive with full dataset (1,000+ records)
- No blocking operations on main thread

**Rationale**: Property managers use E-Kost while managing properties. Slow responses reduce usability and trust.

---

## 6. Security & Data Privacy

**Applies to**: All data handling, especially PII

- Tenant personal data (name, phone, email) must be treated as PII
- No sensitive data in logs or error messages
- All data transmission must use HTTPS
- Database credentials must not be hardcoded
- Future AI integrations must not expose tenant PII to external services without explicit consent

**Rationale**: E-Kost handles personal information. Privacy and security are foundational.

---

## 7. Validation & Error Handling

**Applies to**: All forms, API endpoints, and data operations

- All required fields must be validated before submission
- Email addresses must be validated for format
- Monetary amounts must be validated as positive numbers
- Dates must be validated as valid calendar dates
- Room numbers/identifiers must be unique within property
- Validation errors must be displayed clearly to user
- API errors must return appropriate HTTP status codes with descriptive messages

**Rationale**: Data quality depends on validation. Clear error messages improve user experience.

---

## 8. Data Freshness After Mutations

**Applies to**: All UI-triggered mutations (create, update, delete) that change data displayed elsewhere (lists, detail views, dashboard, balances)

- After any successful mutation, the UI must refetch and display updated data **without** requiring a full page refresh
- Every mutation flow that uses TanStack Query for reading data must invalidate the relevant query keys after a successful response (e.g. `queryClient.invalidateQueries({ queryKey: [...] })`)
- Mutations that affect dashboard stats (rooms, tenants, payments, expenses) must invalidate `["dashboard", propertyId]`
- Mutations that affect list or detail views must invalidate the corresponding list/detail query keys
- Property list is updated via PropertyContext `refetch()` for create/delete property; when using TanStack Query for other data, invalidate affected keys there too
- **Do not** invalidate on mutation failure; only after success

**Rationale**: Stale lists and dashboard after create/edit flows confuse users and force manual refresh. Invalidating the right query keys ensures the UI shows fresh data as soon as the user navigates or the component re-renders.

**Invalidation checklist** (when adding or changing a mutation, invalidate these keys after success):

| Mutation | Query keys to invalidate |
|----------|--------------------------|
| **Room** create | `["rooms", propertyId]`, `["dashboard", propertyId]` |
| **Room** edit or status change | `["room", propertyId, roomId]`, `["rooms", propertyId]`, `["dashboard", propertyId]` |
| **Tenant** create | `["tenants", propertyId]`, `["balances", propertyId]`, `["dashboard", propertyId]` |
| **Tenant** edit or assign room | `["tenant", propertyId, tenantId]`, `["tenants", propertyId]`, `["rooms", propertyId]` (if assign), `["dashboard", propertyId]` |
| **Tenant** move-out | `["tenants", propertyId]`, `["rooms", propertyId]`, `["dashboard", propertyId]`, `["balances", propertyId]`, `["tenant", propertyId, tenantId]`, `["payments", "tenant"]` |
| **Payment** create | `["payments", propertyId]`, `["payments", "tenant"]`, `["dashboard", propertyId]`, `["balance", propertyId, tenantId]` (if scoped), `["balances", propertyId]` |
| **Expense** create or edit | `["expenses", propertyId]`, `["finance-summary", propertyId]`, `["dashboard", propertyId]` |
| **Property** delete | `PropertyContext.refetch()`; if deleted property was active, also `queryClient.invalidateQueries({ queryKey: ["dashboard", deletedPropertyId] })` |
| **Property** create | `PropertyContext.refetch()` |
| **Notes** (tenant) create/update/delete | `["tenant-notes", propertyId, tenantId]` (or equivalent key used by the notes query) |
| **Staff** add/remove | `["staff", propertyId]` |

- Use `queryClient.invalidateQueries({ queryKey: [...] })` after a successful API response; do not invalidate on failure.
- For property list changes (create/delete property), use PropertyContext `refetch()`; for all other list/detail/dashboard data, use TanStack Query invalidation.

**Reference**: Full requirements and task history in **`specs/data-freshness/`**.

---

## Implementation Checklist

When implementing any feature, verify:

- [ ] Mobile responsive (320px-480px, 44x44px targets, single-column)
- [ ] All UI text uses translation keys (no hardcoded strings)
- [ ] Translation keys defined in language JSON files
- [ ] Language switching updates entire UI without code changes
- [ ] All data persisted immediately with UTC timestamps
- [ ] Soft delete used where appropriate
- [ ] Color-coded indicators use both color and text/icon
- [ ] Status updates within 2 seconds
- [ ] All forms validated before submission
- [ ] Error messages clear and actionable
- [ ] No PII in logs or error messages
- [ ] HTTPS for all data transmission
- [ ] Date/number/currency formatting respects locale
- [ ] Currency code sourced from i18n config, not hardcoded
- [ ] When adding new mutations: invalidate affected TanStack Query keys (and PropertyContext refetch if applicable) so lists/dashboard/balances update without refresh — see `specs/data-freshness/`
