"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoSummaryRepository = void 0;
const mongoose_1 = require("mongoose");
const entry_model_1 = require("../../../modules/entry/entry.model");
class MongoSummaryRepository {
    async getMonthlySummary(userId, start, end) {
        return entry_model_1.Entry.aggregate([
            { $match: { user: new mongoose_1.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
    }
    async getCategoryBreakdown(userId, start, end) {
        return entry_model_1.Entry.aggregate([
            {
                $match: {
                    user: new mongoose_1.Types.ObjectId(userId),
                    type: 'expense',
                    date: { $gte: start, $lte: end },
                },
            },
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' },
            { $sort: { total: -1 } },
        ]);
    }
    async getYearlyTrend(userId, start, end) {
        return entry_model_1.Entry.aggregate([
            { $match: { user: new mongoose_1.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { month: { $month: '$date' }, type: '$type' },
                    total: { $sum: '$amount' },
                },
            },
        ]);
    }
    async getAccountSummaries(userId, year) {
        const match = { user: new mongoose_1.Types.ObjectId(userId), type: 'savings' };
        if (year) {
            match.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
        }
        return entry_model_1.Entry.aggregate([
            { $match: match },
            { $group: { _id: '$account', totalSavings: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $lookup: { from: 'accounts', localField: '_id', foreignField: '_id', as: 'account' } },
            { $unwind: '$account' },
            { $sort: { totalSavings: -1 } },
        ]);
    }
    async getCategoryReport(userId, filters) {
        const match = {
            user: new mongoose_1.Types.ObjectId(userId),
            date: { $gte: filters.startDate, $lte: filters.endDate },
        };
        if (filters.type) {
            match.type = filters.type;
        }
        if (filters.categoryIds && filters.categoryIds.length > 0) {
            match.category = { $in: filters.categoryIds.map(id => new mongoose_1.Types.ObjectId(id)) };
        }
        if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
            match.amount = {};
            if (filters.minAmount !== undefined)
                match.amount.$gte = filters.minAmount;
            if (filters.maxAmount !== undefined)
                match.amount.$lte = filters.maxAmount;
        }
        return entry_model_1.Entry.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    minAmount: { $min: '$amount' },
                    maxAmount: { $max: '$amount' },
                },
            },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            { $sort: { total: -1 } },
        ]);
    }
    async getTransactionStatement(userId, filters) {
        const match = {
            user: new mongoose_1.Types.ObjectId(userId),
            date: { $gte: filters.startDate, $lte: filters.endDate },
        };
        if (filters.type) {
            match.type = filters.type;
        }
        if (filters.categoryIds && filters.categoryIds.length > 0) {
            match.category = { $in: filters.categoryIds.map(id => new mongoose_1.Types.ObjectId(id)) };
        }
        // Fetch transactions sorted by date
        const transactions = await entry_model_1.Entry.aggregate([
            { $match: match },
            { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'accounts', localField: 'account', foreignField: '_id', as: 'account' } },
            { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
            { $sort: { date: 1 } },
            {
                $project: {
                    _id: 1,
                    date: 1,
                    type: 1,
                    amount: 1,
                    note: 1,
                    sector: 1,
                    source: 1,
                    category: {
                        _id: 1,
                        name: 1,
                        icon: 1,
                        color: 1,
                    },
                    account: { _id: 1, name: 1, type: 1 },
                },
            },
        ]);
        // Calculate running balance
        let balance = 0;
        return transactions.map((t) => {
            // Income adds, expenses/investments subtract
            if (t.type === 'income' || t.type === 'receivable') {
                balance += t.amount;
            }
            else {
                balance -= t.amount;
            }
            return {
                ...t,
                runningBalance: balance,
            };
        });
    }
}
exports.MongoSummaryRepository = MongoSummaryRepository;
//# sourceMappingURL=summary.mongo.repo.js.map