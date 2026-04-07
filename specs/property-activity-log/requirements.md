# Requirements: Property Activity Log

## Context & Problem

Landlords and their staff perform many actions (recording payments, adding expenses, assigning tenants, creating rooms, changing settings) but there is currently no audit trail. When something goes wrong, it's impossible to know who did what and when. This is especially important in multi-staff properties.

## Goals / Non-Goals

**Goals:**
- Record every significant action in a property as an immutable log entry
- Show a chronological activity feed per property
- Support filtering by area (Finance, Tenant, Rooms, Settings) and by actor
- Support i18n — action descriptions rendered client-side from structured codes

**Non-Goals:**
- Retroactive logging of existing data (only new actions from deployment onwards)
- Cash accountability / aggregated financial summaries per actor (separate issue #109)
- Editing or deleting log entries (append-only)
- Cross-property activity view

---

## Functional Requirements

### Requirement 1: Activity Logging (Write Side)

**User Story:** As a system, I want to record every significant user action so that owners and staff have an audit trail.

#### Acceptance Criteria

1. WHEN any of the following actions completes successfully, the system SHALL create an `ActivityLog` entry:
   - Finance: payment recorded, payment updated, payment deleted
   - Finance: expense created, expense updated, expense deleted
   - Tenant: tenant assigned to room, tenant unassigned, tenant moved to another room, tenant details updated
   - Rooms: room created, room updated, room archived
   - Settings: staff-only finance mode toggled, property details updated
2. WHEN an action fails (validation error, auth error, etc.), the system SHALL NOT create a log entry
3. Each log entry SHALL contain: propertyId, actorId, actorRole, actionCode, entityType, entityId (nullable), metadata (JSON), createdAt
4. Log entries SHALL be append-only — no update or delete operations are permitted
5. Logging SHALL NOT block the primary action — if logging fails, the primary action still succeeds (fire-and-forget after commit)

### Requirement 2: Activity Feed API

**User Story:** As an owner or staff member, I want to fetch the activity log via API so the UI can display it.

#### Acceptance Criteria

1. `GET /api/properties/:id/activity` SHALL return a paginated list of activity entries, newest first
2. The endpoint SHALL support cursor-based pagination via `cursor` query param; page size is 20
3. The endpoint SHALL support optional filters: `?area=finance|tenant|rooms|settings` and `?actorId=<userId>`
4. The response SHALL include: `{ data: ActivityEntry[], nextCursor: string | null }`
5. Each `ActivityEntry` SHALL include: id, actorName, actorRole, actionCode, entityType, entityId, metadata, createdAt
6. The endpoint SHALL return 401 if unauthenticated, 403 if the caller has no access to the property
7. Both owners and staff SHALL be able to read the full activity log for a property

### Requirement 3: Activity Feed UI

**User Story:** As an owner or staff member, I want to see a chronological feed of all activity in my property.

#### Acceptance Criteria

1. A dedicated "Activity" page SHALL be accessible at `/properties/:id/activity`
2. The page SHALL be linked from the property navigation
3. Each entry SHALL display: actor name, role badge (owner/staff), human-readable action description (i18n), and relative timestamp
4. A "Load more" button SHALL appear when `nextCursor` is non-null; clicking it appends the next page
5. Filter controls SHALL allow filtering by area and/or actor
6. An empty state SHALL be shown when no entries exist
7. The page SHALL be mobile-first (max-width 480px layout)

### Requirement 4: i18n Action Descriptions

**User Story:** As a user, I want action descriptions in my preferred language.

#### Acceptance Criteria

1. Action descriptions SHALL be rendered client-side from structured `actionCode` values using i18n translation keys
2. Translation keys SHALL exist in both `locales/en.json` and `locales/id.json`
3. Translation strings SHALL support interpolation for entity context (e.g., room name, amount)

---

## Constraints

- `prisma/schema.prisma` requires explicit user approval before modification
- Log entries are append-only — no edit or delete
- Logging must not block or slow down primary actions
- Must support i18n for all UI strings and action descriptions
- Touch targets ≥ 44px on mobile
- All API routes must use `withPropertyAccess()` for auth/authz

## Success Criteria

- All specified action types are captured in the log
- Activity feed loads and paginates correctly on mobile
- Filtering by area and actor works
- i18n strings render correctly in English and Indonesian
- No regression in existing payment, expense, tenant, room, or settings flows
