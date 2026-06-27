import { mapCategoryFromApi, type Category } from './category';

export interface MonthlySummary {
    income: number;
    expense: number;
    investment: number;
    budget: number;
    remainingBudget: number;
    amountOverBudget: number;
    budgetUsed: number;
    savings: number;
    savingsRate: number;
    incomeCount: number;
    expenseCount: number;
    investmentCount: number;
    savingsCount: number;
    payableCount: number;
    receivableCount: number;
}

export interface CategoryBreakdown {
    category: Category;
    total: number;
    count: number;
    percentage: number;
}

export interface MonthlyTrend {
    month: number;
    year: number;
    income: number;
    expense: number;
    savings: number;
    investment: number;
}

export interface YearlySummary {
    income: number;
    expense: number;
    investment: number;
    savings: number;
    savingsRate: number;
}

export function mapMonthlySummaryFromApi(json: Record<string, unknown>): MonthlySummary {
    return {
        income: Number(json.income ?? 0),
        expense: Number(json.expense ?? 0),
        investment: Number(json.investment ?? 0),
        budget: Number(json.budget ?? 0),
        remainingBudget: Number(json.remainingBudget ?? 0),
        amountOverBudget: Number(json.amountOverBudget ?? 0),
        budgetUsed: Number(json.budgetUsed ?? 0),
        savings: Number(json.savings ?? 0),
        savingsRate: Number(json.savingsRate ?? 0),
        incomeCount: Number(json.incomeCount ?? 0),
        expenseCount: Number(json.expenseCount ?? 0),
        investmentCount: Number(json.investmentCount ?? 0),
        savingsCount: Number(json.savingsCount ?? 0),
        payableCount: Number(json.payableCount ?? 0),
        receivableCount: Number(json.receivableCount ?? 0),
    };
}

export function emptyMonthlySummary(): MonthlySummary {
    return mapMonthlySummaryFromApi({});
}

export function mapCategoryBreakdownFromApi(json: Record<string, unknown>): CategoryBreakdown {
    const rawCategory = json.category && typeof json.category === 'object'
        ? json.category as Record<string, unknown>
        : {};
    return {
        category: mapCategoryFromApi(rawCategory),
        total: Number(json.total ?? 0),
        count: Number(json.count ?? 0),
        percentage: Number(json.percentage ?? 0),
    };
}

export function mapMonthlyTrendFromApi(json: Record<string, unknown>): MonthlyTrend {
    return {
        month: Number(json.month ?? 1),
        year: Number(json.year ?? new Date().getFullYear()),
        income: Number(json.income ?? 0),
        expense: Number(json.expense ?? 0),
        savings: Number(json.savings ?? 0),
        investment: Number(json.investment ?? 0),
    };
}

