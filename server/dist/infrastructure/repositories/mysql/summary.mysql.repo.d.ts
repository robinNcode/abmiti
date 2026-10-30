import { ISummaryRepository, IMonthlySummaryRow, ICategoryBreakdownRow, IMonthlyTrendRow, IAccountSummaryRow, ICategoryReportRow } from '../../../shared/types/repositories';
export declare class MySQLSummaryRepository implements ISummaryRepository {
    private get pool();
    getMonthlySummary(userId: string, start: Date, end: Date): Promise<IMonthlySummaryRow[]>;
    getCategoryBreakdown(userId: string, start: Date, end: Date): Promise<ICategoryBreakdownRow[]>;
    getYearlyTrend(userId: string, start: Date, end: Date): Promise<IMonthlyTrendRow[]>;
    getAccountSummaries(userId: string, year?: number): Promise<IAccountSummaryRow[]>;
    getCategoryReport(userId: string, filters: {
        startDate: Date;
        endDate: Date;
        categoryIds?: string[];
        minAmount?: number;
        maxAmount?: number;
        type?: 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
    }): Promise<ICategoryReportRow[]>;
    getTransactionStatement(userId: string, filters: {
        startDate: Date;
        endDate: Date;
        categoryIds?: string[];
        type?: 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
    }): Promise<any[]>;
}
//# sourceMappingURL=summary.mysql.repo.d.ts.map