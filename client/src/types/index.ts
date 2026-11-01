export type EntryType    = 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
export type PaymentSource = 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  budget: number;
  avatar?: string;
  userType: 'admin' | 'user';
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

export type LineStatus = 'ok' | 'warn' | 'over';

export interface ComputedLineSummary {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  allocationMethod: AllocationMethod;
  allocationValue: number;
  linkedCategoryIds: string[];
  allocated: number;
  spent: number;
  remaining: number;
  pctUsed: number;
  status: LineStatus;
}

export interface BudgetAnalysisResult {
  plannedIncome: number;
  actualIncome: number;
  incomeVariance: number;
  totalAllocated: number;
  unallocated: number;
  totalSpent: number;
  unbudgetedSpent: number;
  netCashFlow: number;
  savingsRate: number | null;
  lines: ComputedLineSummary[];
  unbudgetedEntriesCount: number;
}

export type ForecastWarningCode =
  | 'LINE_OVER_ALLOCATION'
  | 'NET_NEGATIVE'
  | 'PAYABLE_DUE_EXCEEDS_BUFFER';

export interface ForecastWarning {
  code: ForecastWarningCode;
  lineId?: string;
  lineName?: string;
  amount?: number;
  message: string;
}

export interface MonthForecast {
  month: number;
  year: number;
  projectedIncome: number;
  projectedSpend: number;
  committedPayables: number;
  projectedNet: number;
  warnings: ForecastWarning[];
}

export interface ForecastResult {
  insufficientHistory: boolean;
  months: MonthForecast[];
}

export interface PaginatedEntries {
  data: Entry[];
  total: number;
  page: number;
  totalPages: number;
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
  payableId?: string | null;
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

export type PayableKind = 'borrowed_cash' | 'unpaid_expense';
export type PayableStatus = 'open' | 'settled' | 'cancelled';

export interface IPayable {
  _id: string;
  id?: string;
  user: string;
  counterparty: string;
  principal: number;
  paidAmount: number;
  remaining: number;
  kind: PayableKind;
  categoryId?: string | null;
  accountId?: string | null;
  dueDate?: string | null;
  note?: string;
  status: PayableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IPayableWithPayments extends IPayable {
  payments: Entry[];
}

export interface CreatePayableDto {
  counterparty: string;
  principal: number;
  kind: PayableKind;
  categoryId?: string | null;
  accountId?: string | null;
  dueDate?: string | null;
  note?: string;
}

export interface PayPayableDto {
  amount: number;
  date?: string;
  accountId?: string;
  source: PaymentSource;
  note?: string;
}

export interface PatchPayableDto {
  counterparty?: string;
  dueDate?: string | null;
  note?: string;
}

export interface INetPosition {
  liquid: number;
  receivableOpen: number;
  payableOpen: number;
  netPosition: number;
}

export type ReceivableKind = 'lent_cash' | 'unpaid_income';
export type ReceivableStatus = 'open' | 'settled' | 'cancelled';

export interface IReceivable {
  _id: string;
  id?: string;
  user?: string;
  userId?: string;
  counterparty: string;
  principal: number;
  receivedAmount: number;
  remaining: number;
  kind: ReceivableKind;
  categoryId?: string | null;
  accountId?: string | null;
  dueDate?: string | null;
  note?: string;
  status: ReceivableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IReceivableWithPayments extends IReceivable {
  payments: Entry[];
}

export interface CreateReceivableDto {
  counterparty: string;
  principal: number;
  kind: ReceivableKind;
  categoryId?: string | null;
  accountId?: string | null;
  dueDate?: string | null;
  note?: string;
}

export interface CollectReceivableDto {
  amount: number;
  date?: string;
  accountId?: string;
  source?: PaymentSource;
  note?: string;
}

export interface PatchReceivableDto {
  counterparty?: string;
  dueDate?: string | null;
  note?: string;
}

