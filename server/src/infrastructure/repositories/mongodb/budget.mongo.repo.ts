import { Types } from 'mongoose';
import { IBudgetRepository } from '../../../shared/types/repositories';
import { IBudget, IBudgetInput, IBudgetLineInput, IEntry } from '../../../shared/types';
import { Budget } from '../../../modules/budget/budget.model';
import { Entry } from '../../../modules/entry/entry.model';

const normalizeLine = (line: IBudgetLineInput, index = 0) => ({
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

export class MongoBudgetRepository implements IBudgetRepository {
  async create(userId: string, data: IBudgetInput): Promise<IBudget> {
    return Budget.create({
      user: userId,
      month: data.month,
      year: data.year,
      totalIncome: data.totalIncome,
      lines: (data.lines ?? []).map(normalizeLine),
      isTemplate: data.isTemplate ?? false,
      templateName: data.templateName,
      notes: data.notes,
    });
  }

  async update(id: string, userId: string, data: Partial<IBudgetInput>): Promise<IBudget | null> {
    const patch: Record<string, unknown> = {};
    if (data.totalIncome !== undefined) patch.totalIncome = data.totalIncome;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.templateName !== undefined) patch.templateName = data.templateName;
    if (data.lines !== undefined) patch.lines = data.lines.map(normalizeLine);
    return Budget.findOneAndUpdate({ _id: id, user: userId }, { $set: patch }, { new: true, runValidators: true });
  }

  async findById(id: string, userId: string): Promise<IBudget | null> {
    return Budget.findOne({ _id: id, user: userId });
  }

  async findByMonth(userId: string, month: number, year: number, isTemplate = false): Promise<IBudget | null> {
    return Budget.findOne({ user: userId, month, year, isTemplate });
  }

  async findMany(userId: string, templatesOnly = false): Promise<IBudget[]> {
    const query = templatesOnly ? { user: userId, isTemplate: true } : { user: userId };
    return Budget.find(query).sort({ isTemplate: -1, year: -1, month: -1, createdAt: -1 });
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await Budget.deleteOne({ _id: id, user: userId });
    return result.deletedCount === 1;
  }

  async addLine(budgetId: string, userId: string, line: IBudgetLineInput): Promise<IBudget | null> {
    const budget = await Budget.findOne({ _id: budgetId, user: userId });
    if (!budget) return null;
    budget.lines.push(normalizeLine(line, budget.lines.length) as never);
    await budget.save();
    return budget;
  }

  async updateLine(budgetId: string, lineId: string, userId: string, line: Partial<IBudgetLineInput>): Promise<IBudget | null> {
    const budget = await Budget.findOne({ _id: budgetId, user: userId });
    if (!budget) return null;
    const target = budget.lines.find((item) => item._id.toString() === lineId);
    if (!target) return null;
    Object.assign(target, line);
    await budget.save();
    return budget;
  }

  async removeLine(budgetId: string, lineId: string, userId: string): Promise<IBudget | null> {
    return Budget.findOneAndUpdate(
      { _id: budgetId, user: userId },
      { $pull: { lines: { _id: new Types.ObjectId(lineId) } } },
      { new: true },
    );
  }

  async reorderLines(budgetId: string, userId: string, order: string[]): Promise<IBudget | null> {
    const budget = await Budget.findOne({ _id: budgetId, user: userId });
    if (!budget) return null;
    budget.lines.forEach((line) => {
      const index = order.indexOf(line._id.toString());
      if (index >= 0) line.order = index;
    });
    await budget.save();
    return budget;
  }

  async findExpenseEntriesByCategories(
    userId: string,
    categoryIds: string[],
    start: Date,
    end: Date,
  ): Promise<IEntry[]> {
    if (!categoryIds.length) return [];
    return Entry.find({
      user: userId,
      type: 'expense',
      category: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
      date: { $gte: start, $lte: end },
    }).populate('category', 'name icon color');
  }
}
