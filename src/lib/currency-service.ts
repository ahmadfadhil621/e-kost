import type { ICurrencyRepository } from "@/domain/interfaces/currency-repository";
import type { Currency, CreateCurrencyInput } from "@/domain/schemas/currency";
import { createCurrencySchema } from "@/domain/schemas/currency";

export class CurrencyExistsError extends Error {
  constructor(message = "Currency already exists") {
    super(message);
    this.name = "CurrencyExistsError";
  }
}

export class CurrencyInUseError extends Error {
  constructor(message = "Currency is in use") {
    super(message);
    this.name = "CurrencyInUseError";
  }
}

export class LastCurrencyError extends Error {
  constructor(message = "Cannot delete the last currency") {
    super(message);
    this.name = "LastCurrencyError";
  }
}

export class CurrencyNotFoundError extends Error {
  constructor(message = "Currency not found") {
    super(message);
    this.name = "CurrencyNotFoundError";
  }
}

export class CurrencyService {
  constructor(private readonly repo: ICurrencyRepository) {}

  async list(): Promise<Currency[]> {
    return this.repo.list();
  }

  async add(data: CreateCurrencyInput): Promise<Currency> {
    const parsed = createCurrencySchema.parse(data);
    const existing = await this.repo.findByCode(parsed.code);
    if (existing) { throw new CurrencyExistsError(); }
    return this.repo.create(parsed);
  }

  async remove(id: string, getPropertyCount: (code: string) => Promise<number>): Promise<void> {
    const currency = await this.repo.findById(id);
    if (!currency) { throw new CurrencyNotFoundError(); }
    const count = await getPropertyCount(currency.code);
    if (count > 0) { throw new CurrencyInUseError(); }
    const all = await this.repo.list();
    if (all.length <= 1) { throw new LastCurrencyError(); }
    await this.repo.delete(id);
  }
}
