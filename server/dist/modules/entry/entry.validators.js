"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSmsValidator = exports.updateEntryValidator = exports.createEntryValidator = void 0;
const express_validator_1 = require("express-validator");
const isDatabaseId = (value) => typeof value === 'string' && (/^[0-9a-f]{24}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
exports.createEntryValidator = [
    (0, express_validator_1.body)('type').isIn(['income', 'expense', 'investment', 'savings', 'payable', 'receivable'])
        .withMessage('Type must be income, expense, investment, savings, payable or receivable'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    (0, express_validator_1.body)('categoryId').custom(isDatabaseId).withMessage('Valid category ID required'),
    (0, express_validator_1.body)('note').optional().isString().isLength({ max: 300 }),
    (0, express_validator_1.body)('sector').optional().isString().isLength({ max: 120 }),
    (0, express_validator_1.body)('source').optional().isIn(['bank', 'bkash', 'nagad', 'cash', 'card', 'other']),
    (0, express_validator_1.body)('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];
exports.updateEntryValidator = [
    (0, express_validator_1.body)('amount').optional().isFloat({ min: 0.01 }),
    (0, express_validator_1.body)('categoryId').optional().custom(isDatabaseId).withMessage('Valid category ID required'),
    (0, express_validator_1.body)('note').optional().isString().isLength({ max: 300 }),
    (0, express_validator_1.body)('source').optional().isIn(['bank', 'bkash', 'nagad', 'cash', 'card', 'other']),
    (0, express_validator_1.body)('date').optional().isISO8601(),
];
exports.parseSmsValidator = [
    (0, express_validator_1.body)('sms').trim().notEmpty().withMessage('SMS text is required'),
];
//# sourceMappingURL=entry.validators.js.map