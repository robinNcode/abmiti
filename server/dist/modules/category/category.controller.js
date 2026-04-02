"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const category_service_1 = require("./category.service");
const response_1 = require("../../shared/utils/response");
exports.categoryController = {
    async list(req, res, next) {
        try {
            const data = await category_service_1.categoryService.list(req.user.userId, req.query.type);
            (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const data = await category_service_1.categoryService.create(req.user.userId, req.body);
            (0, response_1.sendCreated)(res, data, 'Category created');
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const data = await category_service_1.categoryService.update(req.user.userId, req.params.id, req.body);
            (0, response_1.sendSuccess)(res, data, 'Category updated');
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            await category_service_1.categoryService.remove(req.user.userId, req.params.id);
            (0, response_1.sendSuccess)(res, null, 'Category deleted');
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=category.controller.js.map