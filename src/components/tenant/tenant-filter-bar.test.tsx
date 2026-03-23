// Traceability: rt-8-filter-search-lists
// REQ-2  -> it('renders search input and both filter buttons with counts')
// REQ-2  -> it('clicking "Missing rent" button calls onFilterChange("missing_rent")')
// REQ-2  -> it('clicking "All" button calls onFilterChange("all")')
// REQ-6  -> it('"All" button has aria-pressed="true" when filter is "all"')
// REQ-6  -> it('"Missing rent" button has aria-pressed="true" when filter is "missing_rent"')
// REQ-6  -> it('"Missing rent" button is disabled when balancesLoading is true')
// REQ-8  -> it('uses i18n translation keys for button labels')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TenantFilterBar } from "./tenant-filter-bar";

function renderFilterBar(
  overrides: Partial<React.ComponentProps<typeof TenantFilterBar>> = {}
) {
  const defaults = {
    searchValue: "",
    onSearchChange: vi.fn(),
    filter: "all" as const,
    onFilterChange: vi.fn(),
    counts: { all: 5, missing_rent: 2 },
    balancesLoading: false,
  };
  return render(<TenantFilterBar {...defaults} {...overrides} />);
}

describe("TenantFilterBar", () => {
  describe("good cases", () => {
    it("renders search input and both filter buttons with counts", () => {
      renderFilterBar({ counts: { all: 5, missing_rent: 2 } });
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /all.*5/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /missing rent.*2/i })).toBeInTheDocument();
    });

    it('clicking "Missing rent" button calls onFilterChange("missing_rent")', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderFilterBar({ onFilterChange, filter: "all" });

      await user.click(screen.getByRole("button", { name: /missing rent/i }));
      expect(onFilterChange).toHaveBeenCalledWith("missing_rent");
    });

    it('clicking "All" button calls onFilterChange("all")', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderFilterBar({ onFilterChange, filter: "missing_rent" });

      await user.click(screen.getByRole("button", { name: /^all/i }));
      expect(onFilterChange).toHaveBeenCalledWith("all");
    });
  });

  describe("bad cases", () => {
    it('"All" button has aria-pressed="true" when filter is "all"', () => {
      renderFilterBar({ filter: "all" });
      const allBtn = screen.getByRole("button", { name: /^all/i });
      expect(allBtn).toHaveAttribute("aria-pressed", "true");
    });

    it('"Missing rent" button has aria-pressed="true" when filter is "missing_rent"', () => {
      renderFilterBar({ filter: "missing_rent" });
      const missingBtn = screen.getByRole("button", { name: /missing rent/i });
      expect(missingBtn).toHaveAttribute("aria-pressed", "true");
    });

    it('"All" button has aria-pressed="false" when filter is "missing_rent"', () => {
      renderFilterBar({ filter: "missing_rent" });
      const allBtn = screen.getByRole("button", { name: /^all/i });
      expect(allBtn).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("edge cases", () => {
    it('"Missing rent" button is disabled when balancesLoading is true', () => {
      renderFilterBar({ balancesLoading: true });
      const missingBtn = screen.getByRole("button", { name: /missing rent/i });
      expect(missingBtn).toBeDisabled();
    });

    it('"Missing rent" button is enabled when balancesLoading is false', () => {
      renderFilterBar({ balancesLoading: false });
      const missingBtn = screen.getByRole("button", { name: /missing rent/i });
      expect(missingBtn).not.toBeDisabled();
    });

    it("renders with zero counts without error", () => {
      renderFilterBar({ counts: { all: 0, missing_rent: 0 } });
      expect(screen.getByRole("button", { name: /all.*0/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /missing rent.*0/i })).toBeInTheDocument();
    });
  });
});
