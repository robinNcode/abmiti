interface MonthlySummary {
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
    incomeCount: number;
    expenseCount: number;
}
interface CategoryBreakdown {
    category: {
        _id: string;
        name: string;
        icon: string;
        color: string;
    };
    total: number;
    count: number;
    percentage: number;
}
interface MonthlyTrend {
    month: number;
    year: number;
    income: number;
    expense: number;
    savings: number;
}
export declare const summaryService: {
    monthly(userId: string, month: number, year: number): Promise<MonthlySummary>;
    categoryBreakdown(userId: string, month: number, year: number): Promise<CategoryBreakdown[]>;
    yearlyTrend(userId: string, year: number): Promise<MonthlyTrend[]>;
};
export {};
//# sourceMappingURL=summary.service.d.ts.map