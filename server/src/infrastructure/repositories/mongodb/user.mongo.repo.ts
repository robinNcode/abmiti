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
}
