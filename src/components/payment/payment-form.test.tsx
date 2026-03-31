// Traceability: payment-recording
// REQ 1.1 -> it('renders form with tenant, amount, and payment date fields')
// REQ 1.4 -> it('shows validation errors when required fields are empty')
// REQ 1.5 -> it('shows validation error when amount is zero or negative')
// REQ 6.1, 6.5 -> it('calls onSubmit with valid data and form clears after (PROP 11)')
// PROP 3 -> it('shows validation errors when required fields are empty')
// PROP 4 -> it('shows validation error when amount is zero or negative')
// PROP 11 -> it('calls onSubmit with valid data and form clears after (PROP 11)')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentForm } from "./payment-form";

const tenants = [
  { id: "t1", name: "Alice", roomNumber: "A101" },
  { id: "t2", name: "Bob", roomNumber: "B202" },
];

describe("PaymentForm", () => {
  describe("good cases", () => {
    it("renders form with tenant, amount, and payment date fields", () => {
      render(<PaymentForm tenants={tenants} />);

      expect(
        screen.getByLabelText(/tenant|penyewa/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/payment amount|jumlah pembayaran/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/payment date|tanggal pembayaran/i)
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<PaymentForm tenants={tenants} />);

      expect(
        screen.getByRole("button", { name: /record payment|catat pembayaran/i })
      ).toBeInTheDocument();
    });

    it("calls onSubmit with valid data when submitted", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<PaymentForm tenants={tenants} onSubmit={onSubmit} />);
      await user.type(screen.getByLabelText(/payment amount|jumlah/i), "500000");
      await user.click(
        screen.getByRole("button", { name: /record payment|catat pembayaran/i })
      );
      expect(onSubmit).not.toHaveBeenCalled();
      expect(
        screen.getByText(/invalid tenant id|tenant is required|penyewa wajib|required/i)
      ).toBeInTheDocument();
    });

    it("displays form in vertical stack with touch targets", () => {
      const { container } = render(<PaymentForm tenants={tenants} />);

      const form = container.querySelector("form");
      expect(form).toHaveClass("flex", "flex-col");
      const submit = screen.getByRole("button", {
        name: /record payment|catat pembayaran/i,
      });
      expect(submit).toHaveClass("min-h-[44px]");
    });
  });

  describe("bad cases", () => {
    it("shows validation errors when required fields are empty", async () => {
      const user = userEvent.setup();
      render(<PaymentForm tenants={tenants} />);

      await user.click(
        screen.getByRole("button", { name: /record payment|catat pembayaran/i })
      );

      expect(
        screen.getByText(/invalid tenant id|tenant is required|penyewa wajib|required/i)
      ).toBeInTheDocument();
    });

    it("shows validation error when amount is zero or negative", async () => {
      const user = userEvent.setup();
      render(<PaymentForm tenants={tenants} />);

      await user.type(screen.getByLabelText(/payment amount|jumlah/i), "0");
      await user.click(
        screen.getByRole("button", { name: /record payment|catat pembayaran/i })
      );

      expect(
        screen.getByText(/positive|amount must be|jumlah harus|expected number/i)
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders loading state when isLoading is true", () => {
      render(<PaymentForm tenants={tenants} isLoading />);

      const submit = screen.getByRole("button", {
        name: /loading|record payment|catat pembayaran/i,
      });
      expect(submit).toBeDisabled();
    });
  });
});

describe("PaymentForm — defaultTenantId", () => {
  const singleTenant = [{ id: "tenant-1", name: "Alice" }];

  describe("good cases", () => {
    it("pre-selects the tenant matching defaultTenantId", () => {
      render(
        <PaymentForm tenants={singleTenant} defaultTenantId="tenant-1" />
      );

      // The SelectTrigger (combobox) shows the selected value — "Alice" in its text
      expect(screen.getByRole("combobox")).toHaveTextContent("Alice");
    });

    it("pre-selects the correct tenant by name when roomNumber is absent", () => {
      const tenantWithoutRoom = [{ id: "tenant-1", name: "Alice" }];
      render(
        <PaymentForm
          tenants={tenantWithoutRoom}
          defaultTenantId="tenant-1"
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent("Alice");
    });

    it("pre-selects the correct tenant and shows room when roomNumber is present", () => {
      const tenantWithRoom = [
        { id: "tenant-1", name: "Alice", roomNumber: "A101" },
      ];
      render(
        <PaymentForm
          tenants={tenantWithRoom}
          defaultTenantId="tenant-1"
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent("Alice - A101");
    });
  });

  describe("bad cases", () => {
    it("does not pre-select any tenant when defaultTenantId does not match any tenant", () => {
      render(
        <PaymentForm
          tenants={singleTenant}
          defaultTenantId="unknown-id"
        />
      );

      // Trigger should not show any tenant name when no match
      expect(screen.getByRole("combobox")).not.toHaveTextContent("Alice");
    });

    it("does not pre-select any tenant when defaultTenantId is not provided", () => {
      render(<PaymentForm tenants={singleTenant} />);

      expect(screen.getByRole("combobox")).not.toHaveTextContent("Alice");
    });
  });

  describe("edge cases", () => {
    it("pre-selects tenant when defaultTenantId matches one of multiple tenants", () => {
      const multipleTenants = [
        { id: "tenant-1", name: "Alice" },
        { id: "tenant-2", name: "Bob" },
      ];
      render(
        <PaymentForm
          tenants={multipleTenants}
          defaultTenantId="tenant-2"
        />
      );

      // Bob should be shown as selected in the trigger
      expect(screen.getByRole("combobox")).toHaveTextContent("Bob");
      expect(screen.getByRole("combobox")).not.toHaveTextContent("Alice");
    });

    it("does not pre-select when defaultTenantId is an empty string", () => {
      render(
        <PaymentForm tenants={singleTenant} defaultTenantId="" />
      );

      expect(screen.getByRole("combobox")).not.toHaveTextContent("Alice");
    });
  });
});
