---
name: e-kost-ui-components
description: Build mobile-first React components with i18n for E-Kost features. Use when creating forms, list views, detail pages, or any UI that uses shadcn/ui, React Hook Form, TanStack Query, or translation keys. Covers mobile layout, accessibility, currency/date formatting, and translation extraction.
---

# E-Kost UI Components & i18n

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- UI Components section (component definitions, props, features), Internationalization section (translation keys for en and id)
   - `specs/cross-cutting-constraints.md` -- mobile-first rules, accessibility, performance
   - `.cursor/rules/coding-standards.mdc` -- React conventions, naming, Tailwind rules
2. Create components in `src/components/<feature>/`
3. Create custom hooks in `src/hooks/` for data fetching (TanStack Query)
4. Add translation keys to both `locales/en.json` and `locales/id.json`
5. Run existing tests: `npx vitest run` to verify component tests pass

## Mobile-First Layout

All components target 320px-480px viewports. Design for the smallest screen first.

### Core Tailwind Patterns

```tsx
{/* Page container */}
<div className="flex flex-col gap-4 p-4 w-full max-w-md mx-auto">

{/* Full-width card */}
<div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-sm w-full">

{/* Touch-safe button */}
<Button className="w-full min-h-[44px]">

{/* Touch-safe input */}
<Input className="w-full min-h-[44px]" />

{/* Single-column form */}
<form className="flex flex-col gap-4">
```

### Hard Rules

- Minimum touch target: `min-h-[44px] min-w-[44px]` on all interactive elements
- Single-column layout: `flex flex-col`, never `flex-row` for primary content
- No horizontal scroll: `w-full`, never fixed widths wider than viewport
- Adequate spacing: `gap-4` (16px) between form fields, `gap-3` (12px) within cards

## shadcn/ui Components

Use shadcn/ui for all primitives. Never build custom replacements.

| UI Need | shadcn Component |
|---------|-----------------|
| Buttons | `Button` |
| Cards/containers | `Card`, `CardHeader`, `CardContent` |
| Form inputs | `Input`, `Textarea` |
| Select/dropdown | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` |
| Dialogs/modals | `Dialog`, `DialogTrigger`, `DialogContent` |
| Form wiring | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` |
| Profile menu | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` |
| Badges/status | `Badge` |

Import from `@/components/ui/<component>`.

## Forms: React Hook Form + Zod

Every form uses the same pattern. Zod schemas come from `src/lib/validations/`.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoomSchema, type CreateRoomInput } from '@/lib/validations/room';
import { useTranslation } from 'react-i18next';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RoomForm() {
  const { t } = useTranslation();
  const form = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
  });

  const onSubmit = async (data: CreateRoomInput) => {
    // call mutation
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="roomNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room.create.roomNumber')}</FormLabel>
              <FormControl>
                <Input {...field} className="min-h-[44px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* repeat for other fields */}
        <Button type="submit" className="w-full min-h-[44px]">
          {t('room.create.submit')}
        </Button>
      </form>
    </Form>
  );
}
```

## Data Fetching: TanStack Query

Create custom hooks in `src/hooks/`. One hook per query/mutation.

```typescript
// src/hooks/use-rooms.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useRooms(status?: string) {
  return useQuery({
    queryKey: ['rooms', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const res = await fetch(`/api/rooms${params}`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomInput) => {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create room');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
```

Usage in components:

```tsx
export function RoomList() {
  const { data, isLoading, error } = useRooms();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.rooms?.length) return <EmptyState message={t('room.list.empty')} />;

  return (
    <div className="flex flex-col gap-3">
      {data.rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
```

## Component States

Every data-driven component must handle all four states:

```tsx
function DataView({ queryResult }) {
  const { data, isLoading, error } = queryResult;
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">{t('common.error')}</div>;
  }
  if (!data?.length) {
    return <div className="p-4 text-gray-500">{t('common.empty')}</div>;
  }

  return /* render data */;
}
```

## Status Indicators

Use dual encoding: color + icon + text. Never rely on color alone.

```tsx
import { CheckCircle, User, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  available: { icon: CheckCircle, variant: 'success' as const, key: 'room.status.available' },
  occupied: { icon: User, variant: 'destructive' as const, key: 'room.status.occupied' },
  under_renovation: { icon: Wrench, variant: 'warning' as const, key: 'room.status.under_renovation' },
} as const;

export function StatusIndicator({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      <span>{t(config.key)}</span>
    </Badge>
  );
}
```

For balance status (paid/unpaid):

```tsx
const BALANCE_STATUS = {
  paid: { icon: CheckCircle, variant: 'success' as const, key: 'balance.status.paid' },
  unpaid: { icon: AlertCircle, variant: 'destructive' as const, key: 'balance.status.unpaid' },
} as const;
```

## i18n: Translation Keys

### Rules

- All user-facing text must use `useTranslation()` -- never hardcode strings
- Key convention: `feature.context.key` (e.g., `room.create.title`, `tenant.validation.nameRequired`)
- Add entries to both `locales/en.json` and `locales/id.json` simultaneously
- Reference the exact translation blocks in each feature's `design.md` under the Internationalization section

### Adding Translations

When building components for a feature, find the translation JSON blocks in the feature's `specs/<feature>/design.md` and add them to the locale files. The design docs contain complete en.json and id.json blocks for each feature.

### Usage Pattern

```tsx
import { useTranslation } from 'react-i18next';

export function TenantForm() {
  const { t } = useTranslation();

  return (
    <form>
      <h1>{t('tenant.create.title')}</h1>
      <FormLabel>{t('tenant.create.name')}</FormLabel>
      {/* ... */}
      <Button>{t('tenant.create.submit')}</Button>
    </form>
  );
}
```

### Currency Formatting

Use `Intl.NumberFormat` with IDR currency, respecting locale:

```typescript
export function formatCurrency(amount: number, locale: string = 'id-ID'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
```

### Date Formatting

Use `date-fns` with locale support:

```typescript
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';

export function formatDate(date: Date, lng: string = 'en'): string {
  return format(date, 'PPP', { locale: lng === 'id' ? id : enUS });
}

export function formatTimestamp(date: Date, lng: string = 'en'): string {
  return format(date, 'PPp', { locale: lng === 'id' ? id : enUS });
}
```

## Accessibility

- Every `<Input>` and `<Select>` must have a `<FormLabel>` (shadcn/ui Form handles association)
- All interactive elements keyboard-accessible (shadcn/ui handles this by default)
- Color contrast must meet WCAG AA (use Tailwind's default color scale, which satisfies this)
- Status indicators use color + icon + text (see Status Indicators section above)
- Profile icon must have `aria-label="User profile"`

## File Organization

```
src/components/
  ui/                     -- shadcn/ui primitives (auto-generated)
  rooms/
    room-form.tsx
    room-list.tsx
    room-card.tsx
    room-detail.tsx
    status-filter.tsx
    status-indicator.tsx
  tenants/
    tenant-form.tsx
    tenant-list.tsx
    tenant-detail.tsx
    room-assignment.tsx
    move-out-dialog.tsx
  payments/
    payment-form.tsx
    payment-list.tsx
    payment-card.tsx
    tenant-payment-section.tsx
  balance/
    balance-section.tsx
    balance-indicator.tsx
  auth/
    registration-form.tsx
    login-form.tsx
    profile-icon.tsx
    profile-dropdown.tsx
    protected-route.tsx
  shared/
    loading-state.tsx
    empty-state.tsx
    error-state.tsx

src/hooks/
  use-rooms.ts
  use-tenants.ts
  use-payments.ts
  use-balance.ts
  use-auth.ts
```

File naming: `kebab-case.tsx`. Component naming: `PascalCase`.

## Hard Constraints

- No business logic in components. Delegate to hooks or services.
- No inline styles. Use Tailwind utility classes exclusively.
- No hardcoded user-facing strings. All text via `useTranslation()`.
- All interactive elements: minimum 44x44px (`min-h-[44px] min-w-[44px]`).
- All forms: React Hook Form + Zod. No manual form state management.
- All data fetching: TanStack Query hooks. No `useEffect` + `fetch` patterns.
- Status indicators: always color + icon + text. Never color alone.

## Reference Files

Before building components for a feature, always read:
1. `specs/<feature>/design.md` -- UI Components section for component specs and props, Internationalization section for translation keys (en + id JSON blocks)
2. `specs/cross-cutting-constraints.md` -- mobile-first dimensions, touch targets, accessibility rules
3. `.cursor/rules/coding-standards.mdc` -- React conventions, naming, Tailwind rules
