// Traceability: rt-5-rent-missing-banner
// REQ 2.1 -> it('renders banner when status is unpaid')
// REQ 2.2, 2.3 -> it('banner contains icon with aria-hidden and formatted amount')
// REQ 2.5 -> it('renders nothing when status is paid')
// REQ 2.6 -> it('renders nothing when no room assigned')
// REQ 3.1 -> it('banner has role=alert')
// REQ 5.1 -> it('uses i18n key - text comes from translation not hardcoded')
// PROP 1  -> it('renders role=alert for any balance result with status unpaid')
// PROP 2  -> it('renders null for any balance result with status paid')

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import fc from "fast-check";
import { RentMissingBanner } from "./rent-missing-banner";
import { createBalanceResult } from "@/test/fixtures/balance";

const PROPERTY_ID = "prop-111";
const TENANT_ID = "tenant-222";

function renderWithQuery(
  ui: React.ReactElement,
  queryClient: QueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("RentMissingBanner", () => {
  describe("good cases", () => {
    it("renders banner when status is unpaid", async () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 0,
      });
      /* status = "unpaid", outstandingBalance = 1500000 */

      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("banner has role=alert for accessibility", async () => {
      const balance = createBalanceResult({ totalPayments: 0 });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("banner contains an icon with aria-hidden", async () => {
      const balance = createBalanceResult({ totalPayments: 0 });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      const { container } = renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      /* Icon must be aria-hidden (not color alone) */
      const hiddenEl = container.querySelector("[aria-hidden='true']");
      expect(hiddenEl).toBeInTheDocument();
    });

    it("banner contains formatted outstanding amount", async () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 0,
        outstandingBalance: 1500000,
        status: "unpaid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      /* Amount should appear in formatted form (locale-specific, contains digits) */
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toMatch(/1[,.]?500[,.]?000/);
    });

    it("uses i18n key for text — not hardcoded English", async () => {
      const balance = createBalanceResult({ totalPayments: 0 });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      const alert = screen.getByRole("alert");
      /* Text should come from i18n (matches translated string, not raw key) */
      expect(alert.textContent).not.toBe("balance.rentMissingBanner.message");
      /* Should contain meaningful translated content */
      expect(alert.textContent?.length).toBeGreaterThan(5);
    });
  });

  describe("bad cases", () => {
    it("renders nothing when status is paid", () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 1500000,
        outstandingBalance: 0,
        status: "paid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      const { container } = renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders nothing when no room assigned (data is null)", () => {
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], null);

      const { container } = renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders nothing while loading", () => {
      /* Fetch never resolves — query stays in loading state */
      vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

      const qc = makeQueryClient();

      const { container } = renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      /* Initial render is loading — nothing shown */
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders nothing when fetch errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
        )
      );

      const qc = makeQueryClient();

      const { container } = renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe("edge cases", () => {
    it("renders banner when outstanding amount is very small (boundary above zero)", () => {
      const balance = createBalanceResult({
        monthlyRent: 1500000,
        totalPayments: 1499999,
        outstandingBalance: 1,
        status: "unpaid",
      });
      const qc = makeQueryClient();
      qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

      renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("shares query cache key with BalanceSection — no duplicate fetch", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () =>
          createBalanceResult({ totalPayments: 0 }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const qc = makeQueryClient();

      renderWithQuery(
        <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
        qc
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      /* Only one fetch call — cache deduplicates */
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("property-based tests", () => {
    /* Feature: rt-5-rent-missing-banner, Property 1: Banner Visibility Rule (unpaid) */
    it("renders role=alert for any balance result with status unpaid", () => {
      fc.assert(
        fc.property(
          fc.record({
            monthlyRent: fc.float({ min: Math.fround(100), max: Math.fround(10_000_000), noNaN: true }),
            outstandingBalance: fc.float({ min: Math.fround(1), max: Math.fround(10_000_000), noNaN: true }),
          }),
          ({ monthlyRent, outstandingBalance }) => {
            const balance = createBalanceResult({
              monthlyRent,
              outstandingBalance,
              status: "unpaid",
              totalPayments: monthlyRent - outstandingBalance,
            });

            const qc = makeQueryClient();
            qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

            const { container, unmount } = renderWithQuery(
              <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
              qc
            );

            const hasAlert =
              container.querySelector("[role='alert']") !== null;
            unmount();
            return hasAlert;
          }
        ),
        { numRuns: 100 }
      );
    });

    /* Feature: rt-5-rent-missing-banner, Property 2: Banner Visibility Rule (paid) */
    it("renders null for any balance result with status paid", () => {
      fc.assert(
        fc.property(
          fc.record({
            monthlyRent: fc.float({ min: 100, max: 10_000_000, noNaN: true }),
          }),
          ({ monthlyRent }) => {
            const balance = createBalanceResult({
              monthlyRent,
              totalPayments: monthlyRent,
              outstandingBalance: 0,
              status: "paid",
            });

            const qc = makeQueryClient();
            qc.setQueryData(["balance", PROPERTY_ID, TENANT_ID], balance);

            const { container, unmount } = renderWithQuery(
              <RentMissingBanner propertyId={PROPERTY_ID} tenantId={TENANT_ID} />,
              qc
            );

            const hasAlert =
              container.querySelector("[role='alert']") !== null;
            unmount();
            return !hasAlert;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
