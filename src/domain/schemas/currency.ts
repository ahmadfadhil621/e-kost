import { z } from "zod";

export type Currency = {
  id: string;
  code: string;
  locale: string;
  label: string;
  createdAt: Date;
};

export const createCurrencySchema = z.object({
  code: z.string().min(3).max(3).transform((s) => s.toUpperCase()),
  locale: z.string().min(2),
  label: z.string().min(1),
});

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;

export const updateUserCurrencySchema = z.object({
  currency: z.string().min(3).max(3),
});
