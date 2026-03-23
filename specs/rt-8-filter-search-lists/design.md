# RT-8 — Design

## Architecture

**Pure UI layer.** No domain schema, service, API route, or repository changes are needed. Both pages already fetch the complete list for the property; filtering is applied in `useMemo` on the already-cached data.

## Filtering strategy: client-side

Both `tenants/page.tsx` and `rooms/page.tsx` fetch all records for a property and render them fully. Client-side filtering:
- Requires zero new API endpoints or query-param changes
- Remains fast at the expected data sizes (small-landlord domain, typically < 50 tenants / < 20 rooms per property)
- Keeps the "Missing rent" filter simple — it must cross-reference `balancesData` which is a separate query; merging these server-side would add unnecessary coupling

## Debounce

Search input is debounced at 300 ms via a `useDebounce` hook that lives in `src/hooks/`. The hook is used by the page components (not inside `SearchInput`) so it can be tested independently with fake timers.

## Component tree after changes

### Tenant List page
```
TenantListPage
├── header row (title + "Add tenant" button)
├── TenantFilterBar
│   ├── SearchInput
│   └── filter buttons ("All" | "Missing rent")
└── tenant list OR empty/no-results message
```

### Rooms List page
```
RoomListPage
├── header row (title + "Add room" button)
├── SearchInput
├── StatusFilter (unchanged)
└── room grid OR empty/no-results message
```

## New files

| File | Purpose |
|------|---------|
| `src/hooks/use-debounce.ts` | Generic debounce hook |
| `src/components/common/search-input.tsx` | Reusable search input (icon + Input) |
| `src/components/tenant/tenant-filter-bar.tsx` | Tenant-specific: search + filter buttons |

## Filtering logic

### Tenant list
```
let result = tenants
if filter === "missing_rent":
  result = result where balancesMap[id].status === "unpaid"
if debouncedSearch.trim():
  result = result where name|phone|email includes query (case-insensitive)
```

### Rooms list
```
// existing status filter first
let result = filter === "all" ? rooms : rooms where status === filter
// then search
if debouncedSearch.trim():
  result = result where roomNumber|roomType includes query (case-insensitive)
```

## i18n keys

| Key | EN | ID |
|-----|----|----|
| `tenant.list.searchPlaceholder` | Search by name, phone, or email | Cari berdasarkan nama, telepon, atau email |
| `tenant.list.filterAll` | All | Semua |
| `tenant.list.filterMissingRent` | Missing rent | Sewa kurang |
| `room.list.searchPlaceholder` | Search by room number or type | Cari berdasarkan nomor atau tipe kamar |
| `common.noResults` | No results found | *(already exists)* |

## Accessibility

- `SearchInput` renders a lucide `Search` icon with `aria-hidden="true"` and an `<Input>` with an explicit `aria-label` passed from the parent.
- Filter buttons follow the `StatusFilter` pattern: `aria-pressed={isActive}`, `min-h-[44px] min-w-[44px]`.
- The "Missing rent" button is `disabled` while `balancesData` is loading to avoid misleading counts.

## Correctness properties

1. An empty search string shows all records (no filtering).
2. Clearing the search string restores the full list.
3. Search + filter compose: both conditions must be satisfied for a tenant to appear.
4. `tenant.list.empty` is shown only when there are zero tenants in the property.
5. `common.noResults` is shown only when there are tenants/rooms but none match the active search + filter.
6. Switching filters resets displayed results immediately (state is reactive).

## Trade-offs considered

| Option | Decision | Reason |
|--------|----------|--------|
| Client-side vs server-side filtering | Client-side | Zero backend changes; data already fetched |
| Debounce in SearchInput vs in page | In page (via hook) | Hook is independently testable with fake timers |
| Feature-specific empty-search keys vs `common.noResults` | Reuse `common.noResults` | Avoids 2 extra keys; generic text is acceptable here |
| Separate `TenantFilterBar` vs inline in page | Separate component | Keeps page logic readable; component is independently testable |
