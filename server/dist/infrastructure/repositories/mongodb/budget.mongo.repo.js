"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoBudgetRepository = void 0;
const mongoose_1 = require("mongoose");
const budget_model_1 = require("../../../modules/budget/budget.model");
const entry_model_1 = require("../../../modules/entry/entry.model");
const normalizeLine = (line, index = 0) => ({
    name: line.name,
    icon: line.icon ?? '📦',
    color: line.color ?? '#4A7C59',
    allocationMethod: line.allocationMethod,
    allocationValue: line.allocationValue,
    linkedCategoryIds: line.linkedCategoryIds ?? [],
    subItems: line.subItems ?? [],
    order: line.order ?? index,
    isActive: line.isActive ?? true,
    note: line.note,
});
class MongoBudgetRepository {
    async create(userId, data) {
        return budget_model_1.Budget.create({
            user: userId,
            month: data.month,
            year: data.year,
            totalIncome: data.totalIncome,
            lines: (data.lines ?? []).map(normalizeLine),
            isTemplate: data.isTemplate ?? false,
            templateName: data.templateName,
            notes: data.notes,
        });
    }
    async update(id, userId, data) {
        const patch = {};
        if (data.totalIncome !== undefined)
            patch.totalIncome = data.totalIncome;
        if (data.notes !== undefined)
            patch.notes = data.notes;
        if (data.templateName !== undefined)
            patch.templateName = data.templateName;
        if (data.lines !== undefined)
            patch.lines = data.lines.map(normalizeLine);
        return budget_model_1.Budget.findOneAndUpdate({ _id: id, user: userId }, { $set: patch }, { new: true, runValidators: true });
    }
    async findById(id, userId) {
        return budget_model_1.Budget.findOne({ _id: id, user: userId });
    }
    async findByMonth(userId, month, year, isTemplate = false) {
        return budget_model_1.Budget.findOne({ user: userId, month, year, isTemplate });
    }
    async findMany(userId, templatesOnly = false) {
        const query = templatesOnly ? { user: userId, isTemplate: true } : { user: userId };
        return budget_model_1.Budget.find(query).sort({ isTemplate: -1, year: -1, month: -1, createdAt: -1 });
    }
    async remove(id, userId) {
        const result = await budget_model_1.Budget.deleteOne({ _id: id, user: userId });
        return result.deletedCount === 1;
    }
    async addLine(budgetId, userId, line) {
        const budget = await budget_model_1.Budget.findOne({ _id: budgetId, user: userId });
        if (!budget)
            return null;
        budget.lines.push(normalizeLine(line, budget.lines.length));
        await budget.save();
        return budget;
    }
    async updateLine(budgetId, lineId, userId, line) {
        const budget = await budget_model_1.Budget.findOne({ _id: budgetId, user: userId });
        if (!budget)
            return null;
        const target = budget.lines.find((item) => item._id.toString() === lineId);
        if (!target)
            return null;
        Object.assign(target, line);
        await budget.save();
        return budget;
    }
    async removeLine(budgetId, lineId, userId) {
        return budget_model_1.Budget.findOneAndUpdate({ _id: budgetId, user: userId }, { $pull: { lines: { _id: new mongoose_1.Types.ObjectId(lineId) } } }, { new: true });
    }
    async reorderLines(budgetId, userId, order) {
        const budget = await budget_model_1.Budget.findOne({ _id: budgetId, user: userId });
        if (!budget)
            return null;
        budget.lines.forEach((line) => {
            const index = order.indexOf(line._id.toString());
            if (index >= 0)
                line.order = index;
        });
        await budget.save();
        return budget;
    }
    async findExpenseEntriesByCategories(userId, categoryIds, start, end) {
        if (!categoryIds.length)
            return [];
        return entry_model_1.Entry.find({
            user: userId,
            type: 'expense',
            category: { $in: categoryIds.map((id) => new mongoose_1.Types.ObjectId(id)) },
            date: { $gte: start, $lte: end },
        }).populate('category', 'name icon color');
    }
}
exports.MongoBudgetRepository = MongoBudgetRepository;
//# sourceMappingURL=budget.mongo.repo.js.map