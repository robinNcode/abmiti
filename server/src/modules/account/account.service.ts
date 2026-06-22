import { container } from '../../container';
import { IAccount, IAccountInput } from '../../shared/types';

export const accountService = {
  async create(userId: string, input: IAccountInput): Promise<IAccount> {
    return container.accountRepo.create({ ...input, user: userId });
  },

  async findByUser(userId: string): Promise<IAccount[]> {
    return container.accountRepo.findByUser(userId);
  },

  async findById(userId: string, accountId: string): Promise<IAccount | null> {
    return container.accountRepo.findById(userId, accountId);
  },

  async update(userId: string, accountId: string, input: Partial<IAccountInput>): Promise<IAccount | null> {
    return container.accountRepo.update(userId, accountId, input);
  },

  async delete(userId: string, accountId: string): Promise<boolean> {
    return container.accountRepo.softDelete(userId, accountId);
  },

  async updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null> {
    return container.accountRepo.updateBalance(userId, accountId, amount);
  },
};
