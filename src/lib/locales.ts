// Server-safe locale constants — no React dependencies.
// Import from here in server-side code (API routes, domain schemas).
// src/lib/i18n.ts re-exports these for client-side use.
export const AVAILABLE_LOCALES = ["en", "id"] as const;
export type Locale = (typeof AVAILABLE_LOCALES)[number];
export const LANGUAGE_KEY = "ekost_language";
