import { TenantService } from "@/lib/tenant-service";
import { propertyService } from "@/lib/property-service-instance";

// Stub repository for compilation until PrismaTenantRepository is implemented.
// Route tests mock tenantService; this is only used when app runs without mocks.
const stubTenantRepo = {
  create: () => Promise.reject(new Error("Not implemented")),
  findById: () => Promise.resolve(null),
  findByProperty: () => Promise.resolve([]),
  update: () => Promise.reject(new Error("Not implemented")),
  assignRoom: () => Promise.reject(new Error("Not implemented")),
  removeRoomAssignment: () => Promise.reject(new Error("Not implemented")),
  softDelete: () => Promise.reject(new Error("Not implemented")),
};

const stubRoomRepo = {
  create: () => Promise.reject(new Error("Not implemented")),
  findById: () => Promise.resolve(null),
  findByProperty: () => Promise.resolve([]),
  update: () => Promise.reject(new Error("Not implemented")),
  updateStatus: () => Promise.reject(new Error("Not implemented")),
};

export const tenantService = new TenantService(
  stubTenantRepo as import("@/domain/interfaces/tenant-repository").ITenantRepository,
  stubRoomRepo as import("@/domain/interfaces/room-repository").IRoomRepository,
  propertyService
);
