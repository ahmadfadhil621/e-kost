import { z } from "zod";
import { AVAILABLE_LOCALES } from "@/lib/locales";

export const updateLanguageSchema = z.object({
  language: z.enum([...AVAILABLE_LOCALES]),
});

export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;

export const CURATED_TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export const updateTimezoneSchema = z.object({
  timezone: z
    .string()
    .min(1)
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: "Invalid IANA timezone" }
    ),
});

export type UpdateTimezoneInput = z.infer<typeof updateTimezoneSchema>;
