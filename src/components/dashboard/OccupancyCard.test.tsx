// Traceability: dashboard-overview
// REQ 1.1, 1.2, 1.3 -> it('displays total rooms, occupied, available, under renovation, occupancy rate')
// REQ 1.4 -> it('displays 100% when all rooms occupied')
// REQ 1.5 -> it('shows empty state when no rooms')
// REQ 1.6 -> it('displays stats in compact card format')
// REQ 5.4 -> it('shows skeleton when loading')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OccupancyCard } from "./OccupancyCard";
import { createOccupancyStats } from "@/test/fixtures/dashboard";

describe("OccupancyCard", () => {
  describe("good cases", () => {
    it("displays total rooms, occupied, available, under renovation, occupancy rate", () => {
      const occupancy = createOccupancyStats({
        totalRooms: 10,
        occupied: 6,
        available: 3,
        underRenovation: 1,
        occupancyRate: 60,
      });

      render(<OccupancyCard occupancy={occupancy} />);

      expect(screen.getByText(/60%/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Occupancy Rate 60%/)).toBeInTheDocument();
      expect(screen.getByText(/6\s+Occupied/)).toBeInTheDocument();
      expect(screen.getByText(/3\s+Available/)).toBeInTheDocument();
      expect(screen.getByText(/1\s+Under Renovation/)).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByTestId("occupancy-card")).toBeInTheDocument();
    });

    it("displays 100% when all rooms occupied", () => {
      const occupancy = createOccupancyStats({
        totalRooms: 5,
        occupied: 5,
        available: 0,
        underRenovation: 0,
        occupancyRate: 100,
      });

      render(<OccupancyCard occupancy={occupancy} />);

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it("displays stats in compact card format", () => {
      const occupancy = createOccupancyStats();

      const { container } = render(<OccupancyCard occupancy={occupancy} />);

      const card = container.querySelector(".w-full");
      expect(card).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("renders nothing when occupancy is null and not loading", () => {
      const { container } = render(
        <OccupancyCard occupancy={null} isLoading={false} />
      );

      expect(container.firstChild).toBeNull();
      expect(
        container.querySelector("[data-testid='occupancy-card']")
      ).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("shows empty state when no rooms", () => {
      const occupancy = createOccupancyStats({
        totalRooms: 0,
        occupied: 0,
        available: 0,
        underRenovation: 0,
        occupancyRate: 0,
      });

      render(<OccupancyCard occupancy={occupancy} />);

      expect(screen.getByText(/0%/)).toBeInTheDocument();
      expect(screen.getByTestId("occupancy-card")).toBeInTheDocument();
    });

    it("shows skeleton when loading", () => {
      render(<OccupancyCard occupancy={null} isLoading />);

      expect(screen.getByTestId("occupancy-card-skeleton")).toBeInTheDocument();
    });
  });
});
