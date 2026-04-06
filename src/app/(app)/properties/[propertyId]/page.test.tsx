// Traceability: property-detail — issue #24, #26, #104
// REQ-1.1, REQ-1.2, REQ-1.3 -> it('renders property name, address, role, and creation date')
// REQ-1.4 -> it('renders stats: totalRooms, tenants, outstandingCount')
// REQ-1.5 -> it('renders map placeholder')
// REQ-1.6 (issue #26, #104) -> it('shows Settings nav link for owner') — StaffSection moved to settings page
// REQ-1.6 (issue #26, #104) -> it('hides Settings nav link for non-owner')
// REQ-1.7 -> it('renders quick-nav links to sub-sections')
// REQ-4.1 -> it('shows loading state while fetching')
// REQ-4.2 -> it('shows error state when property is not found')
// REQ-4.2 -> it('renders page when dashboard stats fail (graceful degradation)')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createProperty } from "@/test/fixtures/property";

vi.mock("next/navigation", () => ({
  useParams: () => ({ propertyId: "prop-detail-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockUseQuery = vi.fn();
const mockMutate = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...original,
    useQuery: () => mockUseQuery(),
    useMutation: () => ({ mutate: mockMutate, isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/settings/StaffSection", () => ({
  StaffSection: () => null,
}));

import PropertyDetailPage from "./page";

const property = createProperty({
  id: "prop-detail-1",
  name: "Kost Maju Jaya",
  address: "Jl. Kebon Jeruk No. 5",
  ownerId: "user-owner-1",
  createdAt: new Date("2024-01-15"),
});

const dashboardData = {
  occupancy: { totalRooms: 10, occupied: 7, available: 2, underRenovation: 1, occupancyRate: 70 },
  finance: { month: 3, year: 2026, income: 5000000, expenses: 1000000, netIncome: 4000000, categoryBreakdown: [] },
  outstandingBalances: [],
  outstandingCount: 3,
  recentPayments: [],
};

function mockBothReady() {
  let callCount = 0;
  mockUseQuery.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // property query
      return { data: { ...property, role: "owner" }, isLoading: false, isError: false };
    }
    // dashboard query
    return { data: dashboardData, isLoading: false, isError: false };
  });
}

describe("PropertyDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("good cases", () => {
    it("renders property name, address, role, and creation date", () => {
      mockBothReady();
      render(<PropertyDetailPage />);

      expect(screen.getByRole("heading", { name: /Kost Maju Jaya/i })).toBeInTheDocument();
      expect(screen.getByText(/Jl. Kebon Jeruk No. 5/i)).toBeInTheDocument();
      // role badge
      expect(screen.getByText(/owner/i)).toBeInTheDocument();
      // creation date — Jan 15 2024
      expect(screen.getByText(/2024/i)).toBeInTheDocument();
    });

    it("renders stats: totalRooms, tenants, outstandingCount", () => {
      mockBothReady();
      render(<PropertyDetailPage />);

      expect(screen.getByText("10")).toBeInTheDocument(); // totalRooms
      expect(screen.getByText("7")).toBeInTheDocument();  // occupied tenants
      expect(screen.getByText("3")).toBeInTheDocument();  // outstandingCount
    });

    it("renders quick-nav links to sub-sections", () => {
      mockBothReady();
      render(<PropertyDetailPage />);

      expect(screen.getByRole("link", { name: /rooms/i })).toHaveAttribute(
        "href",
        "/properties/prop-detail-1/rooms"
      );
      expect(screen.getByRole("link", { name: /tenants/i })).toHaveAttribute(
        "href",
        "/properties/prop-detail-1/tenants"
      );
      expect(screen.getByRole("link", { name: /payments/i })).toHaveAttribute(
        "href",
        "/properties/prop-detail-1/payments"
      );
      expect(screen.getByRole("link", { name: /finance/i })).toHaveAttribute(
        "href",
        "/properties/prop-detail-1/finance"
      );
    });

    it("renders map placeholder", () => {
      mockBothReady();
      render(<PropertyDetailPage />);

      expect(screen.getByText(/map coming soon/i)).toBeInTheDocument();
    });

    it("shows Settings nav link for owner", () => {
      mockBothReady(); // returns role: "owner"
      render(<PropertyDetailPage />);

      expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute(
        "href",
        "/properties/prop-detail-1/settings"
      );
    });

    it("hides Settings nav link for non-owner", () => {
      let callCount = 0;
      mockUseQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: { ...property, role: "staff" }, isLoading: false, isError: false };
        }
        return { data: dashboardData, isLoading: false, isError: false };
      });
      render(<PropertyDetailPage />);

      expect(screen.queryByRole("link", { name: /settings/i })).not.toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows error state when property fetch fails", () => {
      let callCount = 0;
      mockUseQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: undefined, isLoading: false, isError: true };
        }
        return { data: undefined, isLoading: false, isError: false };
      });
      render(<PropertyDetailPage />);

      // Should not crash and should show some error indication
      expect(screen.queryByRole("heading", { name: /Kost Maju Jaya/i })).not.toBeInTheDocument();
      expect(screen.getByText(/not found|error|unavailable/i)).toBeInTheDocument();
    });

    it("renders page gracefully when dashboard stats fail", () => {
      let callCount = 0;
      mockUseQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: { ...property, role: "staff" }, isLoading: false, isError: false };
        }
        // dashboard fails
        return { data: undefined, isLoading: false, isError: true };
      });
      render(<PropertyDetailPage />);

      // Property info still shows
      expect(screen.getByRole("heading", { name: /Kost Maju Jaya/i })).toBeInTheDocument();
      // Stats show fallback dashes/zeros instead of crashing
      expect(screen.queryByText(/undefined|NaN/)).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("shows loading state while property is fetching", () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      render(<PropertyDetailPage />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("shows staff role badge correctly", () => {
      let callCount = 0;
      mockUseQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: { ...property, role: "staff" }, isLoading: false, isError: false };
        }
        return { data: dashboardData, isLoading: false, isError: false };
      });
      render(<PropertyDetailPage />);

      // Role badge shows "Staff" and the staff section heading also shows "Staff"
      const staffElements = screen.getAllByText(/^staff$/i);
      expect(staffElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders with all-zero stats without crashing", () => {
      const emptyStats = {
        occupancy: { totalRooms: 0, occupied: 0, available: 0, underRenovation: 0, occupancyRate: 0 },
        finance: { month: 3, year: 2026, income: 0, expenses: 0, netIncome: 0, categoryBreakdown: [] },
        outstandingBalances: [],
        outstandingCount: 0,
        recentPayments: [],
      };
      let callCount = 0;
      mockUseQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: { ...property, role: "owner" }, isLoading: false, isError: false };
        }
        return { data: emptyStats, isLoading: false, isError: false };
      });
      render(<PropertyDetailPage />);

      // Three zeros in stats
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });
  });
});
