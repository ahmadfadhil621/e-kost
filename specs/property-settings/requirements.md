# Property Settings — Requirements

Issue: #104

## Overview

Two deliverables in one issue:
1. A dedicated **Property Settings page** (`/properties/[propertyId]/settings/`) replacing the scattered settings currently on the property detail page.
2. A **Staff-only finance mode** toggle — a per-property boolean (`staffOnlyFinance`) that blocks financial mutations for owners when enabled.

---

## Acceptance Criteria

### Settings Page

- AC-1: A "Settings" link appears in the quick-nav grid on the property detail page **only when the current user is the owner**.
- AC-2: Navigating to `/properties/[propertyId]/settings/` renders the settings page for owners. Staff navigating to this URL are redirected (or shown a forbidden state).
- AC-3: The settings page contains two sections: **Access** (staff management) and **Finance** (staff-only finance mode toggle).
- AC-4: The `StaffSection` component is rendered inside the Access section on the settings page and **removed** from the property detail page.

### Staff-Only Finance Mode Toggle

- AC-5: The toggle reflects the current value of `staffOnlyFinance` on the property, defaulting to off.
- AC-6: Toggling the switch sends a `PATCH /api/properties/[propertyId]/settings` request (owner-only) and updates the cached property data on success.
- AC-7: A toast notification confirms the change.
- AC-8: When `staffOnlyFinance` is `true`, the following API endpoints return `403 Forbidden` for requests made by an **owner**:
  - `POST /api/properties/[propertyId]/payments`
  - `DELETE /api/properties/[propertyId]/payments/[paymentId]`
  - `POST /api/properties/[propertyId]/expenses`
  - `PUT /api/properties/[propertyId]/expenses/[expenseId]`
  - `DELETE /api/properties/[propertyId]/expenses/[expenseId]`
- AC-9: When `staffOnlyFinance` is `true`, the UI hides financial action buttons (record/delete payment, add/edit/delete expense) for owners. Owners can still view all finance data.
- AC-10: When `staffOnlyFinance` is `false`, no existing behavior changes for either role.
- AC-11: Staff can always perform financial mutations regardless of the toggle state.
- AC-12: The owner can always toggle the setting on or off — they are never locked out.

### Schema & Data

- AC-13: The `staffOnlyFinance` field is a non-nullable boolean with a default of `false` on the `Property` model.
- AC-14: The `GET /api/properties/[propertyId]` response includes `staffOnlyFinance`.

---

## Out of Scope

- Currency settings (immutable once set)
- Danger zone (archive/delete) migration to settings page — future issue
- Activity log for toggle changes (depends on #106)
- Any other property-level settings not listed above
