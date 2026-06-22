"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const errors_1 = require("../../shared/utils/errors");
const container_1 = require("../../container");
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
        console.log(dto);
        const exists = await container_1.container.userRepo.findByEmail(dto.email);
        if (exists)
            throw new errors_1.ConflictError('Email already registered');
        const user = await container_1.container.userRepo.create(dto);
        return { user, tokens: signTokens(user) };
    },
    async login(dto) {
        const user = await container_1.container.userRepo.findByEmail(dto.email, true);
        console.log(user);
        console.log(dto);
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
        const user = await container_1.container.userRepo.findById(payload.userId);
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        return signTokens(user);
    },
    async getMe(userId) {
        const user = await container_1.container.userRepo.findById(userId);
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        return user;
    },
    async updateMe(userId, dto) {
        if (dto.budget !== undefined) {
            const updated = await container_1.container.userRepo.updateBudget(userId, dto.budget);
            if (!updated)
                throw new errors_1.UnauthorizedError('User not found');
            return updated;
        }
        const user = await container_1.container.userRepo.findById(userId);
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        return user;
    },
};
//# sourceMappingURL=auth.service.js.map