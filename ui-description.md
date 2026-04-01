# E-Kost — UI Description

> Visual guide for LLM consumption. Mobile-first SPA (max-width ~480px centered).

---

## Global Layout

```
┌─────────────────────────────────┐
│         AppHeader (sticky)      │
│  [🏢 Property Name ▾]  [Avatar]│
│  X occupied · Y avail · Z reno  │
├─────────────────────────────────┤
│                                 │
│         Page Content            │
│      (scrollable, pb-20)        │
│                                 │
├─────────────────────────────────┤
│  Overview │ Rooms │ Tenants │   │
│  Finance                        │
│         BottomNav (fixed)       │
└─────────────────────────────────┘
```

- **AppHeader**: White card bg, bottom border. Left: property switcher (building icon + name + chevron; popover dropdown if multiple properties). Right: circular avatar with initials (teal bg), popover with name/email, "Settings" link, and logout button.
- **BottomNav**: 4 icon+label tabs, 11px semibold labels. Active tab = teal (`primary`). Inactive = muted gray. Fixed to bottom, h-14.

---

## Login Page

- Centered card, max-w-sm
- App title "E-Kost" with building icon, subtitle "Boarding House Management"
- Email + password inputs with labels
- "Sign In" button (full-width, teal primary)
- Two quick-fill buttons below: "Demo Owner Account" and "Demo Staff Account" (outline style, smaller text)
- No header or bottom nav

---

## Property Selector

- Shown when no property is active (before any page loads)
- Centered heading "Select Property"
- List of property cards: each shows building icon, property name (bold), address (muted), room count badge
- Tapping a card sets it as active and enters the app

---

## Overview Page (default `/`)

- **Occupancy Card**: Large percentage number, progress bar (teal fill), room breakdown below (occupied/available/renovation counts with colored dots: teal, green, amber)
- **Finance Summary**: Two side-by-side cards:
  - "Income" card: green text, euro amount, "Expected: €X" subtitle
  - "Expenses" card: red text, euro amount
  - Below: "Net Profit" with green/red coloring based on positive/negative
- **Outstanding Balances**: List of tenant rows with name, room number, and red balance amount. Each row is tappable → navigates to tenant detail. "View all tenants →" link at bottom.
- **Recent Payments**: List of up to 5 payment entries showing tenant name, date, and green amount. "View finances →" link at bottom.
- **Quick Stats Row**: 3 tappable mini-cards at bottom (Rooms count, Tenants count, Net Profit) — each navigates to respective page.

---

## Rooms Page (`/rooms`)

- Grid of room cards (1 column on mobile), staggered fade-in animation
- **Room Card** has 3 visual states:

### Available Room
```
┌─────────────────────────────┐
│  Room 103        [Available]│  ← green badge
│  Standard · €200/mo         │
│                             │
│  👤 Assign Tenant           │  ← teal text, tap opens dialog
│  ─────────────────────────  │
│  🔧 Change room status      │  ← muted text, tap opens dialog
└─────────────────────────────┘
```
- Green left border accent (`border-l-4 border-status-available`)

### Renovation Room
```
┌─────────────────────────────┐
│  Room 104       [Renovation]│  ← amber/orange badge
│  Deluxe · €350/mo           │
└─────────────────────────────┘
```
- Amber left border accent, muted background

### Occupied Room
```
┌─────────────────────────────┐
│  Room 101                   │
│  Budi Santoso               │  ← tenant name, bold
│  Standard · €200/mo         │
│                    [Paid ✓] │  ← green badge if balance=0
│               or [€200 ✗]  │  ← red badge if balance>0
└─────────────────────────────┘
```
- Tapping navigates to `/tenant/:id`

---

## Tenants Page (`/tenants`)

- Header row: "Tenants (N)" title + "Add Tenant" button (teal, with Plus icon)
- List of tenant cards, each showing:
  - Tenant name (bold)
  - Room assignment: "Room 101 · Standard" or amber "Unassigned" badge
  - Balance: green "Paid" badge or red "€X unpaid" badge
- Tapping a tenant card → navigates to `/tenant/:id`

---

## Tenant Detail Page (`/tenant/:id`)

- **Header**: Back arrow, tenant name, edit (pencil) and move-out (door) icon buttons
- **Info Card**: Phone, email, move-in date rows with icons
- **Room Card**: Room number, type, monthly rent
- **Payment Summary Card**: Total paid (green), outstanding balance (red if >0, green "Paid" if 0), monthly rent reference
- **Payment History**: Chronological list of payments (date + amount), or "No payments recorded" empty state
- **Notes Section**: List of notes with date, text, and delete (trash) icon. "Add Note" button opens a dialog with textarea.
- **Fixed Bottom Button**: "Record Payment" (full-width teal button, fixed above bottom nav) → opens payment dialog

---

## Finance Page (`/finance`)

- **Month Selector**: Left/right chevron arrows around "March 2026" label
- **"Add Expense" Button**: Full-width, outline style, Plus icon
- **Summary Cards**: Two side-by-side:
  - Monthly Income (green amount)
  - Monthly Expenses (red amount)
  - Net Profit row below
- **Income Section**: "Income" heading with total. List of payment entries (tenant name, date, amount in green)
- **Expense Section**: "Expenses" heading with total. List of expense entries (category + description, date, amount in red, trash icon to delete)
- **Category Breakdown**: Horizontal stacked progress bar showing expense distribution by category, with legend below (icon + category name + amount)

---

## Settings Page (`/settings`)

- Accessed via avatar popover menu in the header (not in bottom nav)
- **Team Section**: "Team" heading
- Owner card: avatar circle (teal), name, email, "Owner" badge
- Staff cards: same layout, "Staff" badge, with red "Remove" button (owner-only)
- **Add Staff Dialog** (owner-only): "Add Staff" button → dialog with user select dropdown + "Add" button
- **Remove Confirmation**: AlertDialog with warning text and confirm/cancel

---

## Dialogs (Modal Overlays)

All dialogs use shadcn `Dialog` component: centered, with dark overlay backdrop, slide-up animation.

### Assign Tenant Dialog
- Title: "Assign Tenant to Room X"
- Room info (type + rent)
- List of unassigned tenant buttons
- "Create New Tenant" button at bottom
- Cancel option via X button

### Add Tenant Form
- Fields: Name (required), Phone, Email, Move-in Date (calendar picker)
- "Add Tenant" submit button

### Edit Tenant Form
- Pre-filled fields: Name, Phone, Email
- Save/Cancel buttons

### Payment Form
- Amount input (number)
- Date picker (calendar popover)
- "Record Payment" button

### Move Out Dialog
- Warning text with tenant/room info
- Yellow warning banner if unpaid balance exists
- "Move Out" (destructive red) + Cancel buttons

### Add Expense Dialog
- Category dropdown (Electricity, Water, Internet, Maintenance, Cleaning, Supplies, Tax, Transfer, Other)
- Description text input
- Amount number input
- Date picker
- Save/Cancel buttons

### Room Status Dialog
- Current room info (number, type, rent, status)
- "Mark as Available" / "Mark as Renovation" toggle buttons
- Cancel button

---

## Icon Set (Lucide React)

All icons use `lucide-react`, the default icon library for shadcn/ui. Stroke width: 1.5–2. Size: 18–20px unless noted.

### Bottom Nav
| Tab       | Icon              |
|-----------|-------------------|
| Overview  | `LayoutDashboard`  |
| Rooms     | `DoorOpen`         |
| Tenants   | `Users`            |
| Finance   | `Wallet`           |

### Header & Navigation
| Element             | Icon            |
|---------------------|-----------------|
| Property switcher   | `Building2`     |
| Dropdown chevron    | `ChevronDown`   |
| Avatar popover      | Initials (text) |
| Settings link       | `Settings`      |
| Logout              | `LogOut`        |
| Back button         | `ArrowLeft`     |

### Actions
| Action              | Icon            |
|---------------------|-----------------|
| Add / Create        | `Plus`          |
| Edit                | `Pencil`        |
| Delete              | `Trash2`        |
| Move out            | `DoorClosed`    |
| Assign tenant       | `UserPlus`      |
| Change room status  | `Wrench`        |
| Record payment      | `CreditCard`    |

### Info & Detail Rows
| Field / Context     | Icon            |
|---------------------|-----------------|
| Phone               | `Phone`         |
| Email               | `Mail`          |
| Move-in date        | `Calendar`      |
| Room                | `DoorOpen`      |
| Monthly rent        | `Banknote`      |
| Notes               | `StickyNote`    |

### Status Indicators
| Status              | Icon / Element         |
|---------------------|------------------------|
| Occupied dot        | `CircleDot` (teal)     |
| Available dot       | `CircleDot` (green)    |
| Renovation dot      | `CircleDot` (amber)    |
| Paid badge          | `Check` inside badge   |
| Unpaid badge        | `X` inside badge       |

### Finance Page
| Element             | Icon              |
|---------------------|-------------------|
| Month nav left      | `ChevronLeft`     |
| Month nav right     | `ChevronRight`    |
| Income              | `TrendingUp`      |
| Expenses            | `TrendingDown`    |
| Expense categories  | Per-category icons |

### Expense Category Icons
| Category     | Icon            |
|--------------|-----------------|
| Electricity  | `Zap`           |
| Water        | `Droplets`      |
| Internet     | `Wifi`          |
| Maintenance  | `Wrench`        |
| Cleaning     | `SprayCan`      |
| Supplies     | `Package`       |
| Tax          | `Receipt`       |
| Transfer     | `ArrowRightLeft`|
| Other        | `MoreHorizontal`|

---

## Design Tokens & Visual Style

All colors are defined as HSL values in `globals.css` using CSS custom properties, consumed via Tailwind's `bg-*`, `text-*`, `border-*` utilities.

### CSS Variables (`globals.css`)

Below is the full set of required variables. Base shadcn tokens are extended with domain-specific tokens for room status, balance, and finance.

```
:root {
  /* --- Base (shadcn defaults) --- */
  --background         Background surfaces, page body
  --foreground         Default text color
  --card               Card surfaces
  --card-foreground    Text on cards
  --popover            Popover/dialog surfaces
  --popover-foreground Text in popovers/dialogs
  --primary            Primary buttons, active nav tab, key actions
  --primary-foreground Text on primary-colored elements
  --secondary          Subtle backgrounds, outline button fills, hover states
  --secondary-foreground Text on secondary-colored elements
  --muted              Disabled surfaces, inactive backgrounds
  --muted-foreground   Captions, timestamps, helper text, inactive nav labels
  --accent             Hover highlight on menus, list items
  --accent-foreground  Text on accent-colored elements
  --destructive        Delete buttons, move-out, error states
  --destructive-foreground Text on destructive-colored elements
  --border             Card borders, dividers, input borders
  --input              Input field borders
  --ring               Focus ring outline

  /* --- Domain: Room Status --- */
  --status-available            Green — available room badges, left border
  --status-available-foreground Text on available badges
  --status-occupied             Blue — occupied room indicators, left border
  --status-occupied-foreground  Text on occupied badges
  --status-renovation           Amber — renovation badges, left border
  --status-renovation-foreground Text on renovation badges

  /* --- Domain: Balance --- */
  --balance-paid                Green — paid badges, positive payment amounts
  --balance-paid-foreground     Text on paid badges
  --balance-outstanding         Red — unpaid badges, overdue amounts
  --balance-outstanding-foreground Text on outstanding badges

  /* --- Domain: Finance --- */
  --finance-income              Green — income totals, payment amounts
  --finance-income-foreground   Text on income badges/cards
  --finance-expense             Red — expense totals, expense amounts
  --finance-expense-foreground  Text on expense badges/cards
  --finance-profit-positive     Green — net profit when positive
  --finance-profit-negative     Red — net profit when negative
}
```

Add the following finance tokens to `globals.css`:

```css
/* Light */
--finance-income: 142 71% 45%;
--finance-income-foreground: 144 80% 10%;
--finance-expense: 0 84% 60%;
--finance-expense-foreground: 0 80% 10%;
--finance-profit-positive: 142 71% 45%;
--finance-profit-negative: 0 84% 60%;

/* Dark */
--finance-income: 142 71% 35%;
--finance-income-foreground: 142 60% 90%;
--finance-expense: 0 84% 50%;
--finance-expense-foreground: 0 60% 90%;
--finance-profit-positive: 142 71% 35%;
--finance-profit-negative: 0 84% 50%;
```

### Component Color Map

#### Login Page
| Element              | Color                                          |
|----------------------|------------------------------------------------|
| Card background      | `bg-card border-border`                        |
| App title "E-Kost"   | `text-foreground`                              |
| Subtitle             | `text-muted-foreground`                        |
| Input fields         | `border-input bg-background text-foreground`   |
| Input labels         | `text-foreground`                              |
| "Sign In" button     | `bg-primary text-primary-foreground`           |
| Demo account buttons | `border-input bg-background text-muted-foreground` (outline) |

#### AppHeader
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Header background       | `bg-card border-b border-border`               |
| Property name           | `text-foreground font-semibold`                |
| Chevron icon            | `text-muted-foreground`                        |
| Room stats line         | `text-muted-foreground`                        |
| Stat dots (occupied)    | `bg-status-occupied` (inline circle)           |
| Stat dots (available)   | `bg-status-available` (inline circle)          |
| Stat dots (renovation)  | `bg-status-renovation` (inline circle)         |
| Avatar circle           | `bg-primary text-primary-foreground`           |
| Popover name/email      | `text-foreground` / `text-muted-foreground`    |
| Settings link           | `text-foreground`                              |
| Logout button           | `text-destructive`                             |

#### Bottom Nav
| Element              | Color                                          |
|----------------------|------------------------------------------------|
| Nav background       | `bg-card border-t border-border`               |
| Active tab icon      | `text-primary`                                 |
| Active tab label     | `text-primary`                                 |
| Inactive tab icon    | `text-muted-foreground`                        |
| Inactive tab label   | `text-muted-foreground`                        |

#### Property Selector
| Element              | Color                                          |
|----------------------|------------------------------------------------|
| Heading              | `text-foreground`                              |
| Property card        | `bg-card border-border`, hover: `bg-accent`    |
| Property name        | `text-foreground font-semibold`                |
| Address              | `text-muted-foreground`                        |
| Room count badge     | `bg-secondary text-secondary-foreground`       |
| Building icon        | `text-muted-foreground`                        |

#### Overview Page
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Occupancy percentage    | `text-foreground text-3xl font-bold`           |
| Progress bar track      | `bg-secondary`                                 |
| Progress bar fill       | `bg-status-occupied`                           |
| Occupied count label    | `text-status-occupied-foreground`              |
| Available count label   | `text-status-available-foreground`             |
| Renovation count label  | `text-status-renovation-foreground`            |
| Income amount           | `text-finance-income`                          |
| "Expected" subtitle     | `text-muted-foreground`                        |
| Expense amount          | `text-finance-expense`                         |
| Net profit (positive)   | `text-finance-profit-positive`                 |
| Net profit (negative)   | `text-finance-profit-negative`                 |
| Tenant name (balance row)| `text-foreground`                             |
| Room number (balance row)| `text-muted-foreground`                       |
| Outstanding amount      | `text-balance-outstanding font-semibold`       |
| Payment amount (recent) | `text-balance-paid`                            |
| Payment date            | `text-muted-foreground`                        |
| "View all" links        | `text-primary` (underline on hover)            |
| Quick stat cards        | `bg-card border-border`, value: `text-foreground font-bold`, label: `text-muted-foreground` |

#### Room Cards
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Card base               | `bg-card border border-border rounded-lg shadow-xs` |
| Available left border   | `border-l-4 border-status-available`           |
| Occupied left border    | `border-l-4 border-status-occupied`            |
| Renovation left border  | `border-l-4 border-status-renovation`          |
| Renovation card bg      | `bg-muted` (subtle dimmed background)          |
| Room number             | `text-foreground font-semibold`                |
| Room type + rent        | `text-muted-foreground`                        |
| Tenant name (occupied)  | `text-foreground font-semibold`                |
| "Available" badge       | `bg-status-available/15 text-status-available-foreground` |
| "Renovation" badge      | `bg-status-renovation/15 text-status-renovation-foreground` |
| "Paid ✓" badge          | `bg-balance-paid/15 text-balance-paid-foreground` |
| "€X ✗" badge            | `bg-balance-outstanding/15 text-balance-outstanding-foreground` |
| "Assign Tenant" link    | `text-primary`                                 |
| "Change status" link    | `text-muted-foreground`                        |

#### Tenants Page
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Page title              | `text-foreground font-semibold`                |
| "Add Tenant" button     | `bg-primary text-primary-foreground`           |
| Tenant name             | `text-foreground font-semibold`                |
| Room assignment line    | `text-muted-foreground`                        |
| "Unassigned" badge      | `bg-status-renovation/15 text-status-renovation-foreground` |
| "Paid" badge            | `bg-balance-paid/15 text-balance-paid-foreground` |
| "€X unpaid" badge       | `bg-balance-outstanding/15 text-balance-outstanding-foreground` |

#### Tenant Detail Page
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Back arrow              | `text-foreground`                              |
| Tenant name heading     | `text-foreground font-semibold`                |
| Edit icon button        | `text-muted-foreground`, hover: `text-foreground` |
| Move-out icon button    | `text-muted-foreground`, hover: `text-destructive` |
| Info row icons          | `text-muted-foreground`                        |
| Info row labels         | `text-muted-foreground`                        |
| Info row values         | `text-foreground`                              |
| Room card               | `bg-card border-border`                        |
| Total paid amount       | `text-balance-paid font-semibold`              |
| Outstanding amount      | `text-balance-outstanding font-semibold` (or `text-balance-paid` if zero) |
| Monthly rent ref        | `text-muted-foreground`                        |
| Payment history date    | `text-muted-foreground`                        |
| Payment history amount  | `text-balance-paid`                            |
| Empty state text        | `text-muted-foreground italic`                 |
| Note date               | `text-muted-foreground`                        |
| Note text               | `text-foreground`                              |
| Note delete icon        | `text-muted-foreground`, hover: `text-destructive` |
| "Add Note" button       | `border-input bg-background text-foreground` (outline) |
| "Record Payment" fixed  | `bg-primary text-primary-foreground` (full-width) |

#### Finance Page
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Month label             | `text-foreground font-semibold`                |
| Chevron arrows          | `text-muted-foreground`, hover: `text-foreground` |
| "Add Expense" button    | `border-input bg-background text-foreground` (outline) |
| Monthly income amount   | `text-finance-income font-semibold`            |
| Monthly expense amount  | `text-finance-expense font-semibold`           |
| Net profit (positive)   | `text-finance-profit-positive font-semibold`   |
| Net profit (negative)   | `text-finance-profit-negative font-semibold`   |
| Section heading "Income"| `text-foreground font-semibold`                |
| Income entry name       | `text-foreground`                              |
| Income entry date       | `text-muted-foreground`                        |
| Income entry amount     | `text-finance-income`                          |
| Expense entry category  | `text-foreground`                              |
| Expense entry desc      | `text-muted-foreground`                        |
| Expense entry date      | `text-muted-foreground`                        |
| Expense entry amount    | `text-finance-expense`                         |
| Expense delete icon     | `text-muted-foreground`, hover: `text-destructive` |
| Category bar track      | `bg-secondary`                                 |
| Category bar segments   | Each uses its own expense category color       |
| Category legend icons   | `text-muted-foreground`                        |
| Category legend label   | `text-foreground`                              |
| Category legend amount  | `text-muted-foreground`                        |

#### Settings Page
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Section heading         | `text-foreground font-semibold`                |
| Avatar circle           | `bg-primary text-primary-foreground`           |
| Name                    | `text-foreground font-semibold`                |
| Email                   | `text-muted-foreground`                        |
| "Owner" badge           | `bg-secondary text-secondary-foreground`       |
| "Staff" badge           | `bg-secondary text-secondary-foreground`       |
| "Remove" button         | `text-destructive` (ghost style)               |
| "Add Staff" button      | `bg-primary text-primary-foreground`           |

#### Dialogs (all)
| Element                 | Color                                          |
|-------------------------|------------------------------------------------|
| Overlay backdrop        | `bg-black/80`                                  |
| Dialog surface          | `bg-popover text-popover-foreground`           |
| Dialog title            | `text-foreground font-semibold`                |
| Dialog description      | `text-muted-foreground`                        |
| Form labels             | `text-foreground`                              |
| Form inputs             | `border-input bg-background text-foreground`   |
| Primary submit buttons  | `bg-primary text-primary-foreground`           |
| Destructive confirms    | `bg-destructive text-destructive-foreground`   |
| Cancel buttons          | `border-input bg-background text-foreground` (outline) |
| Warning banner          | `bg-status-renovation/15 text-status-renovation-foreground border border-status-renovation/30` |
| Unassigned tenant list  | `bg-accent text-accent-foreground` per row, hover highlight |

### Typography

- **Font**: Plus Jakarta Sans (Google Fonts), clean sans-serif
- **Headings**: `font-semibold`, sizes vary by context (`text-lg` for page titles, `text-base` for card headings)
- **Body**: `text-sm` (14px) for most content
- **Captions**: `text-xs` (12px) for timestamps, labels, nav labels
- **Monetary values**: `font-semibold` always, color per context (income/expense/balance)

### Spacing & Layout

- **Cards**: Generous padding (`p-4` to `p-6`), `gap-3` or `gap-4` between cards
- **Touch targets**: Minimum 44px tap areas on all interactive elements
- **Page content**: `px-4` horizontal padding, `pb-20` bottom padding (clear bottom nav)
- **Border radius**: `--radius: 0.5rem` (8px) for cards and inputs

### Animations

- `animate-fade-in` with staggered delays on card lists (50–100ms increments)
- Dialogs: slide-up with backdrop fade
- Page transitions: subtle fade
