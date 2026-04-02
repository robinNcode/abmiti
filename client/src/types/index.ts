export type EntryType    = 'income' | 'expense' | 'savings' | 'payable' | 'receivable';
export type PaymentSource = 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: EntryType;
  isDefault: boolean;
}

export interface Entry {
  _id: string;
  type: EntryType;
  amount: number;
  note: string;
  category: Category;
  source: PaymentSource;
  account?: Account;
  date: string;
  parsedFromSms: boolean;
  createdAt: string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  savingsCount: number;
  payableCount: number;
  receivableCount: number;
}

export interface CategoryBreakdown {
  category: { _id: string; name: string; icon: string; color: string };
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  income: number;
  expense: number;
  savings: number;
}

export interface YearlySummary {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  savingsCount: number;
  payableCount: number;
  receivableCount: number;
}

export interface AccountSummary {
  account: { _id: string; name: string; type: string; balance: number };
  totalSavings: number;
  count: number;
}

export interface SmsParseResult {
  amount: number | null;
  source: PaymentSource;
  bank?: string;
  date?: string;
  reference?: string;
  accountNumber?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface CreateEntryDto {
  type: EntryType;
  amount: number;
  note?: string;
  categoryId: string;
  source?: PaymentSource;
  accountId?: string;
  date?: string;
  parsedFromSms?: boolean;
  rawSms?: string;
}

export interface Account {
  _id: string;
  name: string;
  type: 'bank' | 'mobile';
  accountNumber?: string;
  bankName?: string;
  provider?: 'bkash' | 'nagad' | 'rocket';
  balance: number;
  isActive: boolean;
}
