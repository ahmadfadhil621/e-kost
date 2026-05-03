import { prisma } from "@/lib/prisma";

export const userService = {
  async getLanguage(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    if (!user) { throw new Error(`User not found: ${userId}`); }
    return user.language;
  },

  async updateLanguage(userId: string, language: string): Promise<string> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { language },
      select: { language: true },
    });
    return user.language;
  },

  async getTimezone(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    if (!user) { throw new Error(`User not found: ${userId}`); }
    return user.timezone;
  },

  async updateTimezone(userId: string, timezone: string): Promise<string> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { timezone },
      select: { timezone: true },
    });
    return user.timezone!;
  },
};

