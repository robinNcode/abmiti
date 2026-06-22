import { IBudgetRepository } from '../../../shared/types/repositories';
import { IBudget, IBudgetInput } from '../../../shared/types';
import { Budget } from '../../../modules/budget/budget.model';

export class MongoBudgetRepository implements IBudgetRepository {
  async upsert(userId: string, data: IBudgetInput): Promise<IBudget> {
    const doc = await Budget.findOneAndUpdate(
      { user: userId, month: data.month, year: data.year },
      { $set: { amount: data.amount } },
      { new: true, upsert: true, runValidators: true }
    );
    return doc;
  }

  async findByMonth(userId: string, month: number, year: number): Promise<IBudget | null> {
    return Budget.findOne({ user: userId, month, year }).lean() as unknown as Promise<IBudget | null>;
  }

  async findMany(userId: string): Promise<IBudget[]> {
    return Budget.find({ user: userId }).sort({ year: -1, month: -1 }).lean() as unknown as Promise<IBudget[]>;
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await Budget.deleteOne({ _id: id, user: userId });
    return result.deletedCount === 1;
  }
}
