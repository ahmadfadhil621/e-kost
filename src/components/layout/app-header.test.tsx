// Traceability: G-1 responsive layout
// REQ-3 -> it('inner content wrapper has md breakpoint max-width for tablet scale-up')
// REQ-3 -> it('header outer element is full-width — no max-w constraint so border-bottom spans viewport')
// REQ-1 -> it('does not render occupancy stats when there is no active property')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "./app-header";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({ data: undefined })),
}));

const mockActivePropertyId = vi.fn();

vi.mock("@/contexts/property-context", () => ({
  usePropertyContext: () => ({
    activePropertyId: mockActivePropertyId(),
  }),
}));

vi.mock("@/components/property/property-switcher", () => ({
  PropertySwitcher: () => <div data-testid="property-switcher" />,
}));

vi.mock("@/components/auth/profile-dropdown", () => ({
  ProfileDropdown: () => <div data-testid="profile-dropdown" />,
}));

describe("AppHeader", () => {
  beforeEach(() => {
    mockActivePropertyId.mockReturnValue(null);
    vi.mocked(useQuery).mockReturnValue({ data: undefined } as ReturnType<typeof useQuery>);
  });

  describe("good cases", () => {
    it("renders the header landmark", () => {
      render(<AppHeader />);
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("renders PropertySwitcher and ProfileDropdown", () => {
      render(<AppHeader />);
      expect(screen.getByTestId("property-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("profile-dropdown")).toBeInTheDocument();
    });

    it("header outer element is full-width — no max-w constraint so border-bottom spans viewport", () => {
      render(<AppHeader />);
      const header = screen.getByRole("banner");
      expect(header.className).not.toMatch(/\bmax-w-/);
    });
  });

  describe("bad cases", () => {
    it("does not render occupancy stats when there is no active property", () => {
      mockActivePropertyId.mockReturnValue(null);
      render(<AppHeader />);
      expect(screen.queryByText(/occupied/i)).not.toBeInTheDocument();
    });
  });

  describe("responsive layout", () => {
    it("inner content wrapper has mobile max-width constraint", () => {
      const { container } = render(<AppHeader />);
      const header = container.querySelector("header");
      const inner = header?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/max-w-\[480px\]/);
    });

    it("inner content wrapper has md breakpoint max-width for tablet scale-up", () => {
      const { container } = render(<AppHeader />);
      const header = container.querySelector("header");
      const inner = header?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/md:max-w-2xl/);
    });

    it("inner content wrapper has lg breakpoint max-width for desktop scale-up", () => {
      const { container } = render(<AppHeader />);
      const header = container.querySelector("header");
      const inner = header?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/lg:max-w-3xl/);
    });

    it("inner content wrapper is horizontally centered with mx-auto", () => {
      const { container } = render(<AppHeader />);
      const header = container.querySelector("header");
      const inner = header?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/\bmx-auto\b/);
    });

    it("occupancy stats row is rendered inside the constrained inner wrapper", () => {
      vi.mocked(useQuery).mockReturnValue({
        data: {
          occupancy: { occupied: 3, available: 2, underRenovation: 1 },
        },
      } as ReturnType<typeof useQuery>);
      mockActivePropertyId.mockReturnValue("prop-123");

      const { container } = render(<AppHeader />);
      const header = container.querySelector("header");
      const inner = header?.firstElementChild as HTMLElement | null;
      // Both the main row and stats row are inside the inner wrapper
      expect(inner?.children.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("edge cases", () => {
    it("renders without crashing when activePropertyId changes from null to a value", () => {
      mockActivePropertyId.mockReturnValue(null);
      const { rerender } = render(<AppHeader />);
      expect(screen.getByRole("banner")).toBeInTheDocument();

      mockActivePropertyId.mockReturnValue("prop-456");
      expect(() => rerender(<AppHeader />)).not.toThrow();
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("inner wrapper w-full class ensures it stretches to fill the header", () => {
      const { container } = render(<AppHeader />);
      const header = container.querySelector("header");
      const inner = header?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/\bw-full\b/);
    });
  });
});
