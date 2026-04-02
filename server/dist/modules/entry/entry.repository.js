"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryRepository = void 0;
const mongoose_1 = require("mongoose");
const entry_model_1 = require("./entry.model");
const pagination_1 = require("../../shared/utils/pagination");
const buildQuery = (userId, filters) => {
    const q = { user: userId };
    if (filters.type)
        q.type = filters.type;
    if (filters.category)
        q.category = new mongoose_1.Types.ObjectId(filters.category);
    if (filters.source)
        q.source = filters.source;
    if (filters.month !== undefined && filters.year !== undefined) {
        const start = new Date(filters.year, filters.month - 1, 1);
        const end = new Date(filters.year, filters.month, 0, 23, 59, 59);
        q.date = { $gte: start, $lte: end };
    }
    else if (filters.startDate || filters.endDate) {
        q.date = {};
        if (filters.startDate)
            q.date.$gte = filters.startDate;
        if (filters.endDate)
            q.date.$lte = filters.endDate;
    }
    return q;
};
exports.entryRepository = {
    async findMany(userId, filters, pagination) {
        const query = buildQuery(userId, filters);
        const skip = (pagination.page - 1) * pagination.limit;
        const [data, total] = await Promise.all([
            entry_model_1.Entry.find(query)
                .populate('category', 'name icon color')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit),
            entry_model_1.Entry.countDocuments(query),
        ]);
        return (0, pagination_1.buildPaginatedResult)(data, total, pagination);
    },
    async findById(id, userId) {
        return entry_model_1.Entry.findOne({ _id: id, user: userId }).populate('category', 'name icon color');
    },
    async create(data) {
        const entry = await entry_model_1.Entry.create(data);
        return entry_model_1.Entry.findById(entry._id).populate('category', 'name icon color');
    },
    async update(id, userId, data) {
        return entry_model_1.Entry.findOneAndUpdate({ _id: id, user: userId }, { $set: data }, { new: true, runValidators: true }).populate('category', 'name icon color');
    },
    async remove(id, userId) {
        const result = await entry_model_1.Entry.deleteOne({ _id: id, user: userId });
        return result.deletedCount === 1;
    },
};
//# sourceMappingURL=entry.repository.js.map