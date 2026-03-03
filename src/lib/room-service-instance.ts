import { RoomService } from "@/lib/room-service";
import { propertyService } from "@/lib/property-service-instance";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";

const stubRoomRepo: IRoomRepository = {
  create: async () => {
    throw new Error("Room repository not implemented");
  },
  findById: async () => null,
  findByProperty: async () => [],
  update: async () => {
    throw new Error("Room repository not implemented");
  },
  updateStatus: async () => {
    throw new Error("Room repository not implemented");
  },
};

export const roomService = new RoomService(stubRoomRepo, propertyService);
