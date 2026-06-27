import { getId } from './common';

export type AccountType = 'bank' | 'mobile';
export type MobileProvider = 'bkash' | 'nagad' | 'rocket';

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    accountNumber?: string;
    bankName?: string;
    provider?: MobileProvider;
    balance: number;
    isActive: boolean;
}

export interface AccountInput {
    name: string;
    type: AccountType;
    accountNumber?: string;
    bankName?: string;
    provider?: MobileProvider;
    balance: number;
    isActive?: boolean;
}

export function mapAccountFromApi(json: Record<string, unknown>): Account {
    return {
        id: getId(json),
        name: String(json.name ?? 'Account'),
        type: (json.type as AccountType) ?? 'bank',
        accountNumber: json.accountNumber ? String(json.accountNumber) : undefined,
        bankName: json.bankName ? String(json.bankName) : undefined,
        provider: json.provider as MobileProvider | undefined,
        balance: Number(json.balance ?? 0),
        isActive: Boolean(json.isActive ?? json.is_active ?? true),
    };
}

