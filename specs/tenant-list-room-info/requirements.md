# Requirements — Tenant List: Show Room Number & Move-In Date

Linked issue: #98

## Acceptance Criteria

### REQ-1 — roomNumber in Tenant type
The `Tenant` domain type MUST include a `roomNumber: string | null` field.

### REQ-2 — Repository enriches tenants with roomNumber
`findByProperty` (and all other `ITenantRepository` methods) MUST return `roomNumber` populated from the related `Room` record. When no room is assigned, `roomNumber` is `null`.

### REQ-3 — API response includes roomNumber
`GET /api/properties/:id/tenants` MUST include `roomNumber` in each tenant object in the response.

### REQ-4 — Tenant card shows room number
When a tenant has a room assigned (`roomId !== null`), the tenant card in the list MUST display the room number (e.g. "Room 3A").

### REQ-5 — Tenant card shows move-in date
When a tenant has a room assigned, the tenant card MUST display the move-in date formatted using `tenant.detail.since`.

### REQ-6 — No room info shown without assignment
When a tenant has no room assigned (`roomId === null`), neither the room number nor the date is displayed on the card.

## Out of Scope
- Sorting or filtering by room number
- Changes to `prisma/schema.prisma` (not needed — Room relation already exists)
- New i18n keys (existing `tenant.detail.room` and `tenant.detail.since` are reused)
