# Tasks: Dashboard / Overview

## 1. Service Layer

- [x] 1.1 Implement DashboardService
  - **Description**: Build service that aggregates data from RoomService, PaymentService, ExpenseService, and BalanceService into a single dashboard response
  - **Acceptance Criteria**:
    - `getDashboardData(propertyId)` returns occupancy, finance, outstanding balances, recent payments
    - Fetches all four sections in parallel using Promise.all
    - Occupancy: counts by status, calculates occupancy rate (occupied/total × 100)
    - Finance: current month income (sum payments), expenses (sum expenses), net income
    - Outstanding: top 5 tenants by balance descending, total count of tenants with balance > 0
    - Recent payments: last 5 payments sorted by date descending
    - Handles edge cases: no rooms, no payments, no expenses, no outstanding
  - **Dependencies**: RoomService, PaymentService, ExpenseService, BalanceService (from prior phases)
  - **Effort**: L

- [x] 1.2 Add getRoomStats method to RoomService
  - **Description**: Add aggregation method for room occupancy statistics
  - **Acceptance Criteria**:
    - Returns total rooms, occupied count, available count, under renovation count
    - Occupancy rate calculated as (occupied / total) × 100, rounded to 1 decimal
    - Returns 0% rate when no rooms exist
    - Excludes rooms from soft-deleted properties
  - **Dependencies**: RoomService (from Phase 3)
  - **Effort**: S

- [x] 1.3 Add getTopOutstandingBalances method to BalanceService
  - **Description**: Add method to retrieve tenants with highest outstanding balances
  - **Acceptance Criteria**:
    - Returns top N tenants sorted by balance descending
    - Includes tenant name, room number, balance amount
    - Excludes moved-out tenants
    - Also returns total count of tenants with balance > 0
    - Returns empty array and count 0 when all tenants paid up
  - **Dependencies**: BalanceService (from Phase 6)
  - **Effort**: S

- [x] 1.4 Add getRecentPayments method to PaymentService
  - **Description**: Add method to retrieve most recent payments for a property
  - **Acceptance Criteria**:
    - Returns last N payments sorted by date descending
    - Includes tenant name, payment amount, payment date
    - Returns empty array when no payments exist
  - **Dependencies**: PaymentService (from Phase 5)
  - **Effort**: S

- [x] 1.5 Write unit tests for DashboardService
  - **Description**: Test dashboard aggregation and edge cases
  - **Acceptance Criteria**:
    - Tests for occupancy calculation (full, empty, mixed, zero rooms)
    - Tests for finance snapshot (with data, no data)
    - Tests for outstanding balances (ordering, limit, all paid)
    - Tests for recent payments (ordering, limit, empty)
    - Tests for parallel fetch and partial failure handling
    - Property-based tests for correctness properties
    - Minimum 15 tests
  - **Dependencies**: 1.1, 1.2, 1.3, 1.4
  - **Effort**: M

## 2. API Layer

- [x] 2.1 Implement dashboard API route
  - **Description**: Create REST endpoint for dashboard data
  - **Acceptance Criteria**:
    - GET /api/properties/[propertyId]/dashboard
    - Returns aggregated DashboardData response
    - Property access middleware applied
    - Response time target: <3 seconds
    - Consistent JSON response format
  - **Dependencies**: 1.1
  - **Effort**: M

- [x] 2.2 Write API route tests
  - **Description**: Test dashboard endpoint
  - **Acceptance Criteria**:
    - Tests for success response with all sections populated
    - Tests for empty property (all zeros/empty)
    - Tests for unauthorized access (403)
    - Tests for nonexistent property (404)
    - Performance test: response under 3 seconds with seeded data
    - Minimum 6 tests
  - **Dependencies**: 2.1
  - **Effort**: S

## 3. UI Layer

- [x] 3.1 Create DashboardPage
  - **Description**: Build the main dashboard page layout
  - **Acceptance Criteria**:
    - Route: / (app root within authenticated layout)
    - Vertical stack: OccupancyCard, FinanceSummaryCard, OutstandingBalancesList, RecentPaymentsList
    - Quick links to Rooms and Tenants for the active property
    - Pull-to-refresh or refresh button
    - Skeleton loading per section
    - Error state with retry for full load failure
    - Partial error: show available sections, error message for failed section
    - All text via translation keys
    - Fetches data via TanStack Query with 1-minute stale time
  - **Dependencies**: 2.1
  - **Effort**: L

- [x] 3.2 Create OccupancyCard component
  - **Description**: Build occupancy statistics card
  - **Acceptance Criteria**:
    - Displays: total rooms, occupied, available, under renovation, occupancy rate
    - Occupancy rate prominently displayed as percentage
    - Room counts with status-colored indicators + text labels
    - Empty state when no rooms
    - Full-width card on mobile
    - Skeleton loader while loading
  - **Dependencies**: None
  - **Effort**: M

- [x] 3.3 Create FinanceSummaryCard component
  - **Description**: Build current month finance summary card
  - **Acceptance Criteria**:
    - Displays: month/year label, income, expenses, net income
    - Net income color-coded (positive green, negative red, zero neutral) with text
    - All amounts formatted per locale currency via Intl.NumberFormat
    - Full-width card on mobile
    - Skeleton loader while loading
  - **Dependencies**: None
  - **Effort**: M

- [x] 3.4 Create OutstandingBalancesList component
  - **Description**: Build top outstanding balances list
  - **Acceptance Criteria**:
    - Lists up to 5 tenants: name, room number, balance amount
    - Sorted by balance descending
    - Balance with red color-coded indicator + text label
    - "View All" link when more than 5 tenants owe
    - Empty state: "All tenants are up to date" with positive indicator
    - Tappable rows navigate to tenant detail (44x44px touch targets)
    - Skeleton loader while loading
  - **Dependencies**: None
  - **Effort**: M

- [x] 3.5 Create RecentPaymentsList component
  - **Description**: Build recent payments list
  - **Acceptance Criteria**:
    - Lists up to 5 payments: tenant name, amount, date
    - Sorted by date descending
    - Amount formatted per locale currency
    - Date formatted per locale
    - "View All" link to payments page
    - Empty state: "No payments recorded yet"
    - Tappable rows (44x44px touch targets)
    - Skeleton loader while loading
  - **Dependencies**: None
  - **Effort**: S

- [x] 3.6 Set dashboard as default route in app layout
  - **Description**: Configure dashboard as the landing page after login
  - **Acceptance Criteria**:
    - Root route / within (app) layout renders DashboardPage
    - Dashboard is the default destination after login/registration
    - Dashboard is the default destination after property selection
    - Bottom navigation highlights dashboard entry
  - **Dependencies**: 3.1
  - **Effort**: S

## 4. Internationalization (i18n)

- [x] 4.1 Extract and translate dashboard strings
  - **Description**: Add all dashboard UI text to translation files
  - **Acceptance Criteria**:
    - All section titles, labels, messages in en.json and id.json
    - Translation keys follow `dashboard.*` convention
    - Empty states and error messages translated
    - "View All" links translated
    - Loading and retry messages translated
  - **Dependencies**: 3.1, 3.2, 3.3, 3.4, 3.5
  - **Effort**: S

## 5. Testing & Validation

- [x] 5.1 Test dashboard with populated data
  - **Description**: Verify dashboard displays correct data when property has rooms, tenants, payments, expenses
  - **Acceptance Criteria**:
    - Occupancy stats match actual room statuses
    - Finance amounts match sum of current month's payments and expenses
    - Outstanding list shows correct top 5 tenants
    - Recent payments show correct last 5 entries
    - Dashboard loads within 3 seconds
  - **Dependencies**: 3.1
  - **Effort**: M

- [x] 5.2 Test dashboard with empty property
  - **Description**: Verify dashboard handles empty state gracefully
  - **Acceptance Criteria**:
    - All sections show appropriate empty states
    - No errors or broken layouts
    - Helpful guidance messages displayed
  - **Dependencies**: 3.1
  - **Effort**: S

- [x] 5.3 Test dashboard data freshness
  - **Description**: Verify dashboard reflects recent changes
  - **Acceptance Criteria**:
    - After adding a room, dashboard occupancy updates on refresh
    - After recording a payment, dashboard income and recent payments update
    - After adding an expense, dashboard expense total updates
    - Pull-to-refresh reloads all sections
  - **Dependencies**: 3.1
  - **Effort**: S

- [x] 5.4 Test mobile responsiveness
  - **Description**: Verify dashboard works on mobile
  - **Acceptance Criteria**:
    - Dashboard renders at 320px-480px without horizontal scroll
    - All stat cards readable at phone scale
    - Touch targets minimum 44x44px for tappable items
    - Numbers and currency amounts readable without zoom
    - Section ordering: occupancy → finance → outstanding → payments
  - **Dependencies**: 3.1
  - **Effort**: M

## Open Questions / Assumptions

- **Occupancy Rate**: Calculated from current snapshot, not historical average. Rooms with "under_renovation" status are counted in total but not in occupied.
- **Finance Month**: Always uses current calendar month (UTC). No month navigation on dashboard — use Finance page for historical data.
- **Outstanding Balance Calculation**: Uses same logic as Outstanding Balance feature (rent - payments). Dashboard reads the already-computed values.
- **Performance**: Dashboard queries run in parallel. With proper database indexes, all queries should complete within 1 second each.
- **Pull-to-Refresh**: Implemented via TanStack Query's `refetch`. No WebSocket or Server-Sent Events for real-time updates in MVP.
