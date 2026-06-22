"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryService = void 0;
const container_1 = require("../../container");
exports.summaryService = {
    async monthly(userId, month, year, budget = 0) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const result = await container_1.container.summaryRepo.getMonthlySummary(userId, start, end);
        const incomeRow = result.find((r) => r._id === 'income');
        const expenseRow = result.find((r) => r._id === 'expense');
        const investmentRow = result.find((r) => r._id === 'investment');
        const savingsRow = result.find((r) => r._id === 'savings');
        const receivableRow = result.find((r) => r._id === 'receivable');
        const payableRow = result.find((r) => r._id === 'payable');
        const income = incomeRow?.total ?? 0;
        const expense = (expenseRow?.total ?? 0) + (investmentRow?.total ?? 0);
        const investment = investmentRow?.total ?? 0;
        const savings = income - expense;
        const remainingBudget = Math.max(0, budget - expense);
        return {
            income,
            expense,
            investment,
            budget,
            remainingBudget,
            budgetUsed: budget > 0 ? parseFloat(((expense / budget) * 100).toFixed(1)) : 0,
            savings,
            savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
            incomeCount: incomeRow?.count ?? 0,
            expenseCount: (expenseRow?.count ?? 0) + (investmentRow?.count ?? 0),
            investmentCount: investmentRow?.count ?? 0,
            savingsCount: savingsRow?.count ?? 0,
            receivableCount: receivableRow?.count ?? 0,
            payableCount: payableRow?.count ?? 0,
        };
    },
    async categoryBreakdown(userId, month, year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const rows = await container_1.container.summaryRepo.getCategoryBreakdown(userId, start, end);
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
        const rows = await container_1.container.summaryRepo.getYearlyTrend(userId, start, end);
        const map = {};
        for (let m = 1; m <= 12; m++) {
            map[m] = { month: m, year, income: 0, expense: 0, savings: 0, investment: 0 };
        }
        rows.forEach((r) => {
            const m = r._id.month;
            if (r._id.type === 'income')
                map[m].income = r.total;
            if (r._id.type === 'expense')
                map[m].expense += r.total;
            if (r._id.type === 'investment')
                map[m].expense += r.total;
            if (r._id.type === 'investment')
                map[m].investment = r.total;
        });
        Object.values(map).forEach((m) => { m.savings = m.income - m.expense; });
        return Object.values(map);
    },
    async yearly(userId, year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59);
        const result = await container_1.container.summaryRepo.getMonthlySummary(userId, start, end);
        const incomeRow = result.find((r) => r._id === 'income');
        const expenseRow = result.find((r) => r._id === 'expense');
        const investmentRow = result.find((r) => r._id === 'investment');
        const savingsRow = result.find((r) => r._id === 'savings');
        const receivableRow = result.find((r) => r._id === 'receivable');
        const payableRow = result.find((r) => r._id === 'payable');
        const income = incomeRow?.total ?? 0;
        const investment = investmentRow?.total ?? 0;
        const expense = (expenseRow?.total ?? 0) + investment;
        const savings = income - expense;
        return {
            income,
            expense,
            investment,
            savings,
            savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
            incomeCount: incomeRow?.count ?? 0,
            expenseCount: (expenseRow?.count ?? 0) + (investmentRow?.count ?? 0),
            investmentCount: investmentRow?.count ?? 0,
            savingsCount: savingsRow?.count ?? 0,
            receivableCount: receivableRow?.count ?? 0,
            payableCount: payableRow?.count ?? 0,
        };
    },
    async accountSummaries(userId, year) {
        const rows = await container_1.container.summaryRepo.getAccountSummaries(userId, year);
        return rows.map((r) => ({
            account: {
                _id: String(r.account._id),
                name: r.account.name,
                type: r.account.type,
                balance: r.account.balance,
            },
            totalSavings: r.totalSavings,
            count: r.count,
        }));
    },
};
//# sourceMappingURL=summary.service.js.map