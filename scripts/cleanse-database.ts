/**
 * Cleanses the database: deletes all rows from every table.
 * Tables and schema are left intact. Run with: npx tsx scripts/cleanse-database.ts
 *
 * Loads .env from project root so DATABASE_URL is available.
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Delete in dependency order (children first) to satisfy foreign keys.
  const payment = await prisma.payment.deleteMany();
  const tenantNote = await prisma.tenantNote.deleteMany();
  const tenant = await prisma.tenant.deleteMany();
  const room = await prisma.room.deleteMany();
  const expense = await prisma.expense.deleteMany();
  const propertyStaff = await prisma.propertyStaff.deleteMany();
  const property = await prisma.property.deleteMany();
  const session = await prisma.session.deleteMany();
  const account = await prisma.account.deleteMany();
  const verification = await prisma.verification.deleteMany();
  const user = await prisma.user.deleteMany();

  console.log("Database cleansed. Rows deleted:");
  console.log("  payment:", payment.count);
  console.log("  tenant_note:", tenantNote.count);
  console.log("  tenant:", tenant.count);
  console.log("  room:", room.count);
  console.log("  expense:", expense.count);
  console.log("  property_staff:", propertyStaff.count);
  console.log("  property:", property.count);
  console.log("  session:", session.count);
  console.log("  account:", account.count);
  console.log("  verification:", verification.count);
  console.log("  user:", user.count);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
