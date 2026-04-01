#!/usr/bin/env tsx
/**
 * Seeds the demo account (demo@ekost.app) with realistic EUR demo data.
 *
 * Run with: npx tsx scripts/seed-demo.ts
 *   or add --reset to wipe existing demo data first.
 *
 * Creates:
 *  - 1 owner user  : demo@ekost.app
 *  - 1 property    : "Kost Bunga" (EUR)
 *  - 4 rooms       : single €450, double €650, ensuite €800, single €500
 *  - 5 tenants     : each assigned to a room
 *  - payments      : 3 months history per tenant
 *  - expenses      : 3 months of electricity, water, internet, maintenance
 */

import "dotenv/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@ekost.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@395762@";
const DEMO_NAME = "Demo User";
const PROPERTY_NAME = "Kost Bunga";

// Seed currency: EUR
const CURRENCY = "EUR";

const ROOMS = [
  { roomNumber: "A101", roomType: "single",  monthlyRent: 450 },
  { roomNumber: "A102", roomType: "double",  monthlyRent: 650 },
  { roomNumber: "B101", roomType: "ensuite", monthlyRent: 800 },
  { roomNumber: "B102", roomType: "single",  monthlyRent: 500 },
];

const TENANTS = [
  { name: "Alice Müller",    phone: "+49 151 00000001", email: "alice@example.com",  roomIndex: 0 },
  { name: "Bart Janssen",    phone: "+31 6 00000002",  email: "bart@example.com",   roomIndex: 1 },
  { name: "Camille Dubois",  phone: "+33 6 00000003",  email: "camille@example.com",roomIndex: 2 },
  { name: "Diego Fernandez", phone: "+34 600 000004",  email: "diego@example.com",  roomIndex: 3 },
  { name: "Emma Walsh",      phone: "+353 86 0000005", email: "emma@example.com",   roomIndex: 1 },
];

// 3 months of expense history (most-recent first)
const EXPENSE_MONTHS = 3;
const EXPENSE_TEMPLATES = [
  { category: "ELECTRICITY" as const, amount: 62,  description: "Monthly electricity" },
  { category: "WATER"       as const, amount: 28,  description: "Monthly water" },
  { category: "INTERNET"    as const, amount: 40,  description: "Fibre broadband" },
  { category: "MAINTENANCE" as const, amount: 120, description: "General maintenance" },
];

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  console.log("🌱 Seeding demo data…\n");

  // ── 1. Ensure EUR currency exists ────────────────────────────────────────
  const eurExists = await prisma.currency.findUnique({ where: { code: "EUR" } });
  if (!eurExists) {
    await prisma.currency.create({
      data: { code: "EUR", locale: "en-IE", label: "Euro" },
    });
    console.log("✅ EUR currency created");
  }

  // ── 2. Create or fetch demo user ─────────────────────────────────────────
  let demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demoUser) {
    const res = await auth.api.signUpEmail({
      body: { name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    if (!res?.user) {
      console.error("Failed to create demo user via Better Auth.");
      process.exit(1);
    }
    demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    console.log(`✅ Demo user created: ${DEMO_EMAIL}`);
  } else {
    console.log(`ℹ️  Demo user already exists: ${DEMO_EMAIL}`);
  }

  // ── 3. Create property ────────────────────────────────────────────────────
  let property = await prisma.property.findFirst({
    where: { ownerId: demoUser!.id, name: PROPERTY_NAME, deletedAt: null },
  });
  if (!property) {
    property = await prisma.property.create({
      data: { name: PROPERTY_NAME, address: "12 Flower Street, Dublin", currency: CURRENCY, ownerId: demoUser!.id },
    });
    console.log(`✅ Property created: "${PROPERTY_NAME}" (${CURRENCY})`);
  } else {
    // Ensure currency is set correctly on existing property
    if (property.currency !== CURRENCY) {
      property = await prisma.property.update({ where: { id: property.id }, data: { currency: CURRENCY } });
      console.log(`✅ Property currency updated to ${CURRENCY}`);
    } else {
      console.log(`ℹ️  Property already exists: "${PROPERTY_NAME}"`);
    }
  }

  // ── 4. Create rooms ───────────────────────────────────────────────────────
  const rooms: { id: string }[] = [];
  for (const r of ROOMS) {
    const existing = await prisma.room.findFirst({
      where: { propertyId: property.id, roomNumber: r.roomNumber },
    });
    if (existing) {
      rooms.push(existing);
    } else {
      const room = await prisma.room.create({
        data: { ...r, propertyId: property.id, status: "OCCUPIED" },
      });
      rooms.push(room);
    }
  }
  console.log(`✅ ${ROOMS.length} rooms ready`);

  // ── 5. Create tenants + payments ─────────────────────────────────────────
  let tenantsCreated = 0;
  let paymentsCreated = 0;
  for (const t of TENANTS) {
    const room = rooms[t.roomIndex];
    const monthlyRent = ROOMS[t.roomIndex].monthlyRent;

    let tenant = await prisma.tenant.findFirst({
      where: { propertyId: property.id, name: t.name, movedOutAt: null },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          propertyId: property.id,
          roomId: room.id,
          name: t.name,
          phone: t.phone,
          email: t.email,
          movedInAt: monthsAgo(6),
        },
      });
      tenantsCreated++;
    }

    // Add 3 months of payments if none exist
    const existingPayments = await prisma.payment.count({ where: { tenantId: tenant.id } });
    if (existingPayments === 0) {
      for (let m = 1; m <= 3; m++) {
        await prisma.payment.create({
          data: { tenantId: tenant.id, amount: monthlyRent, paymentDate: monthsAgo(m) },
        });
        paymentsCreated++;
      }
    }
  }
  console.log(`✅ ${tenantsCreated} tenants created, ${paymentsCreated} payments seeded`);

  // ── 6. Create expenses ────────────────────────────────────────────────────
  let expensesCreated = 0;
  for (let m = 1; m <= EXPENSE_MONTHS; m++) {
    for (const e of EXPENSE_TEMPLATES) {
      const date = monthsAgo(m);
      const existing = await prisma.expense.findFirst({
        where: { propertyId: property.id, category: e.category, date },
      });
      if (!existing) {
        await prisma.expense.create({
          data: { propertyId: property.id, ...e, date },
        });
        expensesCreated++;
      }
    }
  }
  console.log(`✅ ${expensesCreated} expenses seeded`);

  console.log(`\n🎉 Demo seeding complete!`);
  console.log(`   Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
