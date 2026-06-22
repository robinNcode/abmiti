"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const summary_service_1 = require("./summary.service");
const response_1 = require("../../shared/utils/response");
const middleware_1 = require("../../shared/middleware");
const container_1 = require("../../container");
const router = (0, express_1.Router)();
router.use(middleware_1.authenticate);
const now = new Date();
router.get('/monthly', async (req, res, next) => {
    try {
        const month = parseInt(String(req.query.month ?? now.getMonth() + 1), 10);
        const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
        const budgetDoc = await container_1.container.budgetRepo.findByMonth(req.user.userId, month, year);
        const budget = budgetDoc?.amount ?? 0;
        const data = await summary_service_1.summaryService.monthly(req.user.userId, month, year, budget);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
});
router.get('/categories', async (req, res, next) => {
    try {
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
exports.default = router;
//# sourceMappingURL=summary.routes.js.map