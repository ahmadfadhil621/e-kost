import type { INoteRepository } from "@/domain/interfaces/note-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type {
  CreateNoteInput,
  TenantNote,
  UpdateNoteInput,
} from "@/domain/schemas/tenant-note";
import { createNoteSchema, updateNoteSchema } from "@/domain/schemas/tenant-note";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class NoteService {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly tenantRepo: ITenantRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async createNote(
    userId: string,
    propertyId: string,
    tenantId: string,
    data: CreateNoteInput
  ): Promise<TenantNote> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    if (tenant.movedOutAt) {
      throw new Error("Cannot add note: tenant has moved out");
    }
    const parsed = createNoteSchema.parse(data);
    const date = new Date(parsed.date);
    return this.noteRepo.create({
      tenantId,
      content: parsed.content,
      date,
    });
  }

  async listNotes(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<TenantNote[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    return this.noteRepo.findByTenant(tenantId);
  }

  async updateNote(
    userId: string,
    propertyId: string,
    tenantId: string,
    noteId: string,
    data: UpdateNoteInput
  ): Promise<TenantNote> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    const existing = await this.noteRepo.findById(noteId);
    if (!existing || existing.tenantId !== tenantId) {
      throw new Error("Note not found");
    }
    const parsed = updateNoteSchema.parse(data);
    const updateData: Partial<{ content: string; date: Date }> = {};
    if (parsed.content !== undefined) {
      updateData.content = parsed.content;
    }
    if (parsed.date !== undefined) {
      updateData.date = new Date(parsed.date);
    }
    if (Object.keys(updateData).length === 0) {
      return existing;
    }
    return this.noteRepo.update(noteId, updateData);
  }

  async deleteNote(
    userId: string,
    propertyId: string,
    tenantId: string,
    noteId: string
  ): Promise<void> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    const existing = await this.noteRepo.findById(noteId);
    if (!existing || existing.tenantId !== tenantId) {
      throw new Error("Note not found");
    }
    await this.noteRepo.delete(noteId);
  }
}
