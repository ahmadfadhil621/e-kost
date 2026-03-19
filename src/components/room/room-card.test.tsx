// Traceability: room-detail-navigation
// REQ 1.1 -> it('available room card links to room detail')
// REQ 1.2 -> it('occupied room card links to room detail, not tenant detail')
// REQ 1.3 -> it('under_renovation room card links to room detail')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomCard, type RoomForCard } from "./room-card";

vi.mock("@/hooks/use-format-currency", () => ({
  useFormatCurrency: () => (v: number) => `Rp${v.toLocaleString()}`,
}));

const propertyId = "prop-123";

function makeRoom(overrides: Partial<RoomForCard> = {}): RoomForCard {
  return {
    id: "room-456",
    propertyId,
    roomNumber: "A101",
    roomType: "single",
    monthlyRent: 1500000,
    status: "available",
    ...overrides,
  };
}

describe("RoomCard", () => {
  describe("good cases", () => {
    it("available room card links to room detail", () => {
      render(
        <RoomCard room={makeRoom({ status: "available" })} propertyId={propertyId} />
      );
      const link = screen.getByTestId("room-card").closest("a");
      expect(link).toHaveAttribute("href", "/properties/prop-123/rooms/room-456");
    });

    it("occupied room card links to room detail, not tenant detail", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenantId: "tenant-789",
            tenantName: "Jane Doe",
          })}
          propertyId={propertyId}
        />
      );
      const link = screen.getByTestId("room-card").closest("a");
      expect(link).toHaveAttribute("href", "/properties/prop-123/rooms/room-456");
      expect(link).not.toHaveAttribute(
        "href",
        expect.stringContaining("/tenants/")
      );
    });

    it("under_renovation room card links to room detail", () => {
      render(
        <RoomCard room={makeRoom({ status: "under_renovation" })} propertyId={propertyId} />
      );
      const link = screen.getByTestId("room-card").closest("a");
      expect(link).toHaveAttribute("href", "/properties/prop-123/rooms/room-456");
    });
  });

  describe("bad cases", () => {
    it("occupied room with outstanding balance shows unpaid indicator", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenantId: "tenant-789",
            tenantName: "Jane Doe",
            outstandingBalance: 500000,
          })}
          propertyId={propertyId}
        />
      );
      const card = screen.getByTestId("room-card");
      expect(card).toBeTruthy();
      const unpaid = screen.getByRole("status", { name: /unpaid|500/i });
      expect(unpaid).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("occupied room card without tenantId still links to room detail", () => {
      render(
        <RoomCard room={makeRoom({ status: "occupied" })} propertyId={propertyId} />
      );
      const link = screen.getByTestId("room-card").closest("a");
      expect(link).toHaveAttribute("href", "/properties/prop-123/rooms/room-456");
    });
  });
});
