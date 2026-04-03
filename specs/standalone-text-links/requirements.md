# Standalone Text Links — Requirements

## Source
GitHub Issue #96: [UX] — Underline standalone text links

### Requirement 1: Standalone text links must be visually underlined

1. WHEN a bare `<Link>` is not wrapped inside `<Button>`, nav, sidebar, or `<Card>`, THEN it must display a visible underline at all times (not only on hover).
2. WHEN the link is wrapped inside `<Button asChild>` or `<Button variant="link">`, THEN it must remain unaffected by this rule.
3. WHEN the link is inside a `<Card>` wrapper, THEN it must remain unaffected by this rule.

### Requirement 2: Touch targets must meet minimum size

1. WHEN an affected standalone text link is rendered on mobile, THEN its touch target height must be at least 44px.
2. WHEN the page is viewed at 320px–480px mobile viewport, THEN no horizontal scroll must occur.

## Affected Files

| File | Link text (i18n key) | Fix |
|---|---|---|
| `src/components/payment/tenant-payment-section.tsx` | `payment.tenantSection.viewAll` | Add `underline` class |
| `src/components/settings/SettingsPage.tsx` (line 69) | `settings.developer.inviteManagement` | Add `underline` class |
| `src/components/settings/SettingsPage.tsx` (line 80) | `settings.developer.currencyManagement` | Add `underline` class |
| `src/app/(app)/page.tsx` (line 167) | `property.detail.propertyInfo` | Add `underline` + `min-h-[44px]` classes |

## Out of Scope

- `<Button variant="link">` (link variant of Button component)
- Links inside `<Card>` wrappers
- Navigation links (inside `<nav>` or sidebar)
- No new i18n keys needed
