"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLCategoryRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../database/mysql/connection");
const toICategory = (row) => ({
    _id: row.id,
    user: row.user_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
});
class MySQLCategoryRepository {
    get pool() { return (0, connection_1.getMySQLPool)(); }
    async findByUser(userId, type) {
        const sql = type
            ? 'SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY is_default DESC, name ASC'
            : 'SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC';
        const params = type ? [userId, type] : [userId];
        const [rows] = await this.pool.execute(sql, params);
        return rows.map(toICategory);
    }
    async findById(id) {
        const [rows] = await this.pool.execute('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
        return rows[0] ? toICategory(rows[0]) : null;
    }
    async findByUserAndId(userId, id) {
        const [rows] = await this.pool.execute('SELECT * FROM categories WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
        return rows[0] ? toICategory(rows[0]) : null;
    }
    async findByNameAndType(userId, name, type) {
        const [rows] = await this.pool.execute('SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = ? LIMIT 1', [userId, name, type]);
        return rows[0] ? toICategory(rows[0]) : null;
    }
    async insertMany(docs) {
        const conn = await this.pool.getConnection();
        try {
            for (const doc of docs) {
                await conn.execute('INSERT IGNORE INTO categories (id, user_id, name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)', [(0, uuid_1.v4)(), doc.user, doc.name, doc.icon, doc.color, doc.type, doc.isDefault ? 1 : 0]);
            }
        }
        finally {
            conn.release();
        }
    }
    async create(data) {
        const id = (0, uuid_1.v4)();
        await this.pool.execute('INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, data.user, data.name, data.icon, data.color, data.type, data.isDefault ? 1 : 0]);
        return (await this.findById(id));
    }
    async update(id, data) {
        const fields = [];
        const vals = [];
        if (data.name !== undefined) {
            fields.push('name = ?');
            vals.push(data.name);
        }
        if (data.icon !== undefined) {
            fields.push('icon = ?');
            vals.push(data.icon);
        }
        if (data.color !== undefined) {
            fields.push('color = ?');
            vals.push(data.color);
        }
        if (fields.length) {
            vals.push(id);
            await this.pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, vals);
        }
        return (await this.findById(id));
    }
    async remove(id) {
        await this.pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    }
}
exports.MySQLCategoryRepository = MySQLCategoryRepository;
//# sourceMappingURL=category.mysql.repo.js.map