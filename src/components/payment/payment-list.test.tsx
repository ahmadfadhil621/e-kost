// Traceability: payment-recording
// REQ 2.2 -> it('displays each payment with tenant name, amount, date, and timestamp')
// REQ 2.5 -> it('displays list in single-column with clear separation')
// PROP 5 -> it('displays each payment with tenant name, amount, date, and timestamp')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentList } from "./payment-list";
import { createPayment } from "@/test/fixtures/payment";

describe("PaymentList", () => {
  describe("good cases", () => {
    it("displays each payment with tenant name, amount, date, and timestamp", () => {
      const payments = [
        createPayment({
          tenantName: "Alice",
          amount: 500000,
          paymentDate: new Date("2024-06-15"),
          createdAt: new Date("2024-06-15T10:00:00Z"),
        }),
      ];
      render(<PaymentList payments={payments} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
      expect(screen.getByText(/payment date|tanggal pembayaran/i)).toBeInTheDocument();
      expect(screen.getByText(/recorded|dicatat/i)).toBeInTheDocument();
    });

    it("displays empty state when no payments", () => {
      render(<PaymentList payments={[]} />);

      expect(
        screen.getByText(/no payments recorded|belum ada pembayaran/i)
      ).toBeInTheDocument();
    });

    it("displays loading state when isLoading", () => {
      render(<PaymentList payments={[]} isLoading />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("renders nothing for payment list when empty and not loading", () => {
      const { container } = render(<PaymentList payments={[]} />);

      expect(container.querySelector("ul")).not.toBeInTheDocument();
      expect(
        screen.getByText(/no payments recorded|belum ada pembayaran/i)
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("displays multiple payments in list", () => {
      const payments = [
        createPayment({ tenantName: "Alice", amount: 500000 }),
        createPayment({ tenantName: "Bob", amount: 600000 }),
      ];
      render(<PaymentList payments={payments} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });
});
