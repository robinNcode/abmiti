"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLEntryRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../database/mysql/connection");
const pagination_1 = require("../../../shared/utils/pagination");
const toIEntry = (row) => ({
    _id: row.id,
    user: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    note: row.note,
    category: row.cat_name
        ? { _id: row.category_id, name: row.cat_name, icon: row.cat_icon, color: row.cat_color }
        : row.category_id,
    source: row.source,
    account: row.account_id && row.acc_name
        ? {
            _id: row.account_id, name: row.acc_name, type: row.acc_type,
            accountNumber: row.acc_number, bankName: row.acc_bank,
            provider: row.acc_provider, balance: Number(row.acc_balance ?? 0),
        }
        : row.account_id ?? undefined,
    sector: row.sector,
    date: new Date(row.date),
    parsedFromSms: Boolean(row.parsed_from_sms),
    rawSms: row.raw_sms ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
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
class MySQLEntryRepository {
    get pool() { return (0, connection_1.getMySQLPool)(); }
    async findMany(userId, filters, pagination) {
        const conditions = ['e.user_id = ?'];
        const params = [userId];
        if (filters.type) {
            conditions.push('e.type = ?');
            params.push(filters.type);
        }
        if (filters.category) {
            conditions.push('e.category_id = ?');
            params.push(filters.category);
        }
        if (filters.source) {
            conditions.push('e.source = ?');
            params.push(filters.source);
        }
        if (filters.month !== undefined && filters.year !== undefined) {
            const m = String(filters.month).padStart(2, '0');
            const yr = filters.year;
            conditions.push('e.date >= ? AND e.date <= ?');
            params.push(`${yr}-${m}-01`);
            const last = new Date(yr, filters.month, 0).getDate();
            params.push(`${yr}-${m}-${last}`);
        }
        else {
            if (filters.startDate) {
                conditions.push('e.date >= ?');
                params.push(filters.startDate);
            }
            if (filters.endDate) {
                conditions.push('e.date <= ?');
                params.push(filters.endDate);
            }
        }
        const where = conditions.join(' AND ');
        const offset = (pagination.page - 1) * pagination.limit;
        const [rows] = await this.pool.query(`SELECT ${SELECT} FROM entries e ${JOIN} WHERE ${where} ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?`, [...params, pagination.limit, offset]);
        const [count] = await this.pool.query(`SELECT COUNT(*) AS total FROM entries e WHERE ${where}`, params);
        const total = Number(count[0].total);
        return (0, pagination_1.buildPaginatedResult)(rows.map(toIEntry), total, pagination);
    }
    async findById(id, userId) {
        const [rows] = await this.pool.execute(`SELECT ${SELECT} FROM entries e ${JOIN} WHERE e.id = ? AND e.user_id = ? LIMIT 1`, [id, userId]);
        return rows[0] ? toIEntry(rows[0]) : null;
    }
    async create(data) {
        const id = (0, uuid_1.v4)();
        const d = data;
        const dateStr = d.date
            ? new Date(d.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        await this.pool.execute(`INSERT INTO entries
         (id, user_id, type, amount, note, category_id, source, account_id, sector, date, parsed_from_sms, raw_sms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
        return (await this.findById(id, String(d.user)));
    }
    async update(id, userId, data) {
        const d = data;
        const fields = [];
        const vals = [];
        if (d.amount !== undefined) {
            fields.push('amount = ?');
            vals.push(d.amount);
        }
        if (d.note !== undefined) {
            fields.push('note = ?');
            vals.push(d.note);
        }
        if (d.source !== undefined) {
            fields.push('source = ?');
            vals.push(d.source);
        }
        if (d.sector !== undefined) {
            fields.push('sector = ?');
            vals.push(d.sector);
        }
        if (d.date !== undefined) {
            fields.push('date = ?');
            vals.push(new Date(d.date).toISOString().split('T')[0]);
        }
        if (d.category !== undefined) {
            fields.push('category_id = ?');
            vals.push(String(d.category));
        }
        if (d.account !== undefined) {
            fields.push('account_id = ?');
            vals.push(d.account ? String(d.account) : null);
        }
        if (!fields.length)
            return this.findById(id, userId);
        vals.push(id, userId);
        await this.pool.execute(`UPDATE entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, vals);
        return this.findById(id, userId);
    }
    async remove(id, userId) {
        const [result] = await this.pool.execute('DELETE FROM entries WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows === 1;
    }
}
exports.MySQLEntryRepository = MySQLEntryRepository;
//# sourceMappingURL=entry.mysql.repo.js.map