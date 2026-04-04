// Traceability: room-detail-navigation
// REQ 1.1 -> it('available room card links to room detail')
// REQ 1.2 -> it('occupied room card links to room detail, not tenant detail')
// REQ 1.3 -> it('under_renovation room card links to room detail')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { RoomCard, type RoomForCard, abbreviateName } from "./room-card";

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

// Traceability: room-tenant-move-in-date
// AC-1 -> it('occupied room card renders all tenant names as list items')
// AC-2 -> it('occupied room card renders all tenant names in multi-tenant room')
// AC-3 -> it('occupied room card renders abbreviated middle name for 3-word names')
// AC-3 -> it('abbreviates 4-word names correctly')
// AC-3 -> it('2-word names are shown as-is')
// AC-3 -> it('single-word names are shown as-is')
// AC-4 -> it('occupied room card omits date when assignedAt is null')
// AC-1 -> it('occupied room card renders since date when assignedAt is provided')
// AC-5 -> (covered by existing available/under_renovation tests)

describe("room-tenant-move-in-date", () => {
  describe("good cases", () => {
    it("occupied room card renders all tenant names as list items", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [
              { id: "t1", name: "Alice", assignedAt: null },
              { id: "t2", name: "Bob", assignedAt: null },
            ],
          })}
          propertyId={propertyId}
        />
      );
      const listItems = screen.getAllByRole("listitem");
      const listItemTexts = listItems.map((li) => li.textContent ?? "");
      expect(listItemTexts.some((t) => /Alice/.test(t))).toBe(true);
      expect(listItemTexts.some((t) => /Bob/.test(t))).toBe(true);
    });

    it("occupied room card renders abbreviated middle name for 3-word names", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [{ id: "t1", name: "George Washington Bush", assignedAt: null }],
          })}
          propertyId={propertyId}
        />
      );
      expect(screen.getByText(/George W\. Bush/)).toBeInTheDocument();
      expect(screen.queryByText(/George Washington Bush/)).not.toBeInTheDocument();
    });

    it("occupied room card renders since date when assignedAt is provided", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [{ id: "t1", name: "Jane Doe", assignedAt: "2024-01-15T00:00:00.000Z" }],
            assignedAt: "2024-01-15T00:00:00.000Z",
          })}
          propertyId={propertyId}
        />
      );
      expect(screen.getByText(/since/i)).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("occupied room card omits date when assignedAt is null", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [{ id: "t1", name: "Jane Doe", assignedAt: null }],
            assignedAt: null,
          })}
          propertyId={propertyId}
        />
      );
      expect(screen.queryByText(/since/i)).toBeNull();
      expect(screen.queryByText(/room\.card\.since/)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("abbreviates 4-word names correctly", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [{ id: "t1", name: "John William Robert Doe", assignedAt: null }],
          })}
          propertyId={propertyId}
        />
      );
      expect(screen.getByText(/John W\. R\. Doe/)).toBeInTheDocument();
    });

    it("2-word names are shown as-is", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [{ id: "t1", name: "John Doe", assignedAt: null }],
          })}
          propertyId={propertyId}
        />
      );
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.queryByText(/John D\./)).toBeNull();
    });

    it("single-word name is shown as-is", () => {
      render(
        <RoomCard
          room={makeRoom({
            status: "occupied",
            tenants: [{ id: "t1", name: "Cher", assignedAt: null }],
          })}
          propertyId={propertyId}
        />
      );
      expect(screen.getByText(/Cher/)).toBeInTheDocument();
    });
  });
});

// Traceability: room-tenant-move-in-date
// PROP 1 -> abbreviateName on ≥3 words always produces exactly 2 non-abbreviated words plus n-2 abbreviations
// PROP 3 -> abbreviateName never produces empty string for non-empty input

describe("abbreviateName — correctness properties", () => {
  it("PROP 1: ≥3-word names always produce first + abbreviated middles + last", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^[A-Za-z]{1,20}$/),
          { minLength: 3, maxLength: 8 }
        ),
        (words) => {
          const name = words.join(" ");
          const result = abbreviateName(name);
          const resultParts = result.split(" ");
          // First word unchanged
          expect(resultParts[0]).toBe(words[0]);
          // Last word unchanged
          expect(resultParts[resultParts.length - 1]).toBe(words[words.length - 1]);
          // Middle words abbreviated to "X."
          const middles = resultParts.slice(1, -1);
          expect(middles).toHaveLength(words.length - 2);
          middles.forEach((m) => {
            expect(m).toMatch(/^[A-Za-z]\.$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("PROP 3: abbreviateName never produces empty string for non-empty input", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,49}[A-Za-z]$/),
        (name) => {
          const result = abbreviateName(name.trim());
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
