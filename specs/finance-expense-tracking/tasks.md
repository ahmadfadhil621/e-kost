# Tasks: Finance & Expense Tracking

## 1. Domain Layer

- [ ] 1.1 Define Expense entity, categories enum, and validation schemas
  - **Description**: Create shared Zod schemas, TypeScript interfaces, and the expense category enum
  - **Acceptance Criteria**:
    - ExpenseCategory type with 9 values (electricity, water, internet, maintenance, cleaning, supplies, tax, transfer, other)
    - `createExpenseSchema` validates category (enum), amount (positive), date (valid), description (optional, max 1000)
    - `updateExpenseSchema` validates partial updates
    - `financeSummaryQuerySchema` validates year (int, 2000-2100) and month (int, 1-12)
    - TypeScript interfaces: Expense, ExpenseSummary, CategoryBreakdown, FinanceSummary
  - **Dependencies**: None
  - **Effort**: S

- [ ] 1.2 Define IExpenseRepository interface
  - **Description**: Create repository interface for expense data access
  - **Acceptance Criteria**:
    - Methods: create, findById, findByProperty (with filters), update, delete
    - Aggregation methods: sumByMonth, sumByMonthGroupedByCategory
    - All methods return typed promises
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [ ] 2.1 Implement ExpenseService
  - **Description**: Build service layer with expense CRUD and monthly aggregation logic
  - **Acceptance Criteria**:
    - `createExpense` validates category, amount > 0, date valid, associates with property
    - `listExpenses` returns expenses sorted by date descending, supports month/category filters
    - `updateExpense` validates expense exists and belongs to property
    - `deleteExpense` hard-deletes after existence validation
    - `getMonthlyExpenseSummary` returns total and category breakdown for given month
  - **Dependencies**: 1.2
  - **Effort**: M

- [ ] 2.2 Implement FinanceSummaryService
  - **Description**: Build service that combines income (from payments) and expenses into monthly summary
  - **Acceptance Criteria**:
    - `getMonthlySummary` returns income, expenses, netIncome, categoryBreakdown
    - Income calculated by summing Payment amounts for the property/month
    - Net income = income - expenses
    - Category breakdown sorted by total descending
    - Handles months with no data (returns zeros)
  - **Dependencies**: 2.1
  - **Effort**: M

- [ ] 2.3 Write unit tests for ExpenseService and FinanceSummaryService
  - **Description**: Test all expense and finance summary business logic
  - **Acceptance Criteria**:
    - Expense CRUD tests (valid, invalid category, negative amount, missing fields)
    - Monthly income calculation tests (single, multiple, none, cross-month)
    - Monthly expense summary tests (totals, category grouping)
    - Net income tests (positive, negative, zero)
    - Category breakdown completeness (sum of categories = total)
    - Property-based tests for correctness properties
    - Minimum 25 tests
  - **Dependencies**: 2.1, 2.2
  - **Effort**: L

## 3. Data Layer

- [ ] 3.1 Verify Prisma schema for Expense
  - **Description**: Ensure Expense model exists with correct fields, indexes, and relations
  - **Acceptance Criteria**:
    - Expense model: id, propertyId, category, amount (Decimal 12,2), date (Date), description (Text, nullable), createdAt, updatedAt
    - Indexes on propertyId, (propertyId + date), category
    - Relation to Property model
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

- [ ] 3.2 Implement PrismaExpenseRepository
  - **Description**: Implement IExpenseRepository using Prisma client
  - **Acceptance Criteria**:
    - All interface methods implemented
    - findByProperty supports year/month/category filtering
    - sumByMonth uses Prisma aggregate for efficient calculation
    - sumByMonthGroupedByCategory uses Prisma groupBy
    - Date filtering uses UTC month boundaries
  - **Dependencies**: 1.2, 3.1
  - **Effort**: M

## 4. API Layer

- [ ] 4.1 Implement expense CRUD API routes
  - **Description**: Create REST endpoints for expense management
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/expenses — create expense
    - GET /api/properties/[propertyId]/expenses — list expenses (with query filters)
    - GET /api/properties/[propertyId]/expenses/[expenseId] — get single expense
    - PUT /api/properties/[propertyId]/expenses/[expenseId] — update expense
    - DELETE /api/properties/[propertyId]/expenses/[expenseId] — delete expense
    - Property access middleware applied
    - Input validation with Zod schemas
  - **Dependencies**: 2.1, 3.2
  - **Effort**: L

- [ ] 4.2 Implement finance summary API route
  - **Description**: Create endpoint for monthly finance summary
  - **Acceptance Criteria**:
    - GET /api/properties/[propertyId]/finance/summary?year=YYYY&month=M
    - Returns: income, expenses, netIncome, categoryBreakdown
    - Validates year/month query params
    - Property access middleware applied
    - Response within 2 seconds
  - **Dependencies**: 2.2, 3.2
  - **Effort**: M

- [ ] 4.3 Write API route tests
  - **Description**: Test all expense and finance API endpoints
  - **Acceptance Criteria**:
    - Tests for each expense endpoint: success, validation, not found, unauthorized
    - Tests for finance summary: valid month, no data, edge cases
    - Minimum 18 tests
  - **Dependencies**: 4.1, 4.2
  - **Effort**: L

## 5. UI Layer

- [ ] 5.1 Create FinanceOverview page
  - **Description**: Build the main finance page with monthly summary and category breakdown
  - **Acceptance Criteria**:
    - Route: /finance
    - MonthSelector at top for month navigation
    - Three SummaryCards: Income, Expenses, Net Income
    - Net income color-coded (positive/negative/zero)
    - CategoryBreakdownList below summary
    - Link to expense list
    - "Add Expense" button
    - Loading and empty states
    - All amounts formatted via locale currency
    - Fetches data via TanStack Query
  - **Dependencies**: 4.2
  - **Effort**: L

- [ ] 5.2 Create SummaryCard component
  - **Description**: Build reusable card for displaying financial amounts
  - **Acceptance Criteria**:
    - Props: label, amount, variant (income/expense/net/neutral)
    - Large readable amount with locale currency formatting
    - Color-coded indicator (positive green, negative red, neutral default)
    - Color + text indicator (not color alone)
    - Full-width on mobile
  - **Dependencies**: None
  - **Effort**: S

- [ ] 5.3 Create MonthSelector component
  - **Description**: Build month navigation control
  - **Acceptance Criteria**:
    - Previous/next arrow buttons (44x44px touch targets)
    - Current month/year display (e.g., "March 2026")
    - Month display formatted per locale
    - Updates parent state on navigation
    - Accessible: aria-labels on buttons
  - **Dependencies**: None
  - **Effort**: S

- [ ] 5.4 Create CategoryBreakdownList component
  - **Description**: Build sorted category list with amounts
  - **Acceptance Criteria**:
    - Lists categories sorted by amount descending
    - Each row: category icon + translated label, amount right-aligned
    - Percentage of total shown as secondary text
    - Empty state when no expenses
    - Full-width on mobile
  - **Dependencies**: None
  - **Effort**: S

- [ ] 5.5 Create ExpenseList page
  - **Description**: Build expense list view with filtering
  - **Acceptance Criteria**:
    - Route: /finance/expenses
    - Card layout showing expenses sorted by date descending
    - Each card: category icon + label, amount, date, description preview
    - Filter by month selector
    - "Add Expense" button
    - Edit/delete actions on each card (44x44px touch targets)
    - Loading and empty states
    - Single-column on mobile
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.6 Create ExpenseForm component
  - **Description**: Build form for creating and editing expenses
  - **Acceptance Criteria**:
    - Fields: category (select), amount (number), date (date picker, defaults today), description (textarea, optional)
    - Client-side validation with React Hook Form + Zod
    - Category options translated via i18n
    - Supports create and edit modes
    - 44x44px touch targets
    - Loading state on submission
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.7 Add finance entry to bottom navigation
  - **Description**: Add finance page link to the app's bottom navigation
  - **Acceptance Criteria**:
    - Finance icon + label in bottom nav
    - Active state when on /finance routes
    - 44x44px touch target
    - Translated label
  - **Dependencies**: 5.1
  - **Effort**: S

## 6. Internationalization (i18n)

- [ ] 6.1 Extract and translate finance and expense strings
  - **Description**: Add all finance and expense UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `finance.*` and `expense.*` conventions
    - All 9 category labels translated
    - Validation messages translated
    - Summary labels and indicators translated
    - Month names formatted per locale via Intl.DateTimeFormat
  - **Dependencies**: 5.1, 5.5, 5.6
  - **Effort**: S

## 7. Testing & Validation

- [ ] 7.1 Test expense CRUD workflow
  - **Description**: Verify expense creation, editing, and deletion
  - **Acceptance Criteria**:
    - Can record expense in under 20 seconds
    - Expense appears in list immediately
    - Edit updates persisted correctly
    - Delete removes and updates totals
  - **Dependencies**: 5.5, 5.6
  - **Effort**: S

- [ ] 7.2 Test finance overview calculations
  - **Description**: Verify income, expense, and net income calculations
  - **Acceptance Criteria**:
    - Monthly income matches sum of payments
    - Monthly expenses match sum of expenses
    - Net income = income - expenses
    - Category breakdown sums to total expenses
    - Finance overview loads within 2 seconds
  - **Dependencies**: 5.1
  - **Effort**: M

- [ ] 7.3 Test month navigation
  - **Description**: Verify month selection updates all financial data
  - **Acceptance Criteria**:
    - Previous/next month updates all summary values
    - Empty months show zeros
    - Month display matches selected month
  - **Dependencies**: 5.1
  - **Effort**: S

- [ ] 7.4 Test mobile responsiveness
  - **Description**: Verify finance screens work on mobile
  - **Acceptance Criteria**:
    - Finance overview renders at 320px-480px
    - Summary cards readable at phone scale
    - Category breakdown list displays correctly
    - All touch targets minimum 44x44px
    - Currency amounts formatted correctly
  - **Dependencies**: 5.1, 5.5
  - **Effort**: M

## Open Questions / Assumptions

- **Income Source**: Income is derived from Payment records, not manually entered. Finance overview reads from the same payment data used by the Payment Recording feature.
- **Expense Categories**: Fixed in MVP. User-configurable categories are post-MVP.
- **Month Boundaries**: Aggregation uses calendar month in UTC. An expense recorded on March 31 at 23:00 UTC counts for March regardless of the user's local timezone.
- **Multi-Month View**: MVP shows one month at a time. Trends or multi-month comparisons are post-MVP.
- **Decimal Precision**: Amounts stored with 2 decimal places. Aggregation maintains precision via database SUM.
