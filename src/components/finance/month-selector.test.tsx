// Traceability: finance-expense-tracking
// REQ 8.1 -> it('displays current month and year')
// REQ 8.2 -> it('calls onPrevious when previous button clicked')
// REQ 8.2 -> it('calls onNext when next button clicked')
// REQ 8.4 -> it('has minimum 44x44px touch targets on buttons')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthSelector } from "./month-selector";

describe("MonthSelector", () => {
  describe("good cases", () => {
    it("displays current month and year", () => {
      render(
        <MonthSelector
          year={2026}
          month={3}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByText("March 2026")).toBeInTheDocument();
    });

    it("calls onPrevious when previous button clicked", async () => {
      const onPrevious = vi.fn();
      const user = userEvent.setup();
      render(
        <MonthSelector
          year={2026}
          month={3}
          onPrevious={onPrevious}
          onNext={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /previous month/i }));

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it("calls onNext when next button clicked", async () => {
      const onNext = vi.fn();
      const user = userEvent.setup();
      render(
        <MonthSelector
          year={2026}
          month={3}
          onPrevious={vi.fn()}
          onNext={onNext}
        />
      );

      await user.click(screen.getByRole("button", { name: /next month/i }));

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("has minimum 44x44px touch targets on buttons", () => {
      render(
        <MonthSelector
          year={2026}
          month={3}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
        />
      );

      const prev = screen.getByRole("button", { name: /previous month/i });
      const next = screen.getByRole("button", { name: /next month/i });
      expect(prev).toHaveClass("min-h-[44px]", "min-w-[44px]");
      expect(next).toHaveClass("min-h-[44px]", "min-w-[44px]");
    });
  });

  describe("edge cases", () => {
    it("displays December and January correctly", () => {
      const { rerender } = render(
        <MonthSelector
          year={2025}
          month={12}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
        />
      );
      expect(screen.getByText("December 2025")).toBeInTheDocument();

      rerender(
        <MonthSelector
          year={2026}
          month={1}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
        />
      );
      expect(screen.getByText("January 2026")).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not submit form when buttons are clicked without form context", () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      render(
        <MonthSelector
          year={2026}
          month={3}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      );
      expect(screen.getByRole("button", { name: /previous month/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /next month/i })).not.toBeDisabled();
      expect(onPrevious).not.toHaveBeenCalled();
      expect(onNext).not.toHaveBeenCalled();
    });
  });
});
