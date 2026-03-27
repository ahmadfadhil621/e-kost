# Tasks — Nav Disabled (No Active Property) + Auto-select Single Property

## Layer: i18n
- [x] Add `nav.noActiveProperty.tooltip` to `locales/en.json`
- [x] Add `nav.noActiveProperty.tooltip` to `locales/id.json`

## Layer: UI Component — Tooltip
- [x] Create `src/components/ui/tooltip.tsx` (shadcn Tooltip wrapping @radix-ui/react-tooltip)

## Layer: UI Component — AppNav
- [x] Wrap items with TooltipProvider
- [x] When no activePropertyId: render items as disabled (aria-disabled, pointer-events-none, tooltip, muted + icon)

## Layer: Context — PropertyProvider
- [x] After loading properties: if exactly 1 and no activePropertyId, auto-set and redirect to /

## Layer: Tests
- [x] Update `src/components/layout/app-nav.test.tsx` — new disabled-state tests
- [x] Add E2E tests for nav disabled state and auto-select
