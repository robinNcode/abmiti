"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const errors_1 = require("../../shared/utils/errors");
const auth_model_1 = require("./auth.model");
const signTokens = (user) => {
    const payload = {
        userId: String(user._id),
        email: user.email,
    };
    return {
        accessToken: jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN }),
        refreshToken: jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN }),
    };
};
exports.authService = {
    async register(dto) {
        const exists = await auth_model_1.User.findOne({ email: dto.email });
        if (exists)
            throw new errors_1.ConflictError('Email already registered');
        const user = await auth_model_1.User.create(dto);
        return { user, tokens: signTokens(user) };
    },
    async login(dto) {
        const user = await auth_model_1.User.findOne({ email: dto.email }).select('+password');
        if (!user || !(await user.comparePassword(dto.password))) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        return { user, tokens: signTokens(user) };
    },
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
        }
        catch {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        const user = await auth_model_1.User.findById(payload.userId);
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        return signTokens(user);
    },
    async getMe(userId) {
        const user = await auth_model_1.User.findById(userId);
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        return user;
    },
};
//# sourceMappingURL=auth.service.js.map