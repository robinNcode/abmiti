"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const summary_service_1 = require("./summary.service");
const response_1 = require("../../shared/utils/response");
const middleware_1 = require("../../shared/middleware");
const container_1 = require("../../container");
const router = (0, express_1.Router)();
router.use(middleware_1.authenticate);
router.get('/monthly', async (req, res, next) => {
    try {
        const now = new Date();
        const month = parseInt(String(req.query.month ?? now.getMonth() + 1), 10);
        const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
        const budgetDoc = await container_1.container.budgetRepo.findByMonth(req.user.userId, month, year);
        const budget = budgetDoc?.totalIncome ?? 0;
        const data = await summary_service_1.summaryService.monthly(req.user.userId, month, year, budget);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/categories', async (req, res, next) => {
    try {
        const now = new Date();
        const month = parseInt(String(req.query.month ?? now.getMonth() + 1), 10);
        const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
        const data = await summary_service_1.summaryService.categoryBreakdown(req.user.userId, month, year);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/yearly', async (req, res, next) => {
    try {
        const now = new Date();
        const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
        const data = await summary_service_1.summaryService.yearlyTrend(req.user.userId, year);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/yearly-summary', async (req, res, next) => {
    try {
        const now = new Date();
        const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
        const data = await summary_service_1.summaryService.yearly(req.user.userId, year);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/accounts', async (req, res, next) => {
    try {
        const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
        const data = await summary_service_1.summaryService.accountSummaries(req.user.userId, year);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/budget-warnings', async (req, res, next) => {
    try {
        const data = await summary_service_1.summaryService.budgetWarnings(req.user.userId);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/category-report', async (req, res, next) => {
    try {
        const today = new Date();
        const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
        const categoryIds = req.query.categoryIds ? String(req.query.categoryIds).split(',') : undefined;
        const minAmount = req.query.minAmount ? parseFloat(String(req.query.minAmount)) : undefined;
        const maxAmount = req.query.maxAmount ? parseFloat(String(req.query.maxAmount)) : undefined;
        const type = req.query.type;
        const data = await summary_service_1.summaryService.categoryReport(req.user.userId, {
            startDate,
            endDate,
            categoryIds,
            minAmount,
            maxAmount,
            type,
        });
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/transaction-statement', async (req, res, next) => {
    try {
        const today = new Date();
        const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
        const categoryIds = req.query.categoryIds ? String(req.query.categoryIds).split(',') : undefined;
        const type = req.query.type;
        const data = await summary_service_1.summaryService.transactionStatement(req.user.userId, {
            startDate,
            endDate,
            categoryIds,
            type,
        });
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=summary.routes.js.map