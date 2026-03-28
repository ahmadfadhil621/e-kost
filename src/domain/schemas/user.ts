import { z } from "zod";
import { AVAILABLE_LOCALES } from "@/lib/locales";

export const updateLanguageSchema = z.object({
  language: z.enum([...AVAILABLE_LOCALES]),
});

export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
