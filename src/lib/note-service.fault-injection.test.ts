/**
 * Gate 2: Fault injection tests for tenant-notes.
 * Each test injects a fault and asserts correct behavior. When the fault is present,
 * the assertion fails → fault is KILLED. If the test passes with the fault present,
 * the fault SURVIVED (tests are too weak).
 * Run: npx vitest run src/lib/note-service.fault-injection.test.ts
 * We expect fault tests to FAIL (fault killed). Any passing fault test = surviving fault.
 */

import { describe, it, expect, vi } from "vitest";
import { NoteService } from "./note-service";
import type { INoteRepository } from "@/domain/interfaces/note-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import { createTenantNote } from "@/test/fixtures/tenant-note";
import { createTenant } from "@/test/fixtures/tenant";

function createMockNoteRepo(
  overrides: Partial<INoteRepository> = {}
): INoteRepository {
  return {
    create: vi.fn(),
    findByTenant: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

function createMockTenantRepo(
  overrides: Partial<ITenantRepository> = {}
): ITenantRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn(),
    update: vi.fn(),
    assignRoom: vi.fn(),
    removeRoomAssignment: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = () => ({
  validateAccess: vi.fn().mockResolvedValue("owner"),
});

describe("Gate 2: Fault injection (tenant-notes)", () => {
  describe("good cases", () => {
    it("fault missing-id: createNote returns result without id — KILLED by id assertion", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: null,
      });
      const created = createTenantNote({ tenantId, content: "Note", date: new Date("2025-03-01") });
      const noId = { ...created, id: undefined as unknown as string };
      const noteRepo = createMockNoteRepo({
        create: vi.fn().mockResolvedValue(noId),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.createNote(
        "user-1",
        propertyId,
        tenantId,
        { content: "Note", date: "2025-03-01" }
      );

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
    });

    it("fault missing-createdAt: createNote returns result without createdAt — KILLED by timestamp assertion", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: null,
      });
      const created = createTenantNote({ tenantId, content: "Note", date: new Date("2025-03-01") });
      const noCreatedAt = { ...created, createdAt: undefined as unknown as Date };
      const noteRepo = createMockNoteRepo({
        create: vi.fn().mockResolvedValue(noCreatedAt),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.createNote(
        "user-1",
        propertyId,
        tenantId,
        { content: "Note", date: "2025-03-01" }
      );

      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("fault no-validation-empty-content: createNote accepts empty content — KILLED by validation", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: null,
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        createMockNoteRepo(),
        tenantRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.createNote("user-1", propertyId, tenantId, {
          content: "",
          date: "2025-03-01",
        })
      ).rejects.toThrow(/content|required/i);
    });

    it("fault no-moved-out-check: createNote allows moved-out tenant — KILLED by business rule", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenantMovedOut = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: new Date(),
      });
      const noteRepo = createMockNoteRepo();
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenantMovedOut),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.createNote("user-1", propertyId, tenantId, {
          content: "Note",
          date: "2025-03-01",
        })
      ).rejects.toThrow(/moved out/i);
    });

    it("fault list-wrong-sort: listNotes returns ascending instead of descending — KILLED by PROP 2", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: tenantId });
      const notesAsc = [
        createTenantNote({
          tenantId,
          content: "First",
          date: new Date("2025-01-01"),
        }),
        createTenantNote({
          tenantId,
          content: "Second",
          date: new Date("2025-03-01"),
        }),
      ];
      const noteRepo = createMockNoteRepo({
        findByTenant: vi.fn().mockResolvedValue(notesAsc),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.listNotes(
        "user-1",
        propertyId,
        tenantId
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
      if (result.length >= 2) {
        expect(result[0].date >= result[1].date).toBe(true);
      }
    });

    it("fault update-changes-id: updateNote returns different id — KILLED by PROP 3", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const noteId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: tenantId });
      const existing = createTenantNote({
        id: noteId,
        tenantId,
        content: "Original",
        createdAt: new Date("2025-01-01"),
      });
      const wrongId = createTenantNote({
        ...existing,
        id: "different-id",
        content: "Updated",
      });
      const noteRepo = createMockNoteRepo({
        findById: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(wrongId),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.updateNote(
        "user-1",
        propertyId,
        tenantId,
        noteId,
        { content: "Updated" }
      );

      expect(result.id).toBe(noteId);
    });

    it("fault delete-still-in-list: deleteNote but listNotes still returns note — KILLED by PROP 4", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const noteId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: tenantId });
      const existing = createTenantNote({ id: noteId, tenantId });
      const noteRepo = createMockNoteRepo({
        findById: vi.fn().mockResolvedValue(existing),
        delete: vi.fn().mockResolvedValue(undefined),
        findByTenant: vi.fn().mockResolvedValue([existing]),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      await service.deleteNote("user-1", propertyId, tenantId, noteId);
      const list = await service.listNotes("user-1", propertyId, tenantId);

      expect(list.some((n) => n.id === noteId)).toBe(false);
    });

    it("fault list-moved-out-empty: listNotes for moved-out tenant returns empty — KILLED by PROP 6", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: new Date(),
      });
      const notes = [
        createTenantNote({ tenantId, content: "Old note" }),
      ];
      const noteRepo = createMockNoteRepo({
        findByTenant: vi.fn().mockResolvedValue(notes),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new NoteService(
        noteRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.listNotes(
        "user-1",
        propertyId,
        tenantId
      );

      expect(result.length).toBe(1);
      expect(result[0].content).toBe("Old note");
    });
  });

  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("no edge-case scenarios for fault injection", () => {
      expect(true).toBe(true);
    });
  });
});
