# Requirements — Export Outstanding Balances to XLSX (Issue #123)

## Context & Problem

Landlords need a quick way to identify and communicate with tenants who owe rent. Without a downloadable snapshot, they must manually note names and amounts from the screen.

## Goals

- Export a snapshot of tenant balance data to XLSX
- Respect the active filter on the tenants list (all tenants or only owing)
- Match the download UX and file format established by F-4a/F-4b

## Non-Goals

- Transaction-level history (that is F-4d)
- Filtering by date range (snapshot is always as-of today)
- Exporting moved-out tenants

## Functional Requirements

### Requirement 1: Export Button

**Acceptance Criteria:**
1. WHEN the tenants list has items, THEN a download icon button appears in the toolbar
2. WHEN the filtered view is empty, THEN the button is disabled with a tooltip
3. WHEN the button is clicked, THEN the browser downloads a file
4. WHEN rendered on mobile, THEN the button meets minimum touch-target size

### Requirement 2: Filter-Aware Export

**Acceptance Criteria:**
1. WHEN the "All" filter is active, THEN the export includes all active tenants
2. WHEN the "Missing rent" filter is active, THEN the export includes only tenants with outstanding balance > 0
3. WHEN the export runs, THEN the data matches the currently visible filtered view

### Requirement 3: XLSX Content

**Acceptance Criteria:**
1. WHEN exported, THEN filename is `outstanding-balances-<today-in-user-tz>.xlsx`
2. WHEN exported, THEN columns are Tenant, Room, Amount Owed (IDR), Months Overdue, Last Payment Date in that order
3. WHEN exported, THEN a SUM formula is placed on the Amount Owed totals row
4. WHEN monthlyRent > 0, THEN monthsOverdue = ceil(outstandingBalance / monthlyRent)
5. WHEN no payments exist for a tenant, THEN Last Payment Date shows "Never" (EN) or "Belum pernah" (ID)
6. WHEN exported, THEN headers are locale-aware (EN/ID)
7. WHEN row count exceeds 10,000, THEN the API returns HTTP 400

## Definition of Done

- [ ] Vitest tests: Good/Bad/Edge
- [ ] Playwright E2E test written
- [ ] All three quality gates pass
- [ ] Implementation complete, all tests pass
- [ ] i18n keys in `locales/en.json` and `locales/id.json`
- [ ] `npm run test:run` passes with 0 failures
