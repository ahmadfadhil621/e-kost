// Traceability: room-furniture-inventory
// REQ 3.2 -> it('PUT returns 200 with updated item')
// REQ 3.3 -> it('PUT returns 400 when body has no fields')
// REQ 3.3 -> it('PUT returns 400 when condition is invalid')
// REQ 4.2 -> it('DELETE returns 204')
// REQ 4.1 -> it('DELETE returns 404 when item not found')
// AUTH   -> it('PUT returns 401 when unauthenticated'), it('DELETE returns 401 when unauthenticated')
// PROP 5  -> it('PUT returns 404 when item not found')
// PROP 6  -> it('DELETE returns 404 when item not found')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT, DELETE } from "./route";
import { createInventoryItem } from "@/test/fixtures/inventory-item";

const mockSession = {
  user: { id: "test-user-id", name: "Test User", email: "test@example.com" },
  session: {} as unknown,
};

const propertyId = "prop-123";
const roomId = "room-456";
const itemId = "item-789";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/room-inventory-item-service-instance", () => ({
  roomInventoryItemService: {
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
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

describe("PUT /api/properties/[propertyId]/rooms/[roomId]/inventory/[itemId]", () => {
  describe("good cases", () => {
    it("returns 200 with the updated item", async () => {
      const updated = createInventoryItem({
        id: itemId,
        roomId,
        propertyId,
        condition: "POOR",
        notes: "Scratched leg",
      });
      vi.mocked(roomInventoryItemService.updateItem).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: "POOR", notes: "Scratched leg" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.condition).toBe("POOR");
      expect(body.data.notes).toBe("Scratched leg");
    });

    it("allows partial updates (condition only)", async () => {
      const updated = createInventoryItem({ id: itemId, roomId, propertyId, condition: "DAMAGED" });
      vi.mocked(roomInventoryItemService.updateItem).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: "DAMAGED" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 400 when body is empty (no fields to update)", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when condition value is invalid", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: "BROKEN" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 404 when item is not found", async () => {
      vi.mocked(roomInventoryItemService.updateItem).mockRejectedValue(
        new Error("Item not found")
      );

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: "POOR" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBeDefined();
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
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: "POOR" }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("returns 400 when quantity is set to zero", async () => {
      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: 0 }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("DELETE /api/properties/[propertyId]/rooms/[roomId]/inventory/[itemId]", () => {
  describe("good cases", () => {
    it("returns 204 with no body on success", async () => {
      vi.mocked(roomInventoryItemService.deleteItem).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(204);
    });
  });

  describe("bad cases", () => {
    it("returns 404 when item is not found", async () => {
      vi.mocked(roomInventoryItemService.deleteItem).mockRejectedValue(
        new Error("Item not found")
      );

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBeDefined();
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
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 403 when user lacks property access", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse: new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
        }) as never,
      });

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("calls deleteItem with all three IDs from the route params", async () => {
      vi.mocked(roomInventoryItemService.deleteItem).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
        { method: "DELETE" }
      );
      await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId, itemId }),
      });

      expect(vi.mocked(roomInventoryItemService.deleteItem)).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        itemId,
        "owner"
      );
    });
  });
});
