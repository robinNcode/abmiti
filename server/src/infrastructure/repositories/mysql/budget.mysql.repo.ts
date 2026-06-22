import { getMySQLPool } from '../../database/mysql/connection';
import { IBudgetRepository } from '../../../shared/types/repositories';
import { IBudget, IBudgetInput } from '../../../shared/types';

export class MySQLBudgetRepository implements IBudgetRepository {
  private get pool() { return getMySQLPool(); }

  private toIBudget(row: any): IBudget {
    return {
      _id: row.id,
      user: row.user_id,
      month: row.month,
      year: row.year,
      amount: Number(row.amount),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as unknown as IBudget;
  }

  async upsert(userId: string, data: IBudgetInput): Promise<IBudget> {
    // Create the table if it doesn't exist yet, to ensure safety during migration
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id    VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month      INT NOT NULL,
        year       INT NOT NULL,
        amount     DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_month_year (user_id, month, year)
      )
    `);

    await this.pool.query(
      `INSERT INTO budgets (user_id, month, year, amount) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [userId, data.month, data.year, data.amount]
    );

    const [rows] = await this.pool.query<any[]>(
      `SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? LIMIT 1`,
      [userId, data.month, data.year]
    );
    return this.toIBudget(rows[0]);
  }

  async findByMonth(userId: string, month: number, year: number): Promise<IBudget | null> {
    try {
      const [rows] = await this.pool.query<any[]>(
        `SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? LIMIT 1`,
        [userId, month, year]
      );
      if (!rows.length) return null;
      return this.toIBudget(rows[0]);
    } catch (err: any) {
      // If table doesn't exist, return null
      if (err.code === 'ER_NO_SUCH_TABLE') return null;
      throw err;
    }
  }

  async findMany(userId: string): Promise<IBudget[]> {
    try {
      const [rows] = await this.pool.query<any[]>(
        `SELECT * FROM budgets WHERE user_id = ? ORDER BY year DESC, month DESC`,
        [userId]
      );
      return rows.map(this.toIBudget);
    } catch (err: any) {
      if (err.code === 'ER_NO_SUCH_TABLE') return [];
      throw err;
    }
  }

  async remove(id: string, userId: string): Promise<boolean> {
    try {
      const [result] = await this.pool.query<any>(
        `DELETE FROM budgets WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      return result.affectedRows > 0;
    } catch (err: any) {
      if (err.code === 'ER_NO_SUCH_TABLE') return false;
      throw err;
    }
  }
}
