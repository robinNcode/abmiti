import { v4 as uuid } from 'uuid';
import { getMySQLPool } from '../../database/mysql/connection';
import { ICategory, ICategoryInput, EntryType } from '../../../shared/types';
import { ICategoryRepository } from '../../../shared/types/repositories';

type CategoryRow = {
  id: string; user_id: string; name: string; icon: string; color: string;
  type: string; is_default: number; created_at: Date;
};

const toICategory = (row: CategoryRow): ICategory => ({
  _id:       row.id as any,
  user:      row.user_id as any,
  name:      row.name,
  icon:      row.icon,
  color:     row.color,
  type:      row.type as EntryType,
  isDefault: Boolean(row.is_default),
  createdAt: row.created_at,
} as unknown as ICategory);

export class MySQLCategoryRepository implements ICategoryRepository {
  private get pool() { return getMySQLPool(); }

  async findByUser(userId: string, type?: EntryType): Promise<ICategory[]> {
    const sql = type
      ? 'SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY is_default DESC, name ASC'
      : 'SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC';
    const params = type ? [userId, type] : [userId];
    const [rows] = await this.pool.execute<any[]>(sql, params);
    return rows.map(toICategory);
  }

  async findById(id: string): Promise<ICategory | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM categories WHERE id = ? LIMIT 1', [id],
    );
    return rows[0] ? toICategory(rows[0]) : null;
  }

  async findByUserAndId(userId: string, id: string): Promise<ICategory | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? LIMIT 1', [id, userId],
    );
    return rows[0] ? toICategory(rows[0]) : null;
  }

  async findByNameAndType(userId: string, name: string, type: EntryType): Promise<ICategory | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = ? LIMIT 1',
      [userId, name, type],
    );
    return rows[0] ? toICategory(rows[0]) : null;
  }

  async insertMany(docs: (ICategoryInput & { user: string })[]): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      for (const doc of docs) {
        await conn.execute(
          'INSERT IGNORE INTO categories (id, user_id, name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuid(), doc.user, doc.name, doc.icon, doc.color, doc.type, doc.isDefault ? 1 : 0],
        );
      }
    } finally {
      conn.release();
    }
  }

  async create(data: ICategoryInput & { user: string }): Promise<ICategory> {
    const id = uuid();
    await this.pool.execute(
      'INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.user, data.name, data.icon, data.color, data.type, data.isDefault ? 1 : 0],
    );
    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<{ name: string; icon: string; color: string }>): Promise<ICategory> {
    const fields: string[] = [];
    const vals:   any[] = [];
    if (data.name  !== undefined) { fields.push('name = ?');  vals.push(data.name); }
    if (data.icon  !== undefined) { fields.push('icon = ?');  vals.push(data.icon); }
    if (data.color !== undefined) { fields.push('color = ?'); vals.push(data.color); }
    if (fields.length) {
      vals.push(id);
      await this.pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, vals);
    }
    return (await this.findById(id))!;
  }

  async remove(id: string): Promise<void> {
    await this.pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  }
}
