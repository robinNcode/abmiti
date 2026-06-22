import { v4 as uuid } from 'uuid';
import { getMySQLPool } from '../../database/mysql/connection';
import {
  IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult, EntryType, PaymentSource,
} from '../../../shared/types';
import { IEntryRepository } from '../../../shared/types/repositories';
import { buildPaginatedResult } from '../../../shared/utils/pagination';

type EntryRow = {
  id: string; user_id: string; type: string; amount: number | string; note: string;
  category_id: string; source: string; account_id: string | null; sector: string;
  date: Date | string; parsed_from_sms: number; raw_sms: string | null;
  created_at: Date; updated_at: Date;
  // joined fields
  cat_name?: string; cat_icon?: string; cat_color?: string;
  acc_name?: string; acc_type?: string; acc_number?: string;
  acc_bank?: string;  acc_provider?: string; acc_balance?: number | string;
};

const toIEntry = (row: EntryRow): IEntry => ({
  _id:           row.id as any,
  user:          row.user_id as any,
  type:          row.type as EntryType,
  amount:        Number(row.amount),
  note:          row.note,
  category: row.cat_name
    ? { _id: row.category_id, name: row.cat_name, icon: row.cat_icon, color: row.cat_color } as any
    : row.category_id as any,
  source:        row.source as PaymentSource,
  account: row.account_id && row.acc_name
    ? {
        _id: row.account_id, name: row.acc_name, type: row.acc_type,
        accountNumber: row.acc_number, bankName: row.acc_bank,
        provider: row.acc_provider, balance: Number(row.acc_balance ?? 0),
      } as any
    : (row.account_id as any) ?? undefined,
  sector:        row.sector,
  date:          new Date(row.date),
  parsedFromSms: Boolean(row.parsed_from_sms),
  rawSms:        row.raw_sms ?? undefined,
  createdAt:     row.created_at,
  updatedAt:     row.updated_at,
} as unknown as IEntry);

const JOIN = `
  LEFT JOIN categories c ON e.category_id = c.id
  LEFT JOIN accounts   a ON e.account_id  = a.id
`;
const SELECT = `
  e.*,
  c.name  AS cat_name,  c.icon  AS cat_icon,  c.color AS cat_color,
  a.name  AS acc_name,  a.type  AS acc_type,   a.account_number AS acc_number,
  a.bank_name AS acc_bank, a.provider AS acc_provider, a.balance AS acc_balance
`;

export class MySQLEntryRepository implements IEntryRepository {
  private get pool() { return getMySQLPool(); }

  async findMany(
    userId: string,
    filters: IEntryFilters,
    pagination: IPaginationOptions,
  ): Promise<IPaginatedResult<IEntry>> {
    const conditions: string[] = ['e.user_id = ?'];
    const params: any[] = [userId];

    if (filters.type)     { conditions.push('e.type = ?');     params.push(filters.type); }
    if (filters.category) { conditions.push('e.category_id = ?'); params.push(filters.category); }
    if (filters.source)   { conditions.push('e.source = ?');   params.push(filters.source); }

    if (filters.month !== undefined && filters.year !== undefined) {
      const m    = String(filters.month).padStart(2, '0');
      const yr   = filters.year;
      conditions.push('e.date >= ? AND e.date <= ?');
      params.push(`${yr}-${m}-01`);
      const last = new Date(yr, filters.month, 0).getDate();
      params.push(`${yr}-${m}-${last}`);
    } else {
      if (filters.startDate) { conditions.push('e.date >= ?'); params.push(filters.startDate); }
      if (filters.endDate)   { conditions.push('e.date <= ?'); params.push(filters.endDate);   }
    }

    const where  = conditions.join(' AND ');
    const offset = (pagination.page - 1) * pagination.limit;

    const [rows]  = await this.pool.query<any[]>(
      `SELECT ${SELECT} FROM entries e ${JOIN} WHERE ${where} ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pagination.limit, offset],
    );
    const [count] = await this.pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM entries e WHERE ${where}`,
      params,
    );

    const total = Number(count[0].total);
    return buildPaginatedResult(rows.map(toIEntry), total, pagination);
  }

  async findById(id: string, userId: string): Promise<IEntry | null> {
    const [rows] = await this.pool.execute<any[]>(
      `SELECT ${SELECT} FROM entries e ${JOIN} WHERE e.id = ? AND e.user_id = ? LIMIT 1`,
      [id, userId],
    );
    return rows[0] ? toIEntry(rows[0]) : null;
  }

  async create(data: Partial<IEntry>): Promise<IEntry> {
    const id = uuid();
    const d  = data as any;
    const dateStr = d.date
      ? new Date(d.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    await this.pool.execute(
      `INSERT INTO entries
         (id, user_id, type, amount, note, category_id, source, account_id, sector, date, parsed_from_sms, raw_sms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(d.user),
        d.type,
        d.amount,
        d.note ?? '',
        String(d.category),
        d.source ?? 'cash',
        d.account ? String(d.account) : null,
        d.sector ?? '',
        dateStr,
        d.parsedFromSms ? 1 : 0,
        d.rawSms ?? null,
      ],
    );
    return (await this.findById(id, String(d.user)))!;
  }

  async update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null> {
    const d      = data as any;
    const fields: string[] = [];
    const vals:   any[] = [];

    if (d.amount    !== undefined) { fields.push('amount = ?');    vals.push(d.amount); }
    if (d.note      !== undefined) { fields.push('note = ?');      vals.push(d.note); }
    if (d.source    !== undefined) { fields.push('source = ?');    vals.push(d.source); }
    if (d.sector    !== undefined) { fields.push('sector = ?');    vals.push(d.sector); }
    if (d.date      !== undefined) { fields.push('date = ?');      vals.push(new Date(d.date).toISOString().split('T')[0]); }
    if (d.category  !== undefined) { fields.push('category_id = ?'); vals.push(String(d.category)); }
    if (d.account   !== undefined) { fields.push('account_id = ?');  vals.push(d.account ? String(d.account) : null); }

    if (!fields.length) return this.findById(id, userId);

    vals.push(id, userId);
    await this.pool.execute(
      `UPDATE entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      vals,
    );
    return this.findById(id, userId);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const [result] = await this.pool.execute<any>(
      'DELETE FROM entries WHERE id = ? AND user_id = ?', [id, userId],
    );
    return result.affectedRows === 1;
  }
}
