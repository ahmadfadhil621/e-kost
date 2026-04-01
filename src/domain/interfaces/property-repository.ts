import type { Property, PropertyRole, PropertyStaff } from "@/domain/schemas/property";

export interface IPropertyRepository {
  create(data: {
    name: string;
    address: string;
    currency: string;
    ownerId: string;
  }): Promise<Property>;
  findById(id: string): Promise<Property | null>;
  findByUser(userId: string): Promise<Property[]>;
  update(
    id: string,
    data: Partial<{ name: string; address: string }>
  ): Promise<Property>;
  softDelete(id: string): Promise<void>;
  archive(id: string): Promise<Property>;
  unarchive(id: string): Promise<Property>;
  hardDelete(id: string): Promise<void>;

  addStaff(propertyId: string, userId: string): Promise<PropertyStaff>;
  removeStaff(propertyId: string, userId: string): Promise<void>;
  findStaff(propertyId: string): Promise<PropertyStaff[]>;
  findUserRole(propertyId: string, userId: string): Promise<PropertyRole | null>;
}
