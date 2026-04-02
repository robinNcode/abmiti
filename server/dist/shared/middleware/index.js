"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.rateLimiter = exports.validate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_validator_1 = require("express-validator");
const env_1 = require("../../config/env");
const errors_1 = require("../utils/errors");
// ── Auth middleware ──────────────────────────────────────────
const authenticate = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
        throw new errors_1.UnauthorizedError('No token provided');
    const token = header.split(' ')[1];
    try {
        req.user = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        next();
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid or expired token');
    }
};
exports.authenticate = authenticate;
// ── Validation middleware ────────────────────────────────────
const validate = (req, _res, next) => {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        next();
        return;
    }
    const errors = {};
    result.array().forEach((err) => {
        const field = err.path ?? 'general';
        if (!errors[field])
            errors[field] = [];
        errors[field].push(err.msg);
    });
    throw new errors_1.ValidationError(errors);
};
exports.validate = validate;
// ── Rate limiter ─────────────────────────────────────────────
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
// ── Not found handler ────────────────────────────────────────
const notFoundHandler = (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=index.js.map