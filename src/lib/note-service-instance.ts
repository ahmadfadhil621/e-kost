import { NoteService } from "@/lib/note-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaNoteRepository } from "@/lib/repositories/prisma/prisma-note-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";

const noteRepo = new PrismaNoteRepository();
const tenantRepo = new PrismaTenantRepository();

export const noteService = new NoteService(
  noteRepo,
  tenantRepo,
  propertyService
);
