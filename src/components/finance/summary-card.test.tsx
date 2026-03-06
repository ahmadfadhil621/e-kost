// Traceability: finance-expense-tracking
// REQ 5.1, 7.2, 7.3 -> it('renders label and formatted amount')
// REQ 7.2, 7.3 -> it('shows positive indicator when variant is net and amount > 0')
// REQ 7.3 -> it('shows negative indicator when variant is net and amount < 0')
// REQ 9.2 -> it('displays amount with full-width card')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCard } from "./summary-card";

const formatCurrency = (amount: number) => `€${amount.toLocaleString("en-IE")}`;

describe("SummaryCard", () => {
  describe("good cases", () => {
    it("renders label and formatted amount", () => {
      render(
        <SummaryCard
          label="Income"
          amount={1500000}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText("Income")).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Income €1,500,000/i)
      ).toBeInTheDocument();
    });

    it("displays amount with full-width card", () => {
      const { container } = render(
        <SummaryCard
          label="Expenses"
          amount={500000}
          formatCurrency={formatCurrency}
        />
      );

      const card = container.querySelector(".w-full");
      expect(card).toBeInTheDocument();
    });

    it("shows positive indicator when variant is net and amount > 0", () => {
      render(
        <SummaryCard
          label="Net Income"
          amount={1000000}
          variant="net"
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText("Profit")).toBeInTheDocument();
    });

    it("shows negative indicator when variant is net and amount < 0", () => {
      render(
        <SummaryCard
          label="Net Income"
          amount={-200000}
          variant="net"
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText("Loss")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders zero amount without positive/negative indicator when variant is net", () => {
      render(
        <SummaryCard
          label="Net Income"
          amount={0}
          variant="net"
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.queryByText("Profit")).not.toBeInTheDocument();
      expect(screen.queryByText("Loss")).not.toBeInTheDocument();
    });

    it("uses custom formatCurrency for display", () => {
      const customFormat = vi.fn((n: number) => `IDR ${n}`);
      render(
        <SummaryCard
          label="Income"
          amount={1000}
          formatCurrency={customFormat}
        />
      );

      expect(customFormat).toHaveBeenCalledWith(1000);
      expect(screen.getByText("IDR 1000")).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not show Profit or Loss when variant is income", () => {
      render(
        <SummaryCard
          label="Income"
          amount={1000}
          variant="income"
          formatCurrency={formatCurrency}
        />
      );
      expect(screen.queryByText("Profit")).not.toBeInTheDocument();
      expect(screen.queryByText("Loss")).not.toBeInTheDocument();
    });
  });
});
