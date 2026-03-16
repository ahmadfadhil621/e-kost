# Webapp Issues & Backlog

> **Format notes for LLM:** Each issue includes a `priority` (high / medium / low), a `status` hint, and a `scope` tag. Issues marked `[CROSS-CUTTING]` affect the entire app, not a single page.

---

## 1. Global / Cross-Cutting

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| G-1 | Responsive layout — mobile-first, but scale up gracefully on desktop | High | Applies to every page, not just Dashboard |
| G-2 | Sticky bottom navigation | High | Global nav component |
| G-3 | All destructive actions (Delete / Move-out) must be placed at the very bottom of their respective detail pages | High | UX consistency rule |
| G-4 | Research and adopt a better color palette | Medium | Affects all UI components |

---

## 2. Dashboard

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| D-1 | Differentiate the **Landing Page** from the **Home/Dashboard Page** | Low | Separate routes/layouts |
| D-2 | Occupancy meter must show all states: **Occupied**, **Under Renovation**, **Not Occupied** | High | Needs multi-color segment support |
| D-3 | Clicking **Income** or **Expense** summary card should open a small popup with the most important details only | High | Lightweight detail modal |
| D-4 | Research the correct financial term for **Net Income** (Total Income − Total Expense for the month) | Medium | Terminology / copy update |
| D-5 | **Outstanding Balances** widget should show only missing rent; no inline detail — use a popup instead | High | Simplify widget, add popup |
| D-6 | Add **filter and search** to the Recent Payments section | Low | Nice-to-have |

---

## 3. Rooms & Tenant Details

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| RT-1 | Clicking a room card should navigate to **Room Detail** page, not Tenant Detail | High | Not yet implemented |
| RT-2 | Implement **Delete Room** functionality | High | Currently missing |
| RT-3 | Make the **Edit button** smaller and place it beside the room card | Medium | UI polish |
| RT-4 | Remove the **Back button** | Medium | Redundant navigation element |
| RT-5 | Remove the **Outstanding Balance** field from Tenant Detail; replace with a **banner at the top of the page** when rent is missing | High | Better UX pattern |
| RT-6 | **Payment History** should show only the last 3 entries, with a link/button to a full history page (new page to implement) | Medium | Requires new Full Payment History page |
| RT-7 | Show a **"Fully Paid" icon/badge** prominently on the Tenant Detail page when all rent is settled | Medium | Visual feedback |
| RT-8 | Add **filter and search** to the Tenant List page (priority: filter by missing rent) | High | Also apply to Rooms List page |
| RT-9 | Rooms can be **Archived** (soft) or **Deleted** (hard) | High | Two distinct actions needed |

---

## 4. Finances

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| F-1 | Clicking an **Income** or **Expense** entry should navigate to a detail view | High | Likely not yet implemented |
| F-2 | Remove the **Breakdown** section | High | Delete UI element |
| F-3 | Remove the **"View Expenses" button** | High | Delete UI element |
| F-4 | Add option to **export data to CSV / XLSX** | Low | Deprioritize if effort is too high |

---

## 5. Properties

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| P-1 | Add a **Property Detail page** (consider embedding a map marker) | Medium | New page; lower priority section |
| P-2 | Support **Archive** (soft) and **Delete** (hard) actions for properties | Medium | Consistent with room behavior (RT-9) |
| P-3 | **Move Staff Management** to the Properties section once Property Detail is implemented | Low | Blocked by P-1 |

---

## Priority Summary

| Priority | Issues |
|----------|--------|
| **High** | G-1, G-2, G-3, D-2, D-3, D-5, RT-1, RT-2, RT-5, RT-8, RT-9, F-1, F-2, F-3 |
| **Medium** | G-4, D-4, RT-3, RT-4, RT-6, RT-7, P-1, P-2 |
| **Low** | D-1, D-6, F-4, P-3 |

---

## Blockers & Dependencies

- **RT-6** (Payment History truncation) → requires a new **Full Payment History** page to be designed and routed.
- **RT-1** (Room Detail navigation) → requires **Room Detail** page to be implemented first.
- **P-3** (Staff Management move) → blocked by **P-1** (Property Detail page).
- **G-3** (Delete at bottom) → should be applied during the same pass as **RT-2**, **RT-9**, and **P-2** for consistency.
