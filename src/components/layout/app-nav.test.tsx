// Traceability: UI redesign (global layout)
// Plan: AppNav renders four items (Overview, Rooms, Tenants, Finance), no Settings;
//       when activePropertyId is set, links use it; active tab matches current route.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppNav } from "./app-nav";

const mockPathname = vi.fn();
const mockActivePropertyId = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/contexts/property-context", () => ({
  usePropertyContext: () => ({
    activePropertyId: mockActivePropertyId(),
  }),
}));

describe("AppNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    mockActivePropertyId.mockReturnValue("prop-123");
  });

  describe("good cases", () => {
    it("renders four nav items: Overview, Rooms, Tenants, Finance", () => {
      render(<AppNav />);

      expect(
        screen.getByRole("link", { name: /overview|dashboard|dasbor/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /rooms|kamar/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /tenants|penyewa/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /finance|keuangan/i })
      ).toBeInTheDocument();
    });

    it("does not render Settings link in nav", () => {
      render(<AppNav />);

      expect(
        screen.queryByRole("link", { name: /settings|pengaturan/i })
      ).not.toBeInTheDocument();
    });

    it("when activePropertyId is set, Rooms link uses property-scoped href", () => {
      mockActivePropertyId.mockReturnValue("prop-456");
      render(<AppNav />);

      const roomsLink = screen.getByRole("link", { name: /rooms|kamar/i });
      expect(roomsLink).toHaveAttribute("href", "/properties/prop-456/rooms");
    });

    it("when activePropertyId is set, Tenants link uses property-scoped href", () => {
      mockActivePropertyId.mockReturnValue("prop-456");
      render(<AppNav />);

      const tenantsLink = screen.getByRole("link", {
        name: /tenants|penyewa/i,
      });
      expect(tenantsLink).toHaveAttribute(
        "href",
        "/properties/prop-456/tenants"
      );
    });

    it("when activePropertyId is set, Finance link uses property-scoped href", () => {
      mockActivePropertyId.mockReturnValue("prop-456");
      render(<AppNav />);

      const financeLink = screen.getByRole("link", {
        name: /finance|keuangan/i,
      });
      expect(financeLink).toHaveAttribute(
        "href",
        "/properties/prop-456/finance"
      );
    });

    it("active tab has primary styling when pathname matches", () => {
      mockPathname.mockReturnValue("/properties/prop-123/rooms");
      render(<AppNav />);

      const roomsLink = screen.getByRole("link", { name: /rooms|kamar/i });
      expect(roomsLink.className).toMatch(/text-primary|bg-primary/);
    });
  });

  describe("bad cases", () => {
    it("renders without crashing when activePropertyId is null", () => {
      mockActivePropertyId.mockReturnValue(null);
      expect(() => render(<AppNav />)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("nav has role navigation and adequate touch targets", () => {
      render(<AppNav />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();

      const links = screen.getAllByRole("link");
      for (const link of links) {
        expect(link.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]/);
      }
    });
  });
});
