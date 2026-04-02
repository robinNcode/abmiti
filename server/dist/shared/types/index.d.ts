import { Document, Types } from 'mongoose';
export type EntryType = 'income' | 'expense';
export type PaymentSource = 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';
export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
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
export interface IEntry extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    type: EntryType;
    amount: number;
    note: string;
    category: Types.ObjectId;
    source: PaymentSource;
    date: Date;
    parsedFromSms: boolean;
    rawSms?: string;
    createdAt: Date;
    updatedAt: Date;
}
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
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
//# sourceMappingURL=index.d.ts.map