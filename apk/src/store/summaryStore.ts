import { create } from 'zustand';
import { CacheStorage } from '../core/storage/cacheStorage';
import { emptyMonthlySummary, type CategoryBreakdown, type MonthlySummary, type MonthlyTrend } from '../models/monthlySummary';
import { summaryService } from '../services/summaryService';

const SUMMARY_CACHE_TTL = 5 * 60 * 1000;

interface SummaryState {
    month: number;
    year: number;
    monthly: MonthlySummary;
    categories: CategoryBreakdown[];
    trend: MonthlyTrend[];
    isLoading: boolean;
    isStale: boolean;
    error: string | null;
    setMonth: (month: number, year: number) => void;
    loadSummary: () => Promise<void>;
    loadTrend: (year?: number) => Promise<void>;
}

function summaryKey(month: number, year: number): string {
    return `abmiti_summary_${month}_${year}`;
}

export const useSummaryStore = create<SummaryState>((set, get) => {
    const now = new Date();

    return {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthly: emptyMonthlySummary(),
        categories: [],
        trend: [],
        isLoading: false,
        isStale: false,
        error: null,

        setMonth: (month, year) => set({ month, year }),

        loadSummary: async () => {
            const { month, year } = get();
            const key = summaryKey(month, year);
            set({ isLoading: true, error: null });

            const cached = await CacheStorage.get<{ monthly: MonthlySummary; categories: CategoryBreakdown[] }>(key, SUMMARY_CACHE_TTL);
            if (cached) set({ monthly: cached.monthly, categories: cached.categories, isStale: true });

            try {
                const [monthly, categories] = await Promise.all([
                    summaryService.monthly(month, year),
                    summaryService.categories(month, year),
                ]);
                set({ monthly, categories, isStale: false });
                await CacheStorage.set(key, { monthly, categories });
            } catch (err) {
                set({ error: err instanceof Error ? err.message : 'Failed to load summary.' });
            } finally {
                set({ isLoading: false });
            }
        },

        loadTrend: async (year = get().year) => {
            try {
                const trend = await summaryService.yearlyTrend(year);
                set({ trend });
            } catch (err) {
                set({ error: err instanceof Error ? err.message : 'Failed to load analytics.' });
            }
        },
    };
});

