export type EntryType    = 'income' | 'expense';
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
  date?: string;
  parsedFromSms?: boolean;
  rawSms?: string;
}
