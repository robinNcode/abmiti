import { apiGet } from './apiService';
import {
    mapCategoryBreakdownFromApi,
    mapMonthlySummaryFromApi,
    mapMonthlyTrendFromApi,
    type CategoryBreakdown,
    type MonthlySummary,
    type MonthlyTrend,
    type YearlySummary,
} from '../models/monthlySummary';

export const summaryService = {
    async monthly(month: number, year: number, budget?: number): Promise<MonthlySummary> {
        const response = await apiGet<Record<string, unknown>>('/summary/monthly', { month, year, budget });
        return mapMonthlySummaryFromApi(response.data);
    },

    async categories(month: number, year: number): Promise<CategoryBreakdown[]> {
        const response = await apiGet<Record<string, unknown>[]>('/summary/categories', { month, year });
        return response.data.map(mapCategoryBreakdownFromApi);
    },

    async yearlyTrend(year: number): Promise<MonthlyTrend[]> {
        const response = await apiGet<Record<string, unknown>[]>('/summary/yearly', { year });
        return response.data.map(mapMonthlyTrendFromApi);
    },

    async yearlySummary(year: number): Promise<YearlySummary> {
        const response = await apiGet<YearlySummary>('/summary/yearly-summary', { year });
        return response.data;
    },
};

