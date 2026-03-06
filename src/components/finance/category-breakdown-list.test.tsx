// Traceability: finance-expense-tracking
// REQ 6.3 -> it('renders categories with amount and percentage')
// REQ 6.4 -> it('renders categories in descending order by total')
// REQ 6.5 -> it('shows empty state when no categories')
// REQ 9.3 -> it('displays category and amount in list format')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryBreakdownList } from "./category-breakdown-list";

const formatCurrency = (amount: number) => `€${amount.toLocaleString("en-IE")}`;

describe("CategoryBreakdownList", () => {
  describe("good cases", () => {
    it("renders categories with amount and percentage", () => {
      render(
        <CategoryBreakdownList
          categories={[
            { category: "electricity", total: 500000, count: 2 },
            { category: "water", total: 200000, count: 1 },
          ]}
          totalExpenses={700000}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText(/Electricity/)).toBeInTheDocument();
      expect(screen.getByText(/Water/)).toBeInTheDocument();
      expect(screen.getByText("€500,000")).toBeInTheDocument();
      expect(screen.getByText("€200,000")).toBeInTheDocument();
      expect(screen.getByText(/71%/)).toBeInTheDocument();
      expect(screen.getByText(/29%/)).toBeInTheDocument();
    });

    it("renders categories in order provided (parent supplies sorted by total descending)", () => {
      render(
        <CategoryBreakdownList
          categories={[
            { category: "electricity", total: 400000, count: 1 },
            { category: "water", total: 100000, count: 1 },
          ]}
          totalExpenses={500000}
          formatCurrency={formatCurrency}
        />
      );

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(2);
      expect(items[0]).toHaveTextContent("Electricity");
      expect(items[1]).toHaveTextContent("Water");
    });

    it("displays category and amount in list format", () => {
      render(
        <CategoryBreakdownList
          categories={[{ category: "internet", total: 150000, count: 1 }]}
          totalExpenses={150000}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByRole("list", { name: /expense breakdown/i })).toBeInTheDocument();
      expect(screen.getByText(/Internet/)).toBeInTheDocument();
      expect(screen.getByText("€150,000")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("shows empty state when no categories", () => {
      render(
        <CategoryBreakdownList
          categories={[]}
          totalExpenses={0}
          formatCurrency={formatCurrency}
        />
      );

      expect(
        screen.getByText(/No expenses recorded for this period/i)
      ).toBeInTheDocument();
    });

    it("handles single category with 100%", () => {
      render(
        <CategoryBreakdownList
          categories={[{ category: "other", total: 1000, count: 1 }]}
          totalExpenses={1000}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not render list when categories empty and totalExpenses is zero", () => {
      render(
        <CategoryBreakdownList
          categories={[]}
          totalExpenses={0}
          formatCurrency={formatCurrency}
        />
      );
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(
        screen.getByText(/No expenses recorded for this period/i)
      ).toBeInTheDocument();
    });
  });
});
