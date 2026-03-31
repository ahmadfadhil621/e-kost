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

  async getCurrency(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });
    if (!user) { throw new Error(`User not found: ${userId}`); }
    return user.currency;
  },

  async updateCurrency(userId: string, currency: string): Promise<string> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { currency },
      select: { currency: true },
    });
    return user.currency;
  },
};
