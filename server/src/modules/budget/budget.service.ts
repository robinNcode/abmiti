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
  { name: 'Living Cost', icon: '🏠', color: '#4A7C59', allocationMethod: 'percentage', allocationValue: 50, order: 0, note: 'Family expenses: rent, food, utilities, education' },
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

const lineCategoryIds = (lines: IBudgetLine[]): string[] => (
  lines.flatMap((line) => line.linkedCategoryIds.map((id) => id.toString()))
);

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

export const budgetService = {
  resolvePlannedAmount(line: Pick<IBudgetLine, 'allocationMethod' | 'allocationValue'>, totalIncome: number): number {
    return line.allocationMethod === 'percentage'
      ? Number(((totalIncome * line.allocationValue) / 100).toFixed(2))
      : Number(line.allocationValue.toFixed(2));
  },

  async create(userId: string, data: IBudgetInput) {
    assertUniqueLinkedCategories(data.lines ?? []);
    return sortLines(await container.budgetRepo.create(userId, data));
  },

  async seedDefaultBudget(userId: string, month: number, year: number, totalIncome = 0) {
    return this.create(userId, {
      month,
      year,
      totalIncome,
      lines: defaultBudgetLines,
      isTemplate: false,
      templateName: 'Halal 50/25/10/5/5/5 Budget',
    });
  },

  async getByMonth(userId: string, month: number, year: number) {
    const existing = await container.budgetRepo.findByMonth(userId, month, year, false);
    if (existing) return sortLines(existing);
    return this.seedDefaultBudget(userId, month, year);
  },

  async update(userId: string, id: string, data: Partial<IBudgetInput>) {
    if (data.lines) assertUniqueLinkedCategories(data.lines);
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
    return ensureBudget(await container.budgetRepo.addLine(budgetId, userId, line));
  },

  async updateLine(userId: string, budgetId: string, lineId: string, line: Partial<IBudgetLineInput>) {
    const current = ensureBudget(await container.budgetRepo.findById(budgetId, userId));
    const merged = current.lines.map((item) => (
      item._id.toString() === lineId ? { ...item, ...line } : item
    ));
    assertUniqueLinkedCategories(merged);
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
    return this.create(userId, {
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

  computeLineSummary(budget: IBudget, line: IBudgetLine, entries: IEntry[]): IBudgetLineSummary {
    const plannedAmount = this.resolvePlannedAmount(line, budget.totalIncome);
    const categorySet = new Set(line.linkedCategoryIds.map((id) => id.toString()));
    const actualAmount = entries
      .filter((entry) => categorySet.has(entry.category.toString()))
      .reduce((sum, entry) => sum + entry.amount, 0);
    const usedPercent = plannedAmount > 0 ? Number(((actualAmount / plannedAmount) * 100).toFixed(2)) : 0;
    const status = actualAmount === 0 ? 'unused' : usedPercent > 100 ? 'over_budget' : usedPercent > 80 ? 'warning' : 'on_track';
    return {
      lineId: line._id.toString(),
      name: line.name,
      icon: line.icon,
      color: line.color,
      plannedAmount,
      actualAmount,
      variance: Number((plannedAmount - actualAmount).toFixed(2)),
      usedPercent,
      status,
      subItems: line.subItems.map((item) => ({ ...item, variance: Number((item.expectedAmount - actualAmount).toFixed(2)) })),
    };
  },

  async summary(userId: string, id: string): Promise<IBudgetSummary> {
    const budget = ensureBudget(await container.budgetRepo.findById(id, userId));
    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);
    const entries = await container.budgetRepo.findExpenseEntriesByCategories(userId, lineCategoryIds(budget.lines), start, end);
    const lines = budget.lines.filter((line) => line.isActive).map((line) => this.computeLineSummary(budget, line, entries));
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
    return container.budgetRepo.findExpenseEntriesByCategories(
      userId,
      line.linkedCategoryIds.map((id) => id.toString()),
      start,
      end,
    );
  },
};
