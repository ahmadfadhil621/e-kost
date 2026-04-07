/**
 * One-off backfill: create room_assignment records for any tenant that has
 * roomId != null but has no existing assignment record.
 *
 * Run once:
 *   npx tsx scripts/backfill-room-assignments.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Find all tenants with a room that have no assignment record yet
  const tenants = await prisma.tenant.findMany({
    where: {
      roomId: { not: null },
      room_assignment: { none: {} },
    },
    select: {
      id: true,
      roomId: true,
      movedInAt: true,
      movedOutAt: true,
      createdAt: true,
    },
  });

  if (tenants.length === 0) {
    console.log("No tenants need backfilling — all up to date.");
    return;
  }

  console.log(`Backfilling ${tenants.length} tenant(s)...`);

  for (const tenant of tenants) {
    const startDate = tenant.movedInAt ?? tenant.createdAt;
    const endDate = tenant.movedOutAt ?? null;

    await prisma.room_assignment.create({
      data: {
        tenantId: tenant.id,
        roomId: tenant.roomId!,
        startDate,
        endDate,
      },
    });

    console.log(
      `  ✓ tenant ${tenant.id}: startDate=${startDate.toISOString()}, endDate=${endDate?.toISOString() ?? "null (active)"}`
    );
  }

  console.log("Backfill complete.");
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
