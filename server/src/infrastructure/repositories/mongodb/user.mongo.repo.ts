import { Types } from 'mongoose';
import { User } from '../../../modules/auth/auth.model';
import { IUser, IQuickExpenseItem } from '../../../shared/types';
import { IUserRepository } from '../../../shared/types/repositories';
import { transformUserData } from '../../../shared/utils/userDataEncryption';

export class MongoUserRepository implements IUserRepository {
  private decrypt(doc: IUser | null): IUser | null {
    if (!doc) return null;
    const data = transformUserData(String(doc._id), doc.toObject(), false);
    doc.set({
      name: data.name,
      avatar: data.avatar,
      quickExpenses: data.quickExpenses,
    });
    return doc;
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const q = User.findOne({ email });
    const user = await (includePassword ? q.select('+password') : q);
    return this.decrypt(user);
  }

  async findById(id: string): Promise<IUser | null> {
    return this.decrypt(await User.findById(id));
  }

  async create(data: { name: string; email: string; password: string }): Promise<IUser> {
    const id = new Types.ObjectId();
    const user = await User.create(transformUserData(id.toString(), { _id: id, ...data }, true));
    const decrypted = transformUserData(String(user._id), user.toObject(), false);
    user.set({ name: decrypted.name, avatar: decrypted.avatar, quickExpenses: decrypted.quickExpenses });
    return user;
  }

  async updateBudget(id: string, budget: number): Promise<IUser | null> {
    return this.decrypt(await User.findByIdAndUpdate(id, { budget }, { new: true }));
  }

  async updateProfile(id: string, data: { name?: string; avatar?: string }): Promise<IUser | null> {
    const update = transformUserData(id, data, true);
    if (Object.keys(update).length === 0) return this.findById(id);
    return this.decrypt(await User.findByIdAndUpdate(id, update, { new: true }));
  }

  async updateQuickExpenses(id: string, items: IQuickExpenseItem[]): Promise<IUser | null> {
    const encrypted = transformUserData(id, items, true);
    return this.decrypt(await User.findByIdAndUpdate(id, { quickExpenses: encrypted }, { new: true }));
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return this.decrypt(await User.findOne({ google_id: googleId }));
  }

  async createFromGoogle(data: { name: string; email: string; googleId: string; avatar?: string }): Promise<IUser> {
    const id = new Types.ObjectId();
    const user = await User.create(transformUserData(id.toString(), {
      _id: id,
      name: data.name,
      email: data.email,
      google_id: data.googleId,
      avatar: data.avatar,
    }, true));
    const decrypted = transformUserData(String(user._id), user.toObject(), false);
    user.set({ name: decrypted.name, avatar: decrypted.avatar, quickExpenses: decrypted.quickExpenses });
    return user;
  }

  async linkGoogleId(userId: string, googleId: string): Promise<IUser | null> {
    return this.decrypt(await User.findOneAndUpdate(
      { _id: userId, google_id: { $exists: false } },
      { google_id: googleId },
      { new: true },
    ));
  }
}
