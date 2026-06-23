import { body, query } from 'express-validator';

export const validateMonthYearQuery = [
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year').isInt({ min: 2000 }).withMessage('Year must be valid'),
];

export const validateCopyQuery = [
  query('toMonth').isInt({ min: 1, max: 12 }).withMessage('Target month must be between 1 and 12'),
  query('toYear').isInt({ min: 2000 }).withMessage('Target year must be valid'),
];

const lineRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Line name is required'),
  body('icon').optional().isString().isLength({ max: 20 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a hex value'),
  body('allocationMethod').isIn(['percentage', 'fixed']).withMessage('Allocation method is invalid'),
  body('allocationValue').isFloat({ min: 0 }).withMessage('Allocation value must be zero or greater'),
  body('linkedCategoryIds').optional().isArray(),
  body('linkedCategoryIds.*').optional().isMongoId(),
  body('subItems').optional().isArray(),
  body('subItems.*.name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('subItems.*.expectedAmount').optional().isFloat({ min: 0 }),
  body('subItems.*.note').optional().isString().isLength({ max: 300 }),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('note').optional().isString().isLength({ max: 300 }),
];

export const validateBudgetLine = lineRules;

export const validateBudget = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('Year must be valid'),
  body('totalIncome').isFloat({ min: 0 }).withMessage('Total income must be zero or greater'),
  body('notes').optional().isString().isLength({ max: 1000 }),
  body('isTemplate').optional().isBoolean(),
  body('templateName').optional().isString().isLength({ max: 100 }),
  body('lines').optional().isArray(),
  body('lines.*.name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('lines.*.icon').optional().isString().isLength({ max: 20 }),
  body('lines.*.color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('lines.*.allocationMethod').optional().isIn(['percentage', 'fixed']),
  body('lines.*.allocationValue').optional().isFloat({ min: 0 }),
  body('lines.*.linkedCategoryIds').optional().isArray(),
  body('lines.*.linkedCategoryIds.*').optional().isMongoId(),
  body('lines.*.subItems').optional().isArray(),
];

export const validateReorderLines = [
  body('order').isArray({ min: 1 }).withMessage('Order must include line ids'),
  body('order.*').isString().notEmpty(),
];
