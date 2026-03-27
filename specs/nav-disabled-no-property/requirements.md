# Requirements — Nav Disabled (No Active Property) + Auto-select Single Property

**Issue:** #79
**Area:** cross-cutting, properties

## Acceptance Criteria

### Nav disable
1. When `activePropertyId` is null/undefined, all bottom nav items (Rooms, Tenants, Finance) except Overview are rendered as disabled.
2. Disabled nav items have `aria-disabled="true"` and `pointer-events-none` CSS.
3. Disabled nav items show a tooltip on hover/focus: "Select a property first" (`nav.noActiveProperty.tooltip`).
4. Touch targets remain ≥ 44×44px even when disabled.
5. Disabled state uses color + icon (not color alone) for accessibility.
6. Keyboard accessibility maintained (Tab still reaches disabled items).

### Auto-select single property
7. When `PropertyProvider` loads and finds exactly one property, it auto-sets that property as active and redirects to `/`.
8. Zero-property users are unaffected — they see the empty state / create-property prompt.
9. Multi-property users are unaffected — they still see the property selector.

## i18n Keys
- `nav.noActiveProperty.tooltip` — "Select a property first" (en) / "Pilih properti terlebih dahulu" (id)
