// Traceability: rt-7-fully-paid-badge
// REQ-1 -> it('renders BalanceSection for active tenant with room')
// REQ-2 -> covered by balance-section.test.tsx (paid badge with CheckCircle)
// REQ-3 -> covered by balance-section.test.tsx (unpaid badge with AlertCircle)
// REQ-4 -> covered by balance-status-indicator component (no new icon choices)
// REQ-5 -> covered by balance-section.test.tsx (no room message)
// REQ-6 -> no new i18n keys (nothing to test)
// EDGE  -> it('does NOT render BalanceSection for moved-out tenant')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createTenant } from "@/test/fixtures/tenant";

const PROPERTY_ID = "prop-1";
const TENANT_ID = "tenant-1";

vi.mock("next/navigation", () => ({
  useParams: () => ({ propertyId: PROPERTY_ID, tenantId: TENANT_ID }),
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

// Stub heavy child components to isolate page-level composition concerns
vi.mock("@/components/balance/balance-section", () => ({
  BalanceSection: () => <div data-testid="balance-section">Balance Section</div>,
}));

vi.mock("@/components/balance/rent-missing-banner", () => ({
  RentMissingBanner: () => null,
}));

vi.mock("@/components/payment/tenant-payment-section", () => ({
  TenantPaymentSection: () => <div data-testid="payment-section">Payments</div>,
}));

vi.mock("@/components/notes/notes-section", () => ({
  NotesSection: () => <div data-testid="notes-section">Notes</div>,
}));

import TenantDetailPage from "./page";

const activeTenant = createTenant({
  id: TENANT_ID,
  propertyId: PROPERTY_ID,
  name: "Budi Santoso",
  roomId: "room-1",
  movedOutAt: null,
});

const movedOutTenant = createTenant({
  id: TENANT_ID,
  propertyId: PROPERTY_ID,
  name: "Budi Santoso",
  roomId: null,
  movedOutAt: new Date("2025-01-01"),
});

/** Returns mocked query values in page render order:
 *  1. tenant query
 *  2. available rooms query (disabled by default)
 *  3. payments query
 */
function mockActiveTenant() {
  let callCount = 0;
  mockUseQuery.mockImplementation(() => {
    callCount++;
    if (callCount === 1) { return { data: activeTenant, isLoading: false, error: null }; }
    if (callCount === 2) { return { data: { rooms: [] }, isLoading: false, error: null }; }
    // payments
    return { data: { payments: [], count: 0 }, isLoading: false, error: null };
  });
}

function mockMovedOutTenant() {
  let callCount = 0;
  mockUseQuery.mockImplementation(() => {
    callCount++;
    if (callCount === 1) { return { data: movedOutTenant, isLoading: false, error: null }; }
    return { data: null, isLoading: false, error: null };
  });
}

describe("TenantDetailPage (RT-7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("good cases", () => {
    it("renders BalanceSection for an active tenant", () => {
      mockActiveTenant();
      render(<TenantDetailPage />);

      expect(screen.getByTestId("balance-section")).toBeInTheDocument();
    });

    it("renders tenant name on the detail page", () => {
      mockActiveTenant();
      render(<TenantDetailPage />);

      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not render BalanceSection while tenant data is loading", () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
      render(<TenantDetailPage />);

      expect(screen.queryByTestId("balance-section")).not.toBeInTheDocument();
    });

    it("does not render BalanceSection when tenant is not found", () => {
      mockUseQuery.mockReturnValue({ data: null, isLoading: false, error: null });
      render(<TenantDetailPage />);

      expect(screen.queryByTestId("balance-section")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("does NOT render BalanceSection for a moved-out tenant", () => {
      mockMovedOutTenant();
      render(<TenantDetailPage />);

      expect(screen.queryByTestId("balance-section")).not.toBeInTheDocument();
    });

    it("still renders NotesSection in read-only mode for moved-out tenant", () => {
      mockMovedOutTenant();
      render(<TenantDetailPage />);

      expect(screen.getByTestId("notes-section")).toBeInTheDocument();
    });
  });
});
