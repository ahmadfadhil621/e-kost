// Traceability: rt-8-filter-search-lists
// REQ-1  -> it('searching by name substring shows only matching tenant')
// REQ-1  -> it('searching by email shows matching tenant')
// REQ-1  -> it('searching by phone shows matching tenant')
// REQ-2  -> it('"missing rent" filter shows only unpaid tenants')
// REQ-3  -> it('search and filter compose (AND logic)')
// REQ-5  -> it('search with no match shows common.noResults, not tenant.list.empty')
// REQ-5  -> it('no tenants at all shows tenant.list.empty')
// REQ-1  -> it('search is case-insensitive')
// REQ-1  -> it('clearing search restores full list')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useParams: () => ({ propertyId: "prop-1" }),
  useRouter: () => ({ push: vi.fn() }),
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

// Shared tenant and balance data for tests
const ALICE_ID = "tenant-alice";
const BOB_ID = "tenant-bob";
const CAROL_ID = "tenant-carol";

const TENANTS = [
  { id: ALICE_ID, propertyId: "prop-1", name: "Alice Tan", phone: "08111", email: "alice@test.com", roomId: null },
  { id: BOB_ID, propertyId: "prop-1", name: "Bob Lee", phone: "08222", email: "bob@test.com", roomId: null },
  { id: CAROL_ID, propertyId: "prop-1", name: "Carol Wu", phone: "08333", email: "carol@test.com", roomId: null },
];

const BALANCES = [
  { tenantId: ALICE_ID, outstandingBalance: 1500000, status: "unpaid" as const },
  { tenantId: BOB_ID, outstandingBalance: 0, status: "paid" as const },
  { tenantId: CAROL_ID, outstandingBalance: 1500000, status: "unpaid" as const },
];

let mockTenantsData = { tenants: TENANTS, count: TENANTS.length };
let mockBalancesData = { balances: BALANCES };

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...original,
    useQuery: vi.fn(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "tenants") {
        return { data: mockTenantsData, isLoading: false, isError: false };
      }
      if (queryKey[0] === "balances") {
        return { data: mockBalancesData, isLoading: false, isError: false };
      }
      callCount++;
      return { data: undefined, isLoading: false, isError: false };
    }),
  };
});

import TenantListPage from "./page";

function renderPage() {
  return render(<TenantListPage />);
}

describe("TenantListPage — filtering and search", () => {
  beforeEach(() => {
    mockTenantsData = { tenants: TENANTS, count: TENANTS.length };
    mockBalancesData = { balances: BALANCES };
  });

  describe("good cases", () => {
    it("searching by name substring shows only matching tenant", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "alice");

      expect(await screen.findByText("Alice Tan")).toBeInTheDocument();
      expect(screen.queryByText("Bob Lee")).not.toBeInTheDocument();
      expect(screen.queryByText("Carol Wu")).not.toBeInTheDocument();
    });

    it("searching by email shows matching tenant", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "bob@");

      expect(await screen.findByText("Bob Lee")).toBeInTheDocument();
      expect(screen.queryByText("Alice Tan")).not.toBeInTheDocument();
      expect(screen.queryByText("Carol Wu")).not.toBeInTheDocument();
    });

    it("searching by phone shows matching tenant", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "08333");

      expect(await screen.findByText("Carol Wu")).toBeInTheDocument();
      expect(screen.queryByText("Alice Tan")).not.toBeInTheDocument();
      expect(screen.queryByText("Bob Lee")).not.toBeInTheDocument();
    });

    it('"missing rent" filter shows only unpaid tenants', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /missing rent/i }));

      expect(await screen.findByText("Alice Tan")).toBeInTheDocument();
      expect(await screen.findByText("Carol Wu")).toBeInTheDocument();
      expect(screen.queryByText("Bob Lee")).not.toBeInTheDocument();
    });

    it("search and filter compose (AND logic)", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /missing rent/i }));
      await user.type(screen.getByRole("textbox"), "alice");

      expect(await screen.findByText("Alice Tan")).toBeInTheDocument();
      expect(screen.queryByText("Bob Lee")).not.toBeInTheDocument();
      expect(screen.queryByText("Carol Wu")).not.toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("search with no match shows common.noResults, not tenant.list.empty", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "zzz999");

      expect(await screen.findByText(/no results found/i)).toBeInTheDocument();
      expect(screen.queryByText(/no tenants found/i)).not.toBeInTheDocument();
    });

    it("no tenants at all shows tenant.list.empty", () => {
      mockTenantsData = { tenants: [], count: 0 };
      mockBalancesData = { balances: [] };
      renderPage();

      expect(screen.getByText(/no tenants found/i)).toBeInTheDocument();
      expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("search is case-insensitive", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "ALICE");

      expect(await screen.findByText("Alice Tan")).toBeInTheDocument();
      expect(screen.queryByText("Bob Lee")).not.toBeInTheDocument();
    });

    it("clearing search restores full list", async () => {
      const user = userEvent.setup();
      renderPage();

      const input = screen.getByRole("textbox");
      await user.type(input, "alice");

      expect(await screen.findByText("Alice Tan")).toBeInTheDocument();
      expect(screen.queryByText("Bob Lee")).not.toBeInTheDocument();

      await user.clear(input);

      expect(await screen.findByText("Alice Tan")).toBeInTheDocument();
      expect(await screen.findByText("Bob Lee")).toBeInTheDocument();
      expect(await screen.findByText("Carol Wu")).toBeInTheDocument();
    });
  });
});
