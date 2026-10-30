"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReorderLines = exports.validateBudget = exports.validateBudgetLine = exports.validateCopyQuery = exports.validateMonthYearQuery = void 0;
const express_validator_1 = require("express-validator");
const isDatabaseId = (value) => typeof value === 'string' && (/^[0-9a-f]{24}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
exports.validateMonthYearQuery = [
    (0, express_validator_1.query)('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    (0, express_validator_1.query)('year').isInt({ min: 2000 }).withMessage('Year must be valid'),
];
exports.validateCopyQuery = [
    (0, express_validator_1.query)('toMonth').isInt({ min: 1, max: 12 }).withMessage('Target month must be between 1 and 12'),
    (0, express_validator_1.query)('toYear').isInt({ min: 2000 }).withMessage('Target year must be valid'),
];
const lineRules = [
    (0, express_validator_1.body)('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Line name is required'),
    (0, express_validator_1.body)('icon').optional().isString().isLength({ max: 20 }),
    (0, express_validator_1.body)('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a hex value'),
    (0, express_validator_1.body)('allocationMethod').isIn(['percentage', 'fixed']).withMessage('Allocation method is invalid'),
    (0, express_validator_1.body)('allocationValue').isFloat({ min: 0 }).withMessage('Allocation value must be zero or greater'),
    (0, express_validator_1.body)('linkedCategoryIds').optional().isArray(),
    (0, express_validator_1.body)('linkedCategoryIds.*').optional().custom(isDatabaseId).withMessage('Valid category ID required'),
    (0, express_validator_1.body)('subItems').optional().isArray(),
    (0, express_validator_1.body)('subItems.*.name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('subItems.*.expectedAmount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('subItems.*.note').optional().isString().isLength({ max: 300 }),
    (0, express_validator_1.body)('order').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    (0, express_validator_1.body)('note').optional().isString().isLength({ max: 300 }),
];
exports.validateBudgetLine = lineRules;
exports.validateBudget = [
    (0, express_validator_1.body)('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    (0, express_validator_1.body)('year').isInt({ min: 2000 }).withMessage('Year must be valid'),
    (0, express_validator_1.body)('totalIncome').isFloat({ min: 0 }).withMessage('Total income must be zero or greater'),
    (0, express_validator_1.body)('notes').optional().isString().isLength({ max: 1000 }),
    (0, express_validator_1.body)('isTemplate').optional().isBoolean(),
    (0, express_validator_1.body)('templateName').optional().isString().isLength({ max: 100 }),
    (0, express_validator_1.body)('lines').optional().isArray(),
    (0, express_validator_1.body)('lines.*.name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('lines.*.icon').optional().isString().isLength({ max: 20 }),
    (0, express_validator_1.body)('lines.*.color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    (0, express_validator_1.body)('lines.*.allocationMethod').optional().isIn(['percentage', 'fixed']),
    (0, express_validator_1.body)('lines.*.allocationValue').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('lines.*.linkedCategoryIds').optional().isArray(),
    (0, express_validator_1.body)('lines.*.linkedCategoryIds.*').optional().custom(isDatabaseId).withMessage('Valid category ID required'),
    (0, express_validator_1.body)('lines.*.subItems').optional().isArray(),
];
exports.validateReorderLines = [
    (0, express_validator_1.body)('order').isArray({ min: 1 }).withMessage('Order must include line ids'),
    (0, express_validator_1.body)('order.*').isString().notEmpty(),
];
//# sourceMappingURL=budget.validators.js.map