import {
  FinanceSummaryService,
  type IMonthlyIncomeSource,
} from "@/lib/finance-summary-service";
import { expenseService } from "@/lib/expense-service-instance";

const stubIncomeSource: IMonthlyIncomeSource = {
  getMonthlyIncome: async () => 0,
};

export const financeSummaryService = new FinanceSummaryService(
  stubIncomeSource,
  expenseService
);
