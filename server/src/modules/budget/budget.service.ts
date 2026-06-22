import { container } from '../../container';
import { IBudgetInput } from '../../shared/types';
import { AppError } from '../../shared/utils/errors';

export const budgetService = {
  async upsert(userId: string, data: IBudgetInput) {
    return container.budgetRepo.upsert(userId, data);
  },

  async getByMonth(userId: string, month: number, year: number) {
    return container.budgetRepo.findByMonth(userId, month, year);
  },

  async list(userId: string) {
    return container.budgetRepo.findMany(userId);
  },

  async remove(userId: string, id: string) {
    const success = await container.budgetRepo.remove(id, userId);
    if (!success) {
      throw new AppError('Budget not found or unauthorized', 404);
    }
    return true;
  },
};
