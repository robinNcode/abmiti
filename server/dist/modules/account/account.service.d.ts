import { IAccount, IAccountInput } from '../../shared/types';
export declare const accountService: {
    create(userId: string, input: IAccountInput): Promise<IAccount>;
    findByUser(userId: string): Promise<IAccount[]>;
    findById(userId: string, accountId: string): Promise<IAccount | null>;
    update(userId: string, accountId: string, input: Partial<IAccountInput>): Promise<IAccount | null>;
    delete(userId: string, accountId: string): Promise<boolean>;
    updateBalance(userId: string, accountId: string, amount: number): Promise<IAccount | null>;
};
//# sourceMappingURL=account.service.d.ts.map