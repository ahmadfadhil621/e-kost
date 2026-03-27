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

    it("when activePropertyId is null, property-scoped nav items are aria-disabled", () => {
      mockActivePropertyId.mockReturnValue(null);
      render(<AppNav />);

      const disabledItems = screen.getAllByRole("link", { hidden: true }).filter(
        (el) => el.getAttribute("aria-disabled") === "true"
      );
      // Rooms, Tenants, Finance should all be disabled
      expect(disabledItems.length).toBeGreaterThanOrEqual(3);
    });

    it("when activePropertyId is null, Overview link is still enabled", () => {
      mockActivePropertyId.mockReturnValue(null);
      render(<AppNav />);

      const overviewLink = screen.getByRole("link", { name: /overview|dashboard|dasbor/i });
      expect(overviewLink).not.toHaveAttribute("aria-disabled", "true");
    });

    it("when activePropertyId is null, disabled items have cursor-not-allowed", () => {
      mockActivePropertyId.mockReturnValue(null);
      render(<AppNav />);

      const disabledItems = screen.getAllByRole("link", { hidden: true }).filter(
        (el) => el.getAttribute("aria-disabled") === "true"
      );
      for (const item of disabledItems) {
        expect(item.className).toMatch(/cursor-not-allowed/);
      }
    });

    it("when activePropertyId is null, disabled items maintain touch targets ≥44×44px", () => {
      mockActivePropertyId.mockReturnValue(null);
      render(<AppNav />);

      const disabledItems = screen.getAllByRole("link", { hidden: true }).filter(
        (el) => el.getAttribute("aria-disabled") === "true"
      );
      for (const item of disabledItems) {
        expect(item.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]/);
      }
    });

    it("when activePropertyId is null, disabled items are keyboard-reachable (tabIndex=0)", () => {
      mockActivePropertyId.mockReturnValue(null);
      render(<AppNav />);

      const disabledItems = screen.getAllByRole("link", { hidden: true }).filter(
        (el) => el.getAttribute("aria-disabled") === "true"
      );
      for (const item of disabledItems) {
        expect(item).toHaveAttribute("tabindex", "0");
      }
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

    it("nav element has fixed positioning classes", () => {
      render(<AppNav />);
      const nav = screen.getByRole("navigation");
      expect(nav.className).toMatch(/\bfixed\b/);
      expect(nav.className).toMatch(/\bbottom-0\b/);
      expect(nav.className).toMatch(/\bz-50\b/);
    });
  });

  describe("responsive layout", () => {
    it("outer nav is full-width — spans left-0 to right-0 so border-top covers the viewport", () => {
      render(<AppNav />);
      const nav = screen.getByRole("navigation");
      expect(nav.className).toMatch(/\bleft-0\b/);
      expect(nav.className).toMatch(/\bright-0\b/);
    });

    it("outer nav does not directly carry a max-w constraint", () => {
      render(<AppNav />);
      const nav = screen.getByRole("navigation");
      expect(nav.className).not.toMatch(/\bmax-w-/);
    });

    it("inner wrapper div has mobile max-width constraint", () => {
      const { container } = render(<AppNav />);
      const nav = container.querySelector("nav");
      const inner = nav?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/max-w-\[480px\]/);
    });

    it("inner wrapper div has md breakpoint max-width constraint for tablet scale-up", () => {
      const { container } = render(<AppNav />);
      const nav = container.querySelector("nav");
      const inner = nav?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/md:max-w-2xl/);
    });

    it("inner wrapper div has lg breakpoint max-width constraint for desktop scale-up", () => {
      const { container } = render(<AppNav />);
      const nav = container.querySelector("nav");
      const inner = nav?.firstElementChild as HTMLElement | null;
      expect(inner?.className).toMatch(/lg:max-w-3xl/);
    });

    it("all nav links are rendered inside the inner constrained wrapper", () => {
      const { container } = render(<AppNav />);
      const nav = container.querySelector("nav");
      const inner = nav?.firstElementChild as HTMLElement | null;
      const links = inner?.querySelectorAll("a");
      expect(links?.length).toBe(4);
    });
  });
});
