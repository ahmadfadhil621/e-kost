# Project Quality Rules

## data-testid Requirement

Every new React component **must** have a `data-testid` attribute on its root element.

- Use **kebab-case** matching the component name (e.g., `TenantBalanceBanner` → `data-testid="tenant-balance-banner"`)
- This is a **hard gate** — a component is not considered complete without it
- Applies to all new components, whether they are pages, sections, banners, cards, or any other UI element
- Existing components do not need to be retroactively updated unless they are being modified
