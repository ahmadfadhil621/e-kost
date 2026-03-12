import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return undefined;
  }
  if (url.includes("pgbouncer=true")) {
    return url;
  }
  if (url.includes("pooler.supabase.com")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}pgbouncer=true&connection_limit=1`;
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  const url = buildDatasourceUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
