// Traceability: dashboard-overview
// REQ 2.1, 2.2, 2.3 -> it('displays income, expenses, net income for current month')
// REQ 2.4 -> it('shows positive indicator when net income > 0')
// REQ 2.5 -> it('shows negative indicator when net income < 0')
// REQ 2.6 -> it('uses formatCurrency for amounts')
// REQ 5.4 -> it('shows skeleton when loading')
// Traceability: finance-summary-card-detail-popup
// REQ 1 -> it('clicking income trigger opens income detail dialog')
// REQ 2 -> it('clicking expenses trigger opens expense breakdown dialog')
// REQ 3 -> it('income dialog shows income amount and from-rent label')
// REQ 4 -> it('expenses dialog shows total and sorted category breakdown')
// REQ 4 -> it('expenses dialog shows no-expenses message when breakdown is empty')
// REQ 4 -> it('expenses dialog only shows categories with total > 0')
// REQ 4 -> it('expenses dialog sorts categories by total descending')
// REQ 5 -> it('income dialog closes on dismiss')
// REQ 6 -> it('income and expenses trigger buttons have data-testid attributes')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      expect(netEl).toHaveClass("text-finance-profit-positive");
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
      expect(netEl).toHaveClass("text-finance-profit-negative");
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
      expect(netEl).not.toHaveClass("text-finance-profit-positive");
      expect(netEl).not.toHaveClass("text-finance-profit-negative");
    });
  });

  describe("dialog popup behavior", () => {
    describe("good cases", () => {
      it("clicking income trigger opens income detail dialog with amount and from-rent label", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({
          income: 3000000,
          expenses: 500000,
          categoryBreakdown: [],
        });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-income-trigger"));

        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent(/income detail/i);
        expect(dialog).toHaveTextContent(/€3,000,000/i);
        expect(dialog).toHaveTextContent(/from rent payments/i);
      });

      it("clicking expenses trigger opens expense breakdown dialog with total", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({
          income: 3000000,
          expenses: 500000,
          categoryBreakdown: [
            { category: "electricity", total: 300000, count: 1 },
            { category: "water", total: 200000, count: 1 },
          ],
        });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-expenses-trigger"));

        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent(/expense breakdown/i);
        expect(dialog).toHaveTextContent(/€500,000/i);
      });

      it("expenses dialog lists categories sorted by total descending", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({
          expenses: 600000,
          categoryBreakdown: [
            { category: "water", total: 100000, count: 1 },
            { category: "electricity", total: 400000, count: 1 },
            { category: "internet", total: 100000, count: 1 },
          ],
        });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-expenses-trigger"));

        const dialog = screen.getByRole("dialog");
        const items = dialog.querySelectorAll("[data-testid='expense-category-item']");
        expect(items).toHaveLength(3);
        // First item should be the highest total (electricity: 400000)
        expect(items[0]).toHaveTextContent(/Electricity/i);
        expect(items[0]).toHaveTextContent(/€400,000/i);
      });

      it("income dialog closes when dismiss button is clicked", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({ categoryBreakdown: [] });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-income-trigger"));
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    describe("bad cases", () => {
      it("no dialog is visible on initial render without interaction", () => {
        const finance = createFinanceSummarySnapshot({ categoryBreakdown: [] });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      it("opening income then clicking expenses shows expense dialog not income dialog", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({
          income: 3000000,
          expenses: 500000,
          categoryBreakdown: [],
        });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-income-trigger"));
        expect(screen.getByRole("dialog")).toHaveTextContent(/income detail/i);

        await user.keyboard("{Escape}");
        await user.click(screen.getByTestId("finance-expenses-trigger"));

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent(/expense breakdown/i);
        expect(dialog).not.toHaveTextContent(/from rent payments/i);
      });
    });

    describe("edge cases", () => {
      it("expenses dialog shows no-expenses message when categoryBreakdown is empty", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({
          expenses: 0,
          categoryBreakdown: [],
        });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-expenses-trigger"));

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent(/no expenses recorded/i);
        expect(dialog).not.toHaveTextContent(/electricity/i);
      });

      it("expenses dialog only shows categories with total > 0", async () => {
        const user = userEvent.setup();
        const finance = createFinanceSummarySnapshot({
          expenses: 300000,
          categoryBreakdown: [
            { category: "electricity", total: 300000, count: 1 },
            { category: "water", total: 0, count: 0 },
            { category: "internet", total: 0, count: 0 },
          ],
        });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        await user.click(screen.getByTestId("finance-expenses-trigger"));

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent(/electricity/i);
        expect(dialog).not.toHaveTextContent(/water/i);
        expect(dialog).not.toHaveTextContent(/internet/i);
      });

      it("income and expenses trigger buttons are present in the card", () => {
        const finance = createFinanceSummarySnapshot({ categoryBreakdown: [] });

        render(
          <FinanceSummaryCard
            finance={finance}
            formatCurrency={formatCurrency}
          />
        );

        expect(screen.getByTestId("finance-income-trigger")).toBeInTheDocument();
        expect(screen.getByTestId("finance-expenses-trigger")).toBeInTheDocument();
      });
    });
  });
});
