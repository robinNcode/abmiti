import { apiDelete, apiGet, apiPatch, apiPost } from './apiService';
import type { EntryType } from '../models/common';
import { mapCategoryFromApi, type Category, type CategoryInput } from '../models/category';

export const categoryService = {
    async list(type?: EntryType): Promise<Category[]> {
        const response = await apiGet<Record<string, unknown>[]>('/categories', type ? { type } : undefined);
        return response.data.map(mapCategoryFromApi);
    },

    async create(input: CategoryInput): Promise<Category> {
        const response = await apiPost<Record<string, unknown>>('/categories', {
            ...input,
            isDefault: input.isDefault ?? false,
        });
        return mapCategoryFromApi(response.data);
    },

    async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
        const response = await apiPatch<Record<string, unknown>>(`/categories/${id}`, input);
        return mapCategoryFromApi(response.data);
    },

    async remove(id: string): Promise<void> {
        await apiDelete<null>(`/categories/${id}`);
    },
};

