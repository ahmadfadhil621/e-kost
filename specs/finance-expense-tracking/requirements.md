# Requirements: Finance & Expense Tracking

## Context & Problem

Property managers incur various recurring and one-time expenses to maintain their rental properties — electricity, water, internet, maintenance, cleaning supplies, and more. Without a centralized expense tracking system, managers cannot calculate net income (rent collected minus expenses), identify cost patterns, or understand the true profitability of each property. Currently, expense data is scattered across personal records, bank statements, and memory, making it impossible to get a clear financial picture on a mobile device while managing properties.

## Goals

- Enable managers to record property-level expenses with category, amount, date, and description
- Provide monthly income summary (total rent payments received in a month)
- Provide monthly expense summary (total expenses recorded in a month)
- Calculate and display net income (income minus expenses) per month
- Offer category-based expense breakdown for cost analysis
- Deliver a mobile-optimized finance overview accessible from the main navigation
- Scope all financial data to the active property

## Non-Goals

- Integration with bank accounts or accounting software
- Automated expense import (CSV, receipt scanning, etc.)
- Tax calculation or tax reporting
- Multi-currency support within a single property (currency is locale-level)
- Budget planning or forecasting
- Expense approval workflows
- Invoice generation
- Recurring expense automation

## Glossary

- **Expense**: A cost incurred for property maintenance or operations, with category, amount, date, and optional description
- **Income**: Total rent payments received from tenants, derived from the Payment records
- **Net Income**: Monthly income minus monthly expenses
- **Expense Category**: A predefined classification for expenses (Electricity, Water, Internet, Maintenance, Cleaning, Supplies, Tax, Transfer, Other)
- **Finance Overview**: The main page showing monthly income, expenses, net income, and category breakdown

## Functional Requirements

### Requirement 1: Expense Recording

**User Story:** As a property manager, I want to record an expense with category, amount, date, and description, so that I can track all costs associated with my property.

#### Acceptance Criteria

1. WHEN a manager accesses the expense recording interface, THE System SHALL display a form with fields for category (dropdown), amount, date, and description (optional)
2. WHEN a manager selects an expense category, THE System SHALL offer the following options: Electricity, Water, Internet, Maintenance, Cleaning, Supplies, Tax, Transfer, Other
3. WHEN a manager submits a valid expense form, THE System SHALL create a new expense record associated with the active property and display a confirmation message
4. WHEN a manager attempts to submit an expense with missing required fields (category, amount, date), THE System SHALL prevent submission and display validation errors
5. WHEN a manager enters an expense amount, THE System SHALL validate that the amount is a positive number
6. WHEN an expense is created, THE System SHALL assign a unique identifier, record the creation timestamp in UTC, and persist immediately
7. WHEN a manager creates an expense, THE System SHALL default the date field to today's date

### Requirement 2: Expense List View

**User Story:** As a property manager, I want to view all expenses for my property, so that I can review and verify expense records.

#### Acceptance Criteria

1. WHEN a manager accesses the expense list, THE System SHALL display all expenses for the active property
2. WHEN a manager views the expense list, THE System SHALL display each expense showing category, amount (formatted per locale), date, and description
3. WHEN a manager views the expense list, THE System SHALL sort expenses by date in descending order (most recent first)
4. WHEN a manager views the expense list on mobile, THE System SHALL render expenses in a single-column card layout with no horizontal scrolling
5. WHEN a manager views the expense list, THE System SHALL allow filtering by month/year
6. WHEN the expense list is empty, THE System SHALL display an empty state message

### Requirement 3: Expense Update

**User Story:** As a property manager, I want to edit an existing expense, so that I can correct mistakes.

#### Acceptance Criteria

1. WHEN a manager views an expense, THE System SHALL display an edit option
2. WHEN a manager taps edit, THE System SHALL display the expense in an editable form pre-populated with current values
3. WHEN a manager saves updated expense data, THE System SHALL persist the changes and display a confirmation
4. WHEN a manager saves an updated expense, THE System SHALL preserve the unique ID and creation timestamp
5. WHEN a manager submits invalid data (negative amount, missing category), THE System SHALL prevent the save and display validation errors

### Requirement 4: Expense Deletion

**User Story:** As a property manager, I want to delete an incorrect expense, so that my financial records remain accurate.

#### Acceptance Criteria

1. WHEN a manager views an expense, THE System SHALL display a delete option
2. WHEN a manager initiates deletion, THE System SHALL display a confirmation dialog
3. WHEN a manager confirms deletion, THE System SHALL permanently remove the expense record
4. WHEN an expense is deleted, THE System SHALL update the finance overview totals immediately

### Requirement 5: Monthly Income Summary

**User Story:** As a property manager, I want to see total income (rent payments) for each month, so that I understand my revenue.

#### Acceptance Criteria

1. WHEN a manager views the finance overview, THE System SHALL display the total income for the selected month
2. WHEN calculating income, THE System SHALL sum all payment amounts recorded for the active property within the selected month
3. WHEN a manager views income, THE System SHALL format the amount according to the active locale's currency settings
4. WHEN no payments exist for the selected month, THE System SHALL display income as zero

### Requirement 6: Monthly Expense Summary

**User Story:** As a property manager, I want to see total expenses for each month, so that I understand my costs.

#### Acceptance Criteria

1. WHEN a manager views the finance overview, THE System SHALL display the total expenses for the selected month
2. WHEN calculating expenses, THE System SHALL sum all expense amounts recorded for the active property within the selected month
3. WHEN a manager views the expense summary, THE System SHALL also display a category breakdown showing the total for each expense category
4. WHEN a manager views the category breakdown, THE System SHALL display categories sorted by amount descending (highest cost first)
5. WHEN no expenses exist for the selected month, THE System SHALL display expenses as zero

### Requirement 7: Net Income Display

**User Story:** As a property manager, I want to see net income (income minus expenses) for each month, so that I understand my property's profitability.

#### Acceptance Criteria

1. WHEN a manager views the finance overview, THE System SHALL display net income calculated as monthly income minus monthly expenses
2. WHEN net income is positive, THE System SHALL display it with a positive indicator (color + text)
3. WHEN net income is negative, THE System SHALL display it with a negative indicator (color + text)
4. WHEN net income is zero, THE System SHALL display it as zero with a neutral indicator
5. WHEN a manager views net income on mobile, THE System SHALL ensure the amount and indicator are clearly readable

### Requirement 8: Month Navigation

**User Story:** As a property manager, I want to navigate between months to view historical financial data, so that I can track trends over time.

#### Acceptance Criteria

1. WHEN a manager views the finance overview, THE System SHALL default to the current month
2. WHEN a manager taps a previous/next month control, THE System SHALL update all financial data to reflect the selected month
3. WHEN a manager navigates months, THE System SHALL update income, expenses, net income, and category breakdown for the newly selected month
4. WHEN a manager views the month selector on mobile, THE System SHALL ensure navigation controls have minimum 44x44px touch targets

### Requirement 9: Mobile Optimization

**User Story:** As a property manager using a smartphone, I want the finance overview optimized for mobile use, so that I can check my property's finances on-the-go.

#### Acceptance Criteria

1. WHEN a manager views the finance overview on mobile, THE System SHALL render all content in a single-column layout with no horizontal scrolling
2. WHEN a manager views summary cards (income, expenses, net income) on mobile, THE System SHALL display them prominently with large, readable amounts
3. WHEN a manager views the category breakdown on mobile, THE System SHALL display categories in a simple list format with amounts right-aligned
4. WHEN a manager taps interactive elements, THE System SHALL ensure minimum 44x44px touch targets
5. WHEN a manager views the interface on screens smaller than 480px, THE System SHALL maintain readability without requiring pinch-to-zoom

## Constraints

- All expense data must be persisted immediately upon creation or modification
- Expenses are scoped to the active property via `propertyId`
- Expense amounts must be positive numbers
- All timestamps must be recorded in UTC timezone
- The system must support at least 5,000 expense records per property without performance degradation
- Expense categories are a fixed set: Electricity, Water, Internet, Maintenance, Cleaning, Supplies, Tax, Transfer, Other
- Income is derived from Payment records (read-only in finance context, no duplicate recording)
- Currency formatting must use `Intl.NumberFormat` with the locale's currency code
- All monetary amounts stored as plain decimals in the database
- The interface must function on mobile devices with screen widths from 320px to 480px
- All user-facing text must be externalized via translation keys
- Expense deletion is a hard delete (can be corrected immediately; no audit trail in MVP)

## Success Criteria

- A manager can record an expense in fewer than 20 seconds
- A manager can view monthly income, expenses, and net income at a glance on one mobile screen
- A manager can identify the highest expense categories for any given month
- Finance overview loads within 2 seconds
- Category breakdown accurately sums all expenses per category for the selected month
- All amounts are formatted correctly per the active locale
- All interactive elements are accessible via touch without requiring zoom
