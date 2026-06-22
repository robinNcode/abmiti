import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { getMySQLPool } from '../../database/mysql/connection';
import { IUser } from '../../../shared/types';
import { IUserRepository } from '../../../shared/types/repositories';

type UserRow = {
  id: string; name: string; email: string; password: string;
  budget: number; created_at: Date; updated_at: Date;
};

const toIUser = (row: UserRow): IUser => ({
  _id:       row.id  as any,
  name:      row.name,
  email:     row.email,
  password:  row.password,
  budget:    Number(row.budget),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  comparePassword: async (candidate: string) => bcrypt.compare(candidate, row.password),
} as unknown as IUser);

export class MySQLUserRepository implements IUserRepository {
  private get pool() { return getMySQLPool(); }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const cols = includePassword ? '*' : 'id, name, email, budget, created_at, updated_at';
    const [rows] = await this.pool.execute<any[]>(
      `SELECT ${cols} FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    return rows[0] ? toIUser(rows[0]) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT id, name, email, budget, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? toIUser(rows[0]) : null;
  }

  async create(data: { name: string; email: string; password: string }): Promise<IUser> {
    const id   = uuid();
    const hash = await bcrypt.hash(data.password, 12);
    await this.pool.execute(
      'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
      [id, data.name, data.email, hash],
    );
    return (await this.findById(id))!;
  }

  async updateBudget(id: string, budget: number): Promise<IUser | null> {
    await this.pool.execute('UPDATE users SET budget = ? WHERE id = ?', [budget, id]);
    return this.findById(id);
  }
}
