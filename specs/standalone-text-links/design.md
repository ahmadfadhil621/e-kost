# Standalone Text Links — Design

## Change Summary

Pure CSS class addition. No new components, APIs, or i18n keys required.

## Rule

Add `underline` Tailwind class to every bare `<Link>` text node that:
- Is not wrapped inside `<Button asChild>` or `<Button variant="link">`
- Is not inside a `<Card>` or `<CardContent>`
- Is not inside a `<nav>` or sidebar element

## Files Changed

### `src/components/payment/tenant-payment-section.tsx`

**Before:**
```tsx
className="mt-3 flex items-center text-sm text-primary hover:underline min-h-[44px]"
```

**After:**
```tsx
className="mt-3 flex items-center text-sm text-primary underline hover:underline min-h-[44px]"
```

### `src/components/settings/SettingsPage.tsx` (both links)

**Before:**
```tsx
className="flex min-h-[44px] items-center text-sm text-primary underline-offset-4 hover:underline"
```

**After:**
```tsx
className="flex min-h-[44px] items-center text-sm text-primary underline underline-offset-4 hover:underline"
```

### `src/app/(app)/page.tsx`

**Before:**
```tsx
className="inline-flex items-center py-1 text-xs text-primary underline-offset-2 hover:underline"
```

**After:**
```tsx
className="inline-flex items-center py-1 min-h-[44px] text-xs text-primary underline underline-offset-2 hover:underline"
```

## Correctness Properties

### Property 1: Static underline decoration
`underline` Tailwind class always renders the underline decoration regardless of pointer/hover state.

### Property 2: Touch target compliance
`min-h-[44px]` ensures 44px minimum height on all affected interactive elements.

### Property 3: WCAG AA contrast preserved
Color values are unchanged — only text-decoration is added — so contrast ratios remain unaffected.
