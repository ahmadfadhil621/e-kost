// Traceability: tenant-notes
// REQ 3.4, 3.5 -> PUT 200 and validation
// REQ 4.3, 4.4 -> DELETE 204

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { PUT, DELETE } from "./route";
import { createTenantNote } from "@/test/fixtures/tenant-note";

const propertyId = "prop-123";
const tenantId = "tenant-456";
const noteId = "note-789";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/note-service-instance", () => ({
  noteService: {
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { noteService } = await import("@/lib/note-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("PUT /api/properties/[propertyId]/tenants/[tenantId]/notes/[noteId]", () => {
  describe("good cases", () => {
    it("returns 200 with updated note", async () => {
      const updated = createTenantNote({
        id: noteId,
        tenantId,
        content: "Updated content",
        date: new Date("2025-06-01"),
      });
      vi.mocked(noteService.updateNote).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Updated content",
            date: "2025-06-01",
          }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(noteId);
      expect(data.content).toBe("Updated content");
      expect(data.date).toBe("2025-06-01");
    });
  });

  describe("bad cases", () => {
    it("returns 400 when content is empty", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 404 when note not found", async () => {
      vi.mocked(noteService.updateNote).mockRejectedValueOnce(
        new Error("Note not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    it("returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("returns 200 when updating only date", async () => {
      const updated = createTenantNote({
        id: noteId,
        tenantId,
        content: "Same",
        date: new Date("2025-07-01"),
      });
      vi.mocked(noteService.updateNote).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: "2025-07-01" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe("2025-07-01");
    });
  });
});

describe("DELETE /api/properties/[propertyId]/tenants/[tenantId]/notes/[noteId]", () => {
  describe("good cases", () => {
    it("returns 204 when note is deleted", async () => {
      vi.mocked(noteService.deleteNote).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });

      expect(response.status).toBe(204);
      const body = await response.text();
      expect(body).toBe("");
    });
  });

  describe("bad cases", () => {
    it("returns 404 when note not found", async () => {
      vi.mocked(noteService.deleteNote).mockRejectedValueOnce(
        new Error("Note not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });
  });

  describe("edge cases", () => {
    it("returns 204 with empty body when delete succeeds", async () => {
      vi.mocked(noteService.deleteNote).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, tenantId, noteId }),
      });
      const body = await response.text();

      expect(response.status).toBe(204);
      expect(body).toBe("");
    });
  });
});
