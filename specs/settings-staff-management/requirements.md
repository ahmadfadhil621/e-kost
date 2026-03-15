# Requirements: Settings & Staff Management

## Context & Problem

Property managers need a centralized place to manage application-wide preferences and property-level staff access. Without a settings page, managers cannot change their display language, update their account details, or manage who has access to their properties. Staff management is critical because property owners often delegate day-to-day management to trusted staff members, and the owner needs to control who can access each property's data.

Note: The core staff invitation/removal API is implemented as part of the Multi-Property Management feature (Phase 2). This feature focuses on the **Settings UI page** that surfaces staff management alongside language preferences and account settings in a unified settings experience.

## Goals

- Provide a unified settings page accessible from the main navigation
- Enable managers to select their preferred display language from the set of languages for which a locale file exists in `locales/` (e.g. `en.json`, `id.json`)
- Enable managers to update their account details (name)
- Display and manage staff for the active property (leveraging Multi-Property staff APIs)
- Deliver a mobile-optimized settings interface with clear sections

## Non-Goals

- Password change (post-MVP — Better Auth can add this later)
- Email change (post-MVP — requires email verification)
- Account deletion or deactivation
- Push notification preferences
- Theme or appearance settings (dark mode, etc.)
- Custom currency settings (currency is locale-level via i18n)
- Advanced role or permission configuration
- Billing or subscription management

## Glossary

- **Settings Page**: A single page with distinct sections for language, account, and staff management
- **Language Selector**: A control to switch the application language; options are derived from which locale JSON files are present in `locales/` (one option per file, e.g. `en.json` → English, `id.json` → Indonesian)
- **Account Settings**: Section displaying and allowing edits to the user's name
- **Staff Section**: Section for managing property staff (uses Multi-Property staff APIs)

## Functional Requirements

### Requirement 1: Language Selection

**User Story:** As a property manager, I want to choose my preferred display language, so that I can use the application in a language I'm most comfortable with.

#### Acceptance Criteria

1. WHEN a manager views the settings page, THE System SHALL display a language selection section listing all languages for which a locale file exists in `locales/` (e.g. `en.json`, `id.json`), with the currently active language indicated
2. WHEN a manager selects a language from the list, THE System SHALL immediately update all UI text to the selected language without requiring a page reload
3. WHEN a manager selects a language, THE System SHALL persist the preference in localStorage so it survives browser restarts
4. WHEN a manager opens the application with a persisted language preference, THE System SHALL load the application in that language (if that locale is still available)
5. WHEN no language preference is persisted, THE System SHALL default to the first available locale or a configured default (e.g. `en` when `locales/en.json` exists)
6. WHEN a manager switches language, THE System SHALL also update locale-dependent formatting (date, number, currency) to match the selected locale

### Requirement 2: Account Information Display and Update

**User Story:** As a property manager, I want to view and update my account name, so that my profile information is accurate.

#### Acceptance Criteria

1. WHEN a manager views the settings page, THE System SHALL display an account section showing the user's name and email address
2. WHEN a manager views the account section, THE System SHALL display the email address as read-only (not editable in MVP)
3. WHEN a manager taps "Edit" on the account section, THE System SHALL display an editable name field
4. WHEN a manager saves an updated name, THE System SHALL persist the change via Better Auth's update profile API and display a confirmation
5. WHEN a manager enters an empty name, THE System SHALL prevent the save and display a validation error
6. WHEN a manager views the account section, THE System SHALL display the user's profile icon (initials) reflecting the current name

### Requirement 3: Staff Management for Active Property

**User Story:** As a property owner, I want to manage staff for my active property from the settings page, so that I can control who has access.

#### Acceptance Criteria

1. WHEN a property owner views the settings page, THE System SHALL display a staff management section for the active property
2. WHEN a property owner views the staff section, THE System SHALL display the list of currently assigned staff members (name, email)
3. WHEN a property owner taps "Add Staff", THE System SHALL display a form to enter a staff member's email address
4. WHEN a property owner submits a valid staff invitation, THE System SHALL add the user as staff and display a confirmation
5. WHEN a property owner taps "Remove" on a staff member, THE System SHALL display a confirmation dialog and remove access upon confirmation
6. WHEN a staff member (not owner) views the settings page, THE System SHALL hide the staff management section
7. WHEN a manager views staff management on mobile, THE System SHALL ensure all actions have minimum 44x44px touch targets

### Requirement 4: Settings Page Layout

**User Story:** As a property manager, I want all settings organized on one page with clear sections, so that I can find and change settings easily.

#### Acceptance Criteria

1. WHEN a manager navigates to settings, THE System SHALL display a single page with distinct sections: Language, Account, and Staff (if owner)
2. WHEN a manager views the settings page on mobile, THE System SHALL render all sections in a single-column layout with visual separators between sections
3. WHEN a manager views the settings page, THE System SHALL display section headers that clearly label each area
4. WHEN a manager accesses the settings page, THE System SHALL ensure all interactive elements have minimum 44x44px touch targets
5. WHEN a manager views the settings page on screens smaller than 480px, THE System SHALL maintain readability without requiring pinch-to-zoom

### Requirement 5: Settings Accessibility from Navigation

**User Story:** As a property manager, I want to access settings from the main navigation, so that I can quickly find settings from any screen.

#### Acceptance Criteria

1. WHEN a manager is on any authenticated screen, THE System SHALL provide a settings link/icon in the bottom navigation or header menu
2. WHEN a manager taps the settings link, THE System SHALL navigate to the settings page
3. WHEN a manager is on the settings page, THE System SHALL indicate the active navigation state

## Constraints

- Language preference persisted in localStorage (no server-side storage needed)
- Available languages are determined by which locale JSON files exist in `locales/` (e.g. `en.json`, `id.json`); adding a new file and registering it with the app makes that language appear in the switcher without further code changes in the Settings UI
- Account name update uses Better Auth's profile update API
- Email is read-only in MVP (changing email requires verification flow, post-MVP)
- Staff management reuses Multi-Property staff APIs (Phase 2)
- Staff section only visible to property owners, not staff members
- The interface must function on mobile devices with screen widths from 320px to 480px
- All user-facing text must be externalized via translation keys
- All form labels, validation messages, and confirmation dialogs must use translation keys

## Success Criteria

- A manager can change language and see the entire UI update immediately
- Language preference persists across browser restarts
- A manager can update their name and see the profile icon update within 2 seconds
- A property owner can add staff in fewer than 20 seconds
- A property owner can remove staff in fewer than 10 seconds
- All settings are accessible and usable on mobile devices (320px-480px)
- Staff section is hidden for non-owner users
- Settings page loads within 2 seconds
