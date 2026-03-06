import { NoteService } from "@/lib/note-service";
import { propertyService } from "@/lib/property-service-instance";
import { StubNoteRepository } from "@/lib/repositories/stub-note-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";

const noteRepo = new StubNoteRepository();
const tenantRepo = new PrismaTenantRepository();

export const noteService = new NoteService(
  noteRepo,
  tenantRepo,
  propertyService
);
