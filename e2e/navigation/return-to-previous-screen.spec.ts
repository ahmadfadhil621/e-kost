// Traceability: [UX] — Return to previous screen after mutating actions (issue #102)
// TC-1 -> test('new room creation redirects to newly created room detail')
// TC-2 -> test('new room cancel returns to previous screen')
// TC-3 -> test('edit room success returns to previous screen')
// TC-4 -> test('edit room cancel returns to previous screen')
// TC-5 -> test('delete room returns to previous screen')
// TC-6 -> test('archive room returns to previous screen')
// TC-7 -> test('edit tenant success returns to previous screen')
// TC-8 -> test('edit tenant cancel returns to previous screen')
// TC-9 -> test('move out from unusual source returns to that source')
// TC-10 -> test('new expense creation returns to previous screen')
// TC-11 -> test('cancel new expense returns to previous screen')
// TC-12 -> test('edit expense success returns to previous screen')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId } from "../helpers/tenant-room-basics";
import { goToExpenseList } from "../helpers/finance-expense-tracking";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ---------------------------------------------------------------------------
// Shared API helpers
// ---------------------------------------------------------------------------

async function createRoom(
  request: APIRequestContext,
  propertyId: string,
  suffix = ""
): Promise<{ roomId: string; roomNumber: string }> {
  const roomNumber = "Nav-" + Date.now() + suffix;
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber, roomType: "single", monthlyRent: 1000000 },
  });
  if (!res.ok()) { throw new Error(`Failed to create room: ${await res.text()}`); }
  const body = await res.json();
  return { roomId: body.id as string, roomNumber };
}

async function createTenant(
  request: APIRequestContext,
  propertyId: string
): Promise<string> {
  const ts = Date.now();
  const res = await request.post(`/api/properties/${propertyId}/tenants`, {
    data: {
      name: "Nav Tenant " + ts,
      phone: "08100000001",
      email: `nav-${ts}@test.com`,
    },
  });
  if (!res.ok()) { throw new Error(`Failed to create tenant: ${await res.text()}`); }
  return (await res.json()).id as string;
}

async function assignRoom(
  request: APIRequestContext,
  propertyId: string,
  tenantId: string,
  roomId: string
): Promise<void> {
  const res = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
    { data: { roomId } }
  );
  if (!res.ok()) { throw new Error(`Failed to assign room: ${await res.text()}`); }
}

async function createExpense(
  request: APIRequestContext,
  propertyId: string
): Promise<string> {
  const res = await request.post(`/api/properties/${propertyId}/expenses`, {
    data: { category: "maintenance", amount: 100000, date: "2026-01-15" },
  });
  if (!res.ok()) { throw new Error(`Failed to create expense: ${await res.text()}`); }
  return (await res.json()).id as string;
}

// ---------------------------------------------------------------------------
// Room creation
// ---------------------------------------------------------------------------

test.describe("new room creation", () => {
  test("TC-1: new room creation redirects to newly created room detail", async ({
    page,
  }) => {
    test.info().setTimeout(60000);
    const propertyId = getPropertyId();

    await page.goto(`/properties/${propertyId}/rooms/new`, {
      waitUntil: "networkidle",
    });
    await page
      .getByLabel(/room number/i)
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    const roomNumber = "TC1-" + Date.now();
    await stableFill(page, () => page.getByLabel(/room number/i), roomNumber);
    await stableFill(page, () => page.getByLabel(/room type/i), "Standard");
    await stableFill(page, () => page.getByLabel(/monthly rent/i), "1000000");

    await page.getByRole("button", { name: /create room|save/i }).click();

    // Should land on room detail — URL ends with /rooms/<uuid> (not /rooms or /rooms/new)
    await page.waitForURL(
      (url) =>
        /\/rooms\/[^/]+$/.test(url.pathname) && url.pathname !== `/properties/${propertyId}/rooms/new`,
      { timeout: 20000 }
    );
    expect(page.url()).not.toMatch(/\/rooms\/new/);
    expect(page.url()).not.toMatch(/\/rooms$/);
  });

  test("TC-2: new room cancel returns to previous screen", async ({
    page,
  }) => {
    test.info().setTimeout(60000);
    const propertyId = getPropertyId();

    // Build history: rooms list → new room page
    await page.goto(`/properties/${propertyId}/rooms`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("link", { name: /add room/i })
      .or(page.getByRole("button", { name: /add room/i }))
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("link", { name: /add room/i })
      .or(page.getByRole("button", { name: /add room/i }))
      .first()
      .click();

    await page.waitForURL(/\/rooms\/new/, { timeout: 10000 });

    await page
      .getByRole("button", { name: /cancel|batal/i })
      .first()
      .click();

    // Should go back to rooms list
    await page.waitForURL(/\/properties\/[^/]+\/rooms$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/rooms$/);
  });
});

// ---------------------------------------------------------------------------
// Room editing
// ---------------------------------------------------------------------------

test.describe("edit room", () => {
  test("TC-3: edit room success returns to room detail", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(90000);
    const propertyId = getPropertyId();
    const { roomId } = await createRoom(request, propertyId, "-tc3");

    // Build history: rooms list → room detail → edit room
    await page.goto(`/properties/${propertyId}/rooms`, {
      waitUntil: "domcontentloaded",
    });
    await page.goto(`/properties/${propertyId}/rooms/${roomId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("link", { name: /edit/i })
      .first()
      .click();
    await page.waitForURL(/\/rooms\/[^/]+\/edit/, { timeout: 10000 });

    // Submit with any change
    await page
      .getByRole("button", { name: /save|update|submit/i })
      .first()
      .click();

    // Should go back to room detail
    await page.waitForURL(/\/rooms\/[^/]+$/, { timeout: 15000 });
    expect(page.url()).toMatch(new RegExp(`/rooms/${roomId}$`));
  });

  test("TC-4: edit room cancel returns to room detail", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(60000);
    const propertyId = getPropertyId();
    const { roomId } = await createRoom(request, propertyId, "-tc4");

    // Build history: rooms list → room detail → edit room
    await page.goto(`/properties/${propertyId}/rooms`, {
      waitUntil: "domcontentloaded",
    });
    await page.goto(`/properties/${propertyId}/rooms/${roomId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("link", { name: /edit/i })
      .first()
      .click();
    await page.waitForURL(/\/rooms\/[^/]+\/edit/, { timeout: 10000 });

    await page
      .getByRole("button", { name: /cancel|batal/i })
      .first()
      .click();

    // Should go back to room detail
    await page.waitForURL(/\/rooms\/[^/]+$/, { timeout: 10000 });
    expect(page.url()).toMatch(new RegExp(`/rooms/${roomId}$`));
  });
});

// ---------------------------------------------------------------------------
// Room delete / archive
// ---------------------------------------------------------------------------

test.describe("delete and archive room", () => {
  test("TC-5: delete room returns to rooms list", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(90000);
    const propertyId = getPropertyId();
    const { roomId } = await createRoom(request, propertyId, "-tc5");

    // Build history: rooms list → room detail
    await page.goto(`/properties/${propertyId}/rooms`, {
      waitUntil: "domcontentloaded",
    });
    await page.goto(`/properties/${propertyId}/rooms/${roomId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("button", { name: /delete room|hapus kamar/i })
      .first()
      .click();

    // Confirm dialog
    await page
      .getByRole("button", { name: /^delete$|^hapus$|confirm/i })
      .last()
      .click();

    // Should go back to rooms list
    await page.waitForURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/rooms$/);
  });

  test("TC-6: archive room returns to rooms list", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(90000);
    const propertyId = getPropertyId();
    const { roomId } = await createRoom(request, propertyId, "-tc6");

    // Build history: rooms list → room detail
    await page.goto(`/properties/${propertyId}/rooms`, {
      waitUntil: "domcontentloaded",
    });
    await page.goto(`/properties/${propertyId}/rooms/${roomId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("button", { name: /archive room|arsipkan kamar/i })
      .first()
      .click();

    // Confirm dialog
    await page
      .getByRole("button", { name: /^archive$|^arsipkan$|confirm/i })
      .last()
      .click();

    // Should go back to rooms list
    await page.waitForURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/rooms$/);
  });
});

// ---------------------------------------------------------------------------
// Tenant editing
// ---------------------------------------------------------------------------

test.describe("edit tenant", () => {
  test("TC-7: edit tenant success returns to tenant detail", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(90000);
    const propertyId = getPropertyId();
    const tenantId = await createTenant(request, propertyId);

    // Build history: tenants list → tenant detail → edit tenant
    await page.goto(`/properties/${propertyId}/tenants`, {
      waitUntil: "domcontentloaded",
    });
    await page.goto(`/properties/${propertyId}/tenants/${tenantId}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("button", { name: /edit|assign room|move out/i })
      .or(page.getByText(/tenant details|detail penyewa/i))
      .first()
      .waitFor({ state: "visible", timeout: 20000 });

    await page
      .getByRole("link", { name: /edit/i })
      .first()
      .click();
    await page.waitForURL(/\/tenants\/[^/]+\/edit/, { timeout: 10000 });
    await page
      .locator("#tenant-name")
      .waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("button", { name: /save|update|submit/i })
      .first()
      .click();

    // Should go back to tenant detail
    await page.waitForURL(/\/tenants\/[^/]+$/, { timeout: 15000 });
    expect(page.url()).toMatch(new RegExp(`/tenants/${tenantId}$`));
  });

  test("TC-8: edit tenant cancel returns to tenant detail", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(60000);
    const propertyId = getPropertyId();
    const tenantId = await createTenant(request, propertyId);

    // Build history: tenants list → tenant detail → edit tenant
    await page.goto(`/properties/${propertyId}/tenants`, {
      waitUntil: "domcontentloaded",
    });
    await page.goto(`/properties/${propertyId}/tenants/${tenantId}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("button", { name: /edit|assign room|move out/i })
      .or(page.getByText(/tenant details|detail penyewa/i))
      .first()
      .waitFor({ state: "visible", timeout: 20000 });

    await page
      .getByRole("link", { name: /edit/i })
      .first()
      .click();
    await page.waitForURL(/\/tenants\/[^/]+\/edit/, { timeout: 10000 });

    await page
      .getByRole("button", { name: /cancel|batal/i })
      .first()
      .click();

    // Should go back to tenant detail
    await page.waitForURL(/\/tenants\/[^/]+$/, { timeout: 10000 });
    expect(page.url()).toMatch(new RegExp(`/tenants/${tenantId}$`));
  });
});

// ---------------------------------------------------------------------------
// Move out from unusual source
// ---------------------------------------------------------------------------

test.describe("move out", () => {
  test("TC-9: move out from room detail returns to room detail (not tenant list)", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(120000);
    const propertyId = getPropertyId();

    // Create a room with an assigned tenant
    const { roomId } = await createRoom(request, propertyId, "-tc9");
    const tenantId = await createTenant(request, propertyId);
    await assignRoom(request, propertyId, tenantId, roomId);

    // Build history: room detail (with tenant link) → tenant detail → move out
    // Navigate to room detail first (this is the "unusual source")
    await page.goto(`/properties/${propertyId}/rooms/${roomId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });

    // Click the tenant name link to go to tenant detail
    await page
      .getByRole("link", { name: /nav tenant/i })
      .first()
      .click();
    await page.waitForURL(/\/tenants\/[^/]+$/, { timeout: 10000 });
    await page
      .getByRole("button", { name: /move out|pindah keluar/i })
      .first()
      .waitFor({ state: "visible", timeout: 20000 });

    // Trigger move out
    await page
      .getByRole("button", { name: /move out|pindah keluar/i })
      .first()
      .click();

    // Confirm dialog
    await page
      .getByRole("button", { name: /confirm|yes|ya|move out|pindah/i })
      .last()
      .click();

    // Should go back to room detail (not /tenants list)
    await page.waitForURL(/\/rooms\/[^/]+$/, { timeout: 15000 });
    expect(page.url()).toMatch(new RegExp(`/rooms/${roomId}$`));
  });
});

// ---------------------------------------------------------------------------
// Expense forms
// ---------------------------------------------------------------------------

test.describe("expense forms", () => {
  test("TC-10: new expense creation returns to expense list", async ({
    page,
  }) => {
    test.info().setTimeout(90000);

    // Build history: expense list → new expense
    await goToExpenseList(page);
    await page
      .getByRole("link", { name: /add expense|tambah pengeluaran/i })
      .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
      .first()
      .click({ timeout: 15000 });

    await page.waitForURL(/\/expenses\/new/, { timeout: 10000 });
    await page
      .locator("#expense-amount")
      .waitFor({ state: "visible", timeout: 15000 });

    // Fill required fields — category (Select) then amount
    await page.locator("#expense-category").click();
    await page.getByRole("option", { name: /maintenance/i }).first().click();
    await page.locator("#expense-amount").fill("50000");

    await page
      .getByRole("button", { name: /save|create|submit/i })
      .first()
      .click();

    // Should go back to expense list
    await page.waitForURL(/\/finance\/expenses$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/finance\/expenses$/);
  });

  test("TC-11: cancel new expense returns to expense list", async ({
    page,
  }) => {
    test.info().setTimeout(60000);

    // Build history: expense list → new expense
    await goToExpenseList(page);
    await page
      .getByRole("link", { name: /add expense|tambah pengeluaran/i })
      .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
      .first()
      .click({ timeout: 15000 });

    await page.waitForURL(/\/expenses\/new/, { timeout: 10000 });

    await page
      .getByRole("button", { name: /cancel|batal/i })
      .first()
      .click();

    // Should go back to expense list
    await page.waitForURL(/\/finance\/expenses$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/finance\/expenses$/);
  });

  test("TC-12: edit expense success returns to expense list", async ({
    page,
    request,
  }) => {
    test.info().setTimeout(90000);
    const propertyId = getPropertyId();
    const expenseId = await createExpense(request, propertyId);

    // Build history: expense list → edit expense
    await goToExpenseList(page);
    await page.goto(
      `/properties/${propertyId}/finance/expenses/${expenseId}/edit`,
      { waitUntil: "domcontentloaded" }
    );
    await page
      .locator("#expense-amount")
      .waitFor({ state: "visible", timeout: 15000 });

    await page
      .getByRole("button", { name: /save|update|submit/i })
      .first()
      .click();

    // Should go back to expense list
    await page.waitForURL(/\/finance\/expenses$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/finance\/expenses$/);
  });
});
