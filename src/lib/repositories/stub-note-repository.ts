import type { INoteRepository } from "@/domain/interfaces/note-repository";
import type { TenantNote } from "@/domain/schemas/tenant-note";

async function notImplemented(): Promise<never> {
  throw new Error("Note repository not implemented");
}

export class StubNoteRepository implements INoteRepository {
  async create(): Promise<TenantNote> {
    return notImplemented();
  }

  async findByTenant(): Promise<TenantNote[]> {
    return notImplemented();
  }

  async findById(): Promise<TenantNote | null> {
    return notImplemented();
  }

  async update(): Promise<TenantNote> {
    return notImplemented();
  }

  async delete(): Promise<void> {
    return notImplemented();
  }
}
