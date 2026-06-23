export type EntryType    = 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
export type PaymentSource = 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';

export interface User {
  _id: string;
  name: string;
  email: string;
  budget: number;
}

export interface IBudget {
  _id: string;
  user: string;
  month: number;
  year: number;
  totalIncome: number;
  lines: BudgetLine[];
  isTemplate: boolean;
  templateName?: string;
  notes?: string;
}

export interface IBudgetInput {
  month: number;
  year: number;
  totalIncome: number;
  lines?: BudgetLineInput[];
  notes?: string;
  isTemplate?: boolean;
  templateName?: string;
}

export type AllocationMethod = 'percentage' | 'fixed';

export interface BudgetSubItem {
  _id?: string;
  name: string;
  expectedAmount: number;
  note?: string;
}

export interface BudgetLine {
  _id: string;
  name: string;
  icon: string;
  color: string;
  allocationMethod: AllocationMethod;
  allocationValue: number;
  linkedCategoryIds: string[];
  subItems: BudgetSubItem[];
  order: number;
  isActive: boolean;
  note?: string;
}

export type BudgetLineInput = Omit<BudgetLine, '_id'>;

export interface BudgetLineSummary {
  lineId: string;
  name: string;
  icon: string;
  color: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  usedPercent: number;
  status: 'on_track' | 'warning' | 'over_budget' | 'unused';
  subItems: (BudgetSubItem & { variance: number })[];
}

export interface BudgetSummary {
  budgetId: string;
  totalIncome: number;
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  allocationPercent: number;
  lines: BudgetLineSummary[];
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
  sector?: string;
  date: string;
  parsedFromSms: boolean;
  createdAt: string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  investment: number;
  budget: number;
  remainingBudget: number;
  amountOverBudget: number;
  budgetUsed: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  investmentCount: number;
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
  investment: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  investmentCount: number;
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
  sector?: string;
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
