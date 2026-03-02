# Requirements: Dashboard / Overview

## Context & Problem

After logging in, property managers need a single screen that answers their most frequent questions: "How full is my property?", "How is my cash flow this month?", "Who owes money?", and "What payments came in recently?". Without a centralized dashboard, managers must navigate to multiple pages to gather this information, wasting time and making it easy to miss important issues like rising vacancies or mounting outstanding balances.

## Goals

- Provide a single landing page after login that summarizes the active property's key metrics
- Display occupancy statistics (total rooms, occupied, available, occupancy rate)
- Display current month's finance summary (income, expenses, net income)
- Highlight tenants with outstanding balances for quick action
- Show recent payment activity for at-a-glance verification
- Deliver a mobile-optimized, glanceable layout that loads quickly
- All data scoped to the active property

## Non-Goals

- Interactive charts or graphs (simple numbers and lists are sufficient for MVP)
- Historical trends or comparison with previous months
- Customizable dashboard layout or widgets
- Notifications or alerts
- Multi-property aggregate dashboard (one property at a time)
- Real-time auto-refresh (manual refresh is sufficient)
- Export or download functionality

## Glossary

- **Occupancy Rate**: Percentage of rooms with status "occupied" out of total rooms
- **Finance Summary**: Monthly income, expenses, and net income for the active property
- **Outstanding Balances List**: Tenants with balance greater than zero, sorted by amount descending
- **Recent Payments**: The most recent payment records for the active property

## Functional Requirements

### Requirement 1: Occupancy Statistics

**User Story:** As a property manager, I want to see occupancy stats at a glance, so that I understand how full my property is.

#### Acceptance Criteria

1. WHEN a manager views the dashboard, THE System SHALL display the total number of rooms for the active property
2. WHEN a manager views the dashboard, THE System SHALL display the count of occupied rooms and the count of available rooms
3. WHEN a manager views the dashboard, THE System SHALL display the occupancy rate as a percentage (occupied / total rooms × 100)
4. WHEN all rooms are occupied, THE System SHALL display 100% occupancy rate
5. WHEN no rooms exist, THE System SHALL display 0 rooms with an appropriate empty state message
6. WHEN a manager views occupancy on mobile, THE System SHALL display stats in a compact card format that is readable without scrolling

### Requirement 2: Finance Summary

**User Story:** As a property manager, I want to see this month's financial summary on the dashboard, so that I understand my cash flow at a glance.

#### Acceptance Criteria

1. WHEN a manager views the dashboard, THE System SHALL display the current month's total income (sum of payments)
2. WHEN a manager views the dashboard, THE System SHALL display the current month's total expenses
3. WHEN a manager views the dashboard, THE System SHALL display the current month's net income (income minus expenses)
4. WHEN net income is positive, THE System SHALL display it with a positive indicator (color + text)
5. WHEN net income is negative, THE System SHALL display it with a negative indicator (color + text)
6. WHEN a manager views finance amounts, THE System SHALL format them using the locale's currency settings via `Intl.NumberFormat`

### Requirement 3: Outstanding Balances List

**User Story:** As a property manager, I want to see which tenants owe money, so that I can prioritize collection.

#### Acceptance Criteria

1. WHEN a manager views the dashboard, THE System SHALL display a list of tenants with outstanding balance greater than zero
2. WHEN a manager views the outstanding list, THE System SHALL display each tenant's name, room number, and balance amount
3. WHEN a manager views the outstanding list, THE System SHALL sort tenants by balance amount descending (highest owed first)
4. WHEN all tenants are paid up, THE System SHALL display a positive message (e.g., "All tenants are up to date")
5. WHEN a manager views the list, THE System SHALL limit display to the top 5 tenants with a "View All" link if more exist
6. WHEN a manager taps a tenant in the list, THE System SHALL navigate to that tenant's detail page
7. WHEN a manager views balance amounts, THE System SHALL use color-coded indicators with text (not color alone)

### Requirement 4: Recent Payments

**User Story:** As a property manager, I want to see recent payments, so that I can verify what has been recorded.

#### Acceptance Criteria

1. WHEN a manager views the dashboard, THE System SHALL display the 5 most recent payments for the active property
2. WHEN a manager views recent payments, THE System SHALL display each payment's tenant name, amount, and payment date
3. WHEN a manager views recent payments, THE System SHALL sort by payment date descending (most recent first)
4. WHEN no payments have been recorded, THE System SHALL display an empty state message
5. WHEN a manager taps a payment entry, THE System SHALL navigate to the payment list or tenant detail
6. WHEN a manager views payment amounts, THE System SHALL format them using the locale's currency settings

### Requirement 5: Dashboard Loading and Data Freshness

**User Story:** As a property manager, I want the dashboard to load quickly and show current data, so that I can trust the information displayed.

#### Acceptance Criteria

1. WHEN a manager navigates to the dashboard, THE System SHALL load and display all dashboard data within 3 seconds
2. WHEN a manager views the dashboard, THE System SHALL display data that reflects the current state of rooms, tenants, payments, and expenses
3. WHEN a manager pulls-to-refresh or taps a refresh control, THE System SHALL reload all dashboard data
4. WHEN dashboard data is loading, THE System SHALL display loading indicators (skeleton screens or spinners) for each section

### Requirement 6: Mobile Optimization

**User Story:** As a property manager using a smartphone, I want the dashboard optimized for mobile viewing, so that I can get a property overview at a glance.

#### Acceptance Criteria

1. WHEN a manager views the dashboard on mobile, THE System SHALL render all content in a single-column layout with no horizontal scrolling
2. WHEN a manager views stat cards on mobile, THE System SHALL display them with large, readable numbers and clear labels
3. WHEN a manager views lists (outstanding balances, recent payments) on mobile, THE System SHALL display them as compact cards with adequate touch targets (44x44px minimum for tappable items)
4. WHEN a manager views the dashboard on screens smaller than 480px, THE System SHALL maintain readability without requiring pinch-to-zoom
5. WHEN a manager views the dashboard, THE System SHALL prioritize the most critical information at the top (occupancy, then finance, then outstanding, then recent payments)

## Constraints

- Dashboard data is read-only — no create/update/delete operations on the dashboard itself
- All data is scoped to the active property
- Occupancy rate calculated from current room statuses (not historical)
- Finance summary uses the current calendar month (UTC)
- Outstanding balances use the same calculation as the Outstanding Balance feature (rent minus payments)
- The system must render the dashboard within 3 seconds with up to 500 rooms, 1,000 tenants, and 10,000 payments
- All timestamps must be in UTC
- The interface must function on mobile devices with screen widths from 320px to 480px
- All user-facing text must be externalized via translation keys
- Currency formatting must use `Intl.NumberFormat` with the locale's currency code
- Color-coded indicators must use both color and text/icon (not color alone)

## Success Criteria

- Dashboard loads within 3 seconds on first visit
- A manager can view occupancy rate, finance summary, outstanding balances, and recent payments on one scrollable mobile screen
- Occupancy statistics accurately reflect current room statuses
- Finance summary accurately reflects current month's income and expenses
- Outstanding balances list shows the correct top 5 tenants by amount owed
- Recent payments list shows the 5 most recent payment records
- All amounts formatted correctly per locale
- All interactive elements accessible via touch without requiring zoom
