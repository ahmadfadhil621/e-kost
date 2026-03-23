# RT-8 — Filter and Search: Tenant List & Rooms List

## Context

Landlords managing a property need to quickly locate tenants and rooms without scrolling through the full list. The most urgent need is identifying tenants who have not paid rent. The rooms list already has status filters but no text search.

## Goals

- Add free-text search to the Tenant List (by name, phone, email)
- Add a "Missing rent" priority filter to the Tenant List
- Add free-text search to the Rooms List (by room number, room type)

## Non-Goals

- Server-side search or pagination
- Search history or saved filters
- Changes to any page other than Tenant List and Rooms List
- Changes to domain schemas, service layer, API routes, or repositories

## Glossary

| Term | Definition |
|------|-----------|
| Search query | A partial, case-insensitive text string typed by the user |
| Missing rent filter | A toggle that shows only tenants whose balance status is "unpaid" |
| Active filter | The currently selected filter value ("all" or "missing_rent") |
| No results | Filtered list is empty but underlying data is not empty |
| Empty state | No data exists yet (zero tenants or zero rooms) |

## Requirements

### REQ-1 — Tenant List: text search

The Tenant List page must render a search input. Typing in it filters the visible tenant list to only tenants whose name, phone, or email contains the query string (case-insensitive, partial match). The list updates within 300 ms of the user stopping typing.

### REQ-2 — Tenant List: "Missing rent" filter

The Tenant List page must render filter toggle buttons ("All" and "Missing rent"). When "Missing rent" is active, only tenants whose outstanding balance status is "unpaid" are shown. The button displays the count of matching tenants.

### REQ-3 — Tenant List: composed filtering

Search and the missing-rent filter apply simultaneously (AND logic). A tenant is shown only if it satisfies both the active filter and the search query.

### REQ-4 — Rooms List: text search

The Rooms List page must render a search input above the existing status filter buttons. Typing in it filters the visible room list to rooms whose roomNumber or roomType contains the query string (case-insensitive, partial match). Search composes with the existing status filter (AND logic).

### REQ-5 — Empty vs no-results distinction

When filters produce zero results but data exists, the page shows a "no results" message (reusing `common.noResults`). When no data exists at all, the page continues to show the original empty-state message (`tenant.list.empty` / `room.list.empty`).

### REQ-6 — Accessibility

- The search input has an explicit `aria-label`.
- Filter toggle buttons use `aria-pressed` to communicate active state.
- All interactive elements have a minimum touch target of 44×44 px.

### REQ-7 — Mobile layout

At 320 px viewport width, the search input and filter buttons must be fully visible with no horizontal scroll.

### REQ-8 — Internationalisation

All UI strings use i18n translation keys. No hardcoded English strings in component source.
