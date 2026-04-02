import { body } from 'express-validator';

export const createEntryValidator = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('categoryId').notEmpty().isMongoId().withMessage('Valid category ID required'),
  body('note').optional().isString().isLength({ max: 300 }),
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
