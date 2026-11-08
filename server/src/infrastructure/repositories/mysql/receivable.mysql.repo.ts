import { RowDataPacket } from 'mysql2';
import { randomUUID } from 'crypto';
import { getMySQLPool } from '../../database/mysql/connection';
import { IReceivableRepository } from '../../../shared/types/repositories';
import { IReceivable, IReceivableInput } from '../../../shared/types';
import { transformUserData } from '../../../shared/utils/userDataEncryption';

interface ReceivableRow extends RowDataPacket {
  id: string;
  user_id: string;
  counterparty: string;
  principal: string;
  received_amount: string;
  kind: string;
  category_id: string | null;
  account_id: string | null;
  due_date: Date | null;
  note: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const toReceivable = (source: ReceivableRow, userId: string): IReceivable => {
  const row = transformUserData(userId, source, false);
  return ({
  _id:            row.id,
  userId:         row.user_id,
  counterparty:   row.counterparty,
  principal:      Number(row.principal),
  receivedAmount: Number(row.received_amount),
  remaining:      Number(row.principal) - Number(row.received_amount),
  kind:           row.kind as IReceivable['kind'],
  categoryId:     row.category_id ?? null,
  accountId:      row.account_id ?? null,
  dueDate:        row.due_date ?? null,
  note:           row.note ?? undefined,
  status:         row.status as IReceivable['status'],
  createdAt:      row.created_at,
  updatedAt:      row.updated_at,
  });
};

export class MySQLReceivableRepository implements IReceivableRepository {
  private get pool() { return getMySQLPool(); }

  async create(userId: string, data: IReceivableInput): Promise<IReceivable> {
    const id = randomUUID();
    const encrypted = transformUserData(userId, data, true);
    await this.pool.query(
      `INSERT INTO receivables
       (id, user_id, counterparty, principal, kind, category_id, account_id, due_date, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        encrypted.counterparty,
        data.principal,
        data.kind,
        data.categoryId ?? null,
        data.accountId ?? null,
        data.dueDate ?? null,
        encrypted.note ?? null,
      ],
    );
    return (await this.findById(userId, id))!;
  }

  async findById(userId: string, id: string): Promise<IReceivable | null> {
    const [rows] = await this.pool.query<ReceivableRow[]>(
      'SELECT * FROM receivables WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId],
    );
    return rows[0] ? toReceivable(rows[0], userId) : null;
  }

  async findMany(userId: string, status?: string): Promise<IReceivable[]> {
    const [rows] = status
      ? await this.pool.query<ReceivableRow[]>(
          'SELECT * FROM receivables WHERE user_id = ? AND status = ? ORDER BY due_date ASC, created_at DESC',
          [userId, status],
        )
      : await this.pool.query<ReceivableRow[]>(
          'SELECT * FROM receivables WHERE user_id = ? ORDER BY status ASC, due_date ASC, created_at DESC',
          [userId],
        );
    return rows.map((row) => toReceivable(row, userId));
  }

  async update(
    userId: string,
    id: string,
    data: Partial<Pick<IReceivableInput, 'counterparty' | 'note' | 'dueDate'>>,
  ): Promise<IReceivable | null> {
    const encrypted = transformUserData(userId, data, true);
    const fields: string[] = [];
    const vals: unknown[] = [];
    if (data.counterparty !== undefined) { fields.push('counterparty = ?'); vals.push(encrypted.counterparty); }
    if (data.note         !== undefined) { fields.push('note = ?');         vals.push(encrypted.note ?? null); }
    if (data.dueDate      !== undefined) { fields.push('due_date = ?');     vals.push(data.dueDate ?? null); }
    if (!fields.length) return this.findById(userId, id);
    vals.push(id, userId);
    await this.pool.query(
      `UPDATE receivables SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      vals,
    );
    return this.findById(userId, id);
  }

  async applyCollection(
    userId: string,
    id: string,
    amount: number,
    newStatus: 'open' | 'settled',
  ): Promise<IReceivable | null> {
    await this.pool.query(
      `UPDATE receivables
       SET received_amount = received_amount + ?, status = ?
       WHERE id = ? AND user_id = ? AND status = 'open'`,
      [amount, newStatus, id, userId],
    );
    return this.findById(userId, id);
  }

  async reverseCollection(userId: string, id: string, amount: number): Promise<IReceivable | null> {
    await this.pool.query(
      `UPDATE receivables
       SET received_amount = received_amount - ?, status = 'open'
       WHERE id = ? AND user_id = ?`,
      [amount, id, userId],
    );
    return this.findById(userId, id);
  }

  async cancel(userId: string, id: string): Promise<IReceivable | null> {
    await this.pool.query(
      `UPDATE receivables SET status = 'cancelled' WHERE id = ? AND user_id = ? AND received_amount = 0`,
      [id, userId],
    );
    return this.findById(userId, id);
  }
}
