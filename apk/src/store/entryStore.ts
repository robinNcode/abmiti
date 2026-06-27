import { create } from 'zustand';
import { CacheStorage } from '../core/storage/cacheStorage';
import type { EntryType, PaginatedMeta } from '../models/common';
import type { Entry, EntryInput } from '../models/entry';
import { entryService } from '../services/entryService';

const ENTRY_CACHE_TTL = 2 * 60 * 1000;

interface EntryState {
    entries: Entry[];
    selectedType: EntryType | 'all';
    meta: PaginatedMeta;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    setType: (type: EntryType | 'all') => void;
    loadEntries: (options?: { reset?: boolean; month?: number; year?: number }) => Promise<void>;
    refreshEntries: (month?: number, year?: number) => Promise<void>;
    addEntry: (input: EntryInput) => Promise<Entry>;
    updateEntry: (id: string, input: Partial<EntryInput>) => Promise<Entry>;
    deleteEntry: (id: string) => Promise<void>;
}

const initialMeta: PaginatedMeta = { total: 0, page: 0, limit: 20, totalPages: 1 };

function cacheKey(type: EntryType | 'all', month?: number, year?: number): string {
    return `abmiti_entries_${type}_${month ?? 'any'}_${year ?? 'any'}`;
}

export const useEntryStore = create<EntryState>((set, get) => ({
    entries: [],
    selectedType: 'all',
    meta: initialMeta,
    isLoading: false,
    isRefreshing: false,
    error: null,

    setType: (type) => set({ selectedType: type, entries: [], meta: initialMeta }),

    loadEntries: async (options = {}) => {
        const { selectedType, entries, meta } = get();
        const reset = options.reset ?? false;
        if (!reset && meta.page >= meta.totalPages && meta.page !== 0) return;

        const page = reset ? 1 : meta.page + 1;
        const key = cacheKey(selectedType, options.month, options.year);
        set({ isLoading: true, error: null });

        if (reset) {
            const cached = await CacheStorage.get<{ entries: Entry[]; meta: PaginatedMeta }>(key, ENTRY_CACHE_TTL);
            if (cached) set({ entries: cached.entries, meta: cached.meta });
        }

        try {
            const result = await entryService.list({
                page,
                limit: 20,
                type: selectedType === 'all' ? undefined : selectedType,
                month: options.month,
                year: options.year,
            });
            const nextEntries = reset ? result.data : [...entries, ...result.data];
            set({ entries: nextEntries, meta: result.meta });
            await CacheStorage.set(key, { entries: nextEntries, meta: result.meta });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load entries.' });
        } finally {
            set({ isLoading: false, isRefreshing: false });
        }
    },

    refreshEntries: async (month, year) => {
        set({ isRefreshing: true });
        await get().loadEntries({ reset: true, month, year });
    },

    addEntry: async (input) => {
        const entry = await entryService.create(input);
        set({ entries: [entry, ...get().entries] });
        return entry;
    },

    updateEntry: async (id, input) => {
        const entry = await entryService.update(id, input);
        set({ entries: get().entries.map((item) => item.id === id ? entry : item) });
        return entry;
    },

    deleteEntry: async (id) => {
        const previous = get().entries;
        set({ entries: previous.filter((entry) => entry.id !== id) });
        try {
            await entryService.remove(id);
        } catch (err) {
            set({ entries: previous, error: err instanceof Error ? err.message : 'Failed to delete entry.' });
        }
    },
}));

