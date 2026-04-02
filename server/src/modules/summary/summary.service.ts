import { Types } from 'mongoose';
import { Entry } from '../entry/entry.model';

interface MonthlySummary {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
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
}

interface YearlySummary {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
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
  async monthly(userId: string, month: number, year: number): Promise<MonthlySummary> {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const result = await Entry.aggregate([
      { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const incomeRow  = result.find((r) => r._id === 'income');
    const expenseRow = result.find((r) => r._id === 'expense');
    const savingsRow = result.find((r) => r._id === 'savings');
    const receivableRow = result.find((r) => r._id === 'receivable');
    const payableRow = result.find((r) => r._id === 'payable');
    const income  = incomeRow?.total  ?? 0;
    const expense = expenseRow?.total ?? 0;
    const savings = income - expense;

    return {
      income,
      expense,
      savings,
      savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
      incomeCount:  incomeRow?.count  ?? 0,
      expenseCount: expenseRow?.count ?? 0,
      savingsCount: savingsRow?.count ?? 0,
      receivableCount: receivableRow?.count ?? 0,
      payableCount: payableRow?.count ?? 0,
    };
  },

  async categoryBreakdown(userId: string, month: number, year: number): Promise<CategoryBreakdown[]> {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const rows = await Entry.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $sort: { total: -1 } },
    ]);

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

    const rows = await Entry.aggregate([
      { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id:   { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const map: Record<number, MonthlyTrend> = {};
    for (let m = 1; m <= 12; m++) {
      map[m] = { month: m, year, income: 0, expense: 0, savings: 0 };
    }

    rows.forEach((r) => {
      const m = r._id.month as number;
      if (r._id.type === 'income')  map[m].income  = r.total;
      if (r._id.type === 'expense') map[m].expense = r.total;
    });

    Object.values(map).forEach((m) => { m.savings = m.income - m.expense; });

    return Object.values(map);
  },

  async yearly(userId: string, year: number): Promise<YearlySummary> {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);

    const result = await Entry.aggregate([
      { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const incomeRow  = result.find((r) => r._id === 'income');
    const expenseRow = result.find((r) => r._id === 'expense');
    const savingsRow = result.find((r) => r._id === 'savings');
    const receivableRow = result.find((r) => r._id === 'receivable');
    const payableRow = result.find((r) => r._id === 'payable');
    const income  = incomeRow?.total  ?? 0;
    const expense = expenseRow?.total ?? 0;
    const savings = income - expense;

    return {
      income,
      expense,
      savings,
      savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
      incomeCount:  incomeRow?.count  ?? 0,
      expenseCount: expenseRow?.count ?? 0,
      savingsCount: savingsRow?.count ?? 0,
      receivableCount: receivableRow?.count ?? 0,
      payableCount: payableRow?.count ?? 0,
    };
  },

  async accountSummaries(userId: string, year?: number): Promise<AccountSummary[]> {
    const match: any = { user: new Types.ObjectId(userId), type: 'savings' };
    if (year) {
      match.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
    }

    const rows = await Entry.aggregate([
      { $match: match },
      { $group: { _id: '$account', totalSavings: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'accounts', localField: '_id', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $sort: { totalSavings: -1 } },
    ]);

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
};
