"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLUserRepository = void 0;
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = require("../../database/mysql/connection");
const toIUser = (row) => ({
    _id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    budget: Number(row.budget),
    avatar: row.avatar,
    google_id: row.google_id,
    userType: row.user_type ?? 'user',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comparePassword: async (candidate) => row.password ? bcryptjs_1.default.compare(candidate, row.password) : false,
});
class MySQLUserRepository {
    get pool() { return (0, connection_1.getMySQLPool)(); }
    async findByEmail(email, includePassword = false) {
        const cols = includePassword
            ? '*'
            : 'id, name, email, budget, avatar, google_id, user_type, created_at, updated_at';
        const [rows] = await this.pool.execute(`SELECT ${cols} FROM users WHERE email = ? LIMIT 1`, [email]);
        return rows[0] ? toIUser(rows[0]) : null;
    }
    async findById(id) {
        const [rows] = await this.pool.execute('SELECT id, name, email, budget, avatar, google_id, user_type, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [id]);
        return rows[0] ? toIUser(rows[0]) : null;
    }
    async create(data) {
        const id = (0, uuid_1.v4)();
        const hash = await bcryptjs_1.default.hash(data.password, 12);
        await this.pool.execute('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [id, data.name, data.email, hash]);
        return (await this.findById(id));
    }
    async updateBudget(id, budget) {
        await this.pool.execute('UPDATE users SET budget = ? WHERE id = ?', [budget, id]);
        return this.findById(id);
    }
    async updateProfile(id, data) {
        const updates = [];
        const params = [];
        if (data.name !== undefined) {
            updates.push('name = ?');
            params.push(data.name);
        }
        if (data.avatar !== undefined) {
            updates.push('avatar = ?');
            params.push(data.avatar);
        }
        if (updates.length === 0)
            return this.findById(id);
        params.push(id);
        await this.pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        return this.findById(id);
    }
    async findByGoogleId(googleId) {
        const [rows] = await this.pool.execute('SELECT id, name, email, budget, avatar, google_id, user_type, created_at, updated_at FROM users WHERE google_id = ? LIMIT 1', [googleId]);
        return rows[0] ? toIUser(rows[0]) : null;
    }
    async createFromGoogle(data) {
        const id = (0, uuid_1.v4)();
        await this.pool.execute('INSERT INTO users (id, name, email, password, google_id, avatar) VALUES (?, ?, ?, NULL, ?, ?)', [id, data.name, data.email, data.googleId, data.avatar ?? null]);
        return (await this.findById(id));
    }
    async linkGoogleId(userId, googleId) {
        await this.pool.execute('UPDATE users SET google_id = ? WHERE id = ? AND google_id IS NULL', [googleId, userId]);
        return this.findById(userId);
    }
}
exports.MySQLUserRepository = MySQLUserRepository;
//# sourceMappingURL=user.mysql.repo.js.map