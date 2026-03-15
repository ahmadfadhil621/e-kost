// Traceability: tenant-notes
// REQ 1.3, 2.1, 2.2 -> POST 201 and GET 200 with notes
// REQ 1.4 -> POST 400 when content empty
// REQ 5.3 -> POST 409 when tenant moved out

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET, POST } from "./route";
import { createTenantNote } from "@/test/fixtures/tenant-note";

const propertyId = "prop-123";
const tenantId = "tenant-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/note-service-instance", () => ({
  noteService: {
    listNotes: vi.fn(),
    createNote: vi.fn(),
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

describe("GET /api/properties/[propertyId]/tenants/[tenantId]/notes", () => {
  describe("good cases", () => {
    it("returns 200 with notes array sorted by date", async () => {
      const notes = [
        createTenantNote({
          tenantId,
          content: "Second",
          date: new Date("2025-03-01"),
        }),
        createTenantNote({
          tenantId,
          content: "First",
          date: new Date("2025-01-01"),
        }),
      ].reverse();
      vi.mocked(noteService.listNotes).mockResolvedValue(notes);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("content");
      expect(data[0]).toHaveProperty("date");
      expect(data[0]).toHaveProperty("createdAt");
      expect(data[0]).toHaveProperty("updatedAt");
    });

    it("returns 200 with empty array when tenant has no notes", async () => {
      vi.mocked(noteService.listNotes).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe("bad cases", () => {
    it("returns 404 when tenant not found", async () => {
      vi.mocked(noteService.listNotes).mockRejectedValueOnce(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
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
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("returns 200 with notes when list has one note", async () => {
      const one = createTenantNote({ tenantId, content: "Only note" });
      vi.mocked(noteService.listNotes).mockResolvedValue([one]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].content).toBe("Only note");
    });
  });
});

describe("POST /api/properties/[propertyId]/tenants/[tenantId]/notes", () => {
  describe("good cases", () => {
    it("returns 201 with created note", async () => {
      const created = createTenantNote({
        tenantId,
        content: "New note",
        date: new Date("2025-03-01"),
      });
      vi.mocked(noteService.createNote).mockResolvedValue(created);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "New note",
            date: "2025-03-01",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(created.id);
      expect(data.content).toBe("New note");
      expect(data.date).toBe("2025-03-01");
      expect(data).toHaveProperty("createdAt");
    });
  });

  describe("bad cases", () => {
    it("returns 400 when content is empty", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "",
            date: "2025-03-01",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.errors).toBeDefined();
    });

    it("returns 404 when tenant not found", async () => {
      vi.mocked(noteService.createNote).mockRejectedValueOnce(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Note",
            date: "2025-03-01",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    it("returns 409 when tenant has moved out", async () => {
      vi.mocked(noteService.createNote).mockRejectedValueOnce(
        new Error("Cannot add note: tenant has moved out")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Note",
            date: "2025-03-01",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/moved out/i);
    });
  });

  describe("edge cases", () => {
    it("returns 400 when date is invalid", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Note",
            date: "not-a-date",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });
  });
});
