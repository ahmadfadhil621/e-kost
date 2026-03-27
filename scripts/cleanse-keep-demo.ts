/**
 * Cleanses the database but preserves the demo user (demo@ekost.app) and
 * all data belonging to them. All other users and their data are deleted.
 *
 * Run with: npx tsx scripts/cleanse-keep-demo.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@ekost.app";

async function main() {
  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demoUser) {
    console.error(`Demo user (${DEMO_EMAIL}) not found. Aborting.`);
    process.exit(1);
  }

  const demoId = demoUser.id;
  console.log(`Preserving demo user: ${demoUser.name} <${DEMO_EMAIL}> (${demoId})`);

  // Delete in dependency order, excluding anything owned by / related to the demo user.
  const payment = await prisma.payment.deleteMany({
    where: { tenant: { property: { ownerId: { not: demoId } } } },
  });
  const tenantNote = await prisma.tenantNote.deleteMany({
    where: { tenant: { property: { ownerId: { not: demoId } } } },
  });
  const tenant = await prisma.tenant.deleteMany({
    where: { property: { ownerId: { not: demoId } } },
  });
  const expense = await prisma.expense.deleteMany({
    where: { property: { ownerId: { not: demoId } } },
  });
  const room = await prisma.room.deleteMany({
    where: { property: { ownerId: { not: demoId } } },
  });
  const propertyStaff = await prisma.propertyStaff.deleteMany({
    where: { property: { ownerId: { not: demoId } } },
  });
  const property = await prisma.property.deleteMany({
    where: { ownerId: { not: demoId } },
  });
  const session = await prisma.session.deleteMany({
    where: { userId: { not: demoId } },
  });
  const account = await prisma.account.deleteMany({
    where: { userId: { not: demoId } },
  });
  const verification = await prisma.verification.deleteMany();
  const user = await prisma.user.deleteMany({
    where: { id: { not: demoId } },
  });

  console.log("\nDatabase cleansed. Rows deleted:");
  console.log("  payment:", payment.count);
  console.log("  tenant_note:", tenantNote.count);
  console.log("  tenant:", tenant.count);
  console.log("  expense:", expense.count);
  console.log("  room:", room.count);
  console.log("  property_staff:", propertyStaff.count);
  console.log("  property:", property.count);
  console.log("  session:", session.count);
  console.log("  account:", account.count);
  console.log("  verification:", verification.count);
  console.log("  user:", user.count);
  console.log(`\nDemo data for ${DEMO_EMAIL} is intact.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
