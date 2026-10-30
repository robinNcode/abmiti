"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoCategoryRepository = void 0;
const category_model_1 = require("../../../modules/category/category.model");
class MongoCategoryRepository {
    async findByUser(userId, type) {
        const filter = { user: userId };
        if (type)
            filter.type = type;
        return category_model_1.Category.find(filter).sort({ isDefault: -1, name: 1 });
    }
    async findById(id) {
        return category_model_1.Category.findById(id);
    }
    async findByUserAndId(userId, id) {
        return category_model_1.Category.findOne({ _id: id, user: userId });
    }
    async findByNameAndType(userId, name, type) {
        return category_model_1.Category.findOne({ user: userId, name, type });
    }
    async insertMany(docs) {
        await category_model_1.Category.insertMany(docs, { ordered: false }).catch(() => {
            // ignore duplicate key errors on re-seed
        });
    }
    async create(data) {
        return category_model_1.Category.create(data);
    }
    async update(id, data) {
        const cat = await category_model_1.Category.findById(id);
        if (!cat)
            throw new Error('Category not found');
        Object.assign(cat, data);
        return cat.save();
    }
    async remove(id) {
        await category_model_1.Category.findByIdAndDelete(id);
    }
}
exports.MongoCategoryRepository = MongoCategoryRepository;
//# sourceMappingURL=category.mongo.repo.js.map