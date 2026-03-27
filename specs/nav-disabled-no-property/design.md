# Design — Nav Disabled (No Active Property) + Auto-select Single Property

## Components Changed

### `src/components/layout/app-nav.tsx`
- Wrap all nav items in `TooltipProvider`
- When `activePropertyId` is null:
  - Render nav items as `<span>` (not `<Link>`) with `role="link"`, `aria-disabled="true"`, `pointer-events-none`
  - Wrap each in `<Tooltip>` showing `t("nav.noActiveProperty.tooltip")`
  - Apply muted color + distinct icon (e.g. lock icon or dimmed)

### `src/contexts/property-context.tsx`
- After `refetch()` resolves with exactly 1 property and `activePropertyId` is still null, call `setActivePropertyId(properties[0].id)` and use router to push to `/`
- Must not trigger for multi-property or zero-property users

## i18n Changes
- `locales/en.json`: add `nav.noActiveProperty.tooltip = "Select a property first"`
- `locales/id.json`: add `nav.noActiveProperty.tooltip = "Pilih properti terlebih dahulu"`
