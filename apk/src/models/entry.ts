import type { Account } from './account';
import { mapAccountFromApi } from './account';
import type { Category } from './category';
import { mapCategoryFromApi } from './category';
import type { EntryType, PaymentSource } from './common';
import { getId } from './common';

export interface Entry {
    id: string;
    type: EntryType;
    amount: number;
    note: string;
    category: Category;
    source: PaymentSource;
    account?: Account;
    sector?: string;
    date: string;
    parsedFromSms: boolean;
    rawSms?: string;
}

export interface EntryInput {
    type: EntryType;
    amount: number;
    categoryId: string;
    note?: string;
    source?: PaymentSource;
    accountId?: string;
    sector?: string;
    date?: string;
    parsedFromSms?: boolean;
    rawSms?: string;
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

export function mapEntryFromApi(json: Record<string, unknown>): Entry {
    const rawCategory = json.category && typeof json.category === 'object'
        ? json.category as Record<string, unknown>
        : { _id: json.categoryId ?? json.category, name: 'Uncategorized' };
    const rawAccount = json.account && typeof json.account === 'object'
        ? json.account as Record<string, unknown>
        : undefined;

    return {
        id: getId(json),
        type: (json.type as EntryType) ?? 'expense',
        amount: Number(json.amount ?? 0),
        note: String(json.note ?? ''),
        category: mapCategoryFromApi(rawCategory),
        source: (json.source as PaymentSource) ?? 'cash',
        account: rawAccount ? mapAccountFromApi(rawAccount) : undefined,
        sector: json.sector ? String(json.sector) : undefined,
        date: String(json.date ?? new Date().toISOString()),
        parsedFromSms: Boolean(json.parsedFromSms ?? json.parsed_from_sms ?? false),
        rawSms: json.rawSms ? String(json.rawSms) : undefined,
    };
}

