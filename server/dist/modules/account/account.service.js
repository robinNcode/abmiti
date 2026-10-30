"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = void 0;
const container_1 = require("../../container");
exports.accountService = {
    async create(userId, input) {
        return container_1.container.accountRepo.create({ ...input, user: userId });
    },
    async findByUser(userId) {
        return container_1.container.accountRepo.findByUser(userId);
    },
    async findById(userId, accountId) {
        return container_1.container.accountRepo.findById(userId, accountId);
    },
    async update(userId, accountId, input) {
        return container_1.container.accountRepo.update(userId, accountId, input);
    },
    async delete(userId, accountId) {
        return container_1.container.accountRepo.softDelete(userId, accountId);
    },
    async updateBalance(userId, accountId, amount) {
        return container_1.container.accountRepo.updateBalance(userId, accountId, amount);
    },
};
//# sourceMappingURL=account.service.js.map