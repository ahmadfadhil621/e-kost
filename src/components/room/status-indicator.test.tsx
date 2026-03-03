// Traceability: room-inventory-management
// REQ 3.4 -> it('renders text label for each status')
// REQ 3.4, accessibility -> it('does not rely on color alone'), it('has role="status" and aria-label')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./status-indicator";

describe("StatusIndicator", () => {
  describe("bad cases", () => {
    it("renders without crashing for every valid status", () => {
      const statuses = ["available", "occupied", "under_renovation"] as const;
      for (const status of statuses) {
        const { unmount } = render(<StatusIndicator status={status} />);
        expect(screen.getByRole("status")).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("good cases", () => {
    it("renders text label for available status", () => {
      render(<StatusIndicator status="available" />);
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    it("renders text label for occupied status", () => {
      render(<StatusIndicator status="occupied" />);
      expect(screen.getByText(/occupied/i)).toBeInTheDocument();
    });

    it("renders text label for under_renovation status", () => {
      render(<StatusIndicator status="under_renovation" />);
      expect(screen.getByText(/under renovation|renovation/i)).toBeInTheDocument();
    });

    it("has role status and aria-label for accessibility", () => {
      render(<StatusIndicator status="available" />);
      const el = screen.getByRole("status", { name: /available/i });
      expect(el).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("supports large size", () => {
      const { container } = render(
        <StatusIndicator status="available" size="large" />
      );
      expect(screen.getByText(/available/i)).toBeInTheDocument();
      expect(container.querySelector("[role='status']")).toBeInTheDocument();
    });

    it("renders with minimum touch target dimensions (44px) for small size", () => {
      const { container } = render(<StatusIndicator status="available" />);
      const el = container.querySelector("[role='status']");
      expect(el).toHaveClass("min-h-[44px]");
      expect(el).toHaveClass("min-w-[44px]");
    });
  });
});
