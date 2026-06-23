import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { randomUUID } from 'crypto';
import { getMySQLPool } from '../../database/mysql/connection';
import { IBudgetRepository } from '../../../shared/types/repositories';
import { IBudget, IBudgetInput, IBudgetLineInput, IEntry } from '../../../shared/types';

interface BudgetRow extends RowDataPacket {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_income: string;
  is_template: number;
  template_name?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface BudgetLineRow extends RowDataPacket {
  id: string;
  budget_id: string;
  name: string;
  icon: string;
  color: string;
  allocation_method: 'percentage' | 'fixed';
  allocation_value: string;
  sort_order: number;
  is_active: number;
  note?: string;
}

interface BudgetSubItemRow extends RowDataPacket {
  id: string;
  budget_line_id: string;
  name: string;
  expected_amount: string;
  note?: string;
}

interface IdRow extends RowDataPacket { id: string }

const toLineInput = (line: IBudgetLineInput, index: number): Required<Omit<IBudgetLineInput, 'note'>> & { note?: string } => ({
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

export class MySQLBudgetRepository implements IBudgetRepository {
  private get pool() { return getMySQLPool(); }

  private async hydrate(row: BudgetRow): Promise<IBudget> {
    const [lineRows] = await this.pool.query<BudgetLineRow[]>(
      'SELECT * FROM budget_lines WHERE budget_id = ? ORDER BY sort_order ASC',
      [row.id],
    );
    const lineIds = lineRows.map((line) => line.id);
    const [catRows] = lineIds.length
      ? await this.pool.query<(RowDataPacket & { budget_line_id: string; category_id: string })[]>(
        'SELECT * FROM budget_line_categories WHERE budget_line_id IN (?)',
        [lineIds],
      )
      : [[] as (RowDataPacket & { budget_line_id: string; category_id: string })[]];
    const [subRows] = lineIds.length
      ? await this.pool.query<BudgetSubItemRow[]>(
        'SELECT * FROM budget_sub_items WHERE budget_line_id IN (?)',
        [lineIds],
      )
      : [[] as BudgetSubItemRow[]];

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
    } as unknown as IBudget;
  }

  private async insertLines(budgetId: string, lines: IBudgetLineInput[]): Promise<void> {
    for (const [index, rawLine] of lines.entries()) {
      const line = toLineInput(rawLine, index);
      const lineId = randomUUID();
      await this.pool.query(
        `INSERT INTO budget_lines
         (id, budget_id, name, icon, color, allocation_method, allocation_value, sort_order, is_active, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lineId, budgetId, line.name, line.icon, line.color, line.allocationMethod, line.allocationValue, line.order, line.isActive, line.note ?? null],
      );
      for (const categoryId of line.linkedCategoryIds) {
        await this.pool.query(
          'INSERT INTO budget_line_categories (budget_line_id, category_id) VALUES (?, ?)',
          [lineId, categoryId],
        );
      }
      for (const subItem of line.subItems) {
        await this.pool.query(
          'INSERT INTO budget_sub_items (id, budget_line_id, name, expected_amount, note) VALUES (?, ?, ?, ?, ?)',
          [randomUUID(), lineId, subItem.name, subItem.expectedAmount, subItem.note ?? null],
        );
      }
    }
  }

  async create(userId: string, data: IBudgetInput): Promise<IBudget> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO budgets (id, user_id, month, year, total_income, is_template, template_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.month, data.year, data.totalIncome, data.isTemplate ?? false, data.templateName ?? null, data.notes ?? null],
    );
    await this.insertLines(id, data.lines ?? []);
    const budget = await this.findById(id, userId);
    return budget as IBudget;
  }

  async update(id: string, userId: string, data: Partial<IBudgetInput>): Promise<IBudget | null> {
    await this.pool.query(
      `UPDATE budgets
       SET total_income = COALESCE(?, total_income), notes = COALESCE(?, notes), template_name = COALESCE(?, template_name)
       WHERE id = ? AND user_id = ?`,
      [data.totalIncome ?? null, data.notes ?? null, data.templateName ?? null, id, userId],
    );
    if (data.lines) {
      await this.pool.query('DELETE FROM budget_lines WHERE budget_id = ?', [id]);
      await this.insertLines(id, data.lines);
    }
    return this.findById(id, userId);
  }

  async findById(id: string, userId: string): Promise<IBudget | null> {
    const [rows] = await this.pool.query<BudgetRow[]>('SELECT * FROM budgets WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
    return rows[0] ? this.hydrate(rows[0]) : null;
  }

  async findByMonth(userId: string, month: number, year: number, isTemplate = false): Promise<IBudget | null> {
    const [rows] = await this.pool.query<BudgetRow[]>(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? AND is_template = ? LIMIT 1',
      [userId, month, year, isTemplate],
    );
    return rows[0] ? this.hydrate(rows[0]) : null;
  }

  async findMany(userId: string, templatesOnly = false): Promise<IBudget[]> {
    const sql = templatesOnly
      ? 'SELECT * FROM budgets WHERE user_id = ? AND is_template = 1 ORDER BY updated_at DESC'
      : 'SELECT * FROM budgets WHERE user_id = ? ORDER BY is_template DESC, year DESC, month DESC';
    const [rows] = await this.pool.query<BudgetRow[]>(sql, [userId]);
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  async addLine(budgetId: string, userId: string, line: IBudgetLineInput): Promise<IBudget | null> {
    const budget = await this.findById(budgetId, userId);
    if (!budget) return null;
    await this.insertLines(budgetId, [line]);
    return this.findById(budgetId, userId);
  }

  async updateLine(budgetId: string, lineId: string, userId: string, line: Partial<IBudgetLineInput>): Promise<IBudget | null> {
    const budget = await this.findById(budgetId, userId);
    if (!budget) return null;
    await this.pool.query(
      `UPDATE budget_lines SET
       name = COALESCE(?, name), icon = COALESCE(?, icon), color = COALESCE(?, color),
       allocation_method = COALESCE(?, allocation_method), allocation_value = COALESCE(?, allocation_value),
       sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active), note = COALESCE(?, note)
       WHERE id = ? AND budget_id = ?`,
      [line.name ?? null, line.icon ?? null, line.color ?? null, line.allocationMethod ?? null, line.allocationValue ?? null, line.order ?? null, line.isActive ?? null, line.note ?? null, lineId, budgetId],
    );
    if (line.linkedCategoryIds) {
      await this.pool.query('DELETE FROM budget_line_categories WHERE budget_line_id = ?', [lineId]);
      for (const categoryId of line.linkedCategoryIds) {
        await this.pool.query('INSERT INTO budget_line_categories (budget_line_id, category_id) VALUES (?, ?)', [lineId, categoryId]);
      }
    }
    if (line.subItems) {
      await this.pool.query('DELETE FROM budget_sub_items WHERE budget_line_id = ?', [lineId]);
      for (const subItem of line.subItems) {
        await this.pool.query(
          'INSERT INTO budget_sub_items (id, budget_line_id, name, expected_amount, note) VALUES (?, ?, ?, ?, ?)',
          [randomUUID(), lineId, subItem.name, subItem.expectedAmount, subItem.note ?? null],
        );
      }
    }
    return this.findById(budgetId, userId);
  }

  async removeLine(budgetId: string, lineId: string, userId: string): Promise<IBudget | null> {
    const budget = await this.findById(budgetId, userId);
    if (!budget) return null;
    await this.pool.query('DELETE FROM budget_lines WHERE id = ? AND budget_id = ?', [lineId, budgetId]);
    return this.findById(budgetId, userId);
  }

  async reorderLines(budgetId: string, userId: string, order: string[]): Promise<IBudget | null> {
    const budget = await this.findById(budgetId, userId);
    if (!budget) return null;
    for (const [index, lineId] of order.entries()) {
      await this.pool.query('UPDATE budget_lines SET sort_order = ? WHERE id = ? AND budget_id = ?', [index, lineId, budgetId]);
    }
    return this.findById(budgetId, userId);
  }

  async findExpenseEntriesByCategories(userId: string, categoryIds: string[], start: Date, end: Date): Promise<IEntry[]> {
    if (!categoryIds.length) return [];
    const [rows] = await this.pool.query<(RowDataPacket & { id: string; amount: string; category_id: string })[]>(
      `SELECT id, user_id, type, amount, note, category_id, source, account_id, sector, date, parsed_from_sms, created_at, updated_at
       FROM entries
       WHERE user_id = ? AND type = 'expense' AND category_id IN (?) AND date BETWEEN ? AND ?`,
      [userId, categoryIds, start, end],
    );
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
    } as unknown as IEntry));
  }
}
