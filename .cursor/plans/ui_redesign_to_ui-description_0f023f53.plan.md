---
name: UI redesign to ui-description
overview: "Align the E-Kost UI with the visual and interaction spec in ui-description.md: add design tokens and typography, implement the global layout (AppHeader with room stats + property popover, 4-tab BottomNav), redesign Login and Property Selector, then update each main page and all dialogs to match the spec. Mobile-first, ~480px max-width, consistent tokens and Lucide icons throughout."
todos:
  - id: tokens-typography
    content: Design tokens & typography — finance CSS vars, Plus Jakarta Sans, typography rules
    status: completed
  - id: global-layout
    content: Global layout — AppHeader (switcher popover, room stats, avatar popover with Settings), BottomNav (4 tabs, h-14)
    status: completed
  - id: login-page
    content: Login page — centered card, E-Kost title + subtitle, Sign In, Demo Owner/Staff buttons
    status: completed
  - id: property-selector
    content: Property selector — show when no property active, Select Property + property cards
    status: completed
  - id: overview-page
    content: Overview page — occupancy card, finance summary, balances + View all, recent payments + View finances, quick stats row
    status: completed
  - id: rooms-page
    content: Rooms page — grid, staggered fade-in, room card states (Available, Renovation, Occupied)
    status: pending
  - id: tenants-page
    content: Tenants page — Tenants (N) + Add Tenant, tenant cards with badges
    status: pending
  - id: tenant-detail
    content: Tenant detail page — header actions, info/room/payment/notes, fixed Record Payment
    status: pending
  - id: finance-page
    content: Finance page — month selector, Add Expense, summary/income/expense lists, category breakdown
    status: pending
  - id: settings-page
    content: Settings page — Team (Owner/Staff cards), Add Staff, Remove confirmation
    status: pending
  - id: dialogs
    content: Dialogs — Assign Tenant, Add/Edit Tenant, Payment, Move Out, Add Expense, Room Status (slide-up)
    status: pending
  - id: icons-polish
    content: Icons & polish — Lucide per spec, touch targets ≥44px, spacing, radius, animations
    status: pending
  - id: tests-adjust
    content: Tests — adjust settings E2E and profile-dropdown/login tests for new UI
    status: completed
  - id: tests-add
    content: Tests — add Property Selector, AppNav, ProfileDropdown Settings, optional E2E nav
    status: completed
isProject: false
---

# Plan: Solve Issue #2 — Redesign UI to match [ui-description.md](http://ui-description.md)

**Reference:** [GitHub Issue #2](https://github.com/ahmadfadhil621/e-kost/issues/2), [ui-description.md](d:\Workspace\e-kost\ui-description.md)

---

## To-do list (Issue #2 checklist)

Use this as the authoritative checklist when implementing; each item maps to the sections below. **Done** = implemented and tests green.

- **Design tokens & typography** — **Done**
  - Add/extend CSS variables in `globals.css`: finance (income, expense, profit +/-), ensure status/balance tokens exist
  - Use Plus Jakarta Sans (Google Fonts), apply typography rules (headings, body, captions)
- **Global layout** — **Done**
  - AppHeader (sticky): property switcher (Building2 + name + ChevronDown), room stats line (X occupied · Y avail · Z reno), avatar with initials (teal), popover (name, email, Settings, Logout)
  - BottomNav (fixed, h-14): Overview (LayoutDashboard), Rooms (DoorOpen), Tenants (Users), Finance (Wallet); active = primary, inactive = muted
- **Login page** — **Done**
  - Centered card, E-Kost title + subtitle, email/password, Sign In (primary), Demo Owner / Demo Staff (outline)
- **Property selector** — **Done**
  - Shown when no property active: "Select Property" heading, list of property cards (icon, name, address, room count), tap to set active and enter app
- **Overview page** — **Done**
  - Occupancy card (%, progress bar, room breakdown with colored dots)
  - Finance summary (Income / Expenses side-by-side, Net Profit)
  - Outstanding balances list + "View all tenants →"
  - Recent payments list + "View finances →"
  - Quick stats row (Rooms, Tenants, Net Profit) tappable
- **Rooms page**
  - Grid of room cards, staggered fade-in
  - Room card states: Available (green border/badge, Assign Tenant, Change status), Renovation (amber, muted bg), Occupied (tenant name, Paid ✓ or €X ✗ badge, tap → tenant detail)
- **Tenants page**
  - "Tenants (N)" + Add Tenant (primary, Plus icon)
  - Tenant cards: name, room or Unassigned badge, Paid / €X unpaid badge, tap → tenant detail
- **Tenant detail page**
  - Header: back, name, edit (Pencil), move-out (DoorClosed)
  - Info card (phone, email, move-in), Room card, Payment summary card, Payment history list, Notes + Add Note, fixed "Record Payment" button
- **Finance page**
  - Month selector (chevrons + "March 2026"), Add Expense (outline)
  - Summary cards (Income, Expenses, Net Profit), Income list, Expenses list (category, description, date, amount, delete), Category breakdown (stacked bar + legend)
- **Settings page**
  - Team: Owner card, Staff cards (Remove for owner), Add Staff dialog (owner-only), remove confirmation AlertDialog
- **Dialogs**
  - Assign Tenant, Add/Edit Tenant, Payment, Move Out (with unpaid warning), Add Expense, Room Status — all shadcn Dialog, slide-up, correct fields and actions per spec
- **Icons & polish**
  - Lucide React icons per ui-description.md (nav, header, actions, status, finance categories)
  - Touch targets ≥44px, spacing (p-4–p-6, pb-20), radius 0.5rem, animations (fade-in stagger, dialog slide-up)
- **Testing** — **Done**
  - Adjust: settings navigation E2E, profile-dropdown unit tests (add Settings), login tests if copy/label changes
  - Add: Property Selector (unit + E2E), AppNav unit, optional AppHeader/Settings/Login/Bottom nav E2E

---

## Current state vs spec

- **Done:** Tokens (finance vars in globals.css + tailwind), Plus Jakarta Sans, AppHeader (Popover switcher, room stats line), ProfileDropdown (Settings), AppNav (4 tabs: Overview, Rooms, Tenants, Finance; h-14), Login (card, E-Kost + subtitle, Sign In, Demo buttons), Property Selector (when no property active), Overview (occupancy, finance summary, balances, recent payments, quick stats), tests adjusted/added.
- **Remaining (matches [Issue #2](https://github.com/ahmadfadhil621/e-kost/issues/2) checklist):** Rooms page (grid, room card states, stagger), Tenants page (header + cards), Tenant detail (header actions, fixed Record Payment), Finance page (month selector, Add Expense, lists, category breakdown), Settings (Team cards, Add Staff, Remove), Dialogs (slide-up, spec fields), Icons & polish.

---

## What to do next (aligned with [Issue #2](https://github.com/ahmadfadhil621/e-kost/issues/2))

Same order as the unchecked items on GitHub Issue #2 and the plan’s suggested implementation order:

1. **Rooms page** — Grid of room cards, staggered fade-in; room card states: Available (green border/badge, Assign Tenant, Change status), Renovation (amber, muted bg), Occupied (tenant name, Paid ✓ or €X ✗ badge, tap → tenant detail).
2. **Tenants page** — "Tenants (N)" + Add Tenant (primary, Plus icon); tenant cards: name, room or Unassigned badge, Paid / €X unpaid badge, tap → tenant detail.
3. **Tenant detail page** — Header: back, name, edit (Pencil), move-out (DoorClosed); Info card, Room card, Payment summary, Payment history, Notes + Add Note; fixed "Record Payment" button.
4. **Finance page** — Month selector (chevrons + "March 2026"), Add Expense (outline); summary cards, Income list, Expenses list (category, description, date, amount, delete), Category breakdown (stacked bar + legend).
5. **Settings page** — Team: Owner card, Staff cards (Remove for owner), Add Staff dialog (owner-only), remove confirmation AlertDialog.
6. **Dialogs** — Assign Tenant, Add/Edit Tenant, Payment, Move Out (with unpaid warning), Add Expense, Room Status — all shadcn Dialog, slide-up, correct fields/actions per spec.
7. **Icons & polish** — Lucide per ui-description.md; touch targets ≥44px; spacing (p-4–p-6, pb-20); radius 0.5rem; animations (fade-in stagger, dialog slide-up).
