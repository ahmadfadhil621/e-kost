import { ExpenseService } from "@/lib/expense-service";
import { propertyService } from "@/lib/property-service-instance";
import { StubExpenseRepository } from "@/lib/repositories/stub-expense-repository";

const expenseRepo = new StubExpenseRepository();

export const expenseService = new ExpenseService(
  expenseRepo,
  propertyService
);
