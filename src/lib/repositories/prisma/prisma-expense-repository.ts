import type { IExpenseRepository } from "@/domain/interfaces/expense-repository";
import type {
  Expense,
  CategoryBreakdown,
  ExpenseCategory,
} from "@/domain/schemas/expense";
import type { ExpenseCategory as PrismaExpenseCategory } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const DOMAIN_TO_PRISMA: Record<ExpenseCategory, string> = {
  electricity: "ELECTRICITY",
  water: "WATER",
  internet: "INTERNET",
  maintenance: "MAINTENANCE",
  cleaning: "CLEANING",
  supplies: "SUPPLIES",
  tax: "TAX",
  transfer: "TRANSFER",
  other: "OTHER",
};

const PRISMA_TO_DOMAIN: Record<string, ExpenseCategory> = {
  ELECTRICITY: "electricity",
  WATER: "water",
  INTERNET: "internet",
  MAINTENANCE: "maintenance",
  CLEANING: "cleaning",
  SUPPLIES: "supplies",
  TAX: "tax",
  TRANSFER: "transfer",
  OTHER: "other",
};

function toDomainCategory(s: string): ExpenseCategory {
  const cat = PRISMA_TO_DOMAIN[s];
  if (!cat) {
    throw new Error(`Unknown expense category: ${s}`);
  }
  return cat;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function toExpense(e: {
  id: string;
  propertyId: string;
  category: string;
  amount: unknown;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Expense {
  return {
    id: e.id,
    propertyId: e.propertyId,
    category: toDomainCategory(e.category),
    amount: toNumber(e.amount),
    date: e.date,
    description: e.description,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export class PrismaExpenseRepository implements IExpenseRepository {
  async create(data: {
    propertyId: string;
    category: string;
    amount: number;
    date: Date;
    description?: string;
  }): Promise<Expense> {
    const category = DOMAIN_TO_PRISMA[data.category as ExpenseCategory];
    if (!category) {
      throw new Error(`Invalid expense category: ${data.category}`);
    }
    const created = await prisma.expense.create({
      data: {
        propertyId: data.propertyId,
        category: category as PrismaExpenseCategory,
        amount: data.amount,
        date: data.date,
        description: data.description ?? null,
      },
    });
    return toExpense(created);
  }

  async findById(id: string): Promise<Expense | null> {
    const e = await prisma.expense.findUnique({ where: { id } });
    return e ? toExpense(e) : null;
  }

  async findByProperty(
    propertyId: string,
    filters?: { year?: number; month?: number; category?: string }
  ): Promise<Expense[]> {
    const startOfMonth =
      filters?.year !== undefined &&
      filters?.year !== null &&
      filters?.month !== undefined &&
      filters?.month !== null
        ? new Date(Date.UTC(filters.year, filters.month - 1, 1))
        : undefined;
    const endOfMonth =
      startOfMonth
        ? new Date(Date.UTC(filters!.year!, filters!.month!, 0, 23, 59, 59, 999))
        : undefined;

    const where: {
      propertyId: string;
      date?: { gte?: Date; lte?: Date };
      category?: PrismaExpenseCategory;
    } = { propertyId };

    if (startOfMonth && endOfMonth) {
      where.date = { gte: startOfMonth, lte: endOfMonth };
    }
    if (filters?.category) {
      const cat = DOMAIN_TO_PRISMA[filters.category as ExpenseCategory];
      if (cat) {
        where.category = cat as PrismaExpenseCategory;
      }
    }

    const list = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });
    return list.map(toExpense);
  }

  async update(
    id: string,
    data: Partial<{
      category: string;
      amount: number;
      date: Date;
      description: string;
    }>
  ): Promise<Expense> {
    const updateData: {
      category?: PrismaExpenseCategory;
      amount?: number;
      date?: Date;
      description?: string | null;
    } = {};
    if (data.category !== undefined && data.category !== null) {
      const cat = DOMAIN_TO_PRISMA[data.category as ExpenseCategory];
      if (cat) {
        updateData.category = cat as PrismaExpenseCategory;
      }
    }
    if (data.amount !== undefined && data.amount !== null) {
      updateData.amount = data.amount;
    }
    if (data.date !== undefined && data.date !== null) {
      updateData.date = data.date;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
    });
    return toExpense(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.expense.delete({ where: { id } });
  }

  async sumByMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<number> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const result = await prisma.expense.aggregate({
      where: {
        propertyId,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });
    return toNumber(result._sum?.amount);
  }

  async sumByMonthGroupedByCategory(
    propertyId: string,
    year: number,
    month: number
  ): Promise<CategoryBreakdown[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const rows = await prisma.expense.groupBy({
      by: ["category"],
      where: {
        propertyId,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    return rows.map((r) => ({
      category: toDomainCategory(r.category),
      total: toNumber(r._sum?.amount),
      count: r._count.id,
    }));
  }
}
