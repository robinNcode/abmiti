"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const category_model_1 = require("./category.model");
const errors_1 = require("../../shared/utils/errors");
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
];
exports.categoryService = {
    async seedDefaults(userId) {
        const docs = DEFAULT_CATEGORIES.map((c) => ({ ...c, user: userId }));
        await category_model_1.Category.insertMany(docs, { ordered: false }).catch(() => {
            // ignore duplicate errors on re-seed
        });
    },
    async list(userId, type) {
        const filter = { user: userId };
        if (type)
            filter.type = type;
        return category_model_1.Category.find(filter).sort({ isDefault: -1, name: 1 });
    },
    async create(userId, dto) {
        const exists = await category_model_1.Category.findOne({ user: userId, name: dto.name, type: dto.type });
        if (exists)
            throw new errors_1.ConflictError('Category with this name already exists');
        return category_model_1.Category.create({ ...dto, user: userId, isDefault: false });
    },
    async update(userId, id, dto) {
        const cat = await category_model_1.Category.findById(id);
        if (!cat)
            throw new errors_1.NotFoundError('Category');
        if (String(cat.user) !== userId)
            throw new errors_1.ForbiddenError();
        Object.assign(cat, dto);
        return cat.save();
    },
    async remove(userId, id) {
        const cat = await category_model_1.Category.findById(id);
        if (!cat)
            throw new errors_1.NotFoundError('Category');
        if (String(cat.user) !== userId)
            throw new errors_1.ForbiddenError();
        if (cat.isDefault)
            throw new errors_1.ForbiddenError('Cannot delete default categories');
        await cat.deleteOne();
    },
};
//# sourceMappingURL=category.service.js.map