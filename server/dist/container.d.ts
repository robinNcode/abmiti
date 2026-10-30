import { IUserRepository, ICategoryRepository, IEntryRepository, IAccountRepository, ISummaryRepository, IBudgetRepository } from './shared/types/repositories';
export interface AppContainer {
    userRepo: IUserRepository;
    categoryRepo: ICategoryRepository;
    entryRepo: IEntryRepository;
    accountRepo: IAccountRepository;
    summaryRepo: ISummaryRepository;
    budgetRepo: IBudgetRepository;
}
export declare const container: AppContainer;
//# sourceMappingURL=container.d.ts.map