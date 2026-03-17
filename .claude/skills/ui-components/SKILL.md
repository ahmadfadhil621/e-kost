---
name: ui-components
description: Build mobile-first React components with i18n for E-Kost features. Use when creating forms, list views, detail pages, or any UI that uses shadcn/ui, React Hook Form, TanStack Query, or translation keys.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# UI Components & i18n

For coding conventions, see `.claude/rules/coding-standards.md`. For styling rules, see `.claude/rules/styling.md`.

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- UI components, props, i18n keys
   - `specs/cross-cutting-constraints.md` -- mobile-first, accessibility
2. Create components in `src/components/<feature>/`
3. Create custom hooks in `src/hooks/` for data fetching (TanStack Query)
4. Add translation keys to both `locales/en.json` and `locales/id.json`
5. Run `npx vitest run` to verify component tests pass

## Mobile-First Layout

Target 320px-480px viewports. Core patterns:

```tsx
{/* Page container */}
<div className="flex flex-col gap-4 p-4 w-full max-w-md mx-auto">

{/* Touch-safe button (44px minimum) */}
<Button className="w-full min-h-[44px]">

{/* Single-column form */}
<form className="flex flex-col gap-4">
```

Hard rules: `min-h-[44px]` on all interactive elements, single-column layout, no horizontal scroll.

## Forms: React Hook Form + Zod

```tsx
const form = useForm<CreateRoomInput>({
  resolver: zodResolver(createRoomSchema), // from src/domain/schemas/
});

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField control={form.control} name="roomNumber" render={({ field }) => (
        <FormItem>
          <FormLabel>{t('room.create.roomNumber')}</FormLabel>
          <FormControl><Input {...field} className="min-h-[44px]" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <Button type="submit" className="w-full min-h-[44px]">{t('room.create.submit')}</Button>
    </form>
  </Form>
);
```

## Data Fetching: TanStack Query

One hook per query/mutation in `src/hooks/`:

```typescript
export function useRooms(status?: string) {
  return useQuery({
    queryKey: ['rooms', status],
    queryFn: async () => {
      const res = await fetch(`/api/rooms${status ? `?status=${status}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    },
  });
}
```

Every data-driven component must handle loading, error, empty, and data states.

## Status Indicators

Dual encoding: color + icon + text. Never rely on color alone:

```tsx
<Badge variant={config.variant} className="flex items-center gap-1">
  <Icon className="w-3 h-3" />
  <span>{t(config.key)}</span>
</Badge>
```

## i18n

- All text via `useTranslation()` -- never hardcode strings
- Key convention: `feature.context.key` (e.g., `room.create.title`)
- Add to both `locales/en.json` and `locales/id.json`
- Currency: `Intl.NumberFormat` with locale config, never hardcode symbols
- Find translation blocks in `specs/<feature>/design.md` under Internationalization section

## Hard Constraints

- No business logic in components -- delegate to hooks/services
- No inline styles -- Tailwind only
- No hardcoded strings -- all via `useTranslation()`
- All interactive elements: min 44x44px
- All forms: React Hook Form + Zod
- All data fetching: TanStack Query hooks
- Status indicators: color + icon + text

## Reference Files

1. `specs/<feature>/design.md` -- UI components, i18n keys
2. `specs/cross-cutting-constraints.md` -- mobile-first, accessibility
3. `.claude/rules/coding-standards.md` -- React conventions
4. `.claude/rules/styling.md` -- design tokens
