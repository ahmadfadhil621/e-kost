---
name: UI redesign to ui-description
overview: "Align the E-Kost UI with the visual and interaction spec in ui-description.md: add design tokens and typography, implement the global layout (AppHeader with room stats + property popover, 4-tab BottomNav), redesign Login and Property Selector, then update each main page and all dialogs to match the spec. Mobile-first, ~480px max-width, consistent tokens and Lucide icons throughout."
todos:
  - id: tokens-typography
    content: Design tokens & typography — finance CSS vars, Plus Jakarta Sans, typography rules
    status: pending
  - id: global-layout
    content: Global layout — AppHeader (switcher popover, room stats, avatar popover with Settings), BottomNav (4 tabs, h-14)
    status: pending
  - id: login-page
    content: Login page — centered card, E-Kost title + subtitle, Sign In, Demo Owner/Staff buttons
    status: pending
  - id: property-selector
    content: Property selector — show when no property active, Select Property + property cards
    status: pending
  - id: overview-page
    content: Overview page — occupancy card, finance summary, balances + View all, recent payments + View finances, quick stats row
    status: pending
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
    status: pending
  - id: tests-add
    content: Tests — add Property Selector, AppNav, ProfileDropdown Settings, optional E2E nav
    status: pending
isProject: false
---

# Plan: Solve Issue #2 — Redesign UI to match [ui-description.md](http://ui-description.md)

**Reference:** [GitHub Issue #2](https://github.com/ahmadfadhil621/e-kost/issues/2), [ui-description.md](d:\Workspace\e-kost\ui-description.md)

---

## To-do list (Issue #2 checklist)

Use this as the authoritative checklist when implementing; each item maps to the sections below.

- **Design tokens & typography**
  - Add/extend CSS variables in `globals.css`: finance (income, expense, profit +/-), ensure status/balance tokens exist
  - Use Plus Jakarta Sans (Google Fonts), apply typography rules (headings, body, captions)
- **Global layout**
  - AppHeader (sticky): property switcher (Building2 + name + ChevronDown), room stats line (X occupied · Y avail · Z reno), avatar with initials (teal), popover (name, email, Settings, Logout)
  - BottomNav (fixed, h-14): Overview (LayoutDashboard), Rooms (DoorOpen), Tenants (Users), Finance (Wallet); active = primary, inactive = muted
- **Login page**
  - Centered card, E-Kost title + subtitle, email/password, Sign In (primary), Demo Owner / Demo Staff (outline)
- **Property selector**
  - Shown when no property active: "Select Property" heading, list of property cards (icon, name, address, room count), tap to set active and enter app
- **Overview page**
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
- **Testing**
  - Adjust: settings navigation E2E, profile-dropdown unit tests (add Settings), login tests if copy/label changes
  - Add: Property Selector (unit + E2E), AppNav unit, optional AppHeader/Settings/Login/Bottom nav E2E

---

## Current state vs spec

- **Routes:** App uses `/`, `/properties`, `/properties/[propertyId]/rooms|tenants|finance`, `/settings`. Spec uses logical names (Overview, Rooms, Tenants, Finance); URLs stay as-is. Settings is spec’d via header avatar only, not bottom nav.
- **Layout:** [src/app/(app)/layout.tsx](d:\Workspace\e-kost\src\app(app)\layout.tsx) has AppHeader + main + AppNav. Header has PropertySwitcher (Sheet) and ProfileDropdown (no Settings link). [AppNav](d:\Workspace\e-kost\src\components\layout\app-nav.tsx) has only Dashboard + Settings; spec requires Overview, Rooms, Tenants, Finance (4 tabs), h-14, active=primary/inactive=muted.
- **Tokens:** [globals.css](d:\Workspace\e-kost\src\app\globals.css) has status/balance tokens; **finance** tokens (income, expense, profit +/-) are missing. [tailwind.config.ts](d:\Workspace\e-kost\tailwind.config.ts) has no `finance-`* color mappings.
- **Font:** Root layout uses Inter; spec requires **Plus Jakarta Sans** (Google Fonts).
- **Property selection:** When `!activeId && properties.length > 0` the app redirects to `/properties`. Spec wants a dedicated **Property Selector** screen (heading “Select Property”, list of property cards with icon, name, address, room count, tap to set active and enter app).
- **Login:** [login-form.tsx](d:\Workspace\e-kost\src\components\auth\login-form.tsx) has no E-Kost title + building icon, no “Demo Owner” / “Demo Staff” buttons.

---

## 1. Design tokens and typography

- **globals.css:** Add finance variables in `:root` and `.dark` as in ui-description (lines 291–307): `--finance-income`, `--finance-income-foreground`, `--finance-expense`, `--finance-expense-foreground`, `--finance-profit-positive`, `--finance-profit-negative`.
- **tailwind.config.ts:** Extend `theme.extend.colors` with `finance-income`, `finance-income-foreground`, `finance-expense`, `finance-expense-foreground`, `finance-profit-positive`, `finance-profit-negative` mapping to `hsl(var(--...))`.
- **Root layout:** In [src/app/layout.tsx](d:\Workspace\e-kost\src\app\layout.tsx), replace Inter with **Plus Jakarta Sans** (e.g. `next/font/google` with `Plus_Jakarta_Sans`), apply to `body`. Ensure typography rules from spec (headings `font-semibold`, body `text-sm`, captions `text-xs`) are achievable via existing utilities; add a short comment or small typography section in globals if needed for consistency.

---

## 2. Global layout

- **AppHeader** [src/components/layout/app-header.tsx](d:\Workspace\e-kost\src\components\layout\app-header.tsx):
  - Use `bg-card border-b border-border` (spec: white card bg, bottom border).
  - **Property switcher:** Replace Sheet with a **Popover**: trigger = Building2 icon + property name + ChevronDown; content = list of properties (and “Add property” / “View all” if desired). Use [Popover](d:\Workspace\e-kost\src\components\ui\popover.tsx) if present, else add shadcn Popover.
  - **Room stats line:** Second row under the switcher row: “X occupied · Y avail · Z reno” with colored dots (teal/green/amber per spec). Data from dashboard or a small API (e.g. dashboard summary or new endpoint). Only show when `activePropertyId` is set.
  - **Avatar:** Keep circular avatar with initials, `bg-primary text-primary-foreground` (teal). Popover: name, email, **Settings** link (to `/settings`), Logout. Update [profile-dropdown.tsx](d:\Workspace\e-kost\src\components\auth\profile-dropdown.tsx) to add Settings (with Settings icon) before Logout.
- **AppNav** [src/components/layout/app-nav.tsx](d:\Workspace\e-kost\src\components\layout\app-nav.tsx):
  - Replace items with: Overview (`/` or `/properties/[id]`), Rooms, Tenants, Finance. Use icons: LayoutDashboard, DoorOpen, Users, Wallet. Remove Settings from nav.
  - Nav must be property-aware: links go to `/properties/[activePropertyId]/rooms`, etc. When `activePropertyId` is null, nav can point to `#` or be disabled until property is selected.
  - Height `h-14`, labels 11px semibold (e.g. `text-[11px] font-semibold`). Active: `text-primary`; inactive: `text-muted-foreground`. Background `bg-card border-t border-border`.
- **Main content:** Ensure `main` has `pb-20` to clear bottom nav; keep `px-4` (spec: p-4–p-6, pb-20). Optionally add `max-w-[480px] mx-auto` for mobile-first centering.

---

## 3. Login page

- **Layout:** Centered card, `max-w-sm`, card styling per spec (bg-card, border).
- **Copy:** App title “E-Kost” with Building2 icon, subtitle from i18n (e.g. “Boarding House Management”).
- **Form:** Email + password with labels; “Sign In” full-width primary button.
- **Demo buttons:** Two outline buttons below: “Demo Owner Account” and “Demo Staff Account” (smaller text). Wire to prefill or auto-sign-in with demo credentials if backend supports it; otherwise prefill only and keep “Sign In” as submit.
- **Auth layout:** Ensure login route has no header/bottom nav (already in (auth) group; verify no app header/nav is rendered).

---

## 4. Property selector

- **When to show:** In (app) layout, when user is authenticated and `!activePropertyId` and `properties.length > 0` (and not loading). Render a **PropertySelector** view instead of `children`; no need to redirect to `/properties`.
- **When no properties:** Keep current behavior (e.g. dashboard shows “no properties” + CTA to create).
- **PropertySelector component:** New component or page-level block: heading “Select Property”, list of cards. Each card: Building2 icon, property name (bold), address (muted), room count badge. Tap card → `setActivePropertyId(id)`, then navigate to `/` (or current property-scoped default). Use `bg-card border-border`, hover/active `bg-accent`.
- **Placement:** Implement in (app) layout: if `!activeId && properties.length > 0`, render `<PropertySelector />`; else render `children`. This keeps URLs unchanged and matches “shown when no property active (before any page loads)”.

---

## 5. Overview page (dashboard)

- **Structure:** Reuse existing [OccupancyCard](d:\Workspace\e-kost\src\components\dashboard\OccupancyCard.tsx), [FinanceSummaryCard](d:\Workspace\e-kost\src\components\dashboard\FinanceSummaryCard.tsx), [OutstandingBalancesList](d:\Workspace\e-kost\src\components\dashboard\OutstandingBalancesList.tsx), [RecentPaymentsList](d:\Workspace\e-kost\src\components\dashboard\RecentPaymentsList.tsx). Adjust to match spec:
  - **Occupancy:** Large %, progress bar (teal fill), room breakdown with colored dots (occupied=teal, available=green, renovation=amber). Use `text-status-occupied`, `text-status-available`, `text-status-renovation` and dot indicators.
  - **Finance summary:** Side-by-side Income (green, `text-finance-income`) and Expenses (red, `text-finance-expense`); Net Profit below with `text-finance-profit-positive` / `text-finance-profit-negative`.
  - **Outstanding balances:** “View all tenants →” link (to tenants page). Row colors per Component Color Map.
  - **Recent payments:** “View finances →” link. Payment amount in `text-balance-paid`.
  - **Quick stats row:** Three tappable mini-cards (Rooms count, Tenants count, Net Profit) linking to `/properties/[id]/rooms`, `/properties/[id]/tenants`, `/properties/[id]/finance`. Replace current button group with this row.
- Remove duplicate property name/address block if redundant with header; keep content focused on occupancy, finance, balances, recent payments, and quick stats.
- **FinanceSummaryCard:** Use new `finance-`* tokens for income/expense/net instead of any hardcoded or balance colors where appropriate.

---

## 6. Rooms page

- **Layout:** Grid of room cards (1 column on mobile), **staggered fade-in** (e.g. `animate-in fade-in` with delay by index; ensure Tailwind or globals have a short animation).
- **Room card** [room-card.tsx](d:\Workspace\e-kost\src\components\room\room-card.tsx): Three states per spec:
  - **Available:** Green left border (`border-l-4 border-status-available`), “Available” badge (green), room type + rent, “Assign Tenant” (teal, UserPlus), “Change room status” (muted, Wrench). Use Lucide icons.
  - **Renovation:** Amber left border, muted bg (`bg-muted`), “Renovation” badge (amber). No assign/change needed in spec.
  - **Occupied:** Tenant name (bold), “Paid ✓” (green badge) or “€X ✗” (red badge). Tap → navigate to tenant detail. Left border `border-status-occupied`.
- Ensure badges use spec classes (`bg-status-available/15 text-status-available-foreground`, etc.) and touch targets ≥44px on actions.

---

## 7. Tenants page

- **Header:** “Tenants (N)” title + “Add Tenant” primary button with Plus icon.
- **List:** Tenant cards: name (bold), room “Room 101 · Standard” or “Unassigned” badge (amber-style), balance “Paid” (green) or “€X unpaid” (red). Tap card → `/properties/[id]/tenants/[tenantId]`.
- Reuse existing tenant list; restyle to card layout and spec colors/badges. Ensure i18n for “Unassigned”, “Paid”, “unpaid” etc.

---

## 8. Tenant detail page

- **Header:** Back (ArrowLeft), tenant name, Edit (Pencil), Move-out (DoorClosed) icon buttons.
- **Sections:** Info card (Phone, Email, Move-in with icons), Room card, Payment summary card (total paid, outstanding, monthly rent), Payment history list (or empty state), Notes + Add Note, fixed bottom “Record Payment” button (full-width primary, above bottom nav).
- Align existing [tenant detail page](d:\Workspace\e-kost\src\app(app)\propertiespropertyId]\tenantstenantId]\page.tsx) and related components (balance, payments, notes) to this structure and spec colors. Fixed button: `fixed bottom-20 left-0 right-0` (or within a padded container) so it sits above the nav.

---

## 9. Finance page

- **Month selector:** ChevronLeft / ChevronRight around “March 2026” label. Reuse or align [month-selector.tsx](d:\Workspace\e-kost\src\components\finance\month-selector.tsx).
- **Add Expense:** Full-width outline button with Plus icon (link or button to expense create).
- **Summary cards:** Income (green), Expenses (red), Net Profit (green/red) using `finance-`* tokens.
- **Income section:** “Income” heading, total, list of payment entries (tenant name, date, amount in green).
- **Expenses section:** “Expenses” heading, list with category, description, date, amount (red), delete (Trash2) icon.
- **Category breakdown:** Stacked horizontal bar + legend (icon + category name + amount). Use expense category icons from spec (Zap, Droplets, Wifi, etc.) in [category-breakdown-list](d:\Workspace\e-kost\src\components\finance\category-breakdown-list.tsx) or equivalent.
- Ensure [finance page](d:\Workspace\e-kost\src\app(app)\propertiespropertyId]\finance\page.tsx) and expense list/edit pages use Dialog for add/edit and match spec styling.

---

## 10. Settings page

- **Access:** Only via header avatar popover (already removed from bottom nav in step 2).
- **Team:** “Team” heading; Owner card (avatar, name, email, “Owner” badge); Staff cards (avatar, name, email, “Staff” badge, “Remove” for owner). Add Staff dialog (owner-only): user select + Add. Remove confirmation: AlertDialog with warning, confirm/cancel.
- Align [SettingsPage](d:\Workspace\e-kost\src\components\settings\SettingsPage.tsx), [StaffSection](d:\Workspace\e-kost\src\components\settings\StaffSection.tsx), [StaffManagement](d:\Workspace\e-kost\src\components\settings\StaffManagement.tsx) and [AccountSection](d:\Workspace\e-kost\src\components\settings\AccountSection.tsx) to this layout and spec colors (avatar `bg-primary`, badges `bg-secondary`).

---

## 11. Dialogs

- **Unify behavior:** All modal forms use shadcn **Dialog** (not Sheet for these), **slide-up** animation, dark overlay. If Dialog doesn’t support slide-up by default, add custom `data-[state=open]:animate-in` / `slide-in-from-bottom` in [dialog.tsx](d:\Workspace\e-kost\src\components\ui\dialog.tsx) or per usage.
- **Assign Tenant:** Title “Assign Tenant to Room X”, room info, list of unassigned tenants, “Create New Tenant” at bottom. Cancel (X).
- **Add/Edit Tenant:** Add = Name (required), Phone, Email, Move-in date. Edit = pre-filled Name, Phone, Email. Save/Cancel.
- **Payment:** Amount, date picker, “Record Payment” button.
- **Move Out:** Warning text; yellow banner if unpaid balance; “Move Out” (destructive) + Cancel.
- **Add Expense:** Category dropdown (spec list: Electricity, Water, Internet, …), description, amount, date. Save/Cancel.
- **Room Status:** Current room info; “Mark as Available” / “Mark as Renovation” actions; Cancel.
- Audit existing dialogs (e.g. in room-card, tenant forms, payment form, expense form, move-out flow) and ensure titles, fields, and actions match spec; use Lucide icons where listed.

---

## 12. Icons and polish

- **Lucide:** Use spec icons everywhere: LayoutDashboard, DoorOpen, Users, Wallet (nav); Building2, ChevronDown (header); ArrowLeft, Pencil, DoorClosed, UserPlus, Wrench, Plus, Trash2, CreditCard; Phone, Mail, Calendar, Banknote, StickyNote; ChevronLeft/Right, TrendingUp/TrendingDown; category icons (Zap, Droplets, Wifi, etc.); Check/X in badges. Replace any non-Lucide or wrong icons.
- **Touch targets:** All interactive elements ≥44px (min-h-[44px] min-w-[44px] or equivalent). Audit buttons, links, list rows, nav items.
- **Spacing:** Cards `p-4`–`p-6`, gaps `gap-3`/`gap-4`; page content `pb-20`; radius `0.5rem` (already `--radius: 0.5rem`).
- **Animations:** Staggered fade-in for room cards (and optionally tenant cards); dialog slide-up. Add `animate-in fade-in` with `animation-delay` or a small utility class if needed.

---

## Implementation order (suggested)

1. **Tokens + font** — globals.css, tailwind.config, layout.tsx (Plus Jakarta Sans).
2. **Global layout** — AppHeader (popover switcher, room stats line), ProfileDropdown (Settings link), AppNav (4 tabs, property-aware links, h-14).
3. **Login** — Card, title + icon + subtitle, Demo buttons.
4. **Property selector** — (app) layout conditional, PropertySelector component.
5. **Overview** — OccupancyCard, FinanceSummaryCard, OutstandingBalancesList, RecentPaymentsList, quick stats row; use finance tokens and spec colors.
6. **Rooms** — Room cards (3 states), staggered animation, badges and borders.
7. **Tenants** — Header + Add Tenant, tenant cards with badges.
8. **Tenant detail** — Header actions, sections, fixed Record Payment button.
9. **Finance** — Month selector, Add Expense, summary/income/expense lists, category breakdown and icons.
10. **Settings** — Team cards, Add Staff, Remove confirmation; ensure accessible only from header.
11. **Dialogs** — Standardize Dialog + slide-up; align Assign Tenant, Add/Edit Tenant, Payment, Move Out, Add Expense, Room Status to spec.
12. **Icons and polish** — Full pass: Lucide per spec, 44px targets, spacing, animations.

---

## Files to touch (summary)


| Area                | Key files                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens / typography | `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`                                                                                                                                    |
| Global layout       | `src/components/layout/app-header.tsx`, `src/components/layout/app-nav.tsx`, `src/components/auth/profile-dropdown.tsx`, `src/components/property/property-switcher.tsx`, `src/app/(app)/layout.tsx` |
| Login               | `src/components/auth/login-form.tsx`, (auth) layout if needed                                                                                                                                        |
| Property selector   | New `PropertySelector` component, `src/app/(app)/layout.tsx`                                                                                                                                         |
| Overview            | `src/app/(app)/page.tsx`, `OccupancyCard`, `FinanceSummaryCard`, `OutstandingBalancesList`, `RecentPaymentsList`                                                                                     |
| Rooms               | `src/app/(app)/properties/[propertyId]/rooms/page.tsx`, `src/components/room/room-card.tsx`                                                                                                          |
| Tenants             | `src/app/(app)/properties/[propertyId]/tenants/page.tsx`, tenant list/card components                                                                                                                |
| Tenant detail       | `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx`, balance/payment/notes sections                                                                                                  |
| Finance             | `src/app/(app)/properties/[propertyId]/finance/page.tsx`, `month-selector.tsx`, `summary-card.tsx`, `category-breakdown-list.tsx`, expense list                                                      |
| Settings            | `SettingsPage.tsx`, `StaffSection.tsx`, `StaffManagement.tsx`, `AccountSection.tsx`                                                                                                                  |
| Dialogs             | `dialog.tsx`, payment/tenant/room/expense/move-out dialogs and forms                                                                                                                                 |
| i18n                | Add keys for “Select Property”, “Demo Owner Account”, “Demo Staff Account”, “Board House Management”, and any new labels from spec                                                                   |


No API or domain logic changes are required unless demo login needs backend support; then add minimal auth paths or env for demo credentials.

---

## Testing

### Adjust existing tests

1. **Settings navigation E2E** ([e2e/settings-staff-management/settings-navigation.spec.ts](d:\Workspace\e-kost\e2e\settings-staff-management\settings-navigation.spec.ts))
  - Settings moves from bottom nav to header avatar popover. Update tests accordingly:
  - "settings link is available in navigation" → assert Settings is available in header (e.g. open avatar, then look for Settings option).
  - "tapping settings link navigates to settings page" → open avatar popover, click Settings, then assert URL/content.
  - "settings page indicates active navigation state" → remove or replace (e.g. "settings page shows expected content"); Settings is no longer a nav tab.
  - "settings link has adequate touch target" → assert the Settings item in the avatar dropdown has adequate touch target.
  - Keep: unauthenticated redirect, "navigating to /settings directly shows settings content".
2. **Profile dropdown unit test** ([src/components/auth/profile-dropdown.test.tsx](d:\Workspace\e-kost\src\components\auth\profile-dropdown.test.tsx))
  - Add: "shows Settings link in dropdown", "clicking Settings navigates to /settings" (mock useRouter, assert push('/settings')).
  - Existing tests (initials, name/email, logout, touch target) stay as-is.
3. **Login tests**
  - **Unit** (login-form.test.tsx): If button label changes to "Sign In", update assertions to match (or use regex that accepts both). Optionally add tests for "E-Kost" title and Demo buttons once added.
  - **E2E** (e2e/auth/login.spec.ts): Current flow (login → see "create property" when no properties) may remain valid; adjust only if post-login flow or copy changes (e.g. Property Selector for users with properties).

### Add new tests


| Area              | Type            | What to add                                                                                                                                                                      |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property Selector | Unit            | Renders "Select Property" heading and property cards; selecting a card calls setActivePropertyId and navigates (e.g. to /).                                                      |
| Property Selector | E2E             | With auth state "user has properties, none selected", opening / shows Select Property screen; tapping a property leads to overview.                                              |
| AppNav            | Unit            | Renders four items (Overview, Rooms, Tenants, Finance) with correct icons/links; no Settings link; when activePropertyId is set, links use it; active tab matches current route. |
| AppHeader         | Unit (optional) | When property is selected, room stats line is visible (e.g. "X occupied · Y avail · Z reno").                                                                                    |
| ProfileDropdown   | Unit            | "Shows Settings link in dropdown"; "Clicking Settings navigates to /settings" (see Adjust above).                                                                                |
| Login             | Unit (optional) | "Renders E-Kost title and subtitle"; "Renders Demo Owner and Demo Staff buttons" when added.                                                                                     |
| Bottom nav        | E2E             | Overview, Rooms, Tenants, Finance tabs are visible and navigate correctly; Settings is not in bottom nav.                                                                        |


### Leave as-is (unless content changes)

- Dashboard component tests (OccupancyCard, FinanceSummaryCard, OutstandingBalancesList, RecentPaymentsList): adjust only if visible text/roles they depend on change.
- Room/tenant/finance/settings component tests: same; update only when labels, roles, or behavior change.
- API and service tests: unchanged by UI redesign.

**Regression rule:** If a test fails because it asserted old behavior (e.g. Settings in bottom nav), update the test to reflect the new spec (Settings in header only); do not change the implementation to satisfy the old test.