"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLAccountRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../database/mysql/connection");
const toIAccount = (row) => ({
    _id: row.id,
    user: row.user_id,
    name: row.name,
    type: row.type,
    accountNumber: row.account_number ?? undefined,
    bankName: row.bank_name ?? undefined,
    provider: (row.provider ?? undefined),
    balance: Number(row.balance),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
class MySQLAccountRepository {
    get pool() { return (0, connection_1.getMySQLPool)(); }
    async create(data) {
        const id = (0, uuid_1.v4)();
        await this.pool.execute(`INSERT INTO accounts (id, user_id, name, type, account_number, bank_name, provider, balance, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, data.user, data.name, data.type,
            data.accountNumber ?? null,
            data.bankName ?? null,
            data.provider ?? null,
            data.balance ?? 0,
            data.isActive ? 1 : 0,
        ]);
        return (await this.findById(data.user, id));
    }
    async findByUser(userId) {
        const [rows] = await this.pool.execute('SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC', [userId]);
        return rows.map(toIAccount);
    }
    async findById(userId, accountId) {
        const [rows] = await this.pool.execute('SELECT * FROM accounts WHERE id = ? AND user_id = ? LIMIT 1', [accountId, userId]);
        return rows[0] ? toIAccount(rows[0]) : null;
    }
    async update(userId, accountId, data) {
        const fields = [];
        const vals = [];
        if (data.name !== undefined) {
            fields.push('name = ?');
            vals.push(data.name);
        }
        if (data.type !== undefined) {
            fields.push('type = ?');
            vals.push(data.type);
        }
        if (data.accountNumber !== undefined) {
            fields.push('account_number = ?');
            vals.push(data.accountNumber ?? null);
        }
        if (data.bankName !== undefined) {
            fields.push('bank_name = ?');
            vals.push(data.bankName ?? null);
        }
        if (data.provider !== undefined) {
            fields.push('provider = ?');
            vals.push(data.provider ?? null);
        }
        if (data.balance !== undefined) {
            fields.push('balance = ?');
            vals.push(data.balance);
        }
        if (data.isActive !== undefined) {
            fields.push('is_active = ?');
            vals.push(data.isActive ? 1 : 0);
        }
        if (!fields.length)
            return this.findById(userId, accountId);
        vals.push(accountId, userId);
        await this.pool.execute(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, vals);
        return this.findById(userId, accountId);
    }
    async softDelete(userId, accountId) {
        const [result] = await this.pool.execute('UPDATE accounts SET is_active = 0 WHERE id = ? AND user_id = ?', [accountId, userId]);
        return result.affectedRows === 1;
    }
    async updateBalance(userId, accountId, amount) {
        await this.pool.execute('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?', [amount, accountId, userId]);
        return this.findById(userId, accountId);
    }
}
exports.MySQLAccountRepository = MySQLAccountRepository;
//# sourceMappingURL=account.mysql.repo.js.map