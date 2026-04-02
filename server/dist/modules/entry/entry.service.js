"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryService = void 0;
const entry_repository_1 = require("./entry.repository");
const category_service_1 = require("../category/category.service");
const smsParser_1 = require("../../shared/utils/smsParser");
const errors_1 = require("../../shared/utils/errors");
const category_model_1 = require("../category/category.model");
const account_model_1 = require("../account/account.model");
const mongoose_1 = require("mongoose");
exports.entryService = {
    async list(userId, filters, pagination) {
        return entry_repository_1.entryRepository.findMany(userId, filters, pagination);
    },
    async getOne(userId, id) {
        const entry = await entry_repository_1.entryRepository.findById(id, userId);
        if (!entry)
            throw new errors_1.NotFoundError('Entry');
        return entry;
    },
    async create(userId, dto) {
        // Verify category belongs to user
        const category = await category_model_1.Category.findOne({ _id: dto.categoryId, user: userId });
        if (!category)
            throw new errors_1.NotFoundError('Category');
        // Verify account belongs to user if provided
        let account = null;
        if (dto.accountId) {
            account = await account_model_1.Account.findOne({ _id: dto.accountId, user: userId });
            if (!account)
                throw new errors_1.NotFoundError('Account');
        }
        return entry_repository_1.entryRepository.create({
            user: new mongoose_1.Types.ObjectId(userId),
            type: dto.type,
            amount: dto.amount,
            note: dto.note ?? '',
            category: new mongoose_1.Types.ObjectId(dto.categoryId),
            source: dto.source ?? 'cash',
            account: account ? new mongoose_1.Types.ObjectId(dto.accountId) : undefined,
            date: dto.date ? new Date(dto.date) : new Date(),
            parsedFromSms: dto.parsedFromSms ?? false,
            rawSms: dto.rawSms,
        });
    },
    async update(userId, id, dto) {
        const existing = await entry_repository_1.entryRepository.findById(id, userId);
        if (!existing)
            throw new errors_1.NotFoundError('Entry');
        const updateData = {};
        if (dto.amount !== undefined)
            updateData.amount = dto.amount;
        if (dto.note !== undefined)
            updateData.note = dto.note;
        if (dto.source !== undefined)
            updateData.source = dto.source;
        if (dto.date !== undefined)
            updateData.date = new Date(dto.date);
        if (dto.categoryId) {
            const cat = await category_model_1.Category.findOne({ _id: dto.categoryId, user: userId });
            if (!cat)
                throw new errors_1.NotFoundError('Category');
            updateData.category = new mongoose_1.Types.ObjectId(dto.categoryId);
        }
        if (dto.accountId) {
            const acc = await account_model_1.Account.findOne({ _id: dto.accountId, user: userId });
            if (!acc)
                throw new errors_1.NotFoundError('Account');
            updateData.account = new mongoose_1.Types.ObjectId(dto.accountId);
        }
        const updated = await entry_repository_1.entryRepository.update(id, userId, updateData);
        if (!updated)
            throw new errors_1.NotFoundError('Entry');
        return updated;
    },
    async remove(userId, id) {
        const deleted = await entry_repository_1.entryRepository.remove(id, userId);
        if (!deleted)
            throw new errors_1.NotFoundError('Entry');
    },
    async parseSms(sms) {
        return smsParser_1.smsParserService.parse(sms);
    },
    async seedUserDefaults(userId) {
        await category_service_1.categoryService.seedDefaults(new mongoose_1.Types.ObjectId(userId));
    },
};
//# sourceMappingURL=entry.service.js.map