import { prisma } from "@/lib/prisma";

async function globalTeardown() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        email: { startsWith: "e2e-" },
      },
    });
    console.log(`[teardown] Deleted ${deleted.count} E2E test user(s).`);
  } catch (err) {
    console.error("[teardown] Failed to delete E2E users:", err);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
