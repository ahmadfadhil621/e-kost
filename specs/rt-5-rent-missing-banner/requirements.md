# Requirements: RT-5 — Rent Missing Banner on Tenant Detail

## Context & Problem

The Tenant Detail page currently surfaces outstanding balance information inside a balance section mid-page. This buries critical payment status — a landlord may not notice a tenant is behind on rent until they scroll down. The outstanding balance field should be replaced with a prominent banner that appears immediately at the top of the page and only when rent is actually missing.

## Goals

- Remove the "Outstanding Balance" field from the balance section on Tenant Detail.
- Add a prominent banner at the top of the Tenant Detail page that appears only when the tenant has an unpaid balance.
- The banner must be accessible: it must use color + icon + text, never color alone.

## Non-Goals

- Changes to the balance calculation logic or the balance API.
- Changes to the tenant list view.
- Changes to any page other than Tenant Detail.
- Displaying a banner for paid tenants.

## Glossary

- **Rent Missing Banner**: A prominent, visually distinct alert shown at the top of Tenant Detail when `status === "unpaid"` (outstanding balance > 0).
- **Outstanding Balance**: The amount a tenant owes: `room.monthlyRent - SUM(payments)`. Computed by the existing balance API.

## Functional Requirements

### Requirement 1: Remove Outstanding Balance Field

**User Story:** As a property manager, I want the outstanding balance field removed from the balance breakdown section, so the page is not redundant once the banner is in place.

#### Acceptance Criteria

1. WHEN a manager views the Tenant Detail page, THE System SHALL NOT display a row labelled "Outstanding balance" in the balance section.
2. WHEN a manager views the balance section, THE System SHALL still display the monthly rent row and the total payments row.

### Requirement 2: Rent Missing Banner — Unpaid State

**User Story:** As a property manager, I want a prominent banner at the top of the Tenant Detail page when the tenant owes rent, so I can immediately see the problem without scrolling.

#### Acceptance Criteria

1. WHEN a manager opens Tenant Detail for a tenant with `status === "unpaid"`, THE System SHALL display a banner near the top of the page.
2. WHEN the banner is displayed, THE System SHALL show a warning icon, a color fill (amber or red), and a text message — never color alone.
3. WHEN the banner is displayed, THE System SHALL include the outstanding balance amount formatted as currency.
4. WHEN the banner is displayed, THE System SHALL render it above the action buttons and balance section.
5. WHEN a manager opens Tenant Detail for a tenant with `status === "paid"`, THE System SHALL NOT display the banner.
6. WHEN the tenant has no room assigned (balance API returns 400), THE System SHALL NOT display the banner.

### Requirement 3: Accessibility

**User Story:** As a manager who may rely on assistive technology, I want the banner to be accessible, so I don't miss critical payment information.

#### Acceptance Criteria

1. WHEN the banner is displayed, THE System SHALL include an ARIA `role="alert"` or equivalent landmark.
2. WHEN a keyboard user navigates the page, THE System SHALL ensure the banner is reachable and its content is readable by a screen reader.
3. WHEN the banner is displayed, THE System SHALL meet WCAG AA color contrast requirements.

### Requirement 4: Mobile Optimization

**User Story:** As a property manager on a smartphone, I want the banner to be legible and not cause horizontal scroll.

#### Acceptance Criteria

1. WHEN the banner is displayed on a 320px–480px viewport, THE System SHALL display without horizontal scroll.
2. WHEN the banner contains interactive elements, THE System SHALL ensure touch targets are at least 44×44px.

### Requirement 5: i18n

**User Story:** As a user in any supported locale, I want the banner text to be translated.

#### Acceptance Criteria

1. WHEN the banner is displayed, THE System SHALL use i18n keys for all text strings (no hardcoded English).
2. WHEN a new locale is added, THE System SHALL only require adding keys to the locale JSON file.

## Constraints

- No changes to the balance API or balance service.
- Banner must not be shown for moved-out tenants (the active tenant detail view already hides when `movedOutAt` is set).
- All text must be externalized via translation keys.
- Color must not be the sole indicator (icon + text required alongside color).

## Success Criteria

- Tenant Detail for an unpaid tenant shows the banner prominently near the top.
- Tenant Detail for a paid tenant shows no banner.
- The balance section no longer has an outstanding balance row.
- The banner passes WCAG AA contrast checks.
- No horizontal scroll at 320px viewport width.
