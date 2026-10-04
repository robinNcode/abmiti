"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileValidator = exports.refreshValidator = exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
exports.loginValidator = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.refreshValidator = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
exports.updateProfileValidator = [
    (0, express_validator_1.body)('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 1, max: 80 }).withMessage('Name must be 1-80 characters'),
    (0, express_validator_1.body)('avatar').optional().isString().withMessage('Avatar must be a string'),
];
//# sourceMappingURL=auth.validators.js.map