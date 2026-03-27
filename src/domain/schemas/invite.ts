import { z } from "zod";

export const inviteRoleSchema = z.enum(["owner", "staff"]);
export type InviteRole = z.infer<typeof inviteRoleSchema>;

export const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: inviteRoleSchema,
  propertyId: z.string().uuid().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export interface InviteToken {
  id: string;
  token: string;
  email: string;
  role: InviteRole;
  propertyId: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface InviteTokenPublic {
  id: string;
  email: string;
  role: InviteRole;
  propertyId: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
