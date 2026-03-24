// Traceability: dashboard-overview
// REQ 4.1, 4.2 -> it('displays recent payments with tenant name, amount, date')
// REQ 4.4 -> it('shows empty state when no payments')
// REQ 4.6 -> it('formats amount with formatCurrency')
// REQ 5.4 -> it('shows skeleton when loading')
// Traceability: finance-summary-card-navigation
// REQ 3.1 -> it('payment items are not interactive links')
// REQ 3.2 -> (covered by existing 'View finances link goes to finance page')
// REQ 3.3 -> (covered by existing 'displays recent payments with tenant name, amount, date')

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

    it("View finances link goes to finance page", () => {
      render(
        <RecentPaymentsList
          payments={[]}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      );

      const viewFinances = screen.getByRole("link", { name: /view finances/i });
      expect(viewFinances).toHaveAttribute(
        "href",
        `/properties/${propertyId}/finance`
      );
    });

    it("payment items are not interactive links", () => {
      const payments = [
        createRecentPayment({ paymentId: "p1", tenantName: "Alice", amount: 500000 }),
        createRecentPayment({ paymentId: "p2", tenantName: "Bob", amount: 750000 }),
      ];

      render(
        <RecentPaymentsList
          payments={payments}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      );

      // Only the header "View Finances" link should exist — individual items must not be links
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", `/properties/${propertyId}/finance`);
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
