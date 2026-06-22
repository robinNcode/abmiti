import {
  IUser, ICategory, ICategoryInput, IEntry, IAccount, IAccountInput, IBudget, IBudgetInput,
  IEntryFilters, IPaginationOptions, IPaginatedResult, EntryType,
} from './index';

// ── User Repository ─────────────────────────────────────────
export interface IUserRepository {
  findByEmail(email: string, includePassword?: boolean): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  create(data: { name: string; email: string; password: string }): Promise<IUser>;
  updateBudget(id: string, budget: number): Promise<IUser | null>;
}

// ── Category Repository ──────────────────────────────────────
export interface ICategoryRepository {
  findByUser(userId: string, type?: EntryType): Promise<ICategory[]>;
  findById(id: string): Promise<ICategory | null>;
  findByUserAndId(userId: string, id: string): Promise<ICategory | null>;
  findByNameAndType(userId: string, name: string, type: EntryType): Promise<ICategory | null>;
  insertMany(docs: (ICategoryInput & { user: string })[]): Promise<void>;
  create(data: ICategoryInput & { user: string }): Promise<ICategory>;
  update(id: string, data: Partial<{ name: string; icon: string; color: string }>): Promise<ICategory>;
  remove(id: string): Promise<void>;
}

// ── Entry Repository ─────────────────────────────────────────
export interface IEntryRepository {
  findMany(
    userId: string,
    filters: IEntryFilters,
    pagination: IPaginationOptions,
  ): Promise<IPaginatedResult<IEntry>>;
  findById(id: string, userId: string): Promise<IEntry | null>;
  create(data: Partial<IEntry>): Promise<IEntry>;
  update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null>;
  remove(id: string, userId: string): Promise<boolean>;
}

// ── Account Repository ────────────────────────────────────────
export interface IAccountRepository {
  create(data: IAccountInput & { user: string }): Promise<IAccount>;
  findByUser(userId: string): Promise<IAccount[]>;
  findById(userId: string, accountId: string): Promise<IAccount | null>;
  update(userId: string, accountId: string, data: Partial<IAccountInput>): Promise<IAccount | null>;
  softDelete(userId: string, accountId: string): Promise<boolean>;
  updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null>;
}

// ── Summary Repository ────────────────────────────────────────
export interface IMonthlySummaryRow {
  _id: string; // type
  total: number;
  count: number;
}

export interface ICategoryBreakdownRow {
  _id: string; // category id
  total: number;
  count: number;
  category: { _id: string; name: string; icon: string; color: string };
}

export interface IMonthlyTrendRow {
  _id: { month: number; type: string };
  total: number;
}

export interface IAccountSummaryRow {
  _id: string; // account id
  totalSavings: number;
  count: number;
  account: { _id: string; name: string; type: string; balance: number };
}

export interface ISummaryRepository {
  getMonthlySummary(userId: string, start: Date, end: Date): Promise<IMonthlySummaryRow[]>;
  getCategoryBreakdown(userId: string, start: Date, end: Date): Promise<ICategoryBreakdownRow[]>;
  getYearlyTrend(userId: string, start: Date, end: Date): Promise<IMonthlyTrendRow[]>;
  getAccountSummaries(userId: string, year?: number): Promise<IAccountSummaryRow[]>;
}

// ── Budget Repository ─────────────────────────────────────────
export interface IBudgetRepository {
  upsert(userId: string, data: IBudgetInput): Promise<IBudget>;
  findByMonth(userId: string, month: number, year: number): Promise<IBudget | null>;
  findMany(userId: string): Promise<IBudget[]>;
  remove(id: string, userId: string): Promise<boolean>;
}
