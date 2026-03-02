# Tasks: User Authentication

## 1. Domain Layer

- [x] 1.1 Define auth validation schemas and types
  - **Description**: Create shared Zod schemas for authentication operations and TypeScript interfaces
  - **Acceptance Criteria**:
    - `registrationSchema` validates name (1-100 chars, required), email (valid format, required), password (min 8 chars, required)
    - `loginSchema` validates email (valid format, required), password (required)
    - TypeScript interfaces for User, Session, AuthResult
  - **Dependencies**: None
  - **Effort**: S

## 2. Service Layer

- [x] 2.1 Configure Better Auth server instance
  - **Description**: Set up Better Auth server with Prisma adapter, email/password provider, and session config
  - **Acceptance Criteria**:
    - Better Auth server instance configured with Prisma adapter (`src/lib/auth.ts`)
    - Email/password authentication enabled
    - Session duration set to 30 days
    - Cookie cache enabled (5 minutes)
    - Environment variables: DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
  - **Dependencies**: None
  - **Effort**: M

- [x] 2.2 Configure Better Auth React client
  - **Description**: Set up Better Auth client instance for React
  - **Acceptance Criteria**:
    - Client instance configured (`src/lib/auth-client.ts`)
    - `useSession` hook available for session state
    - `signUp.email`, `signIn.email`, `signOut` methods available
  - **Dependencies**: 2.1
  - **Effort**: S

- [x] 2.3 Create useAuth hook
  - **Description**: Create `useAuth` hook wrapping Better Auth client for app-wide session state
  - **Acceptance Criteria**:
    - Provides user state, loading state, and auth methods (signIn, signUp, signOut)
    - Uses Better Auth's `useSession()` hook internally
    - Session automatically restored via HTTP-only cookie on page load
    - Available throughout application
  - **Dependencies**: 2.2
  - **Effort**: S

## 3. Data Layer

- [x] 3.1 Verify Prisma schema for auth tables
  - **Description**: Ensure Better Auth tables (User, Session, Account, Verification) exist in Prisma schema
  - **Acceptance Criteria**:
    - User model: id, name, email (unique), emailVerified, image, createdAt, updatedAt
    - Session model: id, userId, token (unique), expiresAt, ipAddress, userAgent, createdAt, updatedAt
    - Account model: id, userId, accountId, providerId, accessToken, refreshToken, password, createdAt, updatedAt
    - Verification model: id, identifier, value, expiresAt, createdAt, updatedAt
    - Proper relations between User ↔ Session, User ↔ Account
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

## 4. API Layer

- [x] 4.1 Create Better Auth catch-all API route
  - **Description**: Set up Next.js API route handler for all Better Auth endpoints
  - **Acceptance Criteria**:
    - Catch-all route at `src/app/api/auth/[...all]/route.ts`
    - Handles POST /api/auth/sign-up, POST /api/auth/sign-in/email, POST /api/auth/sign-out, GET /api/auth/get-session
    - Uses Better Auth's `toNextJsHandler`
  - **Dependencies**: 2.1
  - **Effort**: S

- [x] 4.2 Create ProtectedRoute component
  - **Description**: Create component to protect routes requiring authentication
  - **Acceptance Criteria**:
    - Checks for active session via useAuth hook
    - Redirects to login if no session exists
    - Shows loading state while checking session
    - Allows access if session is valid
  - **Dependencies**: 2.3
  - **Effort**: S

## 5. UI Layer

- [x] 5.1 Create RegistrationForm component
  - **Description**: Build mobile-responsive registration form
  - **Acceptance Criteria**:
    - Fields: name, email, password
    - Client-side validation with React Hook Form + Zod
    - Mobile-optimized: single column, 44x44px touch targets, appropriate keyboard types (email, secure text)
    - Loading state on submission
    - Handles duplicate email errors
    - Auto-login after successful registration, redirects to main app
    - "Already have an account? Login" link
    - All text via translation keys
  - **Dependencies**: 2.2, 4.1
  - **Effort**: M

- [x] 5.2 Create LoginForm component
  - **Description**: Build mobile-responsive login form
  - **Acceptance Criteria**:
    - Fields: email, password
    - Client-side validation with React Hook Form + Zod
    - Mobile-optimized: single column, 44x44px touch targets, appropriate keyboard types
    - Loading state on submission
    - Handles invalid credentials errors
    - Redirects to main app on success
    - "Don't have an account? Register" link
    - All text via translation keys
  - **Dependencies**: 2.2, 4.1
  - **Effort**: M

- [x] 5.3 Create ProfileIcon component
  - **Description**: Build user avatar/initials display for application header
  - **Acceptance Criteria**:
    - Displays user initials in circular avatar (derived from name)
    - Minimum 44x44px dimensions
    - Click/tap opens ProfileDropdown
    - Positioned in application header
    - All text via translation keys
  - **Dependencies**: 2.3
  - **Effort**: S

- [x] 5.4 Create ProfileDropdown component
  - **Description**: Build dropdown showing user info and logout
  - **Acceptance Criteria**:
    - Displays user name and email
    - Logout button with 44x44px touch target
    - Closes on outside click
    - Logout terminates session, clears cookie, redirects to login
    - All text via translation keys
  - **Dependencies**: 5.3, 2.3
  - **Effort**: S

- [x] 5.5 Integrate ProfileIcon into application header
  - **Description**: Add profile icon to main authenticated app layout
  - **Acceptance Criteria**:
    - Profile icon visible on all authenticated pages
    - Only visible when user is logged in
    - Consistent positioning in header
    - Mobile-responsive
  - **Dependencies**: 5.3
  - **Effort**: S

## 6. Internationalization (i18n)

- [x] 6.1 Set up i18n infrastructure
  - **Description**: Configure react-i18next and create translation file structure
  - **Acceptance Criteria**:
    - react-i18next installed and configured
    - Translation files: locales/en.json, locales/id.json
    - Default language: English, fallback: English
    - Language switching mechanism implemented
  - **Dependencies**: None
  - **Effort**: M

- [x] 6.2 Extract and translate authentication strings
  - **Description**: Add all authentication UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `auth.*` naming convention
    - Validation messages translated
    - Error messages translated (duplicate email, invalid credentials, session expired)
    - Success messages translated
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 6.1
  - **Effort**: S

## 7. Testing & Validation

- [x] 7.1 Test user registration workflow
  - **Description**: Verify registration meets acceptance criteria
  - **Acceptance Criteria**:
    - Can create account in under 30 seconds
    - All fields validated (name, email format, password length)
    - Duplicate email error displayed
    - Auto-login after registration
    - Redirects to main app
  - **Dependencies**: 5.1
  - **Effort**: S

- [x] 7.2 Test user login workflow
  - **Description**: Verify login meets acceptance criteria
  - **Acceptance Criteria**:
    - Can log in with valid credentials in under 10 seconds
    - Invalid credentials error displayed
    - Session created on success
    - Redirects to main app
  - **Dependencies**: 5.2
  - **Effort**: S

- [ ] 7.3 Test session persistence
  - **Description**: Verify session persists across browser sessions
  - **Acceptance Criteria**:
    - User remains logged in after browser close/reopen
    - Session persists for 30 days
    - Expired sessions redirect to login with message
  - **Dependencies**: 4.2
  - **Effort**: S

- [x] 7.4 Test account display and logout
  - **Description**: Verify profile display and logout functionality
  - **Acceptance Criteria**:
    - Profile icon displays correct initials
    - Dropdown shows name and email
    - Logout terminates session within 2 seconds
    - Logout redirects to login
  - **Dependencies**: 5.4
  - **Effort**: S

- [ ] 7.5 Test mobile responsiveness
  - **Description**: Verify all auth screens work on mobile
  - **Acceptance Criteria**:
    - All screens render at 320px-480px without horizontal scroll
    - All touch targets minimum 44x44px
    - Appropriate keyboards displayed (email, secure text)
    - Single-column layouts maintained
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4
  - **Effort**: M

- [x] 7.6 Test protected route access control
  - **Description**: Verify protected routes require authentication
  - **Acceptance Criteria**:
    - Unauthenticated users redirected to login
    - Authenticated users can access protected pages
    - No re-authentication required with valid session
  - **Dependencies**: 4.2
  - **Effort**: S

## Open Questions / Assumptions

- **Password Reset**: Not included in MVP. Post-MVP enhancement via Better Auth's built-in password reset flow.
- **Email Verification**: Not included in MVP. Can be enabled via Better Auth config later.
- **OAuth/Social Login**: Not included in MVP. Can be added via Better Auth provider config (Google, GitHub, etc.).
- **Profile Editing**: Name and avatar editing not in MVP. Post-MVP enhancement.
- **Account Deletion**: Not in MVP. Post-MVP with data retention considerations.
- **Role-Based Access**: Owner/staff roles are handled by the Multi-Property Management feature, not the auth layer.
