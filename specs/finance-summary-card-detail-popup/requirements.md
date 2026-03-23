# Finance Summary Card Detail Popup — Requirements

**Issue:** #12 — D-3
**Scope:** Dashboard `FinanceSummaryCard` income and expense rows

## Functional Requirements

### REQ 1 — Clickable Income Row
The Income row in `FinanceSummaryCard` must be tappable/clickable.
Clicking it opens a popup showing income details for the current month.

### REQ 2 — Clickable Expenses Row
The Expenses row in `FinanceSummaryCard` must be tappable/clickable.
Clicking it opens a popup showing expense details for the current month.

### REQ 3 — Income Detail Popup Content
The income popup must show:
- A title indicating this is the income detail
- The total income amount for the month, formatted as currency
- A label indicating income comes from rent payments

### REQ 4 — Expense Detail Popup Content
The expense popup must show:
- A title indicating this is the expense breakdown
- The total expense amount for the month, formatted as currency
- A list of expense categories with their amounts, sorted by total descending
- Only categories with a non-zero total are shown
- When no expenses exist, a "no expenses" message is shown

### REQ 5 — Popup Dismissal
Both popups must be dismissable via:
- A close (X) button inside the popup
- Clicking outside the popup (backdrop)
- Pressing Escape key
After dismissal the popup is removed from the DOM.

### REQ 6 — Accessibility and Touch Targets
- Clickable income and expense rows must have a minimum touch target of 44×44px
- The popup must be keyboard-accessible (focus-trapped inside the dialog when open)
- Both trigger buttons must have appropriate ARIA labels

### REQ 7 — i18n
All new UI strings must be translated in both `locales/en.json` and `locales/id.json`.
Existing `expense.category.*` keys must be reused for category labels.

### REQ 8 — No New API Requests
The popup must display using data already fetched for the dashboard.
No additional network requests should be triggered when opening a popup.

## Non-Functional Requirements

- Component: shadcn `Dialog` (keyboard-accessible, uses Radix UI primitives)
- Mobile-first: designed for 320–480px viewport widths
- No changes to prisma schema
