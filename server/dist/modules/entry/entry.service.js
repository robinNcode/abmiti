"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryService = void 0;
const container_1 = require("../../container");
const smsParser_1 = require("../../shared/utils/smsParser");
const errors_1 = require("../../shared/utils/errors");
const mongoose_1 = require("mongoose");
const env_1 = require("../../config/env");
exports.entryService = {
    async list(userId, filters, pagination) {
        return container_1.container.entryRepo.findMany(userId, filters, pagination);
    },
    async getOne(userId, id) {
        const entry = await container_1.container.entryRepo.findById(id, userId);
        if (!entry)
            throw new errors_1.NotFoundError('Entry');
        return entry;
    },
    async create(userId, dto) {
        const category = await container_1.container.categoryRepo.findByUserAndId(userId, dto.categoryId);
        if (!category)
            throw new errors_1.NotFoundError('Category');
        let account = null;
        if (dto.accountId) {
            account = await container_1.container.accountRepo.findById(userId, dto.accountId);
            if (!account)
                throw new errors_1.NotFoundError('Account');
        }
        const isMongo = env_1.env.DB_PROVIDER === 'mongodb';
        return container_1.container.entryRepo.create({
            user: (isMongo ? new mongoose_1.Types.ObjectId(userId) : userId),
            type: dto.type,
            amount: dto.amount,
            note: dto.note ?? '',
            category: (isMongo ? new mongoose_1.Types.ObjectId(dto.categoryId) : dto.categoryId),
            sector: dto.sector ?? '',
            source: dto.source ?? 'cash',
            account: account
                ? (isMongo ? new mongoose_1.Types.ObjectId(dto.accountId) : dto.accountId)
                : undefined,
            date: dto.date ? new Date(dto.date) : new Date(),
            parsedFromSms: dto.parsedFromSms ?? false,
            rawSms: dto.rawSms,
        });
    },
    async update(userId, id, dto) {
        const existing = await container_1.container.entryRepo.findById(id, userId);
        if (!existing)
            throw new errors_1.NotFoundError('Entry');
        const isMongo = env_1.env.DB_PROVIDER === 'mongodb';
        const updateData = {};
        if (dto.amount !== undefined)
            updateData.amount = dto.amount;
        if (dto.note !== undefined)
            updateData.note = dto.note;
        if (dto.source !== undefined)
            updateData.source = dto.source;
        if (dto.date !== undefined)
            updateData.date = new Date(dto.date);
        if (dto.sector !== undefined)
            updateData.sector = dto.sector;
        if (dto.categoryId) {
            const cat = await container_1.container.categoryRepo.findByUserAndId(userId, dto.categoryId);
            if (!cat)
                throw new errors_1.NotFoundError('Category');
            updateData.category = (isMongo ? new mongoose_1.Types.ObjectId(dto.categoryId) : dto.categoryId);
        }
        if (dto.accountId) {
            const acc = await container_1.container.accountRepo.findById(userId, dto.accountId);
            if (!acc)
                throw new errors_1.NotFoundError('Account');
            updateData.account = (isMongo ? new mongoose_1.Types.ObjectId(dto.accountId) : dto.accountId);
        }
        const updated = await container_1.container.entryRepo.update(id, userId, updateData);
        if (!updated)
            throw new errors_1.NotFoundError('Entry');
        return updated;
    },
    async remove(userId, id) {
        const deleted = await container_1.container.entryRepo.remove(id, userId);
        if (!deleted)
            throw new errors_1.NotFoundError('Entry');
    },
    async parseSms(sms) {
        return smsParser_1.smsParserService.parse(sms);
    },
    async seedUserDefaults(userId) {
        const DEFAULT_CATEGORIES = [
            { name: 'Salary', icon: '💼', color: '#4a7c59', type: 'income', isDefault: true },
            { name: 'Freelance', icon: '💻', color: '#2a6dc2', type: 'income', isDefault: true },
            { name: 'Business', icon: '🏪', color: '#d4973e', type: 'income', isDefault: true },
            { name: 'Gift', icon: '🎁', color: '#9b59b6', type: 'income', isDefault: true },
            { name: 'Other', icon: '💰', color: '#7f8c8d', type: 'income', isDefault: true },
            { name: 'Home', icon: '🏠', color: '#c2552a', type: 'expense', isDefault: true },
            { name: 'Food', icon: '🍔', color: '#e67e22', type: 'expense', isDefault: true },
            { name: 'Transport', icon: '🚌', color: '#2980b9', type: 'expense', isDefault: true },
            { name: 'Utility', icon: '💡', color: '#f39c12', type: 'expense', isDefault: true },
            { name: 'Education', icon: '🎓', color: '#8e44ad', type: 'expense', isDefault: true },
            { name: 'Health', icon: '🏥', color: '#e74c3c', type: 'expense', isDefault: true },
            { name: 'Shopping', icon: '🛍️', color: '#e91e63', type: 'expense', isDefault: true },
            { name: 'Entertainment', icon: '🎬', color: '#16a085', type: 'expense', isDefault: true },
            { name: 'Travel', icon: '✈️', color: '#1abc9c', type: 'expense', isDefault: true },
            { name: 'Loan', icon: '💳', color: '#c0392b', type: 'expense', isDefault: true },
            { name: 'Other', icon: '📦', color: '#95a5a6', type: 'expense', isDefault: true },
            { name: 'Bank Savings', icon: '🏦', color: '#27ae60', type: 'savings', isDefault: true },
            { name: 'Mobile Savings', icon: '📱', color: '#f1c40f', type: 'savings', isDefault: true },
            { name: 'Other Savings', icon: '💰', color: '#e67e22', type: 'savings', isDefault: true },
            { name: 'Loan Payable', icon: '📤', color: '#e74c3c', type: 'payable', isDefault: true },
            { name: 'Bill Payable', icon: '📄', color: '#f39c12', type: 'payable', isDefault: true },
            { name: 'Other Payable', icon: '📦', color: '#95a5a6', type: 'payable', isDefault: true },
            { name: 'Loan Receivable', icon: '📥', color: '#27ae60', type: 'receivable', isDefault: true },
            { name: 'Payment Receivable', icon: '💳', color: '#3498db', type: 'receivable', isDefault: true },
            { name: 'Other Receivable', icon: '💰', color: '#9b59b6', type: 'receivable', isDefault: true },
        ];
        await container_1.container.categoryRepo.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: userId })));
    },
};
//# sourceMappingURL=entry.service.js.map