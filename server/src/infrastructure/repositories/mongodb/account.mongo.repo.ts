import { Account } from '../../../modules/account/account.model';
import { IAccount, IAccountInput } from '../../../shared/types';
import { IAccountRepository } from '../../../shared/types/repositories';

export class MongoAccountRepository implements IAccountRepository {
  async create(data: IAccountInput & { user: string }): Promise<IAccount> {
    return Account.create(data);
  }

  async findByUser(userId: string): Promise<IAccount[]> {
    return Account.find({ user: userId, isActive: true }).sort({ createdAt: -1 });
  }

  async findById(userId: string, accountId: string): Promise<IAccount | null> {
    return Account.findOne({ _id: accountId, user: userId });
  }

  async update(userId: string, accountId: string, data: Partial<IAccountInput>): Promise<IAccount | null> {
    return Account.findOneAndUpdate({ _id: accountId, user: userId }, data, { new: true });
  }

  async softDelete(userId: string, accountId: string): Promise<boolean> {
    const result = await Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      { isActive: false },
      { new: true },
    );
    return !!result;
  }

  async updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null> {
    return Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      { $inc: { balance: amount } },
      { new: true },
    );
  }
}
