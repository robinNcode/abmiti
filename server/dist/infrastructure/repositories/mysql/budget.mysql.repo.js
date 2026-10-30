"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLBudgetRepository = void 0;
const crypto_1 = require("crypto");
const connection_1 = require("../../database/mysql/connection");
const toLineInput = (line, index) => ({
    name: line.name,
    icon: line.icon ?? '📦',
    color: line.color ?? '#4A7C59',
    allocationMethod: line.allocationMethod,
    allocationValue: line.allocationValue,
    linkedCategoryIds: line.linkedCategoryIds ?? [],
    subItems: line.subItems ?? [],
    order: line.order ?? index,
    isActive: line.isActive ?? true,
    note: line.note,
});
class MySQLBudgetRepository {
    get pool() { return (0, connection_1.getMySQLPool)(); }
    async hydrate(row) {
        const [lineRows] = await this.pool.query('SELECT * FROM budget_lines WHERE budget_id = ? ORDER BY sort_order ASC', [row.id]);
        const lineIds = lineRows.map((line) => line.id);
        const [catRows] = lineIds.length
            ? await this.pool.query('SELECT * FROM budget_line_categories WHERE budget_line_id IN (?)', [lineIds])
            : [[]];
        const [subRows] = lineIds.length
            ? await this.pool.query('SELECT * FROM budget_sub_items WHERE budget_line_id IN (?)', [lineIds])
            : [[]];
        return {
            _id: row.id,
            user: row.user_id,
            month: row.month,
            year: row.year,
            totalIncome: Number(row.total_income),
            isTemplate: Boolean(row.is_template),
            templateName: row.template_name,
            notes: row.notes,
            lines: lineRows.map((line) => ({
                _id: line.id,
                name: line.name,
                icon: line.icon,
                color: line.color,
                allocationMethod: line.allocation_method,
                allocationValue: Number(line.allocation_value),
                linkedCategoryIds: catRows.filter((cat) => cat.budget_line_id === line.id).map((cat) => cat.category_id),
                subItems: subRows.filter((sub) => sub.budget_line_id === line.id).map((sub) => ({
                    _id: sub.id,
                    name: sub.name,
                    expectedAmount: Number(sub.expected_amount),
                    note: sub.note,
                })),
                order: line.sort_order,
                isActive: Boolean(line.is_active),
                note: line.note,
            })),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async insertLines(budgetId, lines) {
        for (const [index, rawLine] of lines.entries()) {
            const line = toLineInput(rawLine, index);
            const lineId = (0, crypto_1.randomUUID)();
            await this.pool.query(`INSERT INTO budget_lines
         (id, budget_id, name, icon, color, allocation_method, allocation_value, sort_order, is_active, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [lineId, budgetId, line.name, line.icon, line.color, line.allocationMethod, line.allocationValue, line.order, line.isActive, line.note ?? null]);
            for (const categoryId of line.linkedCategoryIds) {
                await this.pool.query('INSERT INTO budget_line_categories (budget_line_id, category_id) VALUES (?, ?)', [lineId, categoryId]);
            }
            for (const subItem of line.subItems) {
                await this.pool.query('INSERT INTO budget_sub_items (id, budget_line_id, name, expected_amount, note) VALUES (?, ?, ?, ?, ?)', [(0, crypto_1.randomUUID)(), lineId, subItem.name, subItem.expectedAmount, subItem.note ?? null]);
            }
        }
    }
    async create(userId, data) {
        const id = (0, crypto_1.randomUUID)();
        await this.pool.query(`INSERT INTO budgets (id, user_id, month, year, total_income, is_template, template_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, userId, data.month, data.year, data.totalIncome, data.isTemplate ?? false, data.templateName ?? null, data.notes ?? null]);
        await this.insertLines(id, data.lines ?? []);
        const budget = await this.findById(id, userId);
        return budget;
    }
    async update(id, userId, data) {
        await this.pool.query(`UPDATE budgets
       SET total_income = COALESCE(?, total_income), notes = COALESCE(?, notes), template_name = COALESCE(?, template_name)
       WHERE id = ? AND user_id = ?`, [data.totalIncome ?? null, data.notes ?? null, data.templateName ?? null, id, userId]);
        if (data.lines) {
            await this.pool.query('DELETE FROM budget_lines WHERE budget_id = ?', [id]);
            await this.insertLines(id, data.lines);
        }
        return this.findById(id, userId);
    }
    async findById(id, userId) {
        const [rows] = await this.pool.query('SELECT * FROM budgets WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
        return rows[0] ? this.hydrate(rows[0]) : null;
    }
    async findByMonth(userId, month, year, isTemplate = false) {
        const [rows] = await this.pool.query('SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? AND is_template = ? LIMIT 1', [userId, month, year, isTemplate]);
        return rows[0] ? this.hydrate(rows[0]) : null;
    }
    async findMany(userId, templatesOnly = false) {
        const sql = templatesOnly
            ? 'SELECT * FROM budgets WHERE user_id = ? AND is_template = 1 ORDER BY updated_at DESC'
            : 'SELECT * FROM budgets WHERE user_id = ? ORDER BY is_template DESC, year DESC, month DESC';
        const [rows] = await this.pool.query(sql, [userId]);
        return Promise.all(rows.map((row) => this.hydrate(row)));
    }
    async remove(id, userId) {
        const [result] = await this.pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }
    async addLine(budgetId, userId, line) {
        const budget = await this.findById(budgetId, userId);
        if (!budget)
            return null;
        await this.insertLines(budgetId, [line]);
        return this.findById(budgetId, userId);
    }
    async updateLine(budgetId, lineId, userId, line) {
        const budget = await this.findById(budgetId, userId);
        if (!budget)
            return null;
        await this.pool.query(`UPDATE budget_lines SET
       name = COALESCE(?, name), icon = COALESCE(?, icon), color = COALESCE(?, color),
       allocation_method = COALESCE(?, allocation_method), allocation_value = COALESCE(?, allocation_value),
       sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active), note = COALESCE(?, note)
       WHERE id = ? AND budget_id = ?`, [line.name ?? null, line.icon ?? null, line.color ?? null, line.allocationMethod ?? null, line.allocationValue ?? null, line.order ?? null, line.isActive ?? null, line.note ?? null, lineId, budgetId]);
        if (line.linkedCategoryIds) {
            await this.pool.query('DELETE FROM budget_line_categories WHERE budget_line_id = ?', [lineId]);
            for (const categoryId of line.linkedCategoryIds) {
                await this.pool.query('INSERT INTO budget_line_categories (budget_line_id, category_id) VALUES (?, ?)', [lineId, categoryId]);
            }
        }
        if (line.subItems) {
            await this.pool.query('DELETE FROM budget_sub_items WHERE budget_line_id = ?', [lineId]);
            for (const subItem of line.subItems) {
                await this.pool.query('INSERT INTO budget_sub_items (id, budget_line_id, name, expected_amount, note) VALUES (?, ?, ?, ?, ?)', [(0, crypto_1.randomUUID)(), lineId, subItem.name, subItem.expectedAmount, subItem.note ?? null]);
            }
        }
        return this.findById(budgetId, userId);
    }
    async removeLine(budgetId, lineId, userId) {
        const budget = await this.findById(budgetId, userId);
        if (!budget)
            return null;
        await this.pool.query('DELETE FROM budget_lines WHERE id = ? AND budget_id = ?', [lineId, budgetId]);
        return this.findById(budgetId, userId);
    }
    async reorderLines(budgetId, userId, order) {
        const budget = await this.findById(budgetId, userId);
        if (!budget)
            return null;
        for (const [index, lineId] of order.entries()) {
            await this.pool.query('UPDATE budget_lines SET sort_order = ? WHERE id = ? AND budget_id = ?', [index, lineId, budgetId]);
        }
        return this.findById(budgetId, userId);
    }
    async findExpenseEntriesByCategories(userId, categoryIds, start, end) {
        if (!categoryIds.length)
            return [];
        const [rows] = await this.pool.query(`SELECT id, user_id, type, amount, note, category_id, source, account_id, sector, date, parsed_from_sms, created_at, updated_at
       FROM entries
       WHERE user_id = ? AND type = 'expense' AND category_id IN (?) AND date BETWEEN ? AND ?`, [userId, categoryIds, start, end]);
        return rows.map((row) => ({
            _id: row.id,
            user: row.user_id,
            type: 'expense',
            amount: Number(row.amount),
            note: row.note,
            category: row.category_id,
            source: row.source,
            account: row.account_id,
            sector: row.sector,
            date: row.date,
            parsedFromSms: Boolean(row.parsed_from_sms),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }
}
exports.MySQLBudgetRepository = MySQLBudgetRepository;
//# sourceMappingURL=budget.mysql.repo.js.map