import { Types } from 'mongoose';
import { Account } from './account.model';
import { IAccount, IAccountInput } from '../../shared/types';

export const accountService = {
  async create(userId: string, input: IAccountInput): Promise<IAccount> {
    const account = new Account({ ...input, user: userId });
    return account.save();
  },

  async findByUser(userId: string): Promise<IAccount[]> {
    return Account.find({ user: userId, isActive: true }).sort({ createdAt: -1 });
  },

  async findById(userId: string, accountId: string): Promise<IAccount | null> {
    return Account.findOne({ _id: accountId, user: userId });
  },

  async update(userId: string, accountId: string, input: Partial<IAccountInput>): Promise<IAccount | null> {
    return Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      input,
      { new: true }
    );
  },

  async delete(userId: string, accountId: string): Promise<boolean> {
    const result = await Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      { isActive: false },
      { new: true }
    );
    return !!result;
  },

  async updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null> {
    return Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      { $inc: { balance: amount } },
      { new: true }
    );
  },
};
