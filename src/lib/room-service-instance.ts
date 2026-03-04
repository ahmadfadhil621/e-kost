import { RoomService } from "@/lib/room-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaRoomRepository } from "@/lib/repositories/prisma/prisma-room-repository";

const roomRepo = new PrismaRoomRepository();
export const roomService = new RoomService(roomRepo, propertyService);
