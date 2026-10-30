"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const env_1 = require("./config/env");
// MongoDB repositories
const user_mongo_repo_1 = require("./infrastructure/repositories/mongodb/user.mongo.repo");
const category_mongo_repo_1 = require("./infrastructure/repositories/mongodb/category.mongo.repo");
const entry_mongo_repo_1 = require("./infrastructure/repositories/mongodb/entry.mongo.repo");
const account_mongo_repo_1 = require("./infrastructure/repositories/mongodb/account.mongo.repo");
const summary_mongo_repo_1 = require("./infrastructure/repositories/mongodb/summary.mongo.repo");
const budget_mongo_repo_1 = require("./infrastructure/repositories/mongodb/budget.mongo.repo");
// MySQL repositories
const user_mysql_repo_1 = require("./infrastructure/repositories/mysql/user.mysql.repo");
const category_mysql_repo_1 = require("./infrastructure/repositories/mysql/category.mysql.repo");
const entry_mysql_repo_1 = require("./infrastructure/repositories/mysql/entry.mysql.repo");
const account_mysql_repo_1 = require("./infrastructure/repositories/mysql/account.mysql.repo");
const summary_mysql_repo_1 = require("./infrastructure/repositories/mysql/summary.mysql.repo");
const budget_mysql_repo_1 = require("./infrastructure/repositories/mysql/budget.mysql.repo");
function buildContainer() {
    if (env_1.env.DB_PROVIDER === 'mysql') {
        return {
            userRepo: new user_mysql_repo_1.MySQLUserRepository(),
            categoryRepo: new category_mysql_repo_1.MySQLCategoryRepository(),
            entryRepo: new entry_mysql_repo_1.MySQLEntryRepository(),
            accountRepo: new account_mysql_repo_1.MySQLAccountRepository(),
            summaryRepo: new summary_mysql_repo_1.MySQLSummaryRepository(),
            budgetRepo: new budget_mysql_repo_1.MySQLBudgetRepository(),
        };
    }
    // default: mongodb
    return {
        userRepo: new user_mongo_repo_1.MongoUserRepository(),
        categoryRepo: new category_mongo_repo_1.MongoCategoryRepository(),
        entryRepo: new entry_mongo_repo_1.MongoEntryRepository(),
        accountRepo: new account_mongo_repo_1.MongoAccountRepository(),
        summaryRepo: new summary_mongo_repo_1.MongoSummaryRepository(),
        budgetRepo: new budget_mongo_repo_1.MongoBudgetRepository(),
    };
}
exports.container = buildContainer();
//# sourceMappingURL=container.js.map