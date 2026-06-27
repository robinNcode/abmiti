import { create } from 'zustand';
import { categoryService } from '../services/categoryService';
import type { EntryType } from '../models/common';
import type { Category, CategoryInput } from '../models/category';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    loadCategories: (type?: EntryType) => Promise<void>;
    addCategory: (input: CategoryInput) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,

    loadCategories: async (type) => {
        set({ isLoading: true, error: null });
        try {
            const categories = await categoryService.list(type);
            set({ categories });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load categories.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addCategory: async (input) => {
        const category = await categoryService.create(input);
        set({ categories: [category, ...get().categories] });
    },
}));

