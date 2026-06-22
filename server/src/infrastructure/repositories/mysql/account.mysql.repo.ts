import { v4 as uuid } from 'uuid';
import { getMySQLPool } from '../../database/mysql/connection';
import { IAccount, IAccountInput } from '../../../shared/types';
import { IAccountRepository } from '../../../shared/types/repositories';

type AccountRow = {
  id: string; user_id: string; name: string; type: string;
  account_number: string | null; bank_name: string | null;
  provider: string | null; balance: number | string;
  is_active: number; created_at: Date; updated_at: Date;
};

const toIAccount = (row: AccountRow): IAccount => ({
  _id:           row.id as any,
  user:          row.user_id as any,
  name:          row.name,
  type:          row.type as 'bank' | 'mobile',
  accountNumber: row.account_number ?? undefined,
  bankName:      row.bank_name ?? undefined,
  provider:      (row.provider ?? undefined) as any,
  balance:       Number(row.balance),
  isActive:      Boolean(row.is_active),
  createdAt:     row.created_at,
  updatedAt:     row.updated_at,
} as unknown as IAccount);

export class MySQLAccountRepository implements IAccountRepository {
  private get pool() { return getMySQLPool(); }

  async create(data: IAccountInput & { user: string }): Promise<IAccount> {
    const id = uuid();
    await this.pool.execute(
      `INSERT INTO accounts (id, user_id, name, type, account_number, bank_name, provider, balance, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.user, data.name, data.type,
        data.accountNumber ?? null,
        data.bankName ?? null,
        data.provider ?? null,
        data.balance ?? 0,
        data.isActive ? 1 : 0,
      ],
    );
    return (await this.findById(data.user, id))!;
  }

  async findByUser(userId: string): Promise<IAccount[]> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [userId],
    );
    return rows.map(toIAccount);
  }

  async findById(userId: string, accountId: string): Promise<IAccount | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ? LIMIT 1',
      [accountId, userId],
    );
    return rows[0] ? toIAccount(rows[0]) : null;
  }

  async update(userId: string, accountId: string, data: Partial<IAccountInput>): Promise<IAccount | null> {
    const fields: string[] = [];
    const vals:   any[] = [];
    if (data.name          !== undefined) { fields.push('name = ?');           vals.push(data.name); }
    if (data.type          !== undefined) { fields.push('type = ?');           vals.push(data.type); }
    if (data.accountNumber !== undefined) { fields.push('account_number = ?'); vals.push(data.accountNumber ?? null); }
    if (data.bankName      !== undefined) { fields.push('bank_name = ?');      vals.push(data.bankName ?? null); }
    if (data.provider      !== undefined) { fields.push('provider = ?');       vals.push(data.provider ?? null); }
    if (data.balance       !== undefined) { fields.push('balance = ?');        vals.push(data.balance); }
    if (data.isActive      !== undefined) { fields.push('is_active = ?');      vals.push(data.isActive ? 1 : 0); }

    if (!fields.length) return this.findById(userId, accountId);
    vals.push(accountId, userId);
    await this.pool.execute(
      `UPDATE accounts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, vals,
    );
    return this.findById(userId, accountId);
  }

  async softDelete(userId: string, accountId: string): Promise<boolean> {
    const [result] = await this.pool.execute<any>(
      'UPDATE accounts SET is_active = 0 WHERE id = ? AND user_id = ?',
      [accountId, userId],
    );
    return result.affectedRows === 1;
  }

  async updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null> {
    await this.pool.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?',
      [amount, accountId, userId],
    );
    return this.findById(userId, accountId);
  }
}
