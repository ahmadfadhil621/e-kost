import type { Currency, CreateCurrencyInput } from "@/domain/schemas/currency";

export interface ICurrencyRepository {
  list(): Promise<Currency[]>;
  create(data: CreateCurrencyInput): Promise<Currency>;
  findByCode(code: string): Promise<Currency | null>;
  findById(id: string): Promise<Currency | null>;
  delete(id: string): Promise<void>;
}
