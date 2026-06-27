export type EntryType = 'income' | 'expense' | 'savings' | 'investment' | 'payable' | 'receivable';
export type PaymentSource = 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';

export interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
    meta?: Record<string, unknown>;
}

export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const ENTRY_TYPES: EntryType[] = ['income', 'expense', 'investment', 'savings', 'payable', 'receivable'];
export const PAYMENT_SOURCES: PaymentSource[] = ['cash', 'bank', 'bkash', 'nagad', 'card', 'other'];

export function getId(json: Record<string, unknown>): string {
    return String(json.id ?? json._id ?? '');
}

