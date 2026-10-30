"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetController = void 0;
const budget_service_1 = require("./budget.service");
const response_1 = require("../../shared/utils/response");
const readMonthYear = (req) => ({
    month: Number(req.query.month),
    year: Number(req.query.year),
});
exports.budgetController = {
    async create(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.create(req.user.userId, req.body), 'Budget created successfully', 201);
        }
        catch (err) {
            next(err);
        }
    },
    async getByMonth(req, res, next) {
        try {
            const { month, year } = readMonthYear(req);
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.getByMonth(req.user.userId, month, year));
        }
        catch (err) {
            next(err);
        }
    },
    async list(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.list(req.user.userId));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.update(req.user.userId, req.params.id, req.body), 'Budget updated');
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            await budget_service_1.budgetService.remove(req.user.userId, req.params.id);
            (0, response_1.sendSuccess)(res, null, 'Budget deleted');
        }
        catch (err) {
            next(err);
        }
    },
    async copy(req, res, next) {
        try {
            const { toMonth, toYear } = { toMonth: Number(req.query.toMonth), toYear: Number(req.query.toYear) };
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.copy(req.user.userId, req.params.id, toMonth, toYear), 'Budget copied');
        }
        catch (err) {
            next(err);
        }
    },
    async addLine(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.addLine(req.user.userId, req.params.id, req.body), 'Budget line added', 201);
        }
        catch (err) {
            next(err);
        }
    },
    async updateLine(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.updateLine(req.user.userId, req.params.id, req.params.lineId, req.body), 'Budget line updated');
        }
        catch (err) {
            next(err);
        }
    },
    async removeLine(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.removeLine(req.user.userId, req.params.id, req.params.lineId), 'Budget line removed');
        }
        catch (err) {
            next(err);
        }
    },
    async reorderLines(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.reorderLines(req.user.userId, req.params.id, req.body.order), 'Budget lines reordered');
        }
        catch (err) {
            next(err);
        }
    },
    async templates(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.templates(req.user.userId));
        }
        catch (err) {
            next(err);
        }
    },
    async saveAsTemplate(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.saveAsTemplate(req.user.userId, req.params.id, req.body.templateName), 'Template saved', 201);
        }
        catch (err) {
            next(err);
        }
    },
    async fromTemplate(req, res, next) {
        try {
            const { month, year } = readMonthYear(req);
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.fromTemplate(req.user.userId, req.params.templateId, month, year), 'Template applied', 201);
        }
        catch (err) {
            next(err);
        }
    },
    async deleteTemplate(req, res, next) {
        try {
            await budget_service_1.budgetService.deleteTemplate(req.user.userId, req.params.id);
            (0, response_1.sendSuccess)(res, null, 'Template deleted');
        }
        catch (err) {
            next(err);
        }
    },
    async summary(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.summary(req.user.userId, req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async lineEntries(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await budget_service_1.budgetService.lineEntries(req.user.userId, req.params.id, req.params.lineId));
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=budget.controller.js.map