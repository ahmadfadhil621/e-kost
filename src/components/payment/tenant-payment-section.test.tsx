// Traceability: payment-recording
// REQ 3.1, 3.2 -> it('displays payment section with amount, date, and timestamp per payment')
// REQ 3.5 -> it('displays payment count')
// PROP 7, 8, 9 -> it('displays payment section with amount, date, and timestamp per payment')
// REQ isMovedOut -> it('renders Record Payment link when tenant is active')
// REQ isMovedOut -> it('does not render Record Payment link when tenant has moved out')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantPaymentSection } from "./tenant-payment-section";
import { createPayment } from "@/test/fixtures/payment";

describe("TenantPaymentSection", () => {
  describe("good cases", () => {
    it("displays payment section with amount, date, and timestamp per payment", () => {
      const payments = [
        createPayment({
          amount: 500000,
          paymentDate: new Date("2024-06-15"),
          createdAt: new Date("2024-06-15T10:00:00Z"),
        }),
      ];
      render(
        <TenantPaymentSection
          tenantId="t1"
          propertyId="prop1"
          payments={payments}
          count={1}
        />
      );

      expect(
        screen.getByRole("heading", {
          name: /payment history|riwayat pembayaran/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
      expect(screen.getByText(/payment date|tanggal pembayaran/i)).toBeInTheDocument();
      expect(screen.getAllByText(/recorded|dicatat/i).length).toBeGreaterThanOrEqual(1);
    });

    it("displays payment count", () => {
      const payments = [
        createPayment({ amount: 100 }),
        createPayment({ amount: 200 }),
      ];
      render(
        <TenantPaymentSection
          tenantId="t1"
          propertyId="prop1"
          payments={payments}
          count={2}
        />
      );

      expect(screen.getByText(/2.*payment|2.*pembayaran/i)).toBeInTheDocument();
    });

    it("displays empty state when no payments", () => {
      render(
        <TenantPaymentSection
          tenantId="t1"
          propertyId="prop1"
          payments={[]}
          count={0}
        />
      );

      expect(
        screen.getByText(/no payments recorded for this tenant|belum ada pembayaran untuk penyewa ini/i)
      ).toBeInTheDocument();
    });

    it("displays loading state when isLoading", () => {
      render(
        <TenantPaymentSection
          tenantId="t1"
          propertyId="prop1"
          payments={[]}
          count={0}
          isLoading
        />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("renders Record Payment link with correct href when tenant is active (isMovedOut=false)", () => {
      render(
        <TenantPaymentSection
          tenantId="tenant1"
          propertyId="prop1"
          payments={[]}
          count={0}
          isMovedOut={false}
        />
      );

      const link = screen.getByRole("link", {
        name: /record payment|catat pembayaran/i,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        "/properties/prop1/payments/new?tenantId=tenant1"
      );
    });

    it("renders Record Payment link when isMovedOut is omitted (defaults to false)", () => {
      render(
        <TenantPaymentSection
          tenantId="tenant1"
          propertyId="prop1"
          payments={[]}
          count={0}
        />
      );

      expect(
        screen.getByRole("link", { name: /record payment|catat pembayaran/i })
      ).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not render payment list when payments is empty", () => {
      const { container } = render(
        <TenantPaymentSection
          tenantId="t1"
          propertyId="prop1"
          payments={[]}
          count={0}
        />
      );

      expect(container.querySelector("ul")).not.toBeInTheDocument();
      expect(
        screen.getByText(/no payments recorded for this tenant|belum ada pembayaran untuk penyewa ini/i)
      ).toBeInTheDocument();
    });

    it("does not render Record Payment link when tenant has moved out (isMovedOut=true)", () => {
      render(
        <TenantPaymentSection
          tenantId="tenant1"
          propertyId="prop1"
          payments={[]}
          count={0}
          isMovedOut={true}
        />
      );

      expect(
        screen.queryByRole("link", { name: /record payment|catat pembayaran/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders section with correct count when count matches payments length", () => {
      const payments = [
        createPayment({ amount: 100 }),
        createPayment({ amount: 200 }),
      ];
      render(
        <TenantPaymentSection
          tenantId="t1"
          propertyId="prop1"
          payments={payments}
          count={2}
        />
      );

      expect(screen.getByText(/2.*payment|2.*pembayaran/i)).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    it("does not render Record Payment link when isMovedOut=true even with payments present", () => {
      const payments = [createPayment({ amount: 500000 })];
      render(
        <TenantPaymentSection
          tenantId="tenant1"
          propertyId="prop1"
          payments={payments}
          count={1}
          isMovedOut={true}
        />
      );

      expect(
        screen.queryByRole("link", { name: /record payment|catat pembayaran/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });
  });
});
