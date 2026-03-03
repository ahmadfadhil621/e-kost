import { prisma } from "@/lib/prisma";

export async function findUserByEmail(
  email: string
): Promise<{ id: string; name: string; email: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  return user;
}
