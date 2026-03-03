import { z } from "zod";

export const roomStatusValues = [
  "available",
  "occupied",
  "under_renovation",
] as const;
export type RoomStatus = (typeof roomStatusValues)[number];

export const createRoomSchema = z.object({
  roomNumber: z
    .string()
    .min(1, "Room number is required")
    .max(50)
    .trim(),
  roomType: z
    .string()
    .min(1, "Room type is required")
    .max(100)
    .trim(),
  monthlyRent: z
    .number({ required_error: "Monthly rent is required" })
    .positive("Monthly rent must be a positive number"),
});

export const updateRoomSchema = z
  .object({
    roomNumber: z.string().min(1).max(50).trim().optional(),
    roomType: z.string().min(1).max(100).trim().optional(),
    monthlyRent: z
      .number()
      .positive("Monthly rent must be a positive number")
      .optional(),
  })
  .refine((data) => data && Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateRoomStatusSchema = z.object({
  status: z.enum(roomStatusValues, {
    errorMap: () => ({
      message: "Status must be one of: available, occupied, under_renovation",
    }),
  }),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>;

export interface RoomFilters {
  status?: RoomStatus;
}

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}
