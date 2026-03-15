// Traceability: dashboard-overview
// REQ 3.1, 3.2 -> it('displays list of tenants with name, room number, balance')
// REQ 3.3 -> it('sorts by balance descending (handled by API/service)')
// REQ 3.4 -> it('shows all paid message when no outstanding')
// REQ 3.5 -> it('shows View All link when totalCount > 5')
// REQ 3.7 -> it('uses color and text for balance (not color alone)')
// REQ 5.4 -> it('shows skeleton when loading')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OutstandingBalancesList } from "./OutstandingBalancesList";
import { createOutstandingBalance } from "@/test/fixtures/dashboard";

const formatCurrency = (amount: number) => `€${amount.toLocaleString("en-IE")}`;
const propertyId = "prop-123";

describe("OutstandingBalancesList", () => {
  describe("good cases", () => {
    it("displays list of tenants with name, room number, balance", () => {
      const balances = [
        createOutstandingBalance({
          tenantId: "t1",
          tenantName: "Alice",
          roomNumber: "A1",
          balance: 500000,
        }),
      ];

      render(
        <OutstandingBalancesList
          balances={balances}
          totalCount={1}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText(/€500,000/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Alice/ })).toHaveAttribute(
        "href",
        `/properties/${propertyId}/tenants/t1`
      );
    });

    it("uses color and text for balance (not color alone)", () => {
      const balances = [
        createOutstandingBalance({
          tenantName: "Bob",
          roomNumber: "B2",
          balance: 100000,
        }),
      ];

      render(
        <OutstandingBalancesList
          balances={balances}
          totalCount={1}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByText("B2")).toBeInTheDocument();
      const balanceEl = screen.getByText(/€100,000/);
      expect(balanceEl).toHaveClass("text-balance-outstanding");
      expect(balanceEl).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows View all tenants link and status when totalCount is zero", () => {
      render(
        <OutstandingBalancesList
          balances={[]}
          totalCount={0}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
        />
      );
      expect(screen.getByRole("link", { name: /view all tenants/i })).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", `/properties/${propertyId}/tenants`);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("shows all paid message when no outstanding", () => {
      render(
        <OutstandingBalancesList
          balances={[]}
          totalCount={0}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
        />
      );

      expect(
        screen.getByText(/all tenants are up to date/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(/all tenants are up to date/i);
    });

    it("shows View All link when totalCount > 5", () => {
      const balances = [
        createOutstandingBalance({ tenantName: "A" }),
        createOutstandingBalance({ tenantName: "B" }),
        createOutstandingBalance({ tenantName: "C" }),
        createOutstandingBalance({ tenantName: "D" }),
        createOutstandingBalance({ tenantName: "E" }),
      ];

      render(
        <OutstandingBalancesList
          balances={balances}
          totalCount={7}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
        />
      );

      const viewAll = screen.getByRole("link", {
        name: /view all tenants/i,
      });
      expect(viewAll).toBeInTheDocument();
      expect(viewAll).toHaveAttribute(
        "href",
        `/properties/${propertyId}/tenants`
      );
    });

    it("shows View all tenants link when totalCount <= 5", () => {
      render(
        <OutstandingBalancesList
          balances={[]}
          totalCount={3}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
        />
      );

      expect(screen.getByRole("link", { name: /view all tenants/i })).toBeInTheDocument();
    });

    it("shows skeleton when loading", () => {
      render(
        <OutstandingBalancesList
          balances={[]}
          totalCount={0}
          propertyId={propertyId}
          formatCurrency={formatCurrency}
          isLoading
        />
      );

      expect(
        screen.getByTestId("outstanding-balances-skeleton")
      ).toBeInTheDocument();
    });
  });
});
