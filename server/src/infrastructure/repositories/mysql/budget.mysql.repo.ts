import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { randomUUID } from 'crypto';
import { getMySQLPool } from '../../database/mysql/connection';
import { IBudgetRepository } from '../../../shared/types/repositories';
import { IBudget, IBudgetInput, IBudgetLineInput, IEntry } from '../../../shared/types';
import { transformUserData } from '../../../shared/utils/userDataEncryption';

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

  private async hydrate(source: BudgetRow, userId: string): Promise<IBudget> {
    const row = transformUserData(userId, source, false);
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

    const lines = lineRows.map((sourceLine) => {
      const line = transformUserData(userId, sourceLine, false);
      return {
        _id: line.id,
        name: line.name,
        icon: line.icon,
        color: line.color,
        allocationMethod: line.allocation_method,
        allocationValue: Number(line.allocation_value),
        linkedCategoryIds: catRows.filter((cat) => cat.budget_line_id === line.id).map((cat) => cat.category_id),
        subItems: subRows.filter((sub) => sub.budget_line_id === line.id).map((sourceSub) => {
          const sub = transformUserData(userId, sourceSub, false);
          return {
            _id: sub.id,
            name: sub.name,
            expectedAmount: Number(sub.expected_amount),
            note: sub.note,
          };
        }),
        order: line.sort_order,
        isActive: Boolean(line.is_active),
        note: line.note,
      };
    });

    return {
      _id: row.id,
      user: row.user_id,
      month: row.month,
      year: row.year,
      totalIncome: Number(row.total_income),
      isTemplate: Boolean(row.is_template),
      templateName: row.template_name,
      notes: row.notes,
      lines,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as unknown as IBudget;
  }

  private async insertLines(budgetId: string, userId: string, lines: IBudgetLineInput[]): Promise<void> {
    for (const [index, rawLine] of lines.entries()) {
      const line = transformUserData(userId, toLineInput(rawLine, index), true);
      const lineId = randomUUID();
      await this.pool.query(
        `INSERT INTO budget_lines
         (id, budget_id, name, icon, color, allocation_method, allocation_value, sort_order, is_active, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lineId, budgetId, line.name, line.icon, line.color, line.allocationMethod, line.allocationValue, line.order, line.isActive, line.note ?? null],
      );
      for (const categoryId of line.linkedCategoryIds) {
        await this.pool.query(
          'INSERT IGNORE INTO budget_line_categories (budget_line_id, budget_id, category_id) VALUES (?, ?, ?)',
          [lineId, budgetId, categoryId],
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
    const encrypted = transformUserData(userId, data, true);
    await this.pool.query(
      `INSERT INTO budgets (id, user_id, month, year, total_income, is_template, template_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.month, data.year, data.totalIncome, data.isTemplate ?? false, encrypted.templateName ?? null, encrypted.notes ?? null],
    );
    await this.insertLines(id, userId, data.lines ?? []);
    const budget = await this.findById(id, userId);
    return budget as IBudget;
  }

  async update(id: string, userId: string, data: Partial<IBudgetInput>): Promise<IBudget | null> {
    const encrypted = transformUserData(userId, data, true);
    await this.pool.query(
      `UPDATE budgets
       SET total_income = COALESCE(?, total_income), notes = COALESCE(?, notes), template_name = COALESCE(?, template_name)
       WHERE id = ? AND user_id = ?`,
      [data.totalIncome ?? null, encrypted.notes ?? null, encrypted.templateName ?? null, id, userId],
    );
    if (data.lines) {
      await this.pool.query('DELETE FROM budget_lines WHERE budget_id = ?', [id]);
      await this.insertLines(id, userId, data.lines);
    }
    return this.findById(id, userId);
  }

  async findById(id: string, userId: string): Promise<IBudget | null> {
    const [rows] = await this.pool.query<BudgetRow[]>('SELECT * FROM budgets WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
    return rows[0] ? this.hydrate(rows[0], userId) : null;
  }

  async findByMonth(userId: string, month: number, year: number, isTemplate = false): Promise<IBudget | null> {
    const [rows] = await this.pool.query<BudgetRow[]>(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? AND is_template = ? LIMIT 1',
      [userId, month, year, isTemplate],
    );
    return rows[0] ? this.hydrate(rows[0], userId) : null;
  }

  async findMany(userId: string, templatesOnly = false): Promise<IBudget[]> {
    const sql = templatesOnly
      ? 'SELECT * FROM budgets WHERE user_id = ? AND is_template = 1 ORDER BY updated_at DESC'
      : 'SELECT * FROM budgets WHERE user_id = ? ORDER BY is_template DESC, year DESC, month DESC';
    const [rows] = await this.pool.query<BudgetRow[]>(sql, [userId]);
    return Promise.all(rows.map((row) => this.hydrate(row, userId)));
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  async addLine(budgetId: string, userId: string, line: IBudgetLineInput): Promise<IBudget | null> {
    const budget = await this.findById(budgetId, userId);
    if (!budget) return null;
    await this.insertLines(budgetId, userId, [line]);
    return this.findById(budgetId, userId);
  }

  async updateLine(budgetId: string, lineId: string, userId: string, line: Partial<IBudgetLineInput>): Promise<IBudget | null> {
    const budget = await this.findById(budgetId, userId);
    if (!budget) return null;
    const encrypted = transformUserData(userId, line, true);
    await this.pool.query(
      `UPDATE budget_lines SET
       name = COALESCE(?, name), icon = COALESCE(?, icon), color = COALESCE(?, color),
       allocation_method = COALESCE(?, allocation_method), allocation_value = COALESCE(?, allocation_value),
       sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active), note = COALESCE(?, note)
       WHERE id = ? AND budget_id = ?`,
      [encrypted.name ?? null, line.icon ?? null, line.color ?? null, line.allocationMethod ?? null, line.allocationValue ?? null, line.order ?? null, line.isActive ?? null, encrypted.note ?? null, lineId, budgetId],
    );
    if (line.linkedCategoryIds) {
      await this.pool.query('DELETE FROM budget_line_categories WHERE budget_line_id = ?', [lineId]);
      for (const categoryId of line.linkedCategoryIds) {
        await this.pool.query(
          'INSERT IGNORE INTO budget_line_categories (budget_line_id, budget_id, category_id) VALUES (?, ?, ?)',
          [lineId, budgetId, categoryId],
        );
      }
    }
    if (line.subItems) {
      await this.pool.query('DELETE FROM budget_sub_items WHERE budget_line_id = ?', [lineId]);
      for (const subItem of line.subItems) {
        const encryptedSubItem = transformUserData(userId, subItem, true);
        await this.pool.query(
          'INSERT INTO budget_sub_items (id, budget_line_id, name, expected_amount, note) VALUES (?, ?, ?, ?, ?)',
          [randomUUID(), lineId, encryptedSubItem.name, subItem.expectedAmount, encryptedSubItem.note ?? null],
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
       WHERE user_id = ? AND type IN ('expense','savings','investment') AND category_id IN (?) AND date BETWEEN ? AND ?`,
      [userId, categoryIds, start, end],
    );
    return rows.map((source) => {
      const row = transformUserData(userId, source, false);
      return ({
      _id: row.id,
      user: row.user_id,
      type: row.type,
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
      } as unknown as IEntry);
    });
  }

  async findOutflowEntriesForMonth(userId: string, start: Date, end: Date): Promise<IEntry[]> {
    const [rows] = await this.pool.query<(RowDataPacket & {
      id: string;
      user_id: string;
      type: string;
      amount: string;
      note?: string | null;
      category_id: string;
      source: string;
      account_id?: string | null;
      sector?: string | null;
      date: Date;
      parsed_from_sms: number;
      created_at: Date;
      updated_at: Date;
    })[]>(
      `SELECT id, user_id, type, amount, note, category_id, source, account_id, sector, date, parsed_from_sms, created_at, updated_at
       FROM entries
       WHERE user_id = ? AND type IN ('expense','savings','investment') AND date BETWEEN ? AND ?
       ORDER BY date DESC, created_at DESC`,
      [userId, start, end],
    );
    return rows.map((source) => {
      const row = transformUserData(userId, source, false);
      return ({
      _id: row.id,
      user: row.user_id,
      type: row.type,
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
      } as unknown as IEntry);
    });
  }

  async getAggregatesForMonth(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<{ actualIncome: number; categorySpends: { categoryId: string; amount: number }[]; totalOutflow: number }> {
    // Income
    const [incRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE user_id = ? AND type = 'income' AND date BETWEEN ? AND ?`,
      [userId, start, end],
    );
    const actualIncome = Number(incRows[0]?.total ?? 0);

    // Category-level outflow aggregation (expense + savings + investment)
    const [catRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT category_id AS categoryId, SUM(amount) AS amount
       FROM entries
       WHERE user_id = ? AND type IN ('expense','savings','investment') AND date BETWEEN ? AND ?
       GROUP BY category_id`,
      [userId, start, end],
    );
    const categorySpends = catRows.map((r) => ({ categoryId: r.categoryId as string, amount: Number(r.amount) }));

    const [outRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE user_id = ? AND type IN ('expense','savings','investment') AND date BETWEEN ? AND ?`,
      [userId, start, end],
    );
    const totalOutflow = Number(outRows[0]?.total ?? 0);

    return { actualIncome, categorySpends, totalOutflow };
  }

  async findLineEntriesPaginated(
    userId: string,
    filters: {
      start: Date;
      end: Date;
      categoryIds?: string[];
      subItemNames?: string[];
      unmappedCategoryIds?: string[];
      unmappedSubItemNames?: string[];
      isUnbudgeted?: boolean;
    },
    page: number,
    limit: number,
  ): Promise<{ data: IEntry[]; total: number; page: number; totalPages: number }> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM entries e
       LEFT JOIN categories c ON c.id = e.category_id
       WHERE e.user_id = ? AND e.type IN ('expense','savings','investment') AND e.date BETWEEN ? AND ?
       ORDER BY e.date DESC, e.created_at DESC`,
      [userId, filters.start, filters.end],
    );
    const entries = rows.map((source) => {
      const row = transformUserData(userId, source, false);
      return {
        _id: row.id,
        user: row.user_id,
        type: row.type,
        amount: Number(row.amount),
        note: row.note,
        category: {
          _id: row.category_id,
          name: row.category_name,
          icon: row.category_icon,
          color: row.category_color,
        },
        source: row.source,
        account: row.account_id,
        sector: row.sector,
        date: row.date,
        parsedFromSms: Boolean(row.parsed_from_sms),
        createdAt: row.created_at,
      } as unknown as IEntry;
    });
    const normalize = (value: string): string => value.trim().toLowerCase();
    const categoryId = (entry: IEntry): string =>
      String((entry.category as unknown as { _id?: unknown })._id ?? '');
    const unmappedCategories = filters.unmappedCategoryIds ?? [];
    const unmappedNames = (filters.unmappedSubItemNames ?? []).map(normalize);
    const mappedCategories = filters.categoryIds ?? [];
    const mappedNames = (filters.subItemNames ?? []).map(normalize);
    const filtered = entries.filter((entry) => {
      const matchesCategory = (ids: string[]) => ids.includes(categoryId(entry));
      const matchesNote = (names: string[]) => names.includes(normalize(entry.note ?? ''));
      if (filters.isUnbudgeted) {
        return (!unmappedCategories.length || !matchesCategory(unmappedCategories)) &&
          (!unmappedNames.length || !matchesNote(unmappedNames));
      }
      return matchesCategory(mappedCategories) || matchesNote(mappedNames);
    });
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    return { data: filtered.slice(offset, offset + limit), total, page, totalPages };
  }
}
