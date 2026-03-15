# Tasks: Settings & Staff Management

## 1. UI Layer

- [x] 1.1 Create SettingsPage layout
  - **Description**: Build the main settings page with section-based layout
  - **Acceptance Criteria**:
    - Route: /settings
    - Single-column layout with visual separators between sections
    - Sections in order: Language, Account, Staff (conditional)
    - Staff section only rendered when user is owner of active property
    - Loading states for account and staff data
    - All text via translation keys
    - Mobile-optimized: no horizontal scroll, adequate spacing
  - **Dependencies**: Phase 1 Auth, Phase 2 Multi-Property
  - **Effort**: M

- [x] 1.2 Create LanguageSelector component
  - **Description**: Build language switching UI driven by available locale files
  - **Acceptance Criteria**:
    - Displays one option per available locale, where "available" is determined by which locale JSON files exist in `locales/` (or a single shared config/list derived from them at build time)
    - Current language indicated with check mark or radio indicator
    - Tap to switch immediately (no save button)
    - Calls `i18n.changeLanguage()` on selection
    - Persists choice to localStorage
    - 44x44px touch targets per language option
    - Display name for each locale via translation key (e.g. `settings.language.<code>`) or locale-name map
  - **Dependencies**: i18n infrastructure (Phase 0); list of available locales (from locales dir or config)
  - **Effort**: S

- [x] 1.3 Create AccountSection component
  - **Description**: Build account information display and name editing
  - **Acceptance Criteria**:
    - Displays: profile icon (initials), name, email (read-only badge)
    - "Edit" button toggles name field to editable
    - Save/Cancel buttons in edit mode (44x44px touch targets)
    - Client-side validation: name required, non-empty
    - Calls `authClient.updateUser({ name })` on save
    - Success toast on update
    - Profile icon updates to reflect new name initials
    - Loading state during save
    - All text via translation keys
  - **Dependencies**: Phase 1 Auth (Better Auth client)
  - **Effort**: M

- [x] 1.4 Integrate StaffManagement into settings
  - **Description**: Add StaffManagement component (from Multi-Property) as a section on the settings page
  - **Acceptance Criteria**:
    - Renders StaffManagement component for active property
    - Section header shows "Staff for [Property Name]"
    - Only visible when user role is 'owner' for active property
    - Hidden entirely for staff users
    - Passes correct propertyId from active property context
  - **Dependencies**: Phase 2 Multi-Property (StaffManagement component)
  - **Effort**: S

- [x] 1.5 Add settings entry to bottom navigation
  - **Description**: Add settings page link to the app's bottom navigation
  - **Acceptance Criteria**:
    - Gear icon + translated "Settings" label
    - Active state when on /settings route
    - 44x44px touch target
    - Positioned appropriately in navigation order
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Language Persistence

- [x] 2.1 Define available locales from locale files
  - **Description**: Single source of truth for which languages the switcher offers
  - **Acceptance Criteria**:
    - Available locales are derived from which JSON files exist in `locales/` (e.g. build-time list, or shared config used by i18n init and LanguageSelector)
    - Adding a new `locales/<code>.json` and registering it (e.g. in i18n config and locale list) makes that language appear in the switcher without changing LanguageSelector component logic
  - **Dependencies**: i18n infrastructure (Phase 0)
  - **Effort**: S

- [x] 2.2 Implement language persistence and initialization
  - **Description**: Ensure language preference persists across sessions
  - **Acceptance Criteria**:
    - On app initialization, read language from localStorage
    - If found and still in available locales, set i18n language to stored value
    - If not found or stored value no longer available, default to first available locale or configured default (e.g. `en`)
    - On language change, store in localStorage immediately
    - Formatting (dates, numbers, currency) updates to match selected locale
  - **Dependencies**: i18n infrastructure (Phase 0), 2.1
  - **Effort**: S

## 3. Internationalization (i18n)

- [x] 3.1 Extract and translate settings strings
  - **Description**: Add all settings UI text to translation files
  - **Acceptance Criteria**:
    - All section headers, labels, buttons in en.json and id.json
    - Translation keys follow `settings.*` convention
    - Language names displayed in their native language
    - Account labels and validation messages translated
    - Staff section header with property name interpolation
  - **Dependencies**: 1.1, 1.2, 1.3
  - **Effort**: S

## 4. Testing & Validation

- [x] 4.1 Test language switching workflow
  - **Description**: Verify language selection updates entire UI
  - **Acceptance Criteria**:
    - Selecting any available language updates all visible text to that language
    - Currency, date, and number formatting updates with language
    - Preference persists after browser restart
    - Default is first available locale (or configured default) when no preference stored
    - Switcher shows exactly the set of languages for which locale files exist
  - **Dependencies**: 1.2, 2.1, 2.2
  - **Effort**: M

- [x] 4.2 Test account update workflow
  - **Description**: Verify name update functionality
  - **Acceptance Criteria**:
    - Can edit and save name
    - Profile icon initials update after save
    - Empty name shows validation error
    - Email displayed as read-only
    - Success confirmation shown after save
  - **Dependencies**: 1.3
  - **Effort**: S

- [x] 4.3 Test staff section visibility
  - **Description**: Verify staff section shows only for owners
  - **Acceptance Criteria**:
    - Owner sees Language + Account + Staff sections
    - Staff member sees Language + Account sections only
    - Staff section shows correct property name
  - **Dependencies**: 1.4
  - **Effort**: S

- [x] 4.4 Test mobile responsiveness
  - **Description**: Verify settings page works on mobile
  - **Acceptance Criteria**:
    - Settings renders at 320px-480px without horizontal scroll
    - All touch targets minimum 44x44px
    - Section separators visible
    - Forms usable on mobile
    - Language options easily tappable
  - **Dependencies**: 1.1, 1.2, 1.3
  - **Effort**: S

## Open Questions / Assumptions

- **Language Names**: Language options display via translation keys (e.g. `settings.language.<code>`) or a locale-name map; display in the language's own name (e.g. "Bahasa Indonesia") for recognition. The list of options is driven by which locale JSON files are present, not hardcoded.
- **Account Email**: Email is displayed as read-only. Changing email requires verification flow, which is post-MVP.
- **Password Change**: Not included in MVP. Better Auth supports password change but the UI flow is post-MVP.
- **Staff API Reuse**: The settings page reuses StaffManagement component and APIs built in Phase 2. No new backend work needed for staff.
- **Language Locale Mapping**: `en` maps to `en-IE` locale (EUR currency), `id` maps to `id-ID` locale (IDR currency). This mapping is defined in the locale JSON files.
