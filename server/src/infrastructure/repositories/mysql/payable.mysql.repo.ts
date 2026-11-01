import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { randomUUID } from 'crypto';
import { getMySQLPool } from '../../database/mysql/connection';
import { IPayableRepository } from '../../../shared/types/repositories';
import { IPayable, IPayableInput, INetPosition } from '../../../shared/types';

interface PayableRow extends RowDataPacket {
  id: string; user_id: string; counterparty: string;
  principal: string; paid_amount: string; kind: string;
  category_id: string | null; account_id: string | null;
  due_date: Date | null; note: string | null; status: string;
  created_at: Date; updated_at: Date;
}

const toPayable = (row: PayableRow): IPayable => ({
  _id:          row.id,
  userId:       row.user_id,
  counterparty: row.counterparty,
  principal:    Number(row.principal),
  paidAmount:   Number(row.paid_amount),
  remaining:    Number(row.principal) - Number(row.paid_amount),
  kind:         row.kind as IPayable['kind'],
  categoryId:   row.category_id ?? null,
  accountId:    row.account_id ?? null,
  dueDate:      row.due_date ?? null,
  note:         row.note ?? undefined,
  status:       row.status as IPayable['status'],
  createdAt:    row.created_at,
  updatedAt:    row.updated_at,
});

export class MySQLPayableRepository implements IPayableRepository {
  private get pool() { return getMySQLPool(); }

  async create(userId: string, data: IPayableInput): Promise<IPayable> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO payables
       (id, user_id, counterparty, principal, kind, category_id, account_id, due_date, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.counterparty, data.principal, data.kind,
        data.categoryId ?? null, data.accountId ?? null,
        data.dueDate ?? null, data.note ?? null],
    );
    return (await this.findById(userId, id))!;
  }

  async findById(userId: string, id: string): Promise<IPayable | null> {
    const [rows] = await this.pool.query<PayableRow[]>(
      'SELECT * FROM payables WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId],
    );
    return rows[0] ? toPayable(rows[0]) : null;
  }

  async findMany(userId: string, status?: string): Promise<IPayable[]> {
    const [rows] = status
      ? await this.pool.query<PayableRow[]>(
          'SELECT * FROM payables WHERE user_id = ? AND status = ? ORDER BY due_date ASC, created_at DESC',
          [userId, status],
        )
      : await this.pool.query<PayableRow[]>(
          'SELECT * FROM payables WHERE user_id = ? ORDER BY status ASC, due_date ASC, created_at DESC',
          [userId],
        );
    return rows.map(toPayable);
  }

  async update(userId: string, id: string, data: Partial<Pick<IPayableInput, 'counterparty' | 'note' | 'dueDate'>>): Promise<IPayable | null> {
    const fields: string[] = [];
    const vals: unknown[] = [];
    if (data.counterparty !== undefined) { fields.push('counterparty = ?'); vals.push(data.counterparty); }
    if (data.note         !== undefined) { fields.push('note = ?');         vals.push(data.note ?? null); }
    if (data.dueDate      !== undefined) { fields.push('due_date = ?');     vals.push(data.dueDate ?? null); }
    if (!fields.length) return this.findById(userId, id);
    vals.push(id, userId);
    await this.pool.query(
      `UPDATE payables SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, vals,
    );
    return this.findById(userId, id);
  }

  /** Atomic increment + status update in one statement (no read-modify-write). */
  async applyPayment(userId: string, id: string, amount: number, newStatus: 'open' | 'settled'): Promise<IPayable | null> {
    await this.pool.query(
      `UPDATE payables
       SET paid_amount = paid_amount + ?, status = ?
       WHERE id = ? AND user_id = ? AND status = 'open'`,
      [amount, newStatus, id, userId],
    );
    return this.findById(userId, id);
  }

  /** Atomic decrement + reopen. */
  async reversePayment(userId: string, id: string, amount: number): Promise<IPayable | null> {
    await this.pool.query(
      `UPDATE payables
       SET paid_amount = paid_amount - ?, status = 'open'
       WHERE id = ? AND user_id = ?`,
      [amount, id, userId],
    );
    return this.findById(userId, id);
  }

  async cancel(userId: string, id: string): Promise<IPayable | null> {
    await this.pool.query(
      `UPDATE payables SET status = 'cancelled' WHERE id = ? AND user_id = ? AND paid_amount = 0`,
      [id, userId],
    );
    return this.findById(userId, id);
  }

  async getNetPosition(userId: string): Promise<INetPosition> {
    const [acctRows] = await this.pool.query<(RowDataPacket & { liquid: string })[]>(
      `SELECT COALESCE(SUM(balance), 0) AS liquid FROM accounts WHERE user_id = ? AND is_active = 1`,
      [userId],
    );
    const [recvRows] = await this.pool.query<(RowDataPacket & { total: string })[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE user_id = ? AND type = 'receivable'`,
      [userId],
    );
    const [payRows] = await this.pool.query<(RowDataPacket & { total: string })[]>(
      `SELECT COALESCE(SUM(principal - paid_amount), 0) AS total
       FROM payables WHERE user_id = ? AND status = 'open'`,
      [userId],
    );
    const liquid          = Number(acctRows[0]?.liquid ?? 0);
    const receivableOpen  = Number(recvRows[0]?.total  ?? 0);
    const payableOpen     = Number(payRows[0]?.total   ?? 0);
    return { liquid, receivableOpen, payableOpen, netPosition: liquid + receivableOpen - payableOpen };
  }
}
