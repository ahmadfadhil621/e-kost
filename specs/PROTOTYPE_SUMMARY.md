# E-Kost — Prototype Summary

> **Purpose**: Boarding house (kost) management app for Indonesian property owners/staff. Mobile-first SPA.

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components + custom HSL design tokens in `index.css`
- **Routing**: react-router-dom v6 (client-side)
- **State**: React Context (no backend/database — all in-memory with seed data)
- **Font**: Plus Jakarta Sans
- **Icons**: lucide-react
- **Other**: date-fns, recharts (installed but unused), sonner (toasts), react-hook-form + zod (installed)

---

## Architecture

### Auth (`src/context/AuthContext.tsx`)
- **Dummy auth** — hardcoded users, no persistence
- **Users**:
  - `u1` — Pak Hendra (owner) — `owner@ekost.com` / `owner123`
  - `u2` — Rina Sari (staff) — `staff@ekost.com` / `staff123`
- **Roles**: `"owner" | "staff"` — owners can manage staff; staff has read-only access to staff settings
- Exports: `useAuth()`, `ALL_USERS`, `User` interface

### Data Layer (`src/context/KostContext.tsx`)
- **All state is in-memory** (React useState), resets on refresh
- Core interfaces:

```typescript
interface Property {
  id: string;
  name: string;
  address: string;
  ownerId: string;        // references User.id
  staffIds: string[];     // references User.id[]
  rooms: Room[];
  tenants: Record<string, Tenant>;
  payments: Record<string, Payment[]>;  // keyed by tenantId
  balances: Record<string, number>;     // outstanding balance per tenant
  notes: Record<string, TenantNote[]>;  // keyed by tenantId
  expenses: Expense[];
}

interface Room {
  id: string;
  number: string;           // display number like "101", "A1"
  type: "Standard" | "Deluxe";
  monthlyRent: number;      // in EUR (€)
  status: "occupied" | "available" | "renovation";
  tenantId: string | null;  // null if not occupied
}

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  moveInDate: string;  // ISO date
}

interface Payment { id: string; date: string; amount: number; }
interface TenantNote { id: string; date: string; text: string; }
interface Expense { id: string; date: string; category: string; description: string; amount: number; }
```

- **Expense categories**: Electricity, Water, Internet, Maintenance, Cleaning, Supplies, Tax, Transfer, Other
- **Seed properties**:
  - **Kost Melati** (prop1) — 8 rooms, 6 tenants, Jakarta — owner: u1, staff: [u2]
  - **Kost Anggrek** (prop2) — 5 rooms, 4 tenants (1 unassigned), Bandung — owner: u1, no staff

### Context Actions (KostContextType)
| Action | Description |
|--------|-------------|
| `setActiveProperty(id)` | Switch active property |
| `getPropertiesForUser(userId)` | Get properties where user is owner or staff |
| `recordPayment(tenantId, amount, date)` | Add payment, reduce balance |
| `addTenant(data) → id` | Create new tenant (unassigned) |
| `assignTenantToRoom(tenantId, roomId)` | Assign tenant to available room, set balance = monthlyRent |
| `unassignTenantFromRoom(tenantId)` | Free up room |
| `updateTenant(tenantId, data)` | Partial update tenant info |
| `moveOutTenant(tenantId)` | Free room, keep tenant record |
| `setRoomStatus(roomId, status)` | Toggle available ↔ renovation (only non-occupied rooms) |
| `addNote / deleteNote` | Tenant notes CRUD |
| `addExpense / deleteExpense` | Property expense CRUD |
| `addStaff / removeStaff` | Manage property staff list |

---

## Routes & Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | `Overview` | **Default after login.** Dashboard with occupancy %, finance summary (income/expenses for current month), outstanding balances list, recent payments, quick stats |
| `/rooms` | `Dashboard` | Room grid — each room shows status (occupied/available/renovation), tenant name, balance. Tap to navigate or assign |
| `/tenants` | `Tenants` | Tenant list with room assignment, balance. "Add Tenant" button opens form |
| `/finance` | `Finance` | Monthly income/expense tracker with month selector, category breakdown, add/delete expenses |
| `/settings` | `Settings` | Staff management (owner-only add/remove). Shows owner + staff list with avatars |
| `/tenant/:tenantId` | `TenantDetail` | Full tenant profile: contact info, room, payment summary, payment history, notes. Actions: record payment, edit tenant, move out |
| (no active property) | `PropertySelector` | Property picker shown before any route when no property is selected |
| (not logged in) | `Login` | Email/password form with demo account quick-fill buttons |

### Navigation
- **Bottom nav** (5 tabs): Overview, Rooms, Tenants, Finance, Settings
- **AppHeader**: Property switcher (popover with property list) + user avatar (popover with logout)
- **PropertySwitcher**: Shows active property name/address; dropdown to switch if multiple properties

---

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `AppHeader` | `src/components/AppHeader.tsx` | Sticky header with PropertySwitcher + avatar popover (logout) + room status summary |
| `BottomNav` | `src/components/BottomNav.tsx` | Fixed bottom 5-tab navigation |
| `PropertySwitcher` | `src/components/PropertySwitcher.tsx` | Popover to switch between user's properties |
| `RoomCard` | `src/components/RoomCard.tsx` | Room card with 3 states: occupied (tenant+balance), available (assign CTA), renovation. Status-based border colors using custom tokens |
| `AssignTenantDialog` | `src/components/AssignTenantDialog.tsx` | Dialog to assign existing unassigned tenant or create new tenant for a room |
| `RoomStatusDialog` | `src/components/RoomStatusDialog.tsx` | Toggle room between available/renovation |
| `AddTenantForm` | `src/components/AddTenantForm.tsx` | Dialog form: name, phone, email, move-in date |
| `EditTenantForm` | `src/components/EditTenantForm.tsx` | Edit tenant details dialog |
| `PaymentForm` | `src/components/PaymentForm.tsx` | Record payment dialog with amount + date |
| `MoveOutDialog` | `src/components/MoveOutDialog.tsx` | Confirmation dialog for tenant move-out |
| `AddExpenseDialog` | `src/components/AddExpenseDialog.tsx` | Add expense: category select, description, amount, date |
| `MonthSelector` | `src/components/MonthSelector.tsx` | Month navigation (prev/next) for Finance page |

---

## Design System

### Color Tokens (HSL in `index.css`)
- **Primary**: teal/green (`160 60% 40%`) — used for positive states, CTAs
- **Destructive**: red (`0 72% 51%`) — unpaid, errors
- **Custom status tokens**:
  - `--status-paid` / `--status-paid-bg` / `--status-paid-foreground` — green tones
  - `--status-unpaid` / `--status-unpaid-bg` / `--status-unpaid-foreground` — red tones
  - `--status-available` / `--status-available-bg` / `--status-available-foreground` — green tones
  - `--status-renovation` / `--status-renovation-bg` / `--status-renovation-foreground` — amber/orange tones
- **Dark mode**: Fully supported with matching dark variants for all tokens

### UI Patterns
- Mobile-first (max-width cards, bottom nav, touch targets ≥44px)
- Cards with `shadow-sm`, `border-border`, `bg-card`
- Badges for status indicators (Paid/Unpaid/Available/Renovation)
- Dialogs for all create/edit/delete actions
- Toast notifications via sonner (top-center)
- Animations: `animate-fade-in` with staggered delays on room cards
- Currency: EUR (€) — `formatCurrency(amount)` → `€xx.xx`

---

## What's Missing (for production)

1. **Backend/Database** — Everything is in-memory; needs Supabase or similar
2. **Real authentication** — Currently dummy login
3. **Multi-tenancy** — Property data is shared across all users in-memory
4. **Payment tracking** — "Total paid this month" sums ALL payments, not just current month's
5. **Tenant deletion** — Move-out keeps tenant record; no hard delete
6. **Search/filter** — No search on tenants or rooms
7. **Responsive desktop layout** — Designed mobile-first, no desktop optimization
8. **Notifications/reminders** — No payment reminders or alerts
9. **File uploads** — No tenant documents/ID photos
10. **Reports/export** — No PDF or CSV export
11. **Localization** — UI is English; currency is EUR (should be IDR for Indonesia)

---

## File Structure

```
src/
├── App.tsx                          # Root: QueryClient, Auth, Routing
├── main.tsx                         # Entry point
├── index.css                        # Tailwind + design tokens (light/dark)
├── context/
│   ├── AuthContext.tsx               # Dummy auth with 2 users
│   └── KostContext.tsx               # All app state + seed data + actions
├── pages/
│   ├── Overview.tsx                  # Dashboard overview (default route)
│   ├── Dashboard.tsx                 # Room grid
│   ├── Tenants.tsx                   # Tenant list
│   ├── TenantDetail.tsx              # Single tenant view
│   ├── Finance.tsx                   # Income/expense tracker
│   ├── Settings.tsx                  # Staff management
│   ├── Login.tsx                     # Auth screen
│   ├── PropertySelector.tsx          # Property picker
│   └── NotFound.tsx                  # 404
├── components/
│   ├── AppHeader.tsx                 # Header with property switcher + avatar
│   ├── BottomNav.tsx                 # 5-tab bottom navigation
│   ├── PropertySwitcher.tsx          # Property dropdown
│   ├── RoomCard.tsx                  # Room card (3 status variants)
│   ├── AssignTenantDialog.tsx        # Assign tenant to room
│   ├── RoomStatusDialog.tsx          # Toggle room status
│   ├── AddTenantForm.tsx             # New tenant form
│   ├── EditTenantForm.tsx            # Edit tenant form
│   ├── PaymentForm.tsx               # Record payment
│   ├── MoveOutDialog.tsx             # Move-out confirmation
│   ├── AddExpenseDialog.tsx          # New expense form
│   ├── MonthSelector.tsx             # Month nav for finance
│   └── ui/                           # shadcn/ui primitives
```
