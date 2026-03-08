// Traceability: dashboard-overview
// REQ 2.1, 2.2, 2.3 -> it('displays income, expenses, net income for current month')
// REQ 2.4 -> it('shows positive indicator when net income > 0')
// REQ 2.5 -> it('shows negative indicator when net income < 0')
// REQ 2.6 -> it('uses formatCurrency for amounts')
// REQ 5.4 -> it('shows skeleton when loading')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinanceSummaryCard } from "./FinanceSummaryCard";
import { createFinanceSummarySnapshot } from "@/test/fixtures/dashboard";

const formatCurrency = (amount: number) =>
  `€${amount.toLocaleString("en-IE", { minimumFractionDigits: 2 })}`;

describe("FinanceSummaryCard", () => {
  describe("good cases", () => {
    it("displays income, expenses, net income for current month", () => {
      const finance = createFinanceSummarySnapshot({
        year: 2026,
        month: 3,
        income: 3000000,
        expenses: 500000,
        netIncome: 2500000,
      });

      render(
        <FinanceSummaryCard
          finance={finance}
          formatCurrency={formatCurrency}
        />
      );

      expect(
        screen.getByLabelText(/Income €3,000,000/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Expenses €500,000/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Net income €2,500,000/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/March 2026/)).toBeInTheDocument();
    });

    it("shows positive indicator when net income > 0", () => {
      const finance = createFinanceSummarySnapshot({
        netIncome: 1000000,
      });

      render(
        <FinanceSummaryCard
          finance={finance}
          formatCurrency={formatCurrency}
        />
      );

      const netEl = screen.getByLabelText(/Net income €1,000,000/i);
      expect(netEl).toHaveClass("text-[hsl(var(--status-available))]");
    });

    it("shows negative indicator when net income < 0", () => {
      const finance = createFinanceSummarySnapshot({
        income: 1000000,
        expenses: 1500000,
        netIncome: -500000,
      });

      render(
        <FinanceSummaryCard
          finance={finance}
          formatCurrency={formatCurrency}
        />
      );

      const netEl = screen.getByLabelText(/Net income.*500,000/i);
      expect(netEl).toHaveClass("text-[hsl(var(--status-occupied))]");
    });

    it("uses formatCurrency for amounts", () => {
      const finance = createFinanceSummarySnapshot({ income: 1000 });
      const customFormat = (n: number) => `IDR ${n}`;

      render(
        <FinanceSummaryCard finance={finance} formatCurrency={customFormat} />
      );

      expect(
        screen.getByLabelText(/Income IDR 1000/i)
      ).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("renders card with net income when finance has positive net", () => {
      const finance = createFinanceSummarySnapshot({ netIncome: 1000 });
      render(
        <FinanceSummaryCard
          finance={finance}
          formatCurrency={formatCurrency}
        />
      );
      expect(screen.getByTestId("finance-summary-card")).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Net income €1,000/i)
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders nothing when finance is null and not loading", () => {
      const { container } = render(
        <FinanceSummaryCard
          finance={null}
          formatCurrency={formatCurrency}
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
      expect(container.querySelector("[data-testid='finance-summary-card']")).not.toBeInTheDocument();
    });

    it("shows skeleton when loading", () => {
      render(
        <FinanceSummaryCard
          finance={null}
          formatCurrency={formatCurrency}
          isLoading
        />
      );

      expect(screen.getByTestId("finance-summary-skeleton")).toBeInTheDocument();
    });

    it("shows neutral styling when net income is zero", () => {
      const finance = createFinanceSummarySnapshot({
        income: 1000,
        expenses: 1000,
        netIncome: 0,
      });

      render(
        <FinanceSummaryCard
          finance={finance}
          formatCurrency={formatCurrency}
        />
      );

      const netEl = screen.getByLabelText(/Net income €0.00/i);
      expect(netEl).not.toHaveClass("text-[hsl(var(--status-available))]");
      expect(netEl).not.toHaveClass("text-[hsl(var(--status-occupied))]");
    });
  });
});
