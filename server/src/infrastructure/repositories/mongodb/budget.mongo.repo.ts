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
      type: { $in: ['expense', 'savings', 'investment'] },
      category: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
      date: { $gte: start, $lte: end },
    }).populate('category', 'name icon color');
  }

  async getAggregatesForMonth(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<{ actualIncome: number; categorySpends: { categoryId: string; amount: number }[]; totalOutflow: number }> {
    const uid = new Types.ObjectId(userId);

    const [incomeAgg] = await Entry.aggregate([
      { $match: { user: uid, type: 'income', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const actualIncome = incomeAgg?.total ?? 0;

    const catAgg = await Entry.aggregate([
      { $match: { user: uid, type: { $in: ['expense', 'savings', 'investment'] }, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
    ]);
    const categorySpends = catAgg.map((r: { _id: Types.ObjectId; amount: number }) => ({
      categoryId: r._id.toString(),
      amount: r.amount,
    }));

    const totalOutflow = categorySpends.reduce((s: number, c: { amount: number }) => s + c.amount, 0);

    return { actualIncome, categorySpends, totalOutflow };
  }

  async findLineEntriesPaginated(
    userId: string,
    filters: {
      start: Date;
      end: Date;
      categoryIds?: string[];
      unmappedCategoryIds?: string[];
      isUnbudgeted?: boolean;
    },
    page: number,
    limit: number,
  ): Promise<{ data: IEntry[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {
      user: userId,
      type: { $in: ['expense', 'savings', 'investment'] },
      date: { $gte: filters.start, $lte: filters.end },
    };

    if (filters.isUnbudgeted && filters.unmappedCategoryIds?.length) {
      query.category = { $nin: filters.unmappedCategoryIds.map((id) => new Types.ObjectId(id)) };
    } else if (filters.categoryIds?.length) {
      query.category = { $in: filters.categoryIds.map((id) => new Types.ObjectId(id)) };
    }

    const total = await Entry.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const data = await Entry.find(query)
      .populate('category', 'name icon color')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { data: data as unknown as IEntry[], total, page, totalPages };
  }
}

