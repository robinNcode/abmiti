import { apiDelete, apiGet, apiPost, apiPut } from './apiService';
import { mapAccountFromApi, type Account, type AccountInput } from '../models/account';

export const accountService = {
    async list(): Promise<Account[]> {
        const response = await apiGet<Record<string, unknown>[]>('/accounts');
        return response.data.map(mapAccountFromApi);
    },

    async create(input: AccountInput): Promise<Account> {
        const response = await apiPost<Record<string, unknown>>('/accounts', {
            ...input,
            isActive: input.isActive ?? true,
        });
        return mapAccountFromApi(response.data);
    },

    async update(id: string, input: Partial<AccountInput>): Promise<Account> {
        const response = await apiPut<Record<string, unknown>>(`/accounts/${id}`, input);
        return mapAccountFromApi(response.data);
    },

    async remove(id: string): Promise<void> {
        await apiDelete<null>(`/accounts/${id}`);
    },
};

