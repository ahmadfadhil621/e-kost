import type { IPropertyRepository } from "@/domain/interfaces/property-repository";
import type {
  CreatePropertyInput,
  Property,
  PropertyRole,
  PropertyStaff,
  UpdatePropertyInput,
} from "@/domain/schemas/property";
import {
  addStaffSchema,
  createPropertySchema,
  updatePropertySchema,
} from "@/domain/schemas/property";

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface IUserByEmailFinder {
  findByEmail(email: string): Promise<{ id: string; name: string; email: string } | null>;
}

export class PropertyService {
  constructor(
    private readonly repo: IPropertyRepository,
    private readonly userByEmail?: IUserByEmailFinder
  ) {}

  async createProperty(userId: string, data: CreatePropertyInput): Promise<Property> {
    const parsed = createPropertySchema.parse(data);
    return this.repo.create({
      name: parsed.name,
      address: parsed.address,
      ownerId: userId,
    });
  }

  async getProperty(userId: string, propertyId: string): Promise<Property> {
    await this.validateAccess(userId, propertyId);
    const property = await this.repo.findById(propertyId);
    if (!property) throw new Error("Property not found");
    return property;
  }

  async listProperties(userId: string): Promise<Property[]> {
    return this.repo.findByUser(userId);
  }

  async updateProperty(
    userId: string,
    propertyId: string,
    data: UpdatePropertyInput
  ): Promise<Property> {
    const role = await this.validateAccess(userId, propertyId);
    if (role !== "owner") throw new ForbiddenError("Owner access required");
    const parsed = updatePropertySchema.parse(data);
    return this.repo.update(propertyId, parsed);
  }

  async deleteProperty(userId: string, propertyId: string): Promise<void> {
    const role = await this.validateAccess(userId, propertyId);
    if (role !== "owner") throw new ForbiddenError("Owner access required");
    return this.repo.softDelete(propertyId);
  }

  async addStaff(
    ownerId: string,
    propertyId: string,
    staffEmail: string
  ): Promise<PropertyStaff> {
    const role = await this.validateAccess(ownerId, propertyId);
    if (role !== "owner") throw new ForbiddenError("Owner access required");
    addStaffSchema.parse({ email: staffEmail });
    if (!this.userByEmail) throw new Error("User lookup not configured");
    const user = await this.userByEmail.findByEmail(staffEmail);
    if (!user) throw new Error("No registered account found for this email");
    const existingRole = await this.repo.findUserRole(propertyId, user.id);
    if (existingRole === "staff") throw new Error("This user is already staff on this property");
    if (existingRole === "owner") throw new Error("Cannot add property owner as staff");
    return this.repo.addStaff(propertyId, user.id);
  }

  async removeStaff(
    ownerId: string,
    propertyId: string,
    staffUserId: string
  ): Promise<void> {
    const role = await this.validateAccess(ownerId, propertyId);
    if (role !== "owner") throw new ForbiddenError("Owner access required");
    if (staffUserId === (await this.repo.findById(propertyId))?.ownerId) {
      throw new Error("Cannot remove the property owner");
    }
    return this.repo.removeStaff(propertyId, staffUserId);
  }

  async listStaff(userId: string, propertyId: string): Promise<PropertyStaff[]> {
    await this.validateAccess(userId, propertyId);
    return this.repo.findStaff(propertyId);
  }

  async validateAccess(userId: string, propertyId: string): Promise<PropertyRole> {
    const role = await this.repo.findUserRole(propertyId, userId);
    if (!role) throw new ForbiddenError("No access to this property");
    return role;
  }
}
