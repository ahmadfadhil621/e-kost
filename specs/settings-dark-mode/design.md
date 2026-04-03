# Design — Dark Mode Toggle (Issue #67)

## Package

- `next-themes` — handles class toggling, localStorage, SSR hydration

## Layout Change

**`src/app/layout.tsx`** — add ThemeProvider (server component can import client ThemeProvider directly):

```tsx
import { ThemeProvider } from "next-themes"

<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  </body>
</html>
```

## New Component

**`src/components/settings/AppearanceSection.tsx`** (client component)

- Uses `useTheme()` from `next-themes`
- Renders three buttons: Light (Sun icon), Dark (Moon icon), System (Monitor icon)
- Active button has `aria-pressed="true"` and a highlighted style
- Each button is min 44×44px touch target

## Updated Component

**`src/components/settings/SettingsPage.tsx`**

- Import `AppearanceSection`
- Insert `<AppearanceSection />` at the **top** of the sections list (before Language), with `<Separator />` after it

## i18n Keys

```json
"settings": {
  "appearance": {
    "title": "Appearance",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  }
}
```

## Tailwind v4 Compatibility

`globals.css` uses `@custom-variant dark (&:is(.dark *))`.  
`next-themes` adds `class="dark"` to `<html>` → all body descendants match → ✅ compatible.

## No Schema Changes

This feature is purely UI/localStorage — no Prisma changes needed.
