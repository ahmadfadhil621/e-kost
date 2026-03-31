import { prisma } from "@/lib/prisma";
import type { ICurrencyRepository } from "@/domain/interfaces/currency-repository";
import type { Currency, CreateCurrencyInput } from "@/domain/schemas/currency";

export class PrismaCurrencyRepository implements ICurrencyRepository {
  async list(): Promise<Currency[]> {
    const results = await prisma.currency.findMany({ orderBy: { createdAt: "asc" } });
    return results.map(this.toDomain);
  }

  async create(data: CreateCurrencyInput): Promise<Currency> {
    const result = await prisma.currency.create({ data });
    return this.toDomain(result);
  }

  async findByCode(code: string): Promise<Currency | null> {
    const result = await prisma.currency.findUnique({ where: { code } });
    return result ? this.toDomain(result) : null;
  }

  async findById(id: string): Promise<Currency | null> {
    const result = await prisma.currency.findUnique({ where: { id } });
    return result ? this.toDomain(result) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.currency.delete({ where: { id } });
  }

  private toDomain(record: { id: string; code: string; locale: string; label: string; createdAt: Date }): Currency {
    return {
      id: record.id,
      code: record.code,
      locale: record.locale,
      label: record.label,
      createdAt: record.createdAt,
    };
  }
}
