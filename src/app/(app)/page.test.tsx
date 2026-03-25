// Traceability: dashboard-overview
// REQ 5 (loading/data freshness) -> it('does not show empty state while properties are loading')
// REQ 5 -> it('shows empty state only after loading confirms no properties')
// REQ 5 -> it('shows loading state while context is still fetching')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/dashboard/OccupancyCard", () => ({
  OccupancyCard: () => <div data-testid="occupancy-card" />,
}));

vi.mock("@/components/dashboard/FinanceSummaryCard", () => ({
  FinanceSummaryCard: () => <div data-testid="finance-card" />,
}));

vi.mock("@/components/dashboard/OutstandingBalancesList", () => ({
  OutstandingBalancesList: () => <div data-testid="outstanding-list" />,
}));

vi.mock("@/components/dashboard/RecentPaymentsList", () => ({
  RecentPaymentsList: () => <div data-testid="recent-payments" />,
}));

vi.mock("@/hooks/use-format-currency", () => ({
  useFormatCurrency: () => (v: number) => `Rp ${v}`,
}));

const mockUsePropertyContext = vi.fn();
vi.mock("@/contexts/property-context", () => ({
  usePropertyContext: () => mockUsePropertyContext(),
}));

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...original,
    useQuery: () => mockUseQuery(),
  };
});

// Suppress fetch errors from the property detail useEffect
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  json: async () => ({}),
});

import DashboardPage from "./page";

const loadingContext = {
  activePropertyId: null,
  properties: [],
  isLoading: true,
  setActivePropertyId: vi.fn(),
  refetch: vi.fn(),
};

const emptyContext = {
  activePropertyId: null,
  properties: [],
  isLoading: false,
  setActivePropertyId: vi.fn(),
  refetch: vi.fn(),
};

const withPropertiesContext = {
  activePropertyId: null,
  properties: [{ id: "p1", name: "Test Property", address: "1 Main St", ownerId: "u1" }],
  isLoading: false,
  setActivePropertyId: vi.fn(),
  refetch: vi.fn(),
};

const idleQuery = {
  data: undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

describe("DashboardPage — empty-state guard", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue(idleQuery);
  });

  describe("good cases", () => {
    it("does not show empty state while context is still loading", () => {
      mockUsePropertyContext.mockReturnValue(loadingContext);
      render(<DashboardPage />);

      expect(screen.queryByText(/no properties yet/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/create your first property/i)).not.toBeInTheDocument();
    });

    it("shows loading state while context is still fetching", () => {
      mockUsePropertyContext.mockReturnValue(loadingContext);
      render(<DashboardPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("does not show empty state when user has properties after load", () => {
      mockUsePropertyContext.mockReturnValue(withPropertiesContext);
      render(<DashboardPage />);

      expect(screen.queryByText(/no properties yet/i)).not.toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows empty state when loading completes and user has no properties", () => {
      mockUsePropertyContext.mockReturnValue(emptyContext);
      render(<DashboardPage />);

      expect(screen.getByText(/no properties yet/i)).toBeInTheDocument();
    });

    it("shows create property link in empty state", () => {
      mockUsePropertyContext.mockReturnValue(emptyContext);
      render(<DashboardPage />);

      expect(screen.getByRole("link", { name: /create property/i })).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("does not show create property link while loading", () => {
      mockUsePropertyContext.mockReturnValue(loadingContext);
      render(<DashboardPage />);

      expect(screen.queryByRole("link", { name: /create property/i })).not.toBeInTheDocument();
    });

    it("does not show empty state text during initial render before API responds", () => {
      // Simulate the exact initial render state: properties=[] + isLoading=true
      mockUsePropertyContext.mockReturnValue(loadingContext);
      render(<DashboardPage />);

      // The full empty-state message must not appear
      expect(
        screen.queryByText(/no properties yet\. create your first property to get started/i)
      ).not.toBeInTheDocument();
    });
  });
});
