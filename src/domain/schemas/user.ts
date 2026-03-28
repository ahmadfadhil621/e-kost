import { z } from "zod";
import { AVAILABLE_LOCALES } from "@/lib/i18n";

export const updateLanguageSchema = z.object({
  language: z.enum(AVAILABLE_LOCALES as [string, ...string[]]),
});

export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
