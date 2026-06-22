import { env } from './config/env';

// MongoDB repositories
import { MongoUserRepository }     from './infrastructure/repositories/mongodb/user.mongo.repo';
import { MongoCategoryRepository } from './infrastructure/repositories/mongodb/category.mongo.repo';
import { MongoEntryRepository }    from './infrastructure/repositories/mongodb/entry.mongo.repo';
import { MongoAccountRepository }  from './infrastructure/repositories/mongodb/account.mongo.repo';
import { MongoSummaryRepository }  from './infrastructure/repositories/mongodb/summary.mongo.repo';
import { MongoBudgetRepository }   from './infrastructure/repositories/mongodb/budget.mongo.repo';

// MySQL repositories
import { MySQLUserRepository }     from './infrastructure/repositories/mysql/user.mysql.repo';
import { MySQLCategoryRepository } from './infrastructure/repositories/mysql/category.mysql.repo';
import { MySQLEntryRepository }    from './infrastructure/repositories/mysql/entry.mysql.repo';
import { MySQLAccountRepository }  from './infrastructure/repositories/mysql/account.mysql.repo';
import { MySQLSummaryRepository }  from './infrastructure/repositories/mysql/summary.mysql.repo';
import { MySQLBudgetRepository }   from './infrastructure/repositories/mysql/budget.mysql.repo';

// Repository interfaces
import {
  IUserRepository,
  ICategoryRepository,
  IEntryRepository,
  IAccountRepository,
  ISummaryRepository,
  IBudgetRepository,
} from './shared/types/repositories';

export interface AppContainer {
  userRepo:     IUserRepository;
  categoryRepo: ICategoryRepository;
  entryRepo:    IEntryRepository;
  accountRepo:  IAccountRepository;
  summaryRepo:  ISummaryRepository;
  budgetRepo:   IBudgetRepository;
}

function buildContainer(): AppContainer {
  if (env.DB_PROVIDER === 'mysql') {
    return {
      userRepo:     new MySQLUserRepository(),
      categoryRepo: new MySQLCategoryRepository(),
      entryRepo:    new MySQLEntryRepository(),
      accountRepo:  new MySQLAccountRepository(),
      summaryRepo:  new MySQLSummaryRepository(),
      budgetRepo:   new MySQLBudgetRepository(),
    };
  }
  // default: mongodb
  return {
    userRepo:     new MongoUserRepository(),
    categoryRepo: new MongoCategoryRepository(),
    entryRepo:    new MongoEntryRepository(),
    accountRepo:  new MongoAccountRepository(),
    summaryRepo:  new MongoSummaryRepository(),
    budgetRepo:   new MongoBudgetRepository(),
  };
}

export const container = buildContainer();
