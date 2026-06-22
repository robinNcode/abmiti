import { body } from 'express-validator';

export const createEntryValidator = [
  body('type').isIn(['income', 'expense', 'investment', 'savings', 'payable', 'receivable'])
    .withMessage('Type must be income, expense, investment, savings, payable or receivable'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('categoryId').notEmpty().isUUID().withMessage('Valid category ID required'),
  body('note').optional().isString().isLength({ max: 300 }),
  body('sector').optional().isString().isLength({ max: 120 }),
  body('source').optional().isIn(['bank','bkash','nagad','cash','card','other']),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

export const updateEntryValidator = [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('categoryId').optional().isMongoId(),
  body('note').optional().isString().isLength({ max: 300 }),
  body('source').optional().isIn(['bank','bkash','nagad','cash','card','other']),
  body('date').optional().isISO8601(),
];

export const parseSmsValidator = [
  body('sms').trim().notEmpty().withMessage('SMS text is required'),
];
