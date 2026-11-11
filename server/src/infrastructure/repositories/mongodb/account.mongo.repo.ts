import { Account } from '../../../modules/account/account.model';
import { IAccount, IAccountInput } from '../../../shared/types';
import { IAccountRepository } from '../../../shared/types/repositories';
import { transformUserData } from '../../../shared/utils/userDataEncryption';

export class MongoAccountRepository implements IAccountRepository {
  async create(data: IAccountInput & { user: string }): Promise<IAccount> {
    const doc = await Account.create(transformUserData(data.user, data, true));
    return transformUserData(data.user, doc.toObject(), false) as IAccount;
  }

  async findByUser(userId: string): Promise<IAccount[]> {
    const docs = await Account.find({ user: userId, isActive: true }).sort({ createdAt: -1 });
    return docs.map((doc) => transformUserData(userId, doc.toObject(), false) as IAccount);
  }

  async findById(userId: string, accountId: string): Promise<IAccount | null> {
    const doc = await Account.findOne({ _id: accountId, user: userId });
    return doc
      ? transformUserData(userId, doc.toObject(), false) as IAccount
      : null;
  }

  async update(userId: string, accountId: string, data: Partial<IAccountInput>): Promise<IAccount | null> {
    const doc = await Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      transformUserData(userId, data, true),
      { new: true },
    );
    return doc
      ? transformUserData(userId, doc.toObject(), false) as IAccount
      : null;
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
    const doc = await Account.findOneAndUpdate(
      { _id: accountId, user: userId },
      { $inc: { balance: amount } },
      { new: true },
    );
    return doc
      ? transformUserData(userId, doc.toObject(), false) as IAccount
      : null;
  }
}
