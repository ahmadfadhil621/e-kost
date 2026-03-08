// Traceability: dashboard-overview
// REQ 4.1, 4.2 -> it('displays recent payments with tenant name, amount, date')
// REQ 4.4 -> it('shows empty state when no payments')
// REQ 4.6 -> it('formats amount with formatCurrency')
// REQ 5.4 -> it('shows skeleton when loading')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentPaymentsList } from "./RecentPaymentsList";
import { createRecentPayment } from "@/test/fixtures/dashboard";

const formatCurrency = (amount: number) => `€${amount.toLocaleString("en-IE")}`;
const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const propertyId = "prop-123";

describe("RecentPaymentsList", () => {
  describe("good cases", () => {
    it("displays recent payments with tenant name, amount, date", () => {
      const date = new Date("2026-03-05");
      const payments = [
        createRecentPayment({
          paymentId: "p1",
          tenantName: "Charlie",
          amount: 1500000,
          date,
        }),
      ];

      render(
        <RecentPaymentsList
          payments={payments}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      );

      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText(/1,500,000/)).toBeInTheDocument();
      expect(screen.getByText(/2026-03-05/)).toBeInTheDocument();
    });

    it("formats amount with formatCurrency", () => {
      const payments = [
        createRecentPayment({ amount: 999, tenantName: "Dana" }),
      ];
      const customFormat = (n: number) => `IDR ${n}`;

      render(
        <RecentPaymentsList
          payments={payments}
          propertyId={propertyId}
          formatCurrency={customFormat}
          formatDate={formatDate}
        />
      );

      expect(screen.getByText(/IDR 999/)).toBeInTheDocument();
    });

    it("View All links to payments page", () => {
      render(
        <RecentPaymentsList
          payments={[]}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      );

      const viewAll = screen.getByRole("link", { name: /view all/i });
      expect(viewAll).toHaveAttribute(
        "href",
        `/properties/${propertyId}/payments`
      );
    });
  });

  describe("bad cases", () => {
    it("does not render payment list when payments array is empty", () => {
      render(
        <RecentPaymentsList
          payments={[]}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      );
      expect(
        screen.getByText(/no payments recorded yet/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(/no payments recorded yet/i);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("shows empty state when no payments", () => {
      render(
        <RecentPaymentsList
          payments={[]}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      );

      expect(
        screen.getByText(/no payments recorded yet/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(/no payments recorded yet/i);
    });

    it("shows skeleton when loading", () => {
      render(
        <RecentPaymentsList
          payments={[]}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          isLoading
        />
      );

      expect(
        screen.getByTestId("recent-payments-skeleton")
      ).toBeInTheDocument();
    });
  });
});
