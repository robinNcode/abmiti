import { IUser } from '../../../shared/types';
import { IUserRepository } from '../../../shared/types/repositories';
export declare class MongoUserRepository implements IUserRepository {
    findByEmail(email: string, includePassword?: boolean): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
    create(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<IUser>;
    updateBudget(id: string, budget: number): Promise<IUser | null>;
    updateProfile(id: string, data: {
        name?: string;
        avatar?: string;
    }): Promise<IUser | null>;
    findByGoogleId(googleId: string): Promise<IUser | null>;
    createFromGoogle(data: {
        name: string;
        email: string;
        googleId: string;
        avatar?: string;
    }): Promise<IUser>;
    linkGoogleId(userId: string, googleId: string): Promise<IUser | null>;
}
//# sourceMappingURL=user.mongo.repo.d.ts.map