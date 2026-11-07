import { container } from '../../container';
import {
  IBudget,
  IBudgetInput,
  IBudgetLine,
  IBudgetLineInput,
  IBudgetLineSummary,
  IBudgetSummary,
  IEntry,
} from '../../shared/types';
import { AppError } from '../../shared/utils/errors';

export const defaultBudgetLines: IBudgetLineInput[] = [
  {
    name: 'Living Cost',
    icon: '🏠',
    color: '#4A7C59',
    allocationMethod: 'percentage',
    allocationValue: 50,
    order: 0,
    note: 'Family expenses: rent, food, utilities, education',
    subItems: [
      { name: 'Home Rent', expectedAmount: 0 },
      { name: 'Electricity Bill', expectedAmount: 0 },
      { name: 'Gas Bill', expectedAmount: 0 },
      { name: 'College Fee', expectedAmount: 0 },
      { name: 'Groceries', expectedAmount: 0 },
    ],
  },
  { name: 'Investment', icon: '📈', color: '#2563EB', allocationMethod: 'percentage', allocationValue: 25, order: 1, note: 'Land, gold, business, skill development' },
  { name: 'Wife Expenses', icon: '💝', color: '#DB2777', allocationMethod: 'percentage', allocationValue: 10, order: 2, note: 'Spouse allowance and personal needs' },
  { name: 'Fun / Entertainment', icon: '🎉', color: '#D4973E', allocationMethod: 'percentage', allocationValue: 5, order: 3, note: 'Leisure, dining out, travel' },
  { name: 'Emergency Fund', icon: '🛡️', color: '#0F766E', allocationMethod: 'percentage', allocationValue: 5, order: 4, note: 'Savings buffer' },
  { name: 'Charity (Sadaqah)', icon: '🤲', color: '#7C3AED', allocationMethod: 'percentage', allocationValue: 5, order: 5, note: 'Optional; zakat, donations' },
];

const sortLines = (budget: IBudget): IBudget => {
  budget.lines = [...budget.lines].sort((a, b) => a.order - b.order);
  return budget;
};

const ensureBudget = (budget: IBudget | null): IBudget => {
  if (!budget) throw new AppError('Budget not found or unauthorized', 404);
  return sortLines(budget);
};

import {
  computeBudgetAnalysis,
  calculateForecast,
  BudgetAnalysisResult,
  ForecastResult,
  HistoricalMonthData,
  UpcomingMonthPlan,
  BudgetLineInputData,
  BudgetLineLookup,
  buildLineLookup,
  normalizeEntryName,
  resolveEntryLineId,
} from './budget-math';

const lineCategoryIds = (lines: IBudgetLine[]): string[] => (
  lines.flatMap((line) => line.linkedCategoryIds.map((id) => id.toString()))
);

/** Matching input for a budget line: linked categories plus sub-item names. */
const toLookupLine = (line: IBudgetLine): BudgetLineInputData => ({
  id: line._id.toString(),
  name: line.name,
  allocationMethod: line.allocationMethod,
  allocationValue: line.allocationValue,
  linkedCategoryIds: (line.linkedCategoryIds ?? []).map((id) => id.toString()),
  subItemNames: (line.subItems ?? []).map((item) => item.name),
});

/** Normalized sub-item names of the given lines, used for note matching. */
const lineSubItemNames = (lines: IBudgetLine[]): string[] => (
  Array.from(new Set(
    lines
      .flatMap((line) => (line.subItems ?? []).map((item) => normalizeEntryName(item.name)))
      .filter(Boolean),
  ))
);

/** Entry category id, whether the repository returned an id or a populated object. */
const entryCategoryId = (entry: IEntry): string => {
  const category = entry.category as unknown;
  if (!category) return '';
  if (typeof category === 'string') return category;
  if (typeof category === 'object' && '_id' in (category as Record<string, unknown>)) {
    return String((category as { _id: unknown })._id);
  }
  return String(category);
};

const assertUniqueLinkedCategories = (lines: Array<{ linkedCategoryIds?: Array<{ toString(): string }> }>): void => {
  const seen = new Set<string>();
  for (const line of lines) {
    for (const id of line.linkedCategoryIds ?? []) {
      const key = id.toString();
      if (seen.has(key)) throw new AppError('A category can be linked to only one budget line', 400);
      seen.add(key);
    }
  }
};

const assertValidPercentages = (lines: Array<{ allocationMethod?: string; allocationValue?: number }>): void => {
  const pctSum = lines
    .filter((l) => l.allocationMethod === 'percentage')
    .reduce((sum, l) => sum + (Number(l.allocationValue) || 0), 0);
  if (pctSum > 100.001) {
    throw new AppError('Total percentage allocation cannot exceed 100%', 400);
  }
};

const isTemplateDuplicateError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const dbError = error as {
    code?: unknown;
    message?: unknown;
    keyPattern?: Record<string, unknown>;
  };
  if (dbError.code === 'ER_DUP_ENTRY') {
    return typeof dbError.message === 'string' && dbError.message.includes('uq_user_month_year_template');
  }
  const keyPattern = dbError.keyPattern;
  if (dbError.code !== 11000 || !keyPattern) return false;
  return ['user', 'month', 'year', 'isTemplate'].every((key) => key in keyPattern);
};

export const budgetService = {
  resolvePlannedAmount(line: Pick<IBudgetLine, 'allocationMethod' | 'allocationValue'>, totalIncome: number): number {
    return line.allocationMethod === 'percentage'
      ? Number(((totalIncome * line.allocationValue) / 100).toFixed(2))
      : Number(line.allocationValue.toFixed(2));
  },

  async create(userId: string, data: IBudgetInput) {
    assertUniqueLinkedCategories(data.lines ?? []);
    if (data.lines) assertValidPercentages(data.lines);
    return sortLines(await container.budgetRepo.create(userId, data));
  },

  async buildDefaultLinesWithCategories(userId: string): Promise<IBudgetLineInput[]> {
    let categories = await container.categoryRepo.findByUser(userId, 'expense');
    if (categories.length === 0) {
      const { entryService } = await import('../entry/entry.service');
      await entryService.seedUserDefaults(userId);
      categories = await container.categoryRepo.findByUser(userId, 'expense');
    }

    const catMap = new Map<string, string>();
    for (const cat of categories) {
      catMap.set(cat.name.toLowerCase().trim(), String(cat._id));
    }

    const nameToCats: Record<string, string[]> = {
      'living cost': ['home', 'food', 'utility', 'education'],
      'investment': ['loan'],
      'wife expenses': ['shopping'],
      'fun / entertainment': ['entertainment', 'travel'],
      'emergency fund': ['health'],
      'charity (sadaqah)': ['other'],
    };

    return defaultBudgetLines.map((line) => {
      const targetNames = nameToCats[line.name.toLowerCase().trim()] ?? [];
      const linkedCategoryIds: string[] = [];
      for (const tName of targetNames) {
        const id = catMap.get(tName);
        if (id) linkedCategoryIds.push(id);
      }
      return {
        ...line,
        linkedCategoryIds,
      };
    });
  },

  async autoLinkBudgetLines(userId: string, budget: IBudget): Promise<IBudget> {
    const categories = await container.categoryRepo.findByUser(userId, 'expense');
    if (categories.length === 0) return budget;

    const catMap = new Map<string, string>();
    for (const cat of categories) {
      catMap.set(cat.name.toLowerCase().trim(), String(cat._id));
    }

    const nameToCats: Record<string, string[]> = {
      'living cost': ['home', 'food', 'utility', 'education'],
      'investment': ['loan'],
      'wife expenses': ['shopping'],
      'fun / entertainment': ['entertainment', 'travel'],
      'emergency fund': ['health'],
      'charity (sadaqah)': ['other'],
    };

    const alreadyLinked = new Set<string>();
    for (const line of budget.lines) {
      for (const cid of line.linkedCategoryIds ?? []) {
        alreadyLinked.add(String(cid));
      }
    }

    for (const line of budget.lines) {
      if (!line.linkedCategoryIds || line.linkedCategoryIds.length === 0) {
        const targetNames = nameToCats[line.name.toLowerCase().trim()] ?? [];
        const toLink: string[] = [];
        for (const tName of targetNames) {
          const id = catMap.get(tName);
          if (id && !alreadyLinked.has(id)) {
            toLink.push(id);
            alreadyLinked.add(id);
          }
        }
        if (toLink.length > 0) {
          line.linkedCategoryIds = toLink as any;
          await container.budgetRepo.updateLine(String(budget._id), String(line._id), userId, {
            linkedCategoryIds: toLink,
          });
        }
      }
    }
    return budget;
  },

  async seedDefaultBudget(userId: string, month: number, year: number, totalIncome = 0) {
    const lines = await this.buildDefaultLinesWithCategories(userId);
    return this.create(userId, {
      month,
      year,
      totalIncome,
      lines,
      isTemplate: false,
      templateName: 'Halal 50/25/10/5/5/5 Budget',
    });
  },

  async getByMonth(userId: string, month: number, year: number) {
    let existing = await container.budgetRepo.findByMonth(userId, month, year, false);
    if (!existing) {
      return this.seedDefaultBudget(userId, month, year);
    }
    const hasUnlinked = existing.lines.some((l) => !l.linkedCategoryIds || l.linkedCategoryIds.length === 0);
    if (hasUnlinked) {
      existing = await this.autoLinkBudgetLines(userId, existing);
    }
    return sortLines(existing);
  },

  async update(userId: string, id: string, data: Partial<IBudgetInput>) {
    if (data.lines) {
      assertUniqueLinkedCategories(data.lines);
      assertValidPercentages(data.lines);
    }
    return ensureBudget(await container.budgetRepo.update(id, userId, data));
  },

  async list(userId: string) {
    return (await container.budgetRepo.findMany(userId, false)).map(sortLines);
  },

  async remove(userId: string, id: string) {
    const success = await container.budgetRepo.remove(id, userId);
    if (!success) throw new AppError('Budget not found or unauthorized', 404);
  },

  async copy(userId: string, id: string, toMonth: number, toYear: number) {
    const source = ensureBudget(await container.budgetRepo.findById(id, userId));
    return this.create(userId, {
      month: toMonth,
      year: toYear,
      totalIncome: source.totalIncome,
      notes: source.notes,
      lines: source.lines.map((line) => ({
        name: line.name,
        icon: line.icon,
        color: line.color,
        allocationMethod: line.allocationMethod,
        allocationValue: line.allocationValue,
        linkedCategoryIds: line.linkedCategoryIds.map((catId) => catId.toString()),
        subItems: line.subItems,
        order: line.order,
        isActive: line.isActive,
        note: line.note,
      })),
    });
  },

  async addLine(userId: string, budgetId: string, line: IBudgetLineInput) {
    const current = ensureBudget(await container.budgetRepo.findById(budgetId, userId));
    assertUniqueLinkedCategories([...current.lines, line]);
    assertValidPercentages([...current.lines, line]);
    return ensureBudget(await container.budgetRepo.addLine(budgetId, userId, line));
  },

  async updateLine(userId: string, budgetId: string, lineId: string, line: Partial<IBudgetLineInput>) {
    const current = ensureBudget(await container.budgetRepo.findById(budgetId, userId));
    const merged = current.lines.map((item) => (
      item._id.toString() === lineId ? { ...item, ...line } : item
    ));
    assertUniqueLinkedCategories(merged);
    assertValidPercentages(merged);
    return ensureBudget(await container.budgetRepo.updateLine(budgetId, lineId, userId, line));
  },

  async removeLine(userId: string, budgetId: string, lineId: string) {
    return ensureBudget(await container.budgetRepo.removeLine(budgetId, lineId, userId));
  },

  async reorderLines(userId: string, budgetId: string, order: string[]) {
    return ensureBudget(await container.budgetRepo.reorderLines(budgetId, userId, order));
  },

  async templates(userId: string) {
    return (await container.budgetRepo.findMany(userId, true)).map(sortLines);
  },

  async saveAsTemplate(userId: string, id: string, templateName?: string) {
    const source = ensureBudget(await container.budgetRepo.findById(id, userId));
    const existingTemplate = await container.budgetRepo.findByMonth(userId, source.month, source.year, true);
    if (existingTemplate) throw new AppError('A template already exists for this month.', 409);

    try {
      return await this.create(userId, {
        month: source.month,
        year: source.year,
        totalIncome: source.totalIncome,
        isTemplate: true,
        templateName: templateName ?? source.templateName ?? `${source.month}/${source.year} Budget`,
        notes: source.notes,
        lines: source.lines.map((line) => ({
          name: line.name,
          icon: line.icon,
          color: line.color,
          allocationMethod: line.allocationMethod,
          allocationValue: line.allocationValue,
          linkedCategoryIds: line.linkedCategoryIds.map((catId) => catId.toString()),
          subItems: line.subItems,
          order: line.order,
          isActive: line.isActive,
          note: line.note,
        })),
      });
    } catch (error) {
      if (isTemplateDuplicateError(error)) {
        throw new AppError('A template already exists for this month.', 409);
      }
      throw error;
    }
  },

  async fromTemplate(userId: string, templateId: string, month: number, year: number) {
    const template = ensureBudget(await container.budgetRepo.findById(templateId, userId));
    if (!template.isTemplate) throw new AppError('Budget is not a template', 400);
    return this.copy(userId, templateId, month, year);
  },

  async deleteTemplate(userId: string, id: string) {
    const template = ensureBudget(await container.budgetRepo.findById(id, userId));
    if (!template.isTemplate) throw new AppError('Budget is not a template', 400);
    await this.remove(userId, id);
  },

  computeLineSummary(budget: IBudget, line: IBudgetLine, entries: IEntry[], lookup: BudgetLineLookup): IBudgetLineSummary {
    const plannedAmount = this.resolvePlannedAmount(line, budget.totalIncome);
    const lineId = line._id.toString();
    const lineEntries = entries.filter((entry) => (
      resolveEntryLineId({ categoryId: entryCategoryId(entry), note: entry.note }, lookup) === lineId
    ));
    const actualAmount = lineEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const usedPercent = plannedAmount > 0 ? Number(((actualAmount / plannedAmount) * 100).toFixed(2)) : 0;
    const status = actualAmount === 0 ? 'unused' : usedPercent > 100 ? 'over_budget' : usedPercent > 80 ? 'warning' : 'on_track';

    const subItems = (line.subItems ?? []).map((item) => {
      const key = normalizeEntryName(item.name);
      const subItemActual = key
        ? lineEntries
          .filter((entry) => normalizeEntryName(entry.note) === key)
          .reduce((sum, entry) => sum + entry.amount, 0)
        : 0;
      return {
        ...item,
        actualAmount: Number(subItemActual.toFixed(2)),
        variance: Number((item.expectedAmount - subItemActual).toFixed(2)),
      };
    });

    return {
      lineId,
      name: line.name,
      icon: line.icon,
      color: line.color,
      plannedAmount,
      actualAmount,
      variance: Number((plannedAmount - actualAmount).toFixed(2)),
      usedPercent,
      status,
      subItems,
    };
  },

  async summary(userId: string, id: string): Promise<IBudgetSummary> {
    const budget = ensureBudget(await container.budgetRepo.findById(id, userId));
    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);
    const entries = await container.budgetRepo.findOutflowEntriesForMonth(userId, start, end);
    const activeLines = budget.lines.filter((line) => line.isActive);
    const lookup = buildLineLookup(activeLines.map(toLookupLine));
    const lines = activeLines.map((line) => this.computeLineSummary(budget, line, entries, lookup));
    const totalPlanned = lines.reduce((sum, line) => sum + line.plannedAmount, 0);
    const totalActual = lines.reduce((sum, line) => sum + line.actualAmount, 0);
    return {
      budgetId: budget._id.toString(),
      totalIncome: budget.totalIncome,
      totalPlanned: Number(totalPlanned.toFixed(2)),
      totalActual: Number(totalActual.toFixed(2)),
      totalVariance: Number((totalPlanned - totalActual).toFixed(2)),
      allocationPercent: budget.totalIncome > 0 ? Number(((totalPlanned / budget.totalIncome) * 100).toFixed(2)) : 0,
      lines,
    };
  },

  async lineEntries(userId: string, budgetId: string, lineId: string) {
    const budget = ensureBudget(await container.budgetRepo.findById(budgetId, userId));
    const line = budget.lines.find((item) => item._id.toString() === lineId);
    if (!line) throw new AppError('Budget line not found', 404);
    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);
    const entries = await container.budgetRepo.findOutflowEntriesForMonth(userId, start, end);
    const lookup = buildLineLookup([toLookupLine(line)]);
    return entries.filter((entry) => (
      resolveEntryLineId({ categoryId: entryCategoryId(entry), note: entry.note }, lookup) === lineId
    ));
  },

  async analysis(userId: string, id: string): Promise<BudgetAnalysisResult> {
    const budget = ensureBudget(await container.budgetRepo.findById(id, userId));
    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);

    const [aggregates, entries] = await Promise.all([
      container.budgetRepo.getAggregatesForMonth(userId, start, end),
      container.budgetRepo.findOutflowEntriesForMonth(userId, start, end),
    ]);

    const linesInput: BudgetLineInputData[] = budget.lines
      .filter((l) => l.isActive)
      .map(toLookupLine);

    const entriesInput = entries.map((entry, idx) => ({
      id: `entry-${idx}`,
      amount: entry.amount,
      type: entry.type,
      categoryId: entryCategoryId(entry),
      date: entry.date,
      note: entry.note,
    }));

    return computeBudgetAnalysis(linesInput, entriesInput, budget.totalIncome, aggregates.actualIncome);
  },

  async forecast(userId: string, id: string): Promise<ForecastResult> {
    const budget = ensureBudget(await container.budgetRepo.findById(id, userId));

    const history: HistoricalMonthData[] = [];
    for (let i = 3; i >= 1; i--) {
      let pastMonth = budget.month - i;
      let pastYear = budget.year;
      while (pastMonth < 1) {
        pastMonth += 12;
        pastYear -= 1;
      }
      const pStart = new Date(pastYear, pastMonth - 1, 1);
      const pEnd = new Date(pastYear, pastMonth, 0, 23, 59, 59);

      const pastAgg = await container.budgetRepo.getAggregatesForMonth(userId, pStart, pEnd);
      const pastBudget = await container.budgetRepo.findByMonth(userId, pastMonth, pastYear, false);

      const lineSpends = new Map<string, number>();
      if (pastBudget) {
        pastBudget.lines.forEach((line) => {
          const catSet = new Set(line.linkedCategoryIds.map((c) => c.toString()));
          const spend = pastAgg.categorySpends
            .filter((cs) => catSet.has(cs.categoryId))
            .reduce((s, cs) => s + cs.amount, 0);
          lineSpends.set(line._id.toString(), spend);
          lineSpends.set(line.name, spend);
        });
      }

      history.push({
        month: pastMonth,
        year: pastYear,
        actualIncome: pastAgg.actualIncome,
        lineSpends,
        totalSpend: pastAgg.totalOutflow,
      });
    }

    const openPayables = await container.payableRepo.findMany(userId, 'open');

    const upcoming: UpcomingMonthPlan[] = [];
    for (let i = 0; i < 3; i++) {
      let upMonth = budget.month + i;
      let upYear = budget.year;
      while (upMonth > 12) {
        upMonth -= 12;
        upYear += 1;
      }

      const committedPayables = openPayables
        .filter((p) => {
          if (!p.dueDate) return i === 0;
          const d = new Date(p.dueDate);
          return d.getMonth() + 1 === upMonth && d.getFullYear() === upYear;
        })
        .reduce((sum, p) => sum + (p.remaining ?? (p.principal - p.paidAmount)), 0);

      upcoming.push({
        month: upMonth,
        year: upYear,
        budgetTotalIncome: i === 0 ? budget.totalIncome : 0,
        lines: budget.lines.map((l) => ({
          id: l._id.toString(),
          name: l.name,
          icon: l.icon,
          color: l.color,
          allocationMethod: l.allocationMethod,
          allocationValue: l.allocationValue,
          linkedCategoryIds: l.linkedCategoryIds.map((c) => c.toString()),
        })),
        committedPayables,
      });
    }

    return calculateForecast(history, upcoming);
  },

  async drilldown(
    userId: string,
    id: string,
    lineId?: string,
    page = 1,
    limit = 20,
  ) {
    const budget = ensureBudget(await container.budgetRepo.findById(id, userId));
    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);

    if (lineId === 'unbudgeted' || !lineId) {
      // Active lines define what is budgeted, by linked category or by sub-item name.
      const activeLines = budget.lines.filter((l) => l.isActive);
      return container.budgetRepo.findLineEntriesPaginated(
        userId,
        {
          start,
          end,
          isUnbudgeted: true,
          unmappedCategoryIds: lineCategoryIds(activeLines),
          unmappedSubItemNames: lineSubItemNames(activeLines),
        },
        page,
        limit,
      );
    }

    const line = budget.lines.find((l) => l._id.toString() === lineId);
    if (!line) throw new AppError('Budget line not found', 404);

    return container.budgetRepo.findLineEntriesPaginated(
      userId,
      {
        start,
        end,
        categoryIds: line.linkedCategoryIds.map((c) => c.toString()),
        subItemNames: lineSubItemNames([line]),
      },
      page,
      limit,
    );
  },
};
