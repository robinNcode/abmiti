import { User } from '../../../modules/auth/auth.model';
import { IUser } from '../../../shared/types';
import { IUserRepository } from '../../../shared/types/repositories';

export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const q = User.findOne({ email });
    return includePassword ? q.select('+password') : q;
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(data: { name: string; email: string; password: string }): Promise<IUser> {
    return User.create(data);
  }

  async updateBudget(id: string, budget: number): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { budget }, { new: true });
  }

  async updateProfile(id: string, data: { name?: string; avatar?: string }): Promise<IUser | null> {
    const update: Partial<{ name: string; avatar: string }> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.avatar !== undefined) update.avatar = data.avatar;
    if (Object.keys(update).length === 0) return this.findById(id);
    return User.findByIdAndUpdate(id, update, { new: true });
  }
}
