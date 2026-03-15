// Traceability: tenant-notes
// REQ 1.3, 1.5 -> it('creates note with valid data and returns note with id and timestamp')
// REQ 1.4 -> it('rejects when content is empty')
// REQ 1.6 -> it('defaults date to provided value')
// REQ 2.1, 2.2, 2.3 -> it('listNotes returns notes sorted by date descending')
// REQ 2.4 -> it('returns empty array when tenant has no notes')
// REQ 3.4 -> it('updateNote preserves id and createdAt')
// REQ 3.5 -> it('rejects update when content is empty')
// REQ 4.3, 4.4 -> it('deleteNote removes note and listNotes excludes it')
// REQ 5.1, 5.2 -> it('listNotes returns notes for moved-out tenant')
// REQ 5.3 -> it('createNote rejects when tenant has moved out')
// PROP 1 -> it('note creation round trip (PROP 1)')
// PROP 2 -> it('listNotes returns notes sorted by date descending (PROP 2)')
// PROP 3 -> it('updateNote preserves id and createdAt (PROP 3)')
// PROP 4 -> it('deleteNote removes note from list (PROP 4)')
// PROP 5 -> it('rejects create or update with empty content (PROP 5)')
// PROP 6 -> it('listNotes for moved-out tenant returns all notes (PROP 6)')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
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

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("NoteService", () => {
  describe("createNote", () => {
    describe("good cases", () => {
      it("creates note with valid data and returns note with id and timestamp", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: tenantId,
          movedOutAt: null,
        });
        const created = createTenantNote({
          tenantId,
          content: "Test note",
          date: new Date("2025-03-01"),
        });
        const noteRepo = createMockNoteRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.createNote(userId, propertyId, tenantId, {
          content: "Test note",
          date: "2025-03-01",
        });

        expect(result.id).toBe(created.id);
        expect(result.tenantId).toBe(tenantId);
        expect(result.content).toBe("Test note");
        expect(result.date).toEqual(new Date("2025-03-01"));
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(noteRepo.create).toHaveBeenCalledWith({
          tenantId,
          content: "Test note",
          date: new Date("2025-03-01"),
        });
      });

      it("note creation round trip (PROP 1)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: tenantId,
          movedOutAt: null,
        });
        const created = createTenantNote({
          tenantId,
          content: "Round trip note",
          date: new Date("2025-06-15"),
        });
        const noteRepo = createMockNoteRepo({
          create: vi.fn().mockResolvedValue(created),
          findByTenant: vi.fn().mockResolvedValue([created]),
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
          crypto.randomUUID(),
          propertyId,
          tenantId,
          { content: "Round trip note", date: "2025-06-15" }
        );
        const list = await service.listNotes(
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(result.id).toBe(created.id);
        expect(result.content).toBe("Round trip note");
        expect(list.some((n) => n.id === result.id)).toBe(true);
        expect(list.find((n) => n.id === result.id)?.content).toBe(
          "Round trip note"
        );
      });
    });

    describe("bad cases", () => {
      it("rejects when content is empty", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: tenantId,
          movedOutAt: null,
        });
        const noteRepo = createMockNoteRepo();
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createNote(crypto.randomUUID(), propertyId, tenantId, {
            content: "",
            date: "2025-03-01",
          })
        ).rejects.toThrow(/content|required/i);
      });

      it("rejects when tenant not found", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new NoteService(
          createMockNoteRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createNote(
            crypto.randomUUID(),
            "prop-1",
            "non-existent",
            { content: "Note", date: "2025-03-01" }
          )
        ).rejects.toThrow(/Tenant not found/i);
      });

      it("createNote rejects when tenant has moved out", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: tenantId,
          movedOutAt: new Date(),
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
          service.createNote(crypto.randomUUID(), propertyId, tenantId, {
            content: "Note",
            date: "2025-03-01",
          })
        ).rejects.toThrow(/moved out/i);
      });

      it("rejects when content exceeds 2000 characters", async () => {
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
          service.createNote(
            crypto.randomUUID(),
            propertyId,
            tenantId,
            {
              content: "x".repeat(2001),
              date: "2025-03-01",
            }
          )
        ).rejects.toThrow(/2000|character/i);
      });

      it("rejects when date is invalid", async () => {
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
          service.createNote(
            crypto.randomUUID(),
            propertyId,
            tenantId,
            { content: "Note", date: "not-a-date" }
          )
        ).rejects.toThrow(/date|valid/i);
      });
    });

    describe("edge cases", () => {
      it("rejects when user has no property access", async () => {
        const noteRepo = createMockNoteRepo();
        const tenantRepo = createMockTenantRepo();
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          propertyAccess
        );

        await expect(
          service.createNote("user-1", "prop-1", "tenant-1", {
            content: "Note",
            date: "2025-03-01",
          })
        ).rejects.toThrow(/Forbidden/i);
      });

      it("rejects when tenant belongs to another property", async () => {
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          id: tenantId,
          propertyId: "other-property",
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
          service.createNote("user-1", "my-property", tenantId, {
            content: "Note",
            date: "2025-03-01",
          })
        ).rejects.toThrow(/Tenant not found/i);
      });
    });
  });

  describe("listNotes", () => {
    describe("good cases", () => {
      it("listNotes returns notes sorted by date descending (PROP 2)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const notes = [
          createTenantNote({
            tenantId,
            date: new Date("2025-01-01"),
            content: "First",
          }),
          createTenantNote({
            tenantId,
            date: new Date("2025-03-01"),
            content: "Second",
          }),
        ].reverse();
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
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(result).toHaveLength(2);
        expect(result[0].date >= result[1].date).toBe(true);
        expect(result[0].content).toBe("Second");
        expect(result[1].content).toBe("First");
      });

      it("returns empty array when tenant has no notes", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const noteRepo = createMockNoteRepo({
          findByTenant: vi.fn().mockResolvedValue([]),
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
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(result).toEqual([]);
      });
    });

    describe("bad cases", () => {
      it("throws when tenant not found", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new NoteService(
          createMockNoteRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.listNotes(
            crypto.randomUUID(),
            "prop-1",
            "non-existent"
          )
        ).rejects.toThrow(/Tenant not found/i);
      });
    });

    describe("edge cases", () => {
      it("listNotes for moved-out tenant returns all notes (PROP 6)", async () => {
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
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe("Old note");
      });
    });
  });

  describe("updateNote", () => {
    describe("good cases", () => {
      it("updates note content and returns updated note", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({
          id: noteId,
          tenantId,
          content: "Original",
          date: new Date("2025-01-01"),
        });
        const updated = createTenantNote({
          ...existing,
          content: "Updated",
          updatedAt: new Date(),
        });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
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
          crypto.randomUUID(),
          propertyId,
          tenantId,
          noteId,
          { content: "Updated" }
        );

        expect(result.id).toBe(noteId);
        expect(result.content).toBe("Updated");
        expect(noteRepo.update).toHaveBeenCalledWith(
          noteId,
          expect.objectContaining({ content: "Updated" })
        );
      });

      it("updateNote preserves id and createdAt (PROP 3)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const createdAt = new Date("2025-01-01T10:00:00Z");
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({
          id: noteId,
          tenantId,
          content: "Original",
          createdAt,
        });
        const updated = createTenantNote({
          ...existing,
          content: "Updated",
          createdAt,
          updatedAt: new Date(),
        });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
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
          crypto.randomUUID(),
          propertyId,
          tenantId,
          noteId,
          { content: "Updated" }
        );

        expect(result.id).toBe(noteId);
        expect(result.createdAt).toEqual(createdAt);
      });
    });

    describe("bad cases", () => {
      it("rejects update when content is empty", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({ id: noteId, tenantId });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.updateNote(
            crypto.randomUUID(),
            propertyId,
            tenantId,
            noteId,
            { content: "" }
          )
        ).rejects.toThrow(/content|required/i);
      });

      it("throws when note not found", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.updateNote(
            crypto.randomUUID(),
            propertyId,
            tenantId,
            "non-existent",
            { content: "Updated" }
          )
        ).rejects.toThrow(/Note not found/i);
      });
    });

    describe("edge cases", () => {
      it("updates only date when content not provided", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({
          id: noteId,
          tenantId,
          content: "Keep",
          date: new Date("2025-01-01"),
        });
        const updated = createTenantNote({
          ...existing,
          date: new Date("2025-06-01"),
          updatedAt: new Date(),
        });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
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
          crypto.randomUUID(),
          propertyId,
          tenantId,
          noteId,
          { date: "2025-06-01" }
        );

        expect(result.date).toEqual(new Date("2025-06-01"));
        expect(result.content).toBe("Keep");
      });
    });
  });

  describe("deleteNote", () => {
    describe("good cases", () => {
      it("deletes note and does not throw", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({ id: noteId, tenantId });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await service.deleteNote(
          crypto.randomUUID(),
          propertyId,
          tenantId,
          noteId
        );

        expect(noteRepo.delete).toHaveBeenCalledWith(noteId);
      });

      it("deleteNote removes note from list (PROP 4)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({ id: noteId, tenantId });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
          delete: vi.fn().mockResolvedValue(undefined),
          findByTenant: vi
            .fn()
            .mockResolvedValueOnce([existing])
            .mockResolvedValueOnce([]),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const before = await service.listNotes(
          crypto.randomUUID(),
          propertyId,
          tenantId
        );
        await service.deleteNote(
          crypto.randomUUID(),
          propertyId,
          tenantId,
          noteId
        );
        const after = await service.listNotes(
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(before).toHaveLength(1);
        expect(after).toHaveLength(0);
      });
    });

    describe("bad cases", () => {
      it("throws when note not found", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.deleteNote(
            crypto.randomUUID(),
            propertyId,
            tenantId,
            "non-existent"
          )
        ).rejects.toThrow(/Note not found/i);
      });
    });

    describe("edge cases", () => {
      it("deleteNote does not return a value", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const noteId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const existing = createTenantNote({ id: noteId, tenantId });
        const noteRepo = createMockNoteRepo({
          findById: vi.fn().mockResolvedValue(existing),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new NoteService(
          noteRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.deleteNote(
          crypto.randomUUID(),
          propertyId,
          tenantId,
          noteId
        );

        expect(result).toBeUndefined();
      });
    });
  });

  describe("property-based tests", () => {
    it("note creation returns complete object with ID and timestamp", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 2000 }).filter((s) => s.trim().length > 0),
          fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
          async (content, date) => {
            const propertyId = crypto.randomUUID();
            const tenantId = crypto.randomUUID();
            const tenant = createTenant({
              propertyId,
              id: tenantId,
              movedOutAt: null,
            });
            const created = createTenantNote({
              tenantId,
              content,
              date,
            });
            const noteRepo = createMockNoteRepo({
              create: vi.fn().mockResolvedValue(created),
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
              crypto.randomUUID(),
              propertyId,
              tenantId,
              {
                content,
                date: date.toISOString().split("T")[0],
              }
            );

            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.tenantId).toBe(tenantId);
            expect(result.content).toBe(content);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
