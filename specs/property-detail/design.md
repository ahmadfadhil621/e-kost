# Property Detail — Design
<!-- Traceability: issue #24 -->

## Route
`/properties/[propertyId]` — `src/app/(app)/properties/[propertyId]/page.tsx`

## Data Fetching
No new API routes. Reuse two existing endpoints:

| Endpoint | Data Used |
|---|---|
| `GET /api/properties/[propertyId]` | name, address, ownerId, createdAt, role |
| `GET /api/properties/[propertyId]/dashboard` | occupancy.totalRooms, occupancy.occupied, outstandingCount, finance.netIncome |

Both fetched client-side with TanStack Query (pattern matches existing pages).

## Components

### `PropertyDetailPage` (page component)
- `useParams()` → `propertyId`
- Two `useQuery` calls: property info + dashboard stats
- Renders: header, stats row, map placeholder, nav links, staff placeholder

### Layout Sections (all in the page component, no sub-components needed)

1. **Header card** — name (h1), address, role badge, creation date
2. **Stats row** — 3 stat tiles: Total Rooms, Tenants, Outstanding count
3. **Quick nav** — 4 link tiles: Rooms, Tenants, Payments, Finance (same style as dashboard)
4. **Map placeholder** — Card with a grey rectangle + "Map coming soon" label
5. **Staff placeholder** — Card with title "Staff" + "Coming soon" badge

## Entry Point Changes

### `/properties/page.tsx` (list page)
- Add a "View details" link/button on each property card → `href="/properties/{p.id}"`
- Keep existing `onClick` (select as active + go to dashboard) on the card body
- The "View details" link should `stopPropagation` so it doesn't also trigger the card click

### `src/app/(app)/page.tsx` (dashboard page)
- Add a "Property info →" link near the property name heading → `href="/properties/{activeId}"`

## i18n Keys (new keys to add)

```json
{
  "property": {
    "detail": {
      "title": "Property Details",
      "createdAt": "Member since",
      "viewDetails": "View details",
      "mapPlaceholder": "Map coming soon",
      "staffPlaceholder": "Coming soon",
      "nav": {
        "rooms": "Rooms",
        "tenants": "Tenants",
        "payments": "Payments",
        "finance": "Finance"
      },
      "stats": {
        "totalRooms": "Total Rooms",
        "tenants": "Tenants",
        "outstanding": "Outstanding"
      }
    }
  }
}
```

## Correctness Properties

### Property 1: Error Resilience
If `GET /api/properties/[propertyId]` returns an error, the page MUST show an error message and MUST NOT crash or render partial data.

### Property 2: Stats Non-Blocking
Dashboard stats query is non-blocking — the page MUST render property info first; stats load independently and show dashes/zeros on failure.

### Property 3: URL Authority
`propertyId` from URL params is the authoritative source of truth (not `activePropertyId` from context). The page MUST display info for the URL's propertyId even if a different property is "active".
