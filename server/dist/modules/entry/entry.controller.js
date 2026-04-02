"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryController = void 0;
const entry_service_1 = require("./entry.service");
const response_1 = require("../../shared/utils/response");
const pagination_1 = require("../../shared/utils/pagination");
exports.entryController = {
    async list(req, res, next) {
        try {
            const filters = {
                type: req.query.type,
                month: req.query.month ? parseInt(String(req.query.month), 10) : undefined,
                year: req.query.year ? parseInt(String(req.query.year), 10) : undefined,
                category: req.query.category,
                source: req.query.source,
            };
            const pagination = (0, pagination_1.parsePagination)(req.query);
            const result = await entry_service_1.entryService.list(req.user.userId, filters, pagination);
            (0, response_1.sendSuccess)(res, result.data, 'OK', 200, {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            });
        }
        catch (err) {
            next(err);
        }
    },
    async getOne(req, res, next) {
        try {
            const data = await entry_service_1.entryService.getOne(req.user.userId, req.params.id);
            (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const data = await entry_service_1.entryService.create(req.user.userId, req.body);
            (0, response_1.sendCreated)(res, data, 'Entry created');
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const data = await entry_service_1.entryService.update(req.user.userId, req.params.id, req.body);
            (0, response_1.sendSuccess)(res, data, 'Entry updated');
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            await entry_service_1.entryService.remove(req.user.userId, req.params.id);
            (0, response_1.sendSuccess)(res, null, 'Entry deleted');
        }
        catch (err) {
            next(err);
        }
    },
    async parseSms(req, res, next) {
        try {
            const data = await entry_service_1.entryService.parseSms(req.body.sms);
            (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=entry.controller.js.map