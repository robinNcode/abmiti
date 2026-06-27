import { create } from 'zustand';
import { accountService } from '../services/accountService';
import type { Account, AccountInput } from '../models/account';

interface AccountState {
    accounts: Account[];
    isLoading: boolean;
    error: string | null;
    loadAccounts: () => Promise<void>;
    addAccount: (input: AccountInput) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
    accounts: [],
    isLoading: false,
    error: null,

    loadAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
            const accounts = await accountService.list();
            set({ accounts });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load accounts.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addAccount: async (input) => {
        const account = await accountService.create(input);
        set({ accounts: [account, ...get().accounts] });
    },
}));

