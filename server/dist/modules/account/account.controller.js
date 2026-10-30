"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountController = void 0;
const account_service_1 = require("./account.service");
const response_1 = require("../../shared/utils/response");
exports.accountController = {
    async create(req, res, next) {
        try {
            const input = req.body;
            const account = await account_service_1.accountService.create(req.user.userId, input);
            (0, response_1.sendSuccess)(res, account, 'Account created successfully', 201);
        }
        catch (err) {
            next(err);
        }
    },
    async getAll(req, res, next) {
        try {
            const accounts = await account_service_1.accountService.findByUser(req.user.userId);
            (0, response_1.sendSuccess)(res, accounts);
        }
        catch (err) {
            next(err);
        }
    },
    async getById(req, res, next) {
        try {
            const account = await account_service_1.accountService.findById(req.user.userId, req.params.id);
            if (!account) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }
            (0, response_1.sendSuccess)(res, account);
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const input = req.body;
            const account = await account_service_1.accountService.update(req.user.userId, req.params.id, input);
            if (!account) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }
            (0, response_1.sendSuccess)(res, account, 'Account updated successfully');
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            const deleted = await account_service_1.accountService.delete(req.user.userId, req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }
            (0, response_1.sendSuccess)(res, null, 'Account deleted successfully');
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=account.controller.js.map