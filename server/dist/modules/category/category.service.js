"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const container_1 = require("../../container");
const errors_1 = require("../../shared/utils/errors");
exports.categoryService = {
    async list(userId, type) {
        return container_1.container.categoryRepo.findByUser(userId, type);
    },
    async create(userId, dto) {
        const exists = await container_1.container.categoryRepo.findByNameAndType(userId, dto.name, dto.type);
        if (exists)
            throw new errors_1.ConflictError('Category with this name already exists');
        return container_1.container.categoryRepo.create({
            name: dto.name,
            icon: dto.icon ?? '📦',
            color: dto.color ?? '#c2552a',
            type: dto.type,
            isDefault: false,
            user: userId,
        });
    },
    async update(userId, id, dto) {
        const cat = await container_1.container.categoryRepo.findById(id);
        if (!cat)
            throw new errors_1.NotFoundError('Category');
        if (String(cat.user) !== userId)
            throw new errors_1.ForbiddenError();
        return container_1.container.categoryRepo.update(id, dto);
    },
    async remove(userId, id) {
        const cat = await container_1.container.categoryRepo.findById(id);
        if (!cat)
            throw new errors_1.NotFoundError('Category');
        if (String(cat.user) !== userId)
            throw new errors_1.ForbiddenError();
        if (cat.isDefault)
            throw new errors_1.ForbiddenError('Cannot delete default categories');
        return container_1.container.categoryRepo.remove(id);
    },
};
//# sourceMappingURL=category.service.js.map