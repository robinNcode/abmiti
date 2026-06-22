"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
exports.authController = {
    async register(req, res, next) {
        try {
            const { user, tokens } = await auth_service_1.authService.register(req.body);
            (0, response_1.sendCreated)(res, {
                user: { _id: user._id, name: user.name, email: user.email, budget: user.budget },
                ...tokens,
            }, 'Registration successful');
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const { user, tokens } = await auth_service_1.authService.login(req.body);
            (0, response_1.sendSuccess)(res, {
                user: { _id: user._id, name: user.name, email: user.email, budget: user.budget },
                ...tokens,
            }, 'Login successful');
        }
        catch (err) {
            next(err);
        }
    },
    async updateMe(req, res, next) {
        try {
            const user = await auth_service_1.authService.updateMe(req.user.userId, req.body);
            (0, response_1.sendSuccess)(res, { _id: user._id, name: user.name, email: user.email, budget: user.budget }, 'Profile updated');
        }
        catch (err) {
            next(err);
        }
    },
    async refresh(req, res, next) {
        try {
            const tokens = await auth_service_1.authService.refresh(req.body.refreshToken);
            (0, response_1.sendSuccess)(res, tokens, 'Token refreshed');
        }
        catch (err) {
            next(err);
        }
    },
    async me(req, res, next) {
        try {
            const user = await auth_service_1.authService.getMe(req.user.userId);
            (0, response_1.sendSuccess)(res, { _id: user._id, name: user.name, email: user.email, budget: user.budget });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map