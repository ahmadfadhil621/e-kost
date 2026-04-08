# Requirements: Finance Staff Summary (Issue #109)

## Context & Problem

Property owners with multiple staff members have no visibility into who collected money or added expenses. There is no way to verify that the amounts match expectations or to hold staff accountable for the cash they handle.

## Goals / Non-Goals

**Goals:**
- Track which user recorded each payment and expense (via `actorId`)
- Expose a per-staff aggregated summary API for a given month
- Render a staff summary section on the Finance page
- Support i18n for all new UI strings

**Non-Goals:**
- Handover / reconciliation tracking (deferred to a follow-up issue)
- Historical data backfill (existing payments/expenses will have `actorId = null`)
- Cross-property staff summary

---

## Functional Requirements

### Requirement 1: Schema — Store Actor on Payment and Expense

**User Story:** As the system, I want to record who created each payment and expense entry so that summaries can be grouped by actor.

#### Acceptance Criteria

1. The `payment` table SHALL have a nullable `actorId String?` field referencing the `User` model
2. The `expense` table SHALL have a nullable `actorId String?` field referencing the `User` model
3. Existing rows (where `actorId IS NULL`) remain valid and are excluded from summaries
4. When a payment is created via API, the authenticated user's ID SHALL be stored as `actorId`
5. When an expense is created via API, the authenticated user's ID SHALL be stored as `actorId`

### Requirement 2: Staff Summary API

**User Story:** As an owner, I want to fetch a per-staff breakdown of collected payments and added expenses for a given month.

#### Acceptance Criteria

1. `GET /api/properties/:id/finance/staff-summary?year=YYYY&month=MM` SHALL return HTTP 200
2. The response SHALL be `{ data: StaffSummaryEntry[] }`
3. Each `StaffSummaryEntry` SHALL include: `actorId`, `actorName`, `actorRole`, `totalPayments`, `totalExpenses`
4. Only entries with at least one payment or expense in the period SHALL be returned
5. Rows with `actorId = null` SHALL be excluded from the response
6. The endpoint SHALL return HTTP 400 for missing or invalid `year`/`month` params
7. The endpoint SHALL return HTTP 401 if unauthenticated
8. The endpoint SHALL return HTTP 403 if the caller has no access to the property
9. **Owner**: receives all rows (all staff + themselves)
10. **Staff**: receives only their own row (`actorId = caller's userId`)

### Requirement 3: Finance Page — Staff Summary Section

**User Story:** As an owner or staff member, I want to see the staff cash accountability section on the Finance page.

#### Acceptance Criteria

1. A "Staff Summary" section SHALL appear below the existing summary cards on the Finance page
2. The section SHALL update when the month selector changes
3. When the caller is owner: all staff rows are shown in a list/table
4. When the caller is staff: only their own row is shown
5. Each row SHALL display: actor name, total payments collected, total expenses added
6. Loading state SHALL be shown while fetching
7. If no data exists for the period, an empty state message SHALL be shown
8. All strings SHALL use i18n keys

### Requirement 4: i18n

All new UI strings SHALL have keys in both `locales/en.json` and `locales/id.json`.

Required keys:
- `finance.staffSummary.title`
- `finance.staffSummary.collected`
- `finance.staffSummary.added`
- `finance.staffSummary.empty`
- `finance.staffSummary.noData`

---

## Out of Scope

- Handover / cash reconciliation tracking
- Editing who recorded a payment/expense after the fact
- Cross-property or cross-period aggregation
- Retroactive backfill of `actorId` on existing records
