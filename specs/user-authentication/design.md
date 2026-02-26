# Design: User Authentication

## Overview

The User Authentication feature enables property managers to create accounts, log in, and maintain secure sessions while using E-Kost. This feature establishes account ownership visibility through profile display and provides the foundation for future multi-user collaboration capabilities.

### Key Design Decisions

**Authentication Provider**: Better Auth is used for all authentication operations, providing email/password authentication as a first-class feature with built-in password hashing and database sessions. Better Auth runs in the application code with a Prisma adapter, storing auth data in the same database as domain data — enabling fully self-hosted deployments with no external service dependency.

**Session Strategy**: Sessions persist for 30 days using Better Auth's database session strategy. Sessions are stored server-side in a `session` table managed by Prisma, with a secure HTTP-only cookie on the client. This enables server-side session revocation and avoids JWT-only limitations.

**Mobile-First UI**: All authentication screens use single-column layouts optimized for 320px-480px widths with 44x44px minimum touch targets. Form fields stack vertically with appropriate keyboard types (email keyboard for email fields, secure text entry for passwords).

**Profile Display**: User account information is displayed via a profile icon in the application header, showing initials or avatar with a dropdown containing name, email, and logout functionality. This provides immediate visibility of whose account is active.

**Security**: Passwords are hashed using bcrypt (built-in to Better Auth), transmitted over HTTPS only, and never stored in plain text. Minimum password length is 8 characters, enforced at both client and server levels.

## Architecture

### System Context

The User Authentication feature uses Better Auth with Prisma adapter and establishes the foundation for all protected application features:

```mermaid
graph TB
    A[Registration Screen] --> B[Better Auth API]
    C[Login Screen] --> B
    D[Profile Display] --> E[Session Manager]
    E --> B
    F[Protected Routes] --> E
    B --> G[(PostgreSQL via Prisma)]
    E --> H[HTTP-only Session Cookie]
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Auth UI
    participant BA as Better Auth API
    participant DB as Database (Prisma)
    
    U->>UI: Enter email/password
    UI->>BA: POST /api/auth/sign-up
    BA->>BA: Hash password (bcrypt)
    BA->>DB: Create user record
    BA->>DB: Create session record
    DB-->>BA: User + Session created
    BA-->>UI: Set session cookie + User data
    UI->>U: Redirect to main app
```

### Session Management Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant UI as App UI
    participant BA as Better Auth API
    participant DB as Database (Prisma)
    
    B->>UI: Page load (sends session cookie)
    UI->>BA: GET /api/auth/get-session
    BA->>DB: Look up session by token
    alt Valid session (not expired)
        DB-->>BA: Session + User data
        BA-->>UI: User authenticated
        UI->>UI: Render protected content
    else Invalid/expired session
        DB-->>BA: No valid session
        BA-->>UI: Not authenticated
        UI->>UI: Redirect to login
    end
```

## Components and Interfaces

### 1. Authentication Service

**Responsibility**: Handle all authentication operations via Better Auth client.

**Interface**:
```typescript
interface AuthService {
  // Register new user
  register(email: string, password: string, name: string): Promise<AuthResult>;
  
  // Log in existing user
  login(email: string, password: string): Promise<AuthResult>;
  
  // Log out current user
  logout(): Promise<void>;
  
  // Get current session
  getSession(): Promise<Session | null>;
  
  // Get current user
  getCurrentUser(): Promise<User | null>;
}

interface AuthResult {
  user: User;
  session: Session;
}

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}
```

**Implementation Notes**:
- Uses Better Auth client library (better-auth/react)
- Password hashing handled automatically by Better Auth (bcrypt)
- Sessions stored server-side in database via Prisma adapter
- Client receives HTTP-only session cookie (no localStorage for auth tokens)

### 2. Session Manager

**Responsibility**: Manage session state, validate authentication, and handle session persistence.

**Interface**:
```typescript
interface SessionManager {
  // Initialize session from storage
  initialize(): Promise<void>;
  
  // Check if user is authenticated
  isAuthenticated(): boolean;
  
  // Get current user
  getUser(): User | null;
  
  // Clear session (logout)
  clearSession(): void;
  
  // Refresh session token
  refreshSession(): Promise<void>;
}
```

**Implementation Notes**:
- React Context provider for session state
- Better Auth handles session expiry server-side
- Redirects to login on session expiration
- Logout invalidates server-side session and clears session cookie

### 3. API Routes

**POST /api/auth/register**
- Creates new user account with email, password, and name
- Validates email format and password length
- Returns session and user data on success
- Response time: <2 seconds

**POST /api/auth/login**
- Authenticates user with email and password
- Creates session with 30-day expiration
- Returns session and user data on success
- Response time: <2 seconds

**POST /api/auth/logout**
- Terminates current session
- Deletes session record from database
- Clears session cookie
- Response time: <1 second

**GET /api/auth/session**
- Returns current session and user data
- Validates session token
- Response time: <500ms

**Request/Response Schemas**:
```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  user: User;
  session: Session;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  session: Session;
}

// Error Response
interface ErrorResponse {
  error: string;
  code: string;
}
```

### 4. UI Components

**RegistrationForm Component**
- Form with fields: name, email, password
- Client-side validation: required fields, email format, password length
- Displays validation errors inline
- Submit button with loading state
- Mobile-optimized: single column, 44x44px touch targets
- Appropriate keyboard types (email, secure text)

**LoginForm Component**
- Form with fields: email, password
- Client-side validation: required fields
- Displays authentication errors
- Submit button with loading state
- Mobile-optimized: single column, 44x44px touch targets
- Appropriate keyboard types (email, secure text)

**ProfileIcon Component**
- Displays user initials or avatar image
- Minimum 44x44px dimensions for touch
- Click/tap opens profile dropdown
- Positioned in application header

**ProfileDropdown Component**
- Displays user name and email
- Logout button with 44x44px minimum
- Closes on outside click
- Mobile-optimized positioning

**ProtectedRoute Component**
- Wraps protected pages/components
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading state during session check

## Data Models

### Database Schema

Better Auth manages user accounts and sessions via the Prisma adapter. All auth tables live in the same `public` schema as domain tables (Tenant, Room, Payment), managed by a single Prisma schema:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  password          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

Authorization is enforced at the service layer (not database-level RLS), keeping the system portable to any PostgreSQL instance.

### Indexes for Performance

```prisma
// Prisma automatically creates indexes for @unique fields (email, session token)
// Additional indexes defined in schema as needed:
// @@index([userId]) on Session and Account models
```

### Data Flow

1. **User Registration**: 
   - UI submits email, password, name → Better Auth API `/api/auth/sign-up`
   - Better Auth hashes password (bcrypt) and creates User record via Prisma
   - Better Auth creates Account record (credential provider) and Session record
   - Better Auth sets HTTP-only session cookie in response
   - UI redirects to main app

2. **User Login**:
   - UI submits email, password → Better Auth API `/api/auth/sign-in/email`
   - Better Auth validates credentials against stored hash
   - Better Auth creates new Session record in database
   - Better Auth sets HTTP-only session cookie in response
   - UI redirects to main app

3. **Session Validation**:
   - App loads → Browser sends session cookie automatically
   - Better Auth looks up session in database via Prisma
   - If valid (not expired): return user data, render protected content
   - If invalid/expired: return not authenticated, redirect to login

4. **User Logout**:
   - UI calls Better Auth API `/api/auth/sign-out`
   - Better Auth deletes session record from database
   - Better Auth clears session cookie
   - UI redirects to login

### Session Storage

Sessions are stored server-side in the `session` database table via Prisma. The client receives an HTTP-only cookie containing the session token:

- **Server-side**: Session record in `session` table with userId, token, expiresAt
- **Client-side**: HTTP-only, secure cookie (not accessible via JavaScript, preventing XSS)
- **No localStorage**: Auth tokens are never stored in localStorage (more secure than client-side token storage)

### User Metadata

User metadata (name, email) is stored directly in the `user` table managed by Prisma. No separate profiles table or metadata JSON field needed — the User model contains all user fields directly.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Successful Registration Creates Session

*For any* valid registration data (name, email, password ≥8 characters), submitting the registration form should create a new user account and return a valid session with access token, refresh token, and 30-day expiration.

**Validates: Requirements 1.2, 1.6, 1.7, 3.1**

### Property 2: Form Validation Rejects Missing Fields

*For any* authentication form (registration or login) with one or more required fields missing, form submission should be prevented and validation errors should be displayed for each missing field.

**Validates: Requirements 1.3, 2.4**

### Property 3: Password Length Validation

*For any* password string with length less than 8 characters, the registration form should reject the submission and display a validation error indicating the minimum length requirement.

**Validates: Requirements 1.5**

### Property 4: Successful Login Creates Persistent Session

*For any* valid email and password combination for an existing user, submitting the login form should authenticate the user and create a session that persists in localStorage with a 30-day expiration.

**Validates: Requirements 2.2, 2.5, 2.6, 3.1**

### Property 5: Invalid Credentials Rejected

*For any* email and password combination that does not match an existing user account, the login attempt should be rejected and an error message indicating invalid credentials should be displayed.

**Validates: Requirements 2.3**

### Property 6: Protected Route Access Control

*For any* protected application route, accessing the route without an active session should redirect to the login interface, and accessing with an active session should allow access without re-authentication.

**Validates: Requirements 3.4, 3.5, 5.4**

### Property 7: Profile Icon Displays Initials

*For any* user with a name, the profile icon should display the user's initials derived from the first letter of each word in the name (e.g., "John Doe" → "JD").

**Validates: Requirements 4.2**

### Property 8: Logout Clears Session

*For any* authenticated user, clicking the logout button should terminate the session, clear all session data from localStorage, and redirect to the login interface.

**Validates: Requirements 5.2, 5.3**

### Property 9: Touch Target Minimum Dimensions

*For any* interactive element on authentication screens (buttons, links, profile icon), the rendered element should have minimum dimensions of 44x44 pixels to ensure comfortable touch interaction.

**Validates: Requirements 6.3, 4.5**

### Property 10: Login Timestamp Recording

*For any* successful login, the system should record a timestamp indicating when the login occurred.

**Validates: Requirements 2.6**

## Error Handling

### Authentication Errors

**Invalid Email Format**:
- Scenario: User enters malformed email address
- Handling: Client-side validation prevents submission
- Message: "Please enter a valid email address"
- UI: Display error below email field

**Email Already Registered**:
- Scenario: User attempts to register with existing email
- Handling: Better Auth returns error (unique constraint violation), API forwards to client
- Message: "This email is already registered. Please log in instead."
- UI: Display error below email field with link to login page

**Invalid Login Credentials**:
- Scenario: User enters wrong email or password
- Handling: Better Auth returns error (credential mismatch), API forwards to client
- Message: "Invalid email or password. Please try again."
- UI: Display error at top of form (don't specify which field is wrong for security)

**Password Too Short**:
- Scenario: User enters password with fewer than 8 characters
- Handling: Client-side validation prevents submission
- Message: "Password must be at least 8 characters long"
- UI: Display error below password field

**Missing Required Fields**:
- Scenario: User attempts to submit form with empty fields
- Handling: Client-side validation prevents submission
- Message: "This field is required" (per field)
- UI: Display error below each empty required field

### Session Errors

**Session Expired**:
- Scenario: User's session expires after 30 days
- Handling: Session Manager detects expired token
- Message: "Your session has expired. Please log in again."
- UI: Redirect to login page with message displayed

**Invalid Session Token**:
- Scenario: Session token is corrupted or invalid
- Handling: Better Auth database lookup finds no matching session
- Message: "Your session is invalid. Please log in again."
- UI: Clear session cookie, redirect to login page

**Network Timeout**:
- Scenario: Authentication request takes longer than 5 seconds
- Handling: Client-side timeout cancels request
- Message: "Request timed out. Please check your connection and try again."
- UI: Display error with retry button

### Database Errors

**User Record Creation Failure**:
- Scenario: User record creation fails during registration
- Handling: Better Auth transaction rollback (Prisma transaction)
- Message: "Account creation failed. Please try again."
- UI: Display error on registration form
- Logging: Log error details for debugging

**Connection Failure**:
- Scenario: Cannot connect to database
- Handling: API returns 503 Service Unavailable
- Message: "Service temporarily unavailable. Please try again in a moment."
- UI: Display error with retry button
- Retry: Implement exponential backoff (1s, 2s, 4s)

### UI Errors

**Missing Translation Keys**:
- Scenario: Translation key not found in locale file
- Handling: Fall back to English key or display key name
- Logging: Log missing keys for developer attention
- UI: Display fallback text without breaking layout

**Component Rendering Failure**:
- Scenario: React component fails to render
- Handling: Error boundary catches error
- Fallback: Display simplified error message
- Logging: Log error details with stack trace

### Security Errors

**CSRF Token Mismatch** (Future):
- Scenario: Request CSRF token doesn't match session
- Handling: Reject request with 403 Forbidden
- Message: "Security validation failed. Please refresh and try again."
- UI: Redirect to login page

**Rate Limiting** (Future):
- Scenario: Too many login attempts from same IP
- Handling: Temporarily block requests
- Message: "Too many login attempts. Please try again in 15 minutes."
- UI: Display error with countdown timer

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Example: Registration with valid data creates account
- Example: Login with valid credentials returns session
- Example: Duplicate email registration shows error
- Example: Session expiration redirects to login
- Edge case: Empty form submission shows validation errors
- Integration: API routes return correct response formats

**Property-Based Tests**: Verify universal properties across all inputs
- Property tests handle comprehensive input coverage through randomization
- Each property test runs minimum 100 iterations
- Properties validate correctness across the full input space

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
```typescript
import fc from 'fast-check';

// Minimum 100 iterations per property test
fc.assert(property, { numRuns: 100 });
```

**Test Tagging**: Each property test must include a comment referencing the design property:
```typescript
// Feature: user-authentication, Property 1: Successful Registration Creates Session
test('valid registration creates account and session', () => {
  fc.assert(
    fc.property(
      validUserDataArbitrary,
      async (userData) => {
        const result = await authService.register(
          userData.email,
          userData.password,
          userData.name
        );
        
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(userData.email);
        expect(result.session).toBeDefined();
        expect(result.session.accessToken).toBeTruthy();
        expect(result.session.expiresAt).toBeGreaterThan(Date.now());
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Unit Tests**:
- Registration flow with various scenarios (5-8 tests)
- Login flow with various scenarios (5-8 tests)
- Session management (5-7 tests)
- Profile display (3-5 tests)
- Logout flow (3-5 tests)
- Form validation (5-8 tests)
- Error handling scenarios (8-12 tests)
- UI component rendering (8-12 tests)

**Property-Based Tests**:
- One test per correctness property (10 tests total)
- Each test runs 100+ iterations
- Generators for: user data, credentials, sessions, form inputs

**Integration Tests**:
- End-to-end registration flow (1-2 tests)
- End-to-end login flow (1-2 tests)
- Session persistence across page reloads (1-2 tests)
- Protected route access control (2-3 tests)

### Test Data Generators

**Valid User Data Generator**:
```typescript
const validUserDataArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 })
});
```

**Invalid Email Generator**:
```typescript
const invalidEmailArbitrary = fc.oneof(
  fc.string().filter(s => !s.includes('@')),
  fc.constant(''),
  fc.constant('invalid'),
  fc.constant('test@')
);
```

**Short Password Generator**:
```typescript
const shortPasswordArbitrary = fc.string({ 
  minLength: 0, 
  maxLength: 7 
});
```

**Session Generator**:
```typescript
const sessionArbitrary = fc.record({
  accessToken: fc.uuid(),
  refreshToken: fc.uuid(),
  expiresAt: fc.integer({ min: Date.now(), max: Date.now() + 30 * 24 * 60 * 60 * 1000 })
});
```

**Form Input Generator** (with missing fields):
```typescript
const formInputWithMissingFieldsArbitrary = fc.record({
  name: fc.option(fc.string(), { nil: '' }),
  email: fc.option(fc.emailAddress(), { nil: '' }),
  password: fc.option(fc.string({ minLength: 8 }), { nil: '' })
}).filter(input => !input.name || !input.email || !input.password);
```

### Mobile Testing

**Responsive Design**:
- Test layouts at 320px, 375px, 414px, 480px widths
- Verify single-column layout on all mobile widths
- Verify no horizontal scrolling required
- Test form field stacking and spacing

**Touch Targets**:
- Verify all buttons are 44x44px minimum
- Verify profile icon is 44x44px minimum
- Verify form inputs have adequate touch area
- Test tap interactions on mobile devices

**Keyboard Types**:
- Verify email fields use `type="email"` (triggers email keyboard)
- Verify password fields use `type="password"` (triggers secure text entry)
- Test on iOS and Android devices

**Accessibility**:
- Test with screen readers (VoiceOver, TalkBack)
- Verify all form fields have associated labels
- Verify error messages are announced
- Test keyboard navigation for all interactive elements
- Verify color contrast meets WCAG AA standards

### Security Testing

**Password Security**:
- Verify passwords are never logged
- Verify passwords are never displayed in plain text
- Verify password fields use `type="password"`
- Verify HTTPS is enforced (infrastructure test)

**Session Security**:
- Verify sessions expire after 30 days
- Verify expired sessions redirect to login
- Verify logout clears all session data
- Verify session tokens are not exposed in URLs

**Input Validation**:
- Test SQL injection attempts (should be prevented by Prisma parameterized queries)
- Test XSS attempts in name field
- Test email format validation
- Test password length validation

### Performance Testing

**Response Time**:
- Registration completes in <2 seconds
- Login completes in <2 seconds
- Logout completes in <1 second
- Session validation completes in <500ms

**Load Testing**:
- Test with 100 concurrent registrations
- Test with 100 concurrent logins
- Verify no performance degradation
- Monitor database connection pool

## Implementation Notes

### Technology Stack Integration

**Frontend**:
- React 18 components for authentication UI
- React Hook Form for form handling and validation
- Zod for schema validation
- Tailwind CSS for mobile-first styling
- react-i18next for translation keys
- Better Auth React client (better-auth/react)

**Backend**:
- Next.js API route handler for Better Auth (`/api/auth/[...all]`)
- Better Auth server instance with Prisma adapter
- Prisma for all database access (auth + domain tables)
- Zod for request/response validation

**Database**:
- PostgreSQL (via Supabase or any self-hosted instance)
- All auth tables (User, Session, Account, Verification) managed by Prisma
- Service-layer authorization (not database-level RLS)

### Better Auth Configuration

**Server Instance** (`src/lib/auth.ts`):
```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
```

**Client Instance** (`src/lib/auth-client.ts`):
```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

**API Route Handler** (`src/app/api/auth/[...all]/route.ts`):
```typescript
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

**Session Configuration**:
- Session duration: 30 days (2,592,000 seconds)
- Storage: Database (server-side via Prisma adapter)
- Client: HTTP-only secure cookie
- Cookie cache: 5 minutes (reduces database lookups)

### React Hook Form Integration

**Registration Form**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function RegistrationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  });

  const onSubmit = async (data: RegistrationFormData) => {
    const result = await authService.register(data.email, data.password, data.name);
    // Handle success
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Register</button>
    </form>
  );
}
```

### Session Management with Better Auth React Client

Better Auth provides a React client with built-in hooks, eliminating the need for a custom Auth Context:

```typescript
import { authClient } from '@/lib/auth-client';

// Use in components directly:
const { data: session, isPending } = authClient.useSession();

// Sign up:
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Sign in:
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out:
await authClient.signOut();
```

If a custom context wrapper is needed for additional app-level state:

```typescript
import { createContext, useContext } from 'react';
import { authClient } from '@/lib/auth-client';

interface AuthContextType {
  user: { id: string; email: string; name: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  const { data: session, isPending } = authClient.useSession();

  return {
    user: session?.user ?? null,
    loading: isPending,
    signIn: async (email, password) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password, name) => {
      const { error } = await authClient.signUp.email({ email, password, name });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await authClient.signOut();
      if (error) throw error;
    },
  };
}
```

### Protected Route Component

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

### Profile Icon Component

```typescript
function ProfileIcon() {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = user?.name 
    ? getInitials(user.name)
    : '??';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="min-w-[44px] min-h-[44px] rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold"
        aria-label="User profile"
      >
        {initials}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 w-full min-h-[44px] bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
```

### Mobile-First CSS

**Tailwind Configuration**:
```css
/* Mobile-first: default styles for 320px+ */
.auth-form {
  @apply flex flex-col gap-4 p-4 w-full max-w-md mx-auto;
}

.auth-input {
  @apply w-full min-h-[44px] px-4 py-2 border border-gray-300 rounded;
}

.auth-button {
  @apply w-full min-h-[44px] bg-blue-500 text-white rounded font-semibold;
}

.auth-error {
  @apply text-red-500 text-sm mt-1;
}
```

**Touch Target Enforcement**:
```css
/* Ensure all interactive elements meet 44x44px minimum */
button, a, input[type="submit"] {
  @apply min-w-[44px] min-h-[44px];
}
```

### Internationalization

**Translation Keys**:
```json
{
  "auth.register.title": "Create Account",
  "auth.register.name": "Full Name",
  "auth.register.email": "Email Address",
  "auth.register.password": "Password",
  "auth.register.submit": "Register",
  "auth.login.title": "Log In",
  "auth.login.email": "Email Address",
  "auth.login.password": "Password",
  "auth.login.submit": "Log In",
  "auth.logout": "Log Out",
  "auth.profile.title": "Account",
  "auth.validation.required": "This field is required",
  "auth.validation.email": "Please enter a valid email address",
  "auth.validation.passwordLength": "Password must be at least 8 characters",
  "auth.error.emailExists": "This email is already registered",
  "auth.error.invalidCredentials": "Invalid email or password",
  "auth.error.sessionExpired": "Your session has expired. Please log in again.",
  "auth.success.logout": "You have been logged out successfully"
}
```

**Usage in Components**:
```typescript
import { useTranslation } from 'react-i18next';

function RegistrationForm() {
  const { t } = useTranslation();
  
  return (
    <form>
      <h1>{t('auth.register.title')}</h1>
      <label>{t('auth.register.name')}</label>
      <input type="text" />
      {/* ... */}
    </form>
  );
}
```

### Security Considerations

**Password Handling**:
- Never log passwords
- Never display passwords in plain text
- Always use `type="password"` for password inputs
- Passwords transmitted over HTTPS only
- Passwords hashed with bcrypt by Better Auth (built-in)

**Session Security**:
- Sessions stored server-side in database (not localStorage)
- Client receives HTTP-only, secure cookie (not accessible via JavaScript)
- Server-side session revocation on logout
- Session expiry enforced server-side

**Input Sanitization**:
- Zod validation prevents malformed data
- React automatically escapes JSX content (XSS protection)
- Prisma uses parameterized queries (SQL injection protection)

**Authorization**:
- Service-layer authorization enforces user data scoping
- Users can only access their own data (enforced in service layer, not database RLS)
- Portable to any PostgreSQL instance without Supabase-specific RLS

### Performance Optimization

**Code Splitting**:
- Lazy load authentication components
- Separate bundle for auth pages
- Reduce initial bundle size

**Caching**:
- Cache user profile data in React Context
- Avoid redundant session validation calls
- Use SWR or React Query for data fetching

**Optimistic UI Updates**:
- Show loading states immediately
- Update UI before API response
- Rollback on error

### Deployment Considerations

**Environment Variables**:
```env
DATABASE_URL=postgresql://user:password@host:5432/ekost
BETTER_AUTH_SECRET=your-random-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Database Setup**:
1. Run `prisma migrate dev` to create auth tables (User, Session, Account, Verification)
2. Auth tables live alongside domain tables in same schema
3. No separate database or schema configuration needed

**Better Auth Configuration**:
1. Install `better-auth` package
2. Configure server instance with Prisma adapter (`src/lib/auth.ts`)
3. Create client instance (`src/lib/auth-client.ts`)
4. Add catch-all API route handler (`src/app/api/auth/[...all]/route.ts`)
5. Generate and set `BETTER_AUTH_SECRET` environment variable

**Monitoring**:
- Track authentication success/failure rates
- Monitor session creation and expiration
- Alert on high error rates
- Track response times for auth operations

## Future Enhancements

**Out of Scope for MVP**:
- OAuth/social login (Google, Facebook, GitHub)
- Two-factor authentication (2FA)
- Password reset flow via email
- Email verification
- Account deletion or deactivation
- User profile editing (name, avatar)
- Role-based access control (RBAC)
- Team invitation and collaboration
- Multi-property assignment
- Admin user management
- Audit log for authentication events
- Account recovery options
- Remember me checkbox
- Login history tracking

**Post-MVP Considerations**:
- Add password reset flow with email verification
- Implement email verification for new accounts
- Add OAuth providers for easier login
- Implement 2FA for enhanced security
- Add user profile editing capabilities
- Build admin dashboard for user management
- Add role-based permissions for collaboration
- Implement team invitation system
- Add audit logging for compliance
- Build account recovery mechanisms
