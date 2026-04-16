// Traceability: room-furniture-inventory
// REQ 1.5 -> it('GET returns 200 with items array')
// REQ 1.2 -> it('GET returns empty array when room has no items')
// REQ 2.2 -> it('POST returns 201 with created item')
// REQ 2.3 -> it('POST returns 400 when name is missing'), it('POST returns 400 when quantity is zero')
// REQ 2.3 -> it('POST returns 400 when condition is invalid')
// AUTH   -> it('GET returns 401 when unauthenticated'), it('POST returns 401 when unauthenticated')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { createInventoryItem } from "@/test/fixtures/inventory-item";

const mockSession = {
  user: { id: "test-user-id", name: "Test User", email: "test@example.com" },
  session: {} as unknown,
};

const propertyId = "prop-123";
const roomId = "room-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/room-inventory-item-service-instance", () => ({
  roomInventoryItemService: {
    listItems: vi.fn(),
    addItem: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { withPropertyAccess } = await import("@/lib/property-access");
const { roomInventoryItemService } = await import("@/lib/room-inventory-item-service-instance");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("GET /api/properties/[propertyId]/rooms/[roomId]/inventory", () => {
  describe("good cases", () => {
    it("returns 200 with items array", async () => {
      const items = [
        createInventoryItem({ roomId, propertyId }),
        createInventoryItem({ roomId, propertyId, name: "Chair", condition: "FAIR" }),
      ];
      vi.mocked(roomInventoryItemService.listItems).mockResolvedValue(items);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe("AC");
      expect(body.data[1].name).toBe("Chair");
    });

    it("returns empty array (not 404) when room has no items", async () => {
      vi.mocked(roomInventoryItemService.listItems).mockResolvedValue([]);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }) as never,
      });

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 403 when user has no access to property", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse: new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
        }) as never,
      });

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("response shape always includes a data array", async () => {
      vi.mocked(roomInventoryItemService.listItems).mockResolvedValue([]);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const body = await response.json();

      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});

describe("POST /api/properties/[propertyId]/rooms/[roomId]/inventory", () => {
  describe("good cases", () => {
    it("returns 201 with created item", async () => {
      const created = createInventoryItem({
        roomId,
        propertyId,
        name: "Wardrobe",
        quantity: 1,
        condition: "NEW",
        notes: "Built-in wardrobe",
      });
      vi.mocked(roomInventoryItemService.addItem).mockResolvedValue(created);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Wardrobe",
            quantity: 1,
            condition: "NEW",
            notes: "Built-in wardrobe",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.name).toBe("Wardrobe");
      expect(body.data.condition).toBe("NEW");
    });

    it("returns 201 without optional notes", async () => {
      const created = createInventoryItem({ roomId, propertyId, notes: null });
      vi.mocked(roomInventoryItemService.addItem).mockResolvedValue(created);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "AC", quantity: 1, condition: "GOOD" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(201);
    });
  });

  describe("bad cases", () => {
    it("returns 400 when name is missing", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: 1, condition: "GOOD" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("returns 400 when quantity is zero", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Chair", quantity: 0, condition: "GOOD" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when condition is an invalid value", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Chair", quantity: 1, condition: "BROKEN" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }) as never,
      });

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "AC", quantity: 1, condition: "GOOD" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("returns 400 when body is empty", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });

    it("trims whitespace-only name and returns 400", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "   ", quantity: 1, condition: "GOOD" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });
  });
});
