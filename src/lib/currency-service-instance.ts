import { CurrencyService } from "./currency-service";
import { PrismaCurrencyRepository } from "./repositories/prisma/prisma-currency-repository";

const repo = new PrismaCurrencyRepository();
export const currencyService = new CurrencyService(repo);
