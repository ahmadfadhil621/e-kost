import {
  FinanceSummaryService,
  type IMonthlyIncomeSource,
} from "@/lib/finance-summary-service";
import { expenseService } from "@/lib/expense-service-instance";
import { paymentService } from "@/lib/payment-service-instance";

const incomeSource: IMonthlyIncomeSource = {
  getMonthlyIncome: (
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ) => paymentService.getMonthlyIncome(userId, propertyId, year, month),
};

export const financeSummaryService = new FinanceSummaryService(
  incomeSource,
  expenseService
);
