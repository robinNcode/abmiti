"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryService = void 0;
const mongoose_1 = require("mongoose");
const entry_model_1 = require("../entry/entry.model");
exports.summaryService = {
    async monthly(userId, month, year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const result = await entry_model_1.Entry.aggregate([
            { $match: { user: new mongoose_1.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const incomeRow = result.find((r) => r._id === 'income');
        const expenseRow = result.find((r) => r._id === 'expense');
        const income = incomeRow?.total ?? 0;
        const expense = expenseRow?.total ?? 0;
        const savings = income - expense;
        return {
            income,
            expense,
            savings,
            savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
            incomeCount: incomeRow?.count ?? 0,
            expenseCount: expenseRow?.count ?? 0,
        };
    },
    async categoryBreakdown(userId, month, year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const rows = await entry_model_1.Entry.aggregate([
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
        const grandTotal = rows.reduce((s, r) => s + r.total, 0);
        return rows.map((r) => ({
            category: {
                _id: String(r.category._id),
                name: r.category.name,
                icon: r.category.icon,
                color: r.category.color,
            },
            total: r.total,
            count: r.count,
            percentage: grandTotal > 0 ? parseFloat(((r.total / grandTotal) * 100).toFixed(1)) : 0,
        }));
    },
    async yearlyTrend(userId, year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59);
        const rows = await entry_model_1.Entry.aggregate([
            { $match: { user: new mongoose_1.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { month: { $month: '$date' }, type: '$type' },
                    total: { $sum: '$amount' },
                },
            },
        ]);
        const map = {};
        for (let m = 1; m <= 12; m++) {
            map[m] = { month: m, year, income: 0, expense: 0, savings: 0 };
        }
        rows.forEach((r) => {
            const m = r._id.month;
            if (r._id.type === 'income')
                map[m].income = r.total;
            if (r._id.type === 'expense')
                map[m].expense = r.total;
        });
        Object.values(map).forEach((m) => { m.savings = m.income - m.expense; });
        return Object.values(map);
    },
};
//# sourceMappingURL=summary.service.js.map