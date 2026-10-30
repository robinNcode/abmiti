"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLSummaryRepository = void 0;
const connection_1 = require("../../database/mysql/connection");
class MySQLSummaryRepository {
    get pool() { return (0, connection_1.getMySQLPool)(); }
    async getMonthlySummary(userId, start, end) {
        const [rows] = await this.pool.execute(`SELECT type AS _id, SUM(amount) AS total, COUNT(*) AS count
       FROM entries
       WHERE user_id = ? AND date >= ? AND date <= ?
       GROUP BY type`, [userId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
        return rows.map((r) => ({ _id: r._id, total: Number(r.total), count: Number(r.count) }));
    }
    async getCategoryBreakdown(userId, start, end) {
        const [rows] = await this.pool.execute(`SELECT e.category_id AS _id, SUM(e.amount) AS total, COUNT(*) AS count,
              c.name, c.icon, c.color
       FROM entries e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.type = 'expense' AND e.date >= ? AND e.date <= ?
       GROUP BY e.category_id
       ORDER BY total DESC`, [userId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
        return rows.map((r) => ({
            _id: r._id,
            total: Number(r.total),
            count: Number(r.count),
            category: { _id: r._id, name: r.name, icon: r.icon, color: r.color },
        }));
    }
    async getYearlyTrend(userId, start, end) {
        const [rows] = await this.pool.execute(`SELECT MONTH(date) AS month, type, SUM(amount) AS total
       FROM entries
       WHERE user_id = ? AND date >= ? AND date <= ?
       GROUP BY MONTH(date), type`, [userId, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
        return rows.map((r) => ({
            _id: { month: Number(r.month), type: r.type },
            total: Number(r.total),
        }));
    }
    async getAccountSummaries(userId, year) {
        const conditions = ['e.user_id = ?', "e.type = 'savings'"];
        const params = [userId];
        if (year) {
            conditions.push('e.date >= ? AND e.date <= ?');
            params.push(`${year}-01-01`, `${year}-12-31`);
        }
        const where = conditions.join(' AND ');
        const [rows] = await this.pool.execute(`SELECT e.account_id AS _id, SUM(e.amount) AS totalSavings, COUNT(*) AS count,
              a.name, a.type, a.balance
       FROM entries e
       JOIN accounts a ON e.account_id = a.id
       WHERE ${where}
       GROUP BY e.account_id
       ORDER BY totalSavings DESC`, params);
        return rows.map((r) => ({
            _id: r._id,
            totalSavings: Number(r.totalSavings),
            count: Number(r.count),
            account: { _id: r._id, name: r.name, type: r.type, balance: Number(r.balance) },
        }));
    }
    async getCategoryReport(userId, filters) {
        const conditions = ['e.user_id = ?', 'e.date >= ?', 'e.date <= ?'];
        const params = [
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
        const [rows] = await this.pool.execute(`SELECT e.category_id AS _id,
              SUM(e.amount) AS total,
              COUNT(*) AS count,
              MIN(e.amount) AS minAmount,
              MAX(e.amount) AS maxAmount,
              c.name, c.icon, c.color
       FROM entries e
       JOIN categories c ON e.category_id = c.id
       WHERE ${where}
       GROUP BY e.category_id
       ORDER BY total DESC`, params);
        return rows.map((r) => ({
            _id: r._id,
            total: Number(r.total),
            count: Number(r.count),
            minAmount: Number(r.minAmount),
            maxAmount: Number(r.maxAmount),
            category: { _id: r._id, name: r.name, icon: r.icon, color: r.color },
        }));
    }
    async getTransactionStatement(userId, filters) {
        const conditions = ['e.user_id = ?', 'e.date >= ?', 'e.date <= ?'];
        const params = [
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
        const [rows] = await this.pool.execute(`SELECT e.id AS _id, e.date, e.type, e.amount, e.note, e.sector, e.source,
              c.id AS category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              a.id AS account_id, a.name AS account_name, a.type AS account_type
       FROM entries e
       JOIN categories c ON e.category_id = c.id
       LEFT JOIN accounts a ON e.account_id = a.id
       WHERE ${where}
       ORDER BY e.date ASC, e.id ASC`, params);
        // Calculate running balance
        let balance = 0;
        return rows.map((r) => {
            // Income adds, expenses/investments subtract
            if (r.type === 'income' || r.type === 'receivable') {
                balance += Number(r.amount);
            }
            else {
                balance -= Number(r.amount);
            }
            return {
                _id: r._id,
                date: r.date,
                type: r.type,
                amount: Number(r.amount),
                note: r.note,
                sector: r.sector,
                source: r.source,
                category: {
                    _id: r.category_id,
                    name: r.category_name,
                    icon: r.category_icon,
                    color: r.category_color,
                },
                account: r.account_id ? { _id: r.account_id, name: r.account_name, type: r.account_type } : undefined,
                runningBalance: balance,
            };
        });
    }
}
exports.MySQLSummaryRepository = MySQLSummaryRepository;
//# sourceMappingURL=summary.mysql.repo.js.map