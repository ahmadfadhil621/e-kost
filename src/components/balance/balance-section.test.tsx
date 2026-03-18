// Traceability: rt-5-rent-missing-banner
// REQ 1.1 -> it('does NOT render outstanding balance row')
// REQ 1.2 -> it('renders monthly rent row')
// REQ 1.2 -> it('renders total payments row')
// PROP 3  -> it('outstanding balance row absent for any valid balance result')
// PROP 4  -> it('monthly rent and total payments rows present for any valid balance result')

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import fc from "fast-check";
import { BalanceSection } from "./balance-section";
import { createBalanceResult } from "@/test/fixtures/balance";

const PROPERTY_ID = "prop-333";
const TENANT_ID = "tenant-444";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithQuery(
  ui: React.ReactElement,
  queryClient: QueryClient = makeQueryClient()
) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("BalanceSection (RT-5 modified)", () => {
  describe("good cases", () => {
    it("renders monthly rent row", () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 500000,
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByText(/monthly rent/i)).toBeInTheDocument();
    });

    it("renders total payments row", () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 500000,
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByText(/total payments/i)).toBeInTheDocument();
    });

    it("does NOT render outstanding balance row", () => {
      // Feature: rt-5-rent-missing-banner, Property 3: Outstanding Balance Row Absent
      // The section heading says "Outstanding Balance" (capital B) — that stays.
      // The removed dt label said "Outstanding balance" (lowercase b) — that must be gone.
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 500000,
        outstandingBalance: 1000000,
        status: "unpaid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      // "Outstanding balance" (lowercase b) is the dt row label — must not be rendered
      expect(screen.queryByText("Outstanding balance")).not.toBeInTheDocument();
    });

    it("status indicator (paid/unpaid badge) is still present", () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 1500000,
        outstandingBalance: 0,
        status: "paid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      // BalanceStatusIndicator renders role="status" with paid/unpaid text
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(/paid/i)).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("renders loading state while fetching", () => {
      vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

      const qc = makeQueryClient();

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("renders error message when fetch fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: "Server error" }),
          })
        )
      );

      const qc = makeQueryClient();

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load balance/i)).toBeInTheDocument();
      });
    });

    it("renders no room message when data is null (tenant has no room)", () => {
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], null);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByText(/no room assigned/i)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders monthly rent and total payments even when both are zero", () => {
      const balance = createBalanceResult({
        monthlyRent: 0,
        totalPayments: 0,
        outstandingBalance: 0,
        status: "paid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByText(/monthly rent/i)).toBeInTheDocument();
      expect(screen.getByText(/total payments/i)).toBeInTheDocument();
      // "Outstanding balance" (lowercase b) is the removed dt row label
      expect(screen.queryByText("Outstanding balance")).not.toBeInTheDocument();
    });

    it("shows unpaid status indicator for unpaid balance", () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 0,
        outstandingBalance: 1500000,
        status: "unpaid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <BalanceSection propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(/unpaid/i)).toBeInTheDocument();
    });
  });

  describe("property-based tests", () => {
    // Feature: rt-5-rent-missing-banner, Property 3: Outstanding Balance Row Absent
    it("outstanding balance row absent for any valid balance result", () => {
      fc.assert(
        fc.property(
          fc.record({
            monthlyRent: fc.float({ min: 0, max: 10_000_000, noNaN: true }),
            totalPayments: fc.float({ min: 0, max: 10_000_000, noNaN: true }),
          }),
          ({ monthlyRent, totalPayments }) => {
            const outstandingBalance = Math.max(0, monthlyRent - totalPayments);
            const status = outstandingBalance <= 0 ? "paid" as const : "unpaid" as const;
            const balance = createBalanceResult({
              monthlyRent,
              totalPayments,
              outstandingBalance,
              status,
            });

            const qc = makeQueryClient();
            qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

            const { container, unmount } = render(
              <QueryClientProvider client={qc}>
                <BalanceSection
                  propertyId={PROPERTY_ID}
                  tenantId={TENANT_ID}
                />
              </QueryClientProvider>
            );

            // Case-sensitive: heading says "Outstanding Balance" (capital B), removed row said "Outstanding balance" (lowercase b)
            const hasOutstandingRow =
              /Outstanding balance/.test(container.textContent ?? "");
            unmount();
            return !hasOutstandingRow;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: rt-5-rent-missing-banner, Property 4: Balance Breakdown Preserved
    it("monthly rent and total payments rows present for any valid balance result", () => {
      fc.assert(
        fc.property(
          fc.record({
            monthlyRent: fc.float({ min: 0, max: 10_000_000, noNaN: true }),
            totalPayments: fc.float({ min: 0, max: 10_000_000, noNaN: true }),
          }),
          ({ monthlyRent, totalPayments }) => {
            const outstandingBalance = Math.max(0, monthlyRent - totalPayments);
            const status = outstandingBalance <= 0 ? "paid" as const : "unpaid" as const;
            const balance = createBalanceResult({
              monthlyRent,
              totalPayments,
              outstandingBalance,
              status,
            });

            const qc = makeQueryClient();
            qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

            const { container, unmount } = render(
              <QueryClientProvider client={qc}>
                <BalanceSection
                  propertyId={PROPERTY_ID}
                  tenantId={TENANT_ID}
                />
              </QueryClientProvider>
            );

            const text = container.textContent ?? "";
            const hasMonthlyRent = /monthly rent/i.test(text);
            const hasTotalPayments = /total payments/i.test(text);
            unmount();
            return hasMonthlyRent && hasTotalPayments;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
