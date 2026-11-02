import { Document, Types } from 'mongoose';

// ── Domain enums ─────────────────────────────────────────────
export type EntryType = 'income' | 'expense' | 'savings' | 'payable' | 'receivable' | 'investment';
export type PaymentSource = 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';

// ── Entity interfaces ────────────────────────────────────────────────
export interface IQuickExpenseItem {
  id: string;
  label: string;
  icon?: string;
  /** Expense category the shortcut logs into. */
  categoryId?: string | null;
  /** Budget line the shortcut was pinned from (optional context). */
  budgetLineId?: string | null;
  /** Suggested amount, copied from the budget sub-item. */
  expectedAmount?: number;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  budget: number;
  avatar?: string;
  google_id?: string;
  userType: 'admin' | 'user';
  /** Dashboard quick-expense shortcuts (max 6), ordered. */
  quickExpenses?: IQuickExpenseItem[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: EntryType;
  isDefault: boolean;
  createdAt: Date;
}

export interface ICategoryInput {
  name: string;
  icon: string;
  color: string;
  type: EntryType;
  isDefault: boolean;
}

export interface IEntry extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: EntryType;
  amount: number;
  note: string;
  category: Types.ObjectId;
  source: PaymentSource;
  account?: Types.ObjectId; // For savings entries
  payable?: Types.ObjectId; // Link to payables (Phase 1)
  receivable?: Types.ObjectId; // Link to receivables
  sector?: string;
  date: Date;
  parsedFromSms: boolean;
  rawSms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAccount extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  type: 'bank' | 'mobile';
  accountNumber?: string;
  bankName?: string;
  provider?: 'bkash' | 'nagad' | 'rocket';
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAccountInput {
  name: string;
  type: 'bank' | 'mobile';
  accountNumber?: string;
  bankName?: string;
  provider?: 'bkash' | 'nagad' | 'rocket';
  balance: number;
  isActive: boolean;
}

export interface IBudget extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  month: number;
  year: number;
  totalIncome: number;
  lines: IBudgetLine[];
  isTemplate: boolean;
  templateName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AllocationMethod = 'percentage' | 'fixed';

export interface IBudgetSubItem {
  _id?: Types.ObjectId | string;
  name: string;
  expectedAmount: number;
  note?: string;
}

export interface IBudgetLine {
  _id: Types.ObjectId | string;
  name: string;
  icon: string;
  color: string;
  allocationMethod: AllocationMethod;
  allocationValue: number;
  linkedCategoryIds: (Types.ObjectId | string)[];
  subItems: IBudgetSubItem[];
  order: number;
  isActive: boolean;
  note?: string;
}

export interface IBudgetInput {
  month: number;
  year: number;
  totalIncome: number;
  lines?: IBudgetLineInput[];
  notes?: string;
  isTemplate?: boolean;
  templateName?: string;
}

export interface IBudgetLineInput {
  name: string;
  icon?: string;
  color?: string;
  allocationMethod: AllocationMethod;
  allocationValue: number;
  linkedCategoryIds?: string[];
  subItems?: IBudgetSubItem[];
  order?: number;
  isActive?: boolean;
  note?: string;
}

export interface IBudgetLineSummary {
  lineId: string;
  name: string;
  icon: string;
  color: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  usedPercent: number;
  status: 'on_track' | 'warning' | 'over_budget' | 'unused';
  subItems: (IBudgetSubItem & { variance: number })[];
}

export interface IBudgetSummary {
  budgetId: string;
  totalIncome: number;
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  allocationPercent: number;
  lines: IBudgetLineSummary[];
}

// ── Repository interfaces (Dependency Inversion) ─────────────
export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface IEntryFilters {
  type?: EntryType;
  month?: number;
  year?: number;
  category?: string;
  source?: PaymentSource;
  startDate?: Date;
  endDate?: Date;
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── SMS Parser interface (Open/Closed principle) ─────────────
export interface ISmsParseResult {
  amount: number | null;
  source: PaymentSource;
  bank?: string;
  date?: string;
  reference?: string;
  accountNumber?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ISmsParser {
  canParse(sms: string): boolean;
  parse(sms: string): ISmsParseResult;
}

// ── API Response types ───────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Auth types ───────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  userType: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Payable domain (Phase 1) ─────────────────────────────────
export type PayableKind   = 'borrowed_cash' | 'unpaid_expense';
export type PayableStatus = 'open' | 'settled' | 'cancelled';

export interface IPayable {
  _id: string;
  userId: string;
  counterparty: string;
  principal: number;
  paidAmount: number;
  remaining: number;          // derived: principal - paidAmount
  kind: PayableKind;
  categoryId?: string | null;
  accountId?: string | null;
  dueDate?: Date | null;
  note?: string;
  status: PayableStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayableInput {
  counterparty: string;
  principal: number;
  kind: PayableKind;
  categoryId?: string;
  accountId?: string;
  dueDate?: string;
  note?: string;
}

export interface IPayablePaymentInput {
  amount: number;
  date?: string;
  accountId?: string;
  source?: string;
  note?: string;
}

export interface INetPosition {
  liquid: number;
  receivableOpen: number;
  payableOpen: number;
  netPosition: number;
}

// ── Receivable domain ────────────────────────────────────────
export type ReceivableKind   = 'lent_cash' | 'unpaid_income';
export type ReceivableStatus = 'open' | 'settled' | 'cancelled';

export interface IReceivable {
  _id: string;
  userId: string;
  counterparty: string;
  principal: number;
  receivedAmount: number;
  remaining: number;          // derived: principal - receivedAmount
  kind: ReceivableKind;
  categoryId?: string | null;
  accountId?: string | null;
  dueDate?: Date | null;
  note?: string;
  status: ReceivableStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceivableInput {
  counterparty: string;
  principal: number;
  kind: ReceivableKind;
  categoryId?: string;
  accountId?: string;
  dueDate?: string;
  note?: string;
}

export interface IReceivableCollectInput {
  amount: number;
  date?: string;
  accountId?: string;
  source?: string;
  note?: string;
}

