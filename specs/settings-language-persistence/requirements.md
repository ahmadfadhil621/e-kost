# Requirements — Persist Language Preference at Account Level

## Issue
#41 — [Settings] Persist language preference at account level

## Problem
Language preference is currently stored only in browser `localStorage` (`ekost_language` key). It resets whenever the user logs in from a new browser or device.

## Functional Requirements

### Requirement 1: Language Field on User

**User Story:** As a user, I want my language preference saved to my account, so it is available on any device.

#### Acceptance Criteria

1. WHEN the schema is applied, THE System SHALL store a `language` column on the `user` table with a default value of `"en"`.

### Requirement 2: API — Persist Language

**User Story:** As an authenticated user, I want to update my language preference via an API.

#### Acceptance Criteria

1. WHEN an authenticated user sends `PATCH /api/user/language` with a valid `{ language }` body, THE System SHALL persist the value and return `{ data: { language } }` with status 200.
2. WHEN an unauthenticated request hits `PATCH /api/user/language`, THE System SHALL return 401.
3. WHEN the request body contains an unsupported locale, THE System SHALL return 400 without writing to the database.
4. WHEN an authenticated user sends `GET /api/user/language`, THE System SHALL return `{ data: { language } }` with their persisted language.
5. WHEN an unauthenticated request hits `GET /api/user/language`, THE System SHALL return 401.

### Requirement 3: App Load — Language Restored from Profile

**User Story:** As an authenticated user, I want the app to restore my saved language automatically on login.

#### Acceptance Criteria

1. WHEN an authenticated user loads the app, THE System SHALL fetch the persisted language from the API and apply it via `i18n.changeLanguage()`.
2. WHEN the user is unauthenticated, THE System SHALL NOT attempt to fetch the language from the API.
3. WHEN the API fetch fails, THE System SHALL retain the current `i18n.language` without error.

### Requirement 4: LanguageSelector — Server Persistence

**User Story:** As an authenticated user, I want selecting a language to save it to my account immediately.

#### Acceptance Criteria

1. WHEN an authenticated user selects a language, THE System SHALL call `PATCH /api/user/language` in addition to the localStorage write.
2. WHEN an unauthenticated user selects a language, THE System SHALL only write to localStorage (no API call).
3. WHEN the PATCH request fails, THE System SHALL retain the locally-selected language without showing an error.

### Requirement 5: Fallback Behavior Preserved

#### Acceptance Criteria

1. WHEN the user is unauthenticated, THE System SHALL use localStorage as the sole language source.
2. WHEN no localStorage value exists, THE System SHALL default to English.
3. WHEN the app makes a language API call, THE System SHALL NOT block UI rendering while waiting.
