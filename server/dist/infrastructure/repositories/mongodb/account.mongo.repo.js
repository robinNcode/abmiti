"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoAccountRepository = void 0;
const account_model_1 = require("../../../modules/account/account.model");
class MongoAccountRepository {
    async create(data) {
        return account_model_1.Account.create(data);
    }
    async findByUser(userId) {
        return account_model_1.Account.find({ user: userId, isActive: true }).sort({ createdAt: -1 });
    }
    async findById(userId, accountId) {
        return account_model_1.Account.findOne({ _id: accountId, user: userId });
    }
    async update(userId, accountId, data) {
        return account_model_1.Account.findOneAndUpdate({ _id: accountId, user: userId }, data, { new: true });
    }
    async softDelete(userId, accountId) {
        const result = await account_model_1.Account.findOneAndUpdate({ _id: accountId, user: userId }, { isActive: false }, { new: true });
        return !!result;
    }
    async updateBalance(userId, accountId, amount) {
        return account_model_1.Account.findOneAndUpdate({ _id: accountId, user: userId }, { $inc: { balance: amount } }, { new: true });
    }
}
exports.MongoAccountRepository = MongoAccountRepository;
//# sourceMappingURL=account.mongo.repo.js.map