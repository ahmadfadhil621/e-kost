import { ExpenseService } from "@/lib/expense-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaExpenseRepository } from "@/lib/repositories/prisma/prisma-expense-repository";
import { logActivity } from "@/lib/activity-log-singleton";

const expenseRepo = new PrismaExpenseRepository();

export const expenseService = new ExpenseService(
  expenseRepo,
  propertyService,
  logActivity
);
