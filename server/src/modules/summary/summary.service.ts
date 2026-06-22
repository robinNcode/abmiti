import { container } from '../../container';

interface MonthlySummary {
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

interface CategoryBreakdown {
  category: { _id: string; name: string; icon: string; color: string };
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
  investment?: number;
}

interface YearlySummary {
  income: number;
  expense: number;
  investment: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  investmentCount: number;
  savingsCount: number;
  payableCount: number;
  receivableCount: number;
}

interface AccountSummary {
  account: { _id: string; name: string; type: string; balance: number };
  totalSavings: number;
  count: number;
}

export const summaryService = {
  async monthly(userId: string, month: number, year: number, budget = 0): Promise<MonthlySummary> {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const result = await container.summaryRepo.getMonthlySummary(userId, start, end);

    const incomeRow     = result.find((r) => r._id === 'income');
    const expenseRow    = result.find((r) => r._id === 'expense');
    const investmentRow = result.find((r) => r._id === 'investment');
    const savingsRow    = result.find((r) => r._id === 'savings');
    const receivableRow = result.find((r) => r._id === 'receivable');
    const payableRow    = result.find((r) => r._id === 'payable');
    const income  = incomeRow?.total  ?? 0;
    const expense = (expenseRow?.total ?? 0) + (investmentRow?.total ?? 0);
    const investment = investmentRow?.total ?? 0;
    const savings = income - expense;
    const remainingBudget = Math.max(0, budget - expense);

    return {
      income,
      expense,
      investment,
      budget,
      remainingBudget,
      amountOverBudget: expense > budget && budget > 0 ? expense - budget : 0,
      budgetUsed: budget > 0 ? parseFloat(((expense / budget) * 100).toFixed(1)) : 0,
      savings,
      savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
      incomeCount:     incomeRow?.count     ?? 0,
      expenseCount:    (expenseRow?.count ?? 0) + (investmentRow?.count ?? 0),
      investmentCount: investmentRow?.count ?? 0,
      savingsCount:    savingsRow?.count    ?? 0,
      receivableCount: receivableRow?.count ?? 0,
      payableCount:    payableRow?.count    ?? 0,
    };
  },

  async categoryBreakdown(userId: string, month: number, year: number): Promise<CategoryBreakdown[]> {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const rows = await container.summaryRepo.getCategoryBreakdown(userId, start, end);

    const grandTotal = rows.reduce((s, r) => s + r.total, 0);

    return rows.map((r) => ({
      category: {
        _id:   String(r.category._id),
        name:  r.category.name,
        icon:  r.category.icon,
        color: r.category.color,
      },
      total:      r.total,
      count:      r.count,
      percentage: grandTotal > 0 ? parseFloat(((r.total / grandTotal) * 100).toFixed(1)) : 0,
    }));
  },

  async yearlyTrend(userId: string, year: number): Promise<MonthlyTrend[]> {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);

    const rows = await container.summaryRepo.getYearlyTrend(userId, start, end);

    const map: Record<number, MonthlyTrend> = {};
    for (let m = 1; m <= 12; m++) {
      map[m] = { month: m, year, income: 0, expense: 0, savings: 0, investment: 0 };
    }

    rows.forEach((r) => {
      const m = r._id.month as number;
      if (r._id.type === 'income')      map[m].income      = r.total;
      if (r._id.type === 'expense')     map[m].expense     += r.total;
      if (r._id.type === 'investment')  map[m].expense     += r.total;
      if (r._id.type === 'investment')  map[m].investment  = r.total;
    });

    Object.values(map).forEach((m) => { m.savings = m.income - m.expense; });

    return Object.values(map);
  },

  async yearly(userId: string, year: number): Promise<YearlySummary> {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);

    const result = await container.summaryRepo.getMonthlySummary(userId, start, end);

    const incomeRow     = result.find((r) => r._id === 'income');
    const expenseRow    = result.find((r) => r._id === 'expense');
    const investmentRow = result.find((r) => r._id === 'investment');
    const savingsRow    = result.find((r) => r._id === 'savings');
    const receivableRow = result.find((r) => r._id === 'receivable');
    const payableRow    = result.find((r) => r._id === 'payable');
    const income  = incomeRow?.total  ?? 0;
    const investment = investmentRow?.total ?? 0;
    const expense = (expenseRow?.total ?? 0) + investment;
    const savings = income - expense;

    return {
      income,
      expense,
      investment,
      savings,
      savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
      incomeCount:     incomeRow?.count     ?? 0,
      expenseCount:    (expenseRow?.count ?? 0) + (investmentRow?.count ?? 0),
      investmentCount: investmentRow?.count ?? 0,
      savingsCount:    savingsRow?.count    ?? 0,
      receivableCount: receivableRow?.count ?? 0,
      payableCount:    payableRow?.count ?? 0,
    };
  },

  async accountSummaries(userId: string, year?: number): Promise<AccountSummary[]> {
    const rows = await container.summaryRepo.getAccountSummaries(userId, year);

    return rows.map((r) => ({
      account: {
        _id:    String(r.account._id),
        name:   r.account.name,
        type:   r.account.type,
        balance: r.account.balance,
      },
      totalSavings: r.totalSavings,
      count:        r.count,
    }));
  },

  async budgetWarnings(userId: string) {
    const budgets = await container.budgetRepo.findMany(userId);
    const warnings = [];
    for (const b of budgets) {
      const summary = await this.monthly(userId, b.month, b.year, b.amount);
      if (summary.amountOverBudget > 0) {
        warnings.push({
          month: b.month,
          year: b.year,
          budget: b.amount,
          expense: summary.expense,
          overBudget: summary.amountOverBudget,
        });
      }
    }
    return warnings;
  },
};

