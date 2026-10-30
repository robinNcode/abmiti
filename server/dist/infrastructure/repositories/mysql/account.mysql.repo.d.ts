import { IAccount, IAccountInput } from '../../../shared/types';
import { IAccountRepository } from '../../../shared/types/repositories';
export declare class MySQLAccountRepository implements IAccountRepository {
    private get pool();
    create(data: IAccountInput & {
        user: string;
    }): Promise<IAccount>;
    findByUser(userId: string): Promise<IAccount[]>;
    findById(userId: string, accountId: string): Promise<IAccount | null>;
    update(userId: string, accountId: string, data: Partial<IAccountInput>): Promise<IAccount | null>;
    softDelete(userId: string, accountId: string): Promise<boolean>;
    updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null>;
}
//# sourceMappingURL=account.mysql.repo.d.ts.map