// Traceability: rt-8-filter-search-lists
// REQ-1  -> it('renders an input with the given placeholder text')
// REQ-1  -> it('fires onChange when user types in the input')
// REQ-6  -> it('applies aria-label to the input element')
// REQ-6  -> it('search icon is aria-hidden')
// REQ-8  -> it('renders without placeholder when prop is omitted')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  describe("good cases", () => {
    it("renders an input with the given placeholder text", () => {
      render(
        <SearchInput
          value=""
          onChange={vi.fn()}
          placeholder="Search tenants"
          ariaLabel="Search tenants"
        />
      );
      expect(screen.getByPlaceholderText("Search tenants")).toBeInTheDocument();
    });

    it("fires onChange when user types in the input", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <SearchInput
          value=""
          onChange={onChange}
          placeholder="Search"
          ariaLabel="Search"
        />
      );

      await user.type(screen.getByRole("textbox"), "ali");
      expect(onChange).toHaveBeenCalled();
    });

    it("applies aria-label to the input element", () => {
      render(
        <SearchInput
          value=""
          onChange={vi.fn()}
          ariaLabel="Search tenants by name"
        />
      );
      expect(
        screen.getByRole("textbox", { name: "Search tenants by name" })
      ).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not call onChange when value changes externally (controlled)", () => {
      // SearchInput is controlled — onChange only fires on user interaction, not on prop changes
      const onChange = vi.fn();
      const { rerender } = render(
        <SearchInput value="" onChange={onChange} ariaLabel="Search" />
      );
      rerender(<SearchInput value="updated" onChange={onChange} ariaLabel="Search" />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("renders without placeholder when prop is omitted", () => {
      render(
        <SearchInput value="" onChange={vi.fn()} ariaLabel="Search" />
      );
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveAttribute("placeholder");
    });

    it("search icon is aria-hidden", () => {
      const { container } = render(
        <SearchInput value="" onChange={vi.fn()} ariaLabel="Search" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });
});
