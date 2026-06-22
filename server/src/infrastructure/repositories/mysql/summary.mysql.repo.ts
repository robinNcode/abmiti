import { getMySQLPool } from '../../database/mysql/connection';
import {
  ISummaryRepository, IMonthlySummaryRow, ICategoryBreakdownRow,
  IMonthlyTrendRow, IAccountSummaryRow,
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
}
