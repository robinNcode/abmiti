import { getMySQLPool } from '../../database/mysql/connection';
import {
  ISummaryRepository, IMonthlySummaryRow, ICategoryBreakdownRow,
  IMonthlyTrendRow, IAccountSummaryRow, ICategoryReportRow,
} from '../../../shared/types/repositories';

export class MySQLSummaryRepository implements ISummaryRepository {
  private get pool() { return getMySQLPool(); }

  async getMonthlySummary(userId: string, start: Date, end: Date): Promise<IMonthlySummaryRow[]> {
    const [rows] = await this.pool.execute<any[]>(
      `SELECT type AS _id, SUM(amount) AS total, COUNT(*) AS count
       FROM entries
       WHERE user_id = ? AND date >= ? AND date <= ?
       GROUP BY type`,
      [userId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]],
    );
    return rows.map((r) => ({ _id: r._id, total: Number(r.total), count: Number(r.count) }));
  }

  async getCategoryBreakdown(userId: string, start: Date, end: Date): Promise<ICategoryBreakdownRow[]> {
    const [rows] = await this.pool.execute<any[]>(
      `SELECT e.category_id AS _id, SUM(e.amount) AS total, COUNT(*) AS count,
              c.name, c.icon, c.color
       FROM entries e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.type = 'expense' AND e.date >= ? AND e.date <= ?
       GROUP BY e.category_id
       ORDER BY total DESC`,
      [userId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]],
    );
    return rows.map((r) => ({
      _id: r._id,
      total: Number(r.total),
      count: Number(r.count),
      category: { _id: r._id, name: r.name, icon: r.icon, color: r.color },
    }));
  }

  async getYearlyTrend(userId: string, start: Date, end: Date): Promise<IMonthlyTrendRow[]> {
    const [rows] = await this.pool.execute<any[]>(
      `SELECT MONTH(date) AS month, type, SUM(amount) AS total
       FROM entries
       WHERE user_id = ? AND date >= ? AND date <= ?
       GROUP BY MONTH(date), type`,
      [userId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]],
    );
    return rows.map((r) => ({
      _id: { month: Number(r.month), type: r.type },
      total: Number(r.total),
    }));
  }

  async getAccountSummaries(userId: string, year?: number): Promise<IAccountSummaryRow[]> {
    const conditions = ['e.user_id = ?', "e.type = 'savings'"];
    const params: any[] = [userId];

    if (year) {
      conditions.push('e.date >= ? AND e.date <= ?');
      params.push(`${year}-01-01`, `${year}-12-31`);
    }

    const where = conditions.join(' AND ');

    const [rows] = await this.pool.execute<any[]>(
      `SELECT e.account_id AS _id, SUM(e.amount) AS totalSavings, COUNT(*) AS count,
              a.name, a.type, a.balance
       FROM entries e
       JOIN accounts a ON e.account_id = a.id
       WHERE ${where}
       GROUP BY e.account_id
       ORDER BY totalSavings DESC`,
      params,
    );

    return rows.map((r) => ({
      _id: r._id,
      totalSavings: Number(r.totalSavings),
      count: Number(r.count),
      account: { _id: r._id, name: r.name, type: r.type, balance: Number(r.balance) },
    }));
  }

  async getCategoryReport(
    userId: string,
    filters: {
      startDate: Date;
      endDate: Date;
      categoryIds?: string[];
      minAmount?: number;
      maxAmount?: number;
      type?: 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
    }
  ): Promise<ICategoryReportRow[]> {
    const conditions = ['e.user_id = ?', 'e.date >= ?', 'e.date <= ?'];
    const params: any[] = [
      userId,
      filters.startDate.toISOString().split('T')[0],
      filters.endDate.toISOString().split('T')[0],
    ];

    if (filters.type) {
      conditions.push('e.type = ?');
      params.push(filters.type);
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const placeholders = filters.categoryIds.map(() => '?').join(',');
      conditions.push(`e.category_id IN (${placeholders})`);
      params.push(...filters.categoryIds);
    }

    if (filters.minAmount !== undefined) {
      conditions.push('e.amount >= ?');
      params.push(filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      conditions.push('e.amount <= ?');
      params.push(filters.maxAmount);
    }

    const where = conditions.join(' AND ');

    const [rows] = await this.pool.execute<any[]>(
      `SELECT e.category_id AS _id,
              SUM(e.amount) AS total,
              COUNT(*) AS count,
              MIN(e.amount) AS minAmount,
              MAX(e.amount) AS maxAmount,
              c.name, c.icon, c.color
       FROM entries e
       JOIN categories c ON e.category_id = c.id
       WHERE ${where}
       GROUP BY e.category_id
       ORDER BY total DESC`,
      params,
    );

    return rows.map((r) => ({
      _id: r._id,
      total: Number(r.total),
      count: Number(r.count),
      minAmount: Number(r.minAmount),
      maxAmount: Number(r.maxAmount),
      category: { _id: r._id, name: r.name, icon: r.icon, color: r.color },
    }));
  }

  async getTransactionStatement(
    userId: string,
    filters: {
      startDate: Date;
      endDate: Date;
      categoryIds?: string[];
      type?: 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
    }
  ): Promise<any[]> {
    const conditions = ['e.user_id = ?', 'e.date >= ?', 'e.date <= ?'];
    const params: any[] = [
      userId,
      filters.startDate.toISOString().split('T')[0],
      filters.endDate.toISOString().split('T')[0],
    ];

    if (filters.type) {
      conditions.push('e.type = ?');
      params.push(filters.type);
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const placeholders = filters.categoryIds.map(() => '?').join(',');
      conditions.push(`e.category_id IN (${placeholders})`);
      params.push(...filters.categoryIds);
    }

    const where = conditions.join(' AND ');

    const [rows] = await this.pool.execute<any[]>(
      `SELECT e.id AS _id, e.date, e.type, e.amount, e.note, e.source,
              c.id AS category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM entries e
       JOIN categories c ON e.category_id = c.id
       WHERE ${where}
       ORDER BY e.date ASC, e.id ASC`,
      params,
    );

    // Calculate running balance
    let balance = 0;
    return rows.map((r: any) => {
      // Income adds, expenses/investments subtract
      if (r.type === 'income' || r.type === 'receivable') {
        balance += Number(r.amount);
      } else {
        balance -= Number(r.amount);
      }
      return {
        _id: r._id,
        date: r.date,
        type: r.type,
        amount: Number(r.amount),
        note: r.note,
        source: r.source,
        category: {
          _id: r.category_id,
          name: r.category_name,
          icon: r.category_icon,
          color: r.category_color,
        },
        runningBalance: balance,
      };
    });
  }
}
