# Room — Show Tenant(s) and Move-In Date (issue #100)

## Acceptance Criteria

### AC-1: Single tenant — name and move-in date shown
Given an occupied room with one active tenant,
when the room list is rendered,
then the room card shows the tenant's name and their `assignedAt` date formatted as "since Month Year".

### AC-2: Multi-tenant — all names and earliest move-in date
Given an occupied room with multiple active tenants,
when the room list is rendered,
then the room card shows each tenant's name on a separate line (bulleted list) and the earliest `assignedAt` date across all tenants.

### AC-3: Long name abbreviation
Given a tenant with 3 or more name words (first + middle(s) + last),
when their name is rendered on a room card,
then middle names are abbreviated to first-letter initials (e.g., "George Washington Bush" → "George W. Bush", "John William Robert Doe" → "John W. R. Doe").

Names with 1 or 2 words are shown as-is.

### AC-4: No move-in date — graceful omission
Given an occupied room where `assignedAt` is null for all tenants,
when the room card is rendered,
then no date line is shown (no crash, no empty string rendered).

### AC-5: Non-occupied cards — unaffected
Given a room with status `available` or `under_renovation`,
when the room card is rendered,
then neither the tenant list nor the date line is shown.

### AC-6: API enrichment
The rooms list API (`GET /api/properties/[propertyId]/rooms`) must:
- Include `assignedAt` (ISO string or null) on each tenant object in the `tenants` array
- Include a room-level `assignedAt` field = earliest non-null `assignedAt` across all active tenants (null if none)

## Definition of Done
- [ ] Vitest tests written (Good / Bad / Edge)
- [ ] Playwright E2E test written
- [ ] All three quality gates pass
- [ ] Implementation complete and all tests pass
- [ ] i18n keys added to `locales/en.json` and `locales/id.json`
- [ ] Full regression suite passes
- [ ] No existing tests weakened
