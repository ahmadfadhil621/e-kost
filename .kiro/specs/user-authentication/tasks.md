# Tasks: User Authentication

## 1. Supabase Auth Setup

- [ ] 1.1 Configure Supabase Auth in project
  - **Description**: Set up Supabase client with Auth configuration and environment variables
  - **Acceptance Criteria**: 
    - Supabase client initialized with project URL and anon key
    - Environment variables configured for Supabase credentials
    - Auth configuration set for 30-day session persistence
  - **Dependencies**: None
  - **Effort**: S

- [ ] 1.2 Create auth context provider
  - **Description**: Build React context to manage authentication state across application
  - **Acceptance Criteria**:
    - Auth context provides user state, loading state, and auth methods
    - Context listens to Supabase auth state changes
    - Session automatically restored on page load
    - Context wraps entire application
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 3

## 2. Backend - Authentication Operations

- [ ] 2.1 Implement user registration with Supabase
  - **Description**: Create registration function using Supabase Auth signUp
  - **Acceptance Criteria**:
    - Function accepts name, email, and password
    - Validates email format and password length (≥8 characters)
    - Calls supabase.auth.signUp() with user metadata (name)
    - Returns user object with unique ID and creation timestamp
    - Handles duplicate email errors
    - Automatically creates session after registration
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 7

- [ ] 2.2 Implement user login with Supabase
  - **Description**: Create login function using Supabase Auth signInWithPassword
  - **Acceptance Criteria**:
    - Function accepts email and password
    - Validates required fields
    - Calls supabase.auth.signInWithPassword()
    - Creates session with 30-day persistence
    - Records login timestamp
    - Returns error for invalid credentials
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 2, 3

- [ ] 2.3 Implement user logout with Supabase
  - **Description**: Create logout function using Supabase Auth signOut
  - **Acceptance Criteria**:
    - Function calls supabase.auth.signOut()
    - Clears session data from browser storage
    - Updates auth context to null user state
    - Returns success confirmation
  - **Dependencies**: 1.1
  - **Effort**: S
  - **Requirements**: Requirement 5

- [ ] 2.4 Implement session persistence check
  - **Description**: Create function to check and restore existing session on app load
  - **Acceptance Criteria**:
    - Function calls supabase.auth.getSession() on app initialization
    - Restores user state if valid session exists
    - Handles expired sessions (>30 days)
    - Redirects to login if session invalid or expired
  - **Dependencies**: 1.1
  - **Effort**: S
  - **Requirements**: Requirement 3

- [ ] 2.5 Implement protected route wrapper
  - **Description**: Create component to protect routes requiring authentication
  - **Acceptance Criteria**:
    - Component checks for active session
    - Redirects to login if no session exists
    - Allows access if session is valid
    - Shows loading state while checking session
  - **Dependencies**: 1.2
  - **Effort**: S
  - **Requirements**: Requirement 3

## 3. Frontend - Registration UI

- [ ] 3.1 Create registration form component
  - **Description**: Build mobile-responsive registration form with name, email, and password fields
  - **Acceptance Criteria**:
    - Form displays fields for name, email, and password
    - Single-column layout on mobile (320px-480px width)
    - All form fields vertically stacked with adequate spacing (16px minimum)
    - Input fields are 48px height for comfortable touch
    - Submit button is 48px height, full width
    - Appropriate keyboard types (email keyboard for email field)
    - Password field displays masked characters
  - **Dependencies**: 2.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 6

- [ ] 3.2 Implement registration form validation
  - **Description**: Add client-side validation for registration form
  - **Acceptance Criteria**:
    - Validates all required fields (name, email, password)
    - Validates email format
    - Validates password minimum length (8 characters)
    - Displays inline error messages below invalid fields
    - Prevents submission until validation passes
    - Clears errors when user corrects input
  - **Dependencies**: 3.1
  - **Effort**: S
  - **Requirements**: Requirement 1, 7

- [ ] 3.3 Handle registration submission and errors
  - **Description**: Connect registration form to Supabase Auth and handle responses
  - **Acceptance Criteria**:
    - Calls registration function on form submit
    - Shows loading state during submission (spinner, disabled button)
    - Displays success message on successful registration
    - Automatically logs in user after registration
    - Redirects to main application after successful registration
    - Displays error banner for duplicate email
    - Displays error banner for API/network errors
  - **Dependencies**: 3.2, 2.1
  - **Effort**: M
  - **Requirements**: Requirement 1

- [ ] 3.4 Add link to login page from registration
  - **Description**: Provide navigation to login page for existing users
  - **Acceptance Criteria**:
    - Displays "Already have an account? Login" link below form
    - Link has minimum 44x44px touch target
    - Navigates to login page on click/tap
  - **Dependencies**: 3.1
  - **Effort**: XS
  - **Requirements**: Requirement 6

## 4. Frontend - Login UI

- [ ] 4.1 Create login form component
  - **Description**: Build mobile-responsive login form with email and password fields
  - **Acceptance Criteria**:
    - Form displays fields for email and password
    - Single-column layout on mobile (320px-480px width)
    - All form fields vertically stacked with adequate spacing (16px minimum)
    - Input fields are 48px height for comfortable touch
    - Submit button is 48px height, full width
    - Appropriate keyboard types (email keyboard for email field)
    - Password field displays masked characters
  - **Dependencies**: 2.2
  - **Effort**: M
  - **Requirements**: Requirement 2, 6

- [ ] 4.2 Implement login form validation
  - **Description**: Add client-side validation for login form
  - **Acceptance Criteria**:
    - Validates all required fields (email, password)
    - Validates email format
    - Displays inline error messages below invalid fields
    - Prevents submission until validation passes
    - Clears errors when user corrects input
  - **Dependencies**: 4.1
  - **Effort**: S
  - **Requirements**: Requirement 2

- [ ] 4.3 Handle login submission and errors
  - **Description**: Connect login form to Supabase Auth and handle responses
  - **Acceptance Criteria**:
    - Calls login function on form submit
    - Shows loading state during submission (spinner, disabled button)
    - Creates session on successful login
    - Redirects to main application after successful login
    - Displays error banner for invalid credentials
    - Displays error banner for API/network errors
  - **Dependencies**: 4.2, 2.2
  - **Effort**: M
  - **Requirements**: Requirement 2

- [ ] 4.4 Add link to registration page from login
  - **Description**: Provide navigation to registration page for new users
  - **Acceptance Criteria**:
    - Displays "Don't have an account? Register" link below form
    - Link has minimum 44x44px touch target
    - Navigates to registration page on click/tap
  - **Dependencies**: 4.1
  - **Effort**: XS
  - **Requirements**: Requirement 6

## 5. Frontend - Account Display UI

- [ ] 5.1 Create profile icon component
  - **Description**: Build component to display user avatar/initials in application header
  - **Acceptance Criteria**:
    - Displays user initials in circular avatar
    - Initials derived from user name (first + last initial, or first 2 letters)
    - Minimum 44x44px dimensions for touch interaction
    - Positioned in top-right corner of application header
    - Click/tap opens account dropdown
    - Initials displayed in uppercase
  - **Dependencies**: 1.2
  - **Effort**: S
  - **Requirements**: Requirement 4

- [ ] 5.2 Create account dropdown component
  - **Description**: Build dropdown to display user information and logout option
  - **Acceptance Criteria**:
    - Displays user name and email from session
    - Shows logout button with minimum 44x44px touch target
    - Dropdown positioned below profile icon
    - Closes on outside click
    - Closes on logout
    - Mobile-responsive layout
  - **Dependencies**: 5.1
  - **Effort**: S
  - **Requirements**: Requirement 4, 5

- [ ] 5.3 Implement logout functionality in dropdown
  - **Description**: Connect logout button to Supabase Auth signOut
  - **Acceptance Criteria**:
    - Calls logout function on button click
    - Shows loading state during logout
    - Clears session data from browser
    - Displays success message after logout
    - Redirects to login page after logout
  - **Dependencies**: 5.2, 2.3
  - **Effort**: S
  - **Requirements**: Requirement 5

- [ ] 5.4 Integrate profile icon into application header
  - **Description**: Add profile icon to main application layout
  - **Acceptance Criteria**:
    - Profile icon visible on all authenticated pages
    - Icon positioned consistently in header
    - Icon only visible when user is logged in
    - Mobile-responsive positioning
  - **Dependencies**: 5.1
  - **Effort**: S
  - **Requirements**: Requirement 4

## 6. Session Management

- [ ] 6.1 Implement session expiration handling
  - **Description**: Detect and handle expired sessions (>30 days)
  - **Acceptance Criteria**:
    - Detects expired session on protected route access
    - Redirects to login page when session expired
    - Displays message: "Your session has expired. Please log in again."
    - Clears stale session data from storage
  - **Dependencies**: 2.4, 2.5
  - **Effort**: S
  - **Requirements**: Requirement 3

- [ ] 6.2 Test session persistence across browser sessions
  - **Description**: Verify sessions persist after browser close/reopen
  - **Acceptance Criteria**:
    - User remains logged in after closing and reopening browser
    - Session persists for 30 days
    - User can access protected pages without re-login
    - Session data correctly restored from storage
  - **Dependencies**: 2.4
  - **Effort**: S
  - **Requirements**: Requirement 3, Success Criteria

## 7. Internationalization (i18n)

- [ ] 7.1 Extract authentication UI strings to translation keys
  - **Description**: Move all authentication UI text to translation keys
  - **Acceptance Criteria**:
    - All form labels translated (name, email, password)
    - All button text translated (Create Account, Login, Logout)
    - All validation messages translated
    - All error messages translated
    - All success messages translated
    - All navigation links translated
    - Translation keys follow consistent naming convention (auth.*)
  - **Dependencies**: 3.1, 4.1, 5.2
  - **Effort**: S
  - **Requirements**: Cross-cutting Constraint 2

## 8. Testing & Validation

- [ ] 8.1 Test user registration workflow
  - **Description**: Verify registration meets all acceptance criteria
  - **Acceptance Criteria**:
    - Can create account in under 30 seconds
    - All required fields validated
    - Email format validated
    - Password length validated (≥8 characters)
    - Duplicate email error displayed
    - User automatically logged in after registration
    - Redirects to main application
  - **Dependencies**: 3.3
  - **Effort**: S
  - **Requirements**: Requirement 1, Success Criteria

- [ ] 8.2 Test user login workflow
  - **Description**: Verify login meets all acceptance criteria
  - **Acceptance Criteria**:
    - Can log in with valid credentials in under 10 seconds
    - Invalid credentials error displayed
    - Session created on successful login
    - Redirects to main application
    - Login timestamp recorded
  - **Dependencies**: 4.3
  - **Effort**: S
  - **Requirements**: Requirement 2, Success Criteria

- [ ] 8.3 Test session persistence
  - **Description**: Verify session persists across browser sessions
  - **Acceptance Criteria**:
    - User remains logged in after browser close/reopen
    - Session persists for 30 days
    - Expired sessions redirect to login
    - Session expiration message displayed
  - **Dependencies**: 6.2
  - **Effort**: S
  - **Requirements**: Requirement 3, Success Criteria

- [ ] 8.4 Test account display and logout
  - **Description**: Verify account display and logout functionality
  - **Acceptance Criteria**:
    - Profile icon displays correct initials
    - Account dropdown shows name and email
    - Logout terminates session within 2 seconds
    - Logout redirects to login page
    - Logout success message displayed
  - **Dependencies**: 5.3
  - **Effort**: S
  - **Requirements**: Requirement 4, 5, Success Criteria

- [ ] 8.5 Test mobile responsiveness
  - **Description**: Verify all authentication screens work on mobile devices
  - **Acceptance Criteria**:
    - All screens render correctly on 320px-480px width
    - No horizontal scrolling required
    - All touch targets minimum 44x44 pixels
    - No pinch-to-zoom required for readability
    - Single-column layouts maintained
    - Appropriate keyboards displayed (email, secure text)
  - **Dependencies**: 3.1, 4.1, 5.1, 5.2
  - **Effort**: M
  - **Requirements**: Requirement 6, Success Criteria

- [ ] 8.6 Test password security
  - **Description**: Verify password security requirements
  - **Acceptance Criteria**:
    - Passwords transmitted over HTTPS only
    - Password fields display masked characters
    - Passwords not stored in plain text (verified via Supabase)
    - Minimum 8 character length enforced
  - **Dependencies**: 3.1, 4.1
  - **Effort**: S
  - **Requirements**: Requirement 7

- [ ] 8.7 Test protected route access control
  - **Description**: Verify protected routes require authentication
  - **Acceptance Criteria**:
    - Unauthenticated users redirected to login
    - Authenticated users can access protected pages
    - No re-authentication required with valid session
  - **Dependencies**: 2.5
  - **Effort**: S
  - **Requirements**: Requirement 3

## Open Questions / Assumptions

- **Password Reset**: Not included in MVP scope, can be added later
- **Email Verification**: Not included in MVP scope, can be added later
- **OAuth/Social Login**: Not included in MVP scope (Google, Facebook, etc.)
- **Two-Factor Authentication**: Not included in MVP scope
- **Profile Picture Upload**: Using initials only in MVP, avatar upload can be added later
- **Account Deletion**: Not included in MVP scope
- **Role-Based Access Control**: Not included in MVP scope, single user type assumed
- **Multi-Property Assignment**: Not included in MVP scope, foundation for future collaboration
