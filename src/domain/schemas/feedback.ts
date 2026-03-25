import { z } from "zod";
export const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
